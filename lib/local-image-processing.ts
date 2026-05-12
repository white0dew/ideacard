export const LOCAL_IMAGE_MAX_EDGE_PX = 2048;
export const LOCAL_IMAGE_WEBP_MIME_TYPE = "image/webp";
export const LOCAL_IMAGE_WEBP_QUALITY = 0.84;

const LOCAL_IMAGE_PASSTHROUGH_MIME_TYPES = new Set(["image/svg+xml", "image/gif"]);

export interface LocalImageDimensions {
  width: number;
  height: number;
}

export interface DecodedLocalImage extends LocalImageDimensions {
  source: CanvasImageSource;
  close?: () => void;
}

export interface RenderLocalImageOptions extends LocalImageDimensions {
  type: string;
  quality: number;
}

export interface LocalImageProcessingDependencies {
  decodeImage: (file: File) => Promise<DecodedLocalImage>;
  renderImage: (source: CanvasImageSource, options: RenderLocalImageOptions) => Promise<Blob | null>;
  createFile: (blob: Blob, originalFile: File, type: string) => File;
}

function isImageFile(file: Pick<File, "type">) {
  return file.type.startsWith("image/");
}

export function shouldBypassLocalImageProcessing(file: Pick<File, "type">) {
  return !isImageFile(file) || LOCAL_IMAGE_PASSTHROUGH_MIME_TYPES.has(file.type);
}

export function getLocalImageTargetDimensions(
  width: number,
  height: number,
  maxEdge = LOCAL_IMAGE_MAX_EDGE_PX,
): LocalImageDimensions {
  const longestEdge = Math.max(width, height);
  if (longestEdge <= maxEdge) {
    return { height, width };
  }

  const scale = maxEdge / longestEdge;
  return {
    height: Math.max(1, Math.round(height * scale)),
    width: Math.max(1, Math.round(width * scale)),
  };
}

function replaceFileExtension(name: string, nextExtension: string) {
  const extensionIndex = name.lastIndexOf(".");
  if (extensionIndex <= 0) {
    return `${name}${nextExtension}`;
  }

  return `${name.slice(0, extensionIndex)}${nextExtension}`;
}

export function getProcessedLocalImageName(originalName: string, type: string) {
  if (type === LOCAL_IMAGE_WEBP_MIME_TYPE) {
    return replaceFileExtension(originalName || "image", ".webp");
  }

  return originalName || "image";
}

async function decodeImageWithBitmap(file: File): Promise<DecodedLocalImage> {
  const bitmap = await createImageBitmap(file);
  return {
    close: () => bitmap.close(),
    height: bitmap.height,
    source: bitmap,
    width: bitmap.width,
  };
}

function decodeImageWithElement(file: File) {
  const objectUrl = URL.createObjectURL(file);

  return new Promise<DecodedLocalImage>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        height: image.naturalHeight,
        source: image,
        width: image.naturalWidth,
      });
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("读取本地图片尺寸失败。"));
    };
    image.src = objectUrl;
  });
}

async function decodeLocalImage(file: File) {
  if (typeof createImageBitmap === "function") {
    return decodeImageWithBitmap(file);
  }

  return decodeImageWithElement(file);
}

async function renderWithCanvasElement(
  source: CanvasImageSource,
  options: RenderLocalImageOptions,
) {
  if (typeof document === "undefined") {
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.width = options.width;
  canvas.height = options.height;
  const context = canvas.getContext("2d");
  if (!context) {
    return null;
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(source, 0, 0, options.width, options.height);

  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), options.type, options.quality);
  });
}

async function renderLocalImage(
  source: CanvasImageSource,
  options: RenderLocalImageOptions,
) {
  if (typeof OffscreenCanvas !== "undefined") {
    const canvas = new OffscreenCanvas(options.width, options.height);
    const context = canvas.getContext("2d");
    if (!context) {
      return null;
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(source, 0, 0, options.width, options.height);
    return canvas.convertToBlob({ quality: options.quality, type: options.type });
  }

  return renderWithCanvasElement(source, options);
}

function createProcessedLocalImageFile(blob: Blob, originalFile: File, type: string) {
  return new File([blob], getProcessedLocalImageName(originalFile.name, type), {
    lastModified: originalFile.lastModified,
    type,
  });
}

const defaultDependencies: LocalImageProcessingDependencies = {
  createFile: createProcessedLocalImageFile,
  decodeImage: decodeLocalImage,
  renderImage: renderLocalImage,
};

export async function prepareLocalImageForStorage(
  file: File,
  dependencies: LocalImageProcessingDependencies = defaultDependencies,
) {
  if (shouldBypassLocalImageProcessing(file)) {
    return file;
  }

  try {
    const decodedImage = await dependencies.decodeImage(file);

    try {
      const targetDimensions = getLocalImageTargetDimensions(
        decodedImage.width,
        decodedImage.height,
      );
      const blob = await dependencies.renderImage(decodedImage.source, {
        ...targetDimensions,
        quality: LOCAL_IMAGE_WEBP_QUALITY,
        type: LOCAL_IMAGE_WEBP_MIME_TYPE,
      });

      if (!blob || blob.size >= file.size) {
        return file;
      }

      return dependencies.createFile(blob, file, LOCAL_IMAGE_WEBP_MIME_TYPE);
    } finally {
      decodedImage.close?.();
    }
  } catch {
    return file;
  }
}
