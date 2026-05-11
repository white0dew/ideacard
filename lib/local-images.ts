export const LOCAL_IMAGE_SCHEME = "local-image://";
export const LOCAL_IMAGE_STORE_LIMIT_BYTES = 100 * 1024 * 1024;
export const LOCAL_IMAGE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const DATABASE_NAME = "ideaCard-local-images";
const DATABASE_VERSION = 1;
const STORE_NAME = "images";
const FALLBACK_ALT_TEXT = "图片";
const LOCAL_IMAGE_ID_PATTERN = /local-image:\/\/([a-z0-9-]+)/gi;

export interface LocalImageRecord {
  id: string;
  blob: Blob;
  createdAt: number;
  expiresAt: number;
  lastAccessedAt: number;
  mimeType: string;
  name: string;
  size: number;
}

interface ResolveMarkdownResult {
  markdown: string;
  revoke: () => void;
}

function supportsIndexedDb() {
  return typeof indexedDB !== "undefined";
}

function createImageId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `local-image-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function sanitizeAltText(value?: string | null) {
  const normalized = value?.trim().replace(/\.[^.]+$/, "").replace(/[\r\n\]]+/g, " ");
  return normalized || FALLBACK_ALT_TEXT;
}

function toExpiryTimestamp(now: number) {
  return now + LOCAL_IMAGE_TTL_MS;
}

function createObjectStore(database: IDBDatabase) {
  if (database.objectStoreNames.contains(STORE_NAME)) {
    return;
  }

  database.createObjectStore(STORE_NAME, { keyPath: "id" });
}

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      createObjectStore(request.result);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("打开本地图片存储失败。"));
  });
}

function createTransaction(database: IDBDatabase, mode: IDBTransactionMode) {
  return database.transaction(STORE_NAME, mode).objectStore(STORE_NAME);
}

function getAllRecords(store: IDBObjectStore) {
  return new Promise<LocalImageRecord[]>((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve((request.result as LocalImageRecord[]) ?? []);
    request.onerror = () => reject(request.error ?? new Error("读取本地图片列表失败。"));
  });
}

function getRecord(store: IDBObjectStore, id: string) {
  return new Promise<LocalImageRecord | null>((resolve, reject) => {
    const request = store.get(id);
    request.onsuccess = () => resolve((request.result as LocalImageRecord | undefined) ?? null);
    request.onerror = () => reject(request.error ?? new Error("读取本地图片失败。"));
  });
}

function putRecord(store: IDBObjectStore, record: LocalImageRecord) {
  return new Promise<void>((resolve, reject) => {
    const request = store.put(record);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error("保存本地图片失败。"));
  });
}

function deleteRecord(store: IDBObjectStore, id: string) {
  return new Promise<void>((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error("删除本地图片失败。"));
  });
}

export function buildLocalImageSource(id: string) {
  return `${LOCAL_IMAGE_SCHEME}${id}`;
}

export function buildLocalImageMarkdown(id: string, altText?: string | null) {
  return `![${sanitizeAltText(altText)}](${buildLocalImageSource(id)})`;
}

export function isLocalImageSource(source: string | null | undefined) {
  return Boolean(source?.startsWith(LOCAL_IMAGE_SCHEME));
}

export function extractLocalImageIds(markdown: string) {
  return Array.from(markdown.matchAll(LOCAL_IMAGE_ID_PATTERN), (match) => match[1]);
}

export function replaceLocalImageSources(markdown: string, replacements: Map<string, string>) {
  let nextMarkdown = markdown;
  replacements.forEach((resolvedSource, source) => {
    nextMarkdown = nextMarkdown.split(source).join(resolvedSource);
  });
  return nextMarkdown;
}

export async function saveLocalImage(file: File) {
  if (!supportsIndexedDb()) {
    throw new Error("当前浏览器不支持 IndexedDB，无法保存本地图片。");
  }

  const database = await openDatabase();
  const now = Date.now();
  const record: LocalImageRecord = {
    id: createImageId(),
    blob: file,
    createdAt: now,
    expiresAt: toExpiryTimestamp(now),
    lastAccessedAt: now,
    mimeType: file.type || "application/octet-stream",
    name: file.name || FALLBACK_ALT_TEXT,
    size: file.size,
  };

  try {
    await putRecord(createTransaction(database, "readwrite"), record);
  } finally {
    database.close();
  }

  await pruneLocalImages({ protectedIds: [record.id] });

  return {
    altText: sanitizeAltText(record.name),
    id: record.id,
    source: buildLocalImageSource(record.id),
  };
}

export async function pruneLocalImages(options: { protectedIds?: string[] } = {}) {
  if (!supportsIndexedDb()) {
    return;
  }

  const protectedIds = new Set(options.protectedIds ?? []);
  const database = await openDatabase();

  try {
    const store = createTransaction(database, "readwrite");
    const records = await getAllRecords(store);
    const now = Date.now();

    for (const record of records) {
      if (!protectedIds.has(record.id) && record.expiresAt <= now) {
        await deleteRecord(store, record.id);
      }
    }

    const retainedRecords = (await getAllRecords(store)).sort(
      (left, right) => left.lastAccessedAt - right.lastAccessedAt,
    );
    let totalSize = retainedRecords.reduce((sum, record) => sum + record.size, 0);

    for (const record of retainedRecords) {
      if (totalSize <= LOCAL_IMAGE_STORE_LIMIT_BYTES) {
        break;
      }
      if (protectedIds.has(record.id)) {
        continue;
      }

      await deleteRecord(store, record.id);
      totalSize -= record.size;
    }
  } finally {
    database.close();
  }
}

export async function resolveLocalImageMarkdown(
  markdown: string,
  fallbackSource = "/placeholder-card.svg",
): Promise<ResolveMarkdownResult> {
  const localImageIds = Array.from(new Set(extractLocalImageIds(markdown)));
  if (!supportsIndexedDb() || localImageIds.length === 0) {
    return {
      markdown,
      revoke: () => undefined,
    };
  }

  const database = await openDatabase();
  const objectUrls: string[] = [];
  const replacements = new Map<string, string>();
  const now = Date.now();

  try {
    const store = createTransaction(database, "readwrite");

    for (const id of localImageIds) {
      const record = await getRecord(store, id);
      if (!record) {
        replacements.set(buildLocalImageSource(id), fallbackSource);
        continue;
      }

      record.expiresAt = toExpiryTimestamp(now);
      record.lastAccessedAt = now;
      await putRecord(store, record);

      const objectUrl = URL.createObjectURL(record.blob);
      objectUrls.push(objectUrl);
      replacements.set(buildLocalImageSource(id), objectUrl);
    }
  } finally {
    database.close();
  }

  await pruneLocalImages({ protectedIds: localImageIds });

  return {
    markdown: replaceLocalImageSources(markdown, replacements),
    revoke: () => {
      objectUrls.forEach((objectUrl) => {
        URL.revokeObjectURL(objectUrl);
      });
    },
  };
}
