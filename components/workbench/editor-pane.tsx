"use client";

import { loader as monacoLoader } from "@monaco-editor/react";
import dynamic from "next/dynamic";
import {
  useEffect,
  useEffectEvent,
  useId,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type JSX,
} from "react";
import {
  FiAlignLeft,
  FiBold,
  FiChevronDown,
  FiCode,
  FiImage,
  FiItalic,
  FiLink2,
  FiList,
  FiPlus,
  FiUnderline,
} from "react-icons/fi";
import { TbH1, TbH2, TbH3 } from "react-icons/tb";
import {
  alignmentOptions,
  formatSelection,
  type AlignmentOption,
  type FormatAction,
} from "@/lib/editor-format";
import {
  buildLocalImageMarkdown,
  saveLocalImage,
} from "@/lib/local-images";
import { configureMonacoLoader } from "@/lib/monaco-loader";
import usePersistHydration from "@/hooks/use-persist-hydration";
import useEditorStore from "@/stores/editor-store";

configureMonacoLoader(monacoLoader);

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});
const persistDelayMs = 180;
const localImageAccept = "image/png,image/jpeg,image/webp,image/gif,image/svg+xml";

type EditorInstance = {
  addCommand: (keybinding: number, handler: () => void) => void;
  executeEdits: (source: string, edits: { range: unknown; text: string }[]) => void;
  focus: () => void;
  getModel: () => { getValueInRange: (range: unknown) => string } | null;
  getSelection: () => unknown;
  pushUndoStop: () => void;
};

type MonacoInstance = {
  KeyCode: Record<string, number>;
  KeyMod: {
    Alt: number;
    CtrlCmd: number;
    Shift: number;
  };
};

const toolbarGroups: {
  id: FormatAction;
  label: string;
  icon: JSX.Element;
}[][] = [
  [
    { id: "h1", label: "一级标题", icon: <TbH1 className="h-4 w-4" /> },
    { id: "h2", label: "二级标题", icon: <TbH2 className="h-4 w-4" /> },
    { id: "h3", label: "三级标题", icon: <TbH3 className="h-4 w-4" /> },
  ],
  [
    { id: "bold", label: "加粗", icon: <FiBold className="h-4 w-4" /> },
    { id: "italic", label: "斜体", icon: <FiItalic className="h-4 w-4" /> },
    { id: "underline", label: "下划线", icon: <FiUnderline className="h-4 w-4" /> },
  ],
  [
    { id: "link", label: "插入链接", icon: <FiLink2 className="h-4 w-4" /> },
    { id: "image", label: "插入图片", icon: <FiImage className="h-4 w-4" /> },
    { id: "code", label: "插入代码", icon: <FiCode className="h-4 w-4" /> },
  ],
  [
    { id: "list", label: "无序列表", icon: <FiList className="h-4 w-4" /> },
    {
      id: "blankLine",
      label: "插入空行",
      icon: <FiPlus className="h-4 w-4" />,
    },
  ],
];

const shortcutLabels: Partial<Record<FormatAction, string>> = {
  h1: "Ctrl/Cmd+Alt+1",
  h2: "Ctrl/Cmd+Alt+2",
  h3: "Ctrl/Cmd+Alt+3",
  bold: "Ctrl/Cmd+B",
  italic: "Ctrl/Cmd+I",
  underline: "Ctrl/Cmd+U",
  link: "Ctrl/Cmd+K",
  code: "Ctrl/Cmd+E",
  list: "Ctrl/Cmd+Shift+8",
};

const shortcutActions: {
  action: FormatAction;
  keyCode: string;
  modifiers?: "alt" | "shift";
}[] = [
  { action: "bold", keyCode: "KeyB" },
  { action: "italic", keyCode: "KeyI" },
  { action: "underline", keyCode: "KeyU" },
  { action: "link", keyCode: "KeyK" },
  { action: "code", keyCode: "KeyE" },
  { action: "list", keyCode: "Digit8", modifiers: "shift" },
  { action: "h1", keyCode: "Digit1", modifiers: "alt" },
  { action: "h2", keyCode: "Digit2", modifiers: "alt" },
  { action: "h3", keyCode: "Digit3", modifiers: "alt" },
];

const alignmentLabels: Record<AlignmentOption, string> = {
  left: "左对齐",
  center: "居中对齐",
  right: "右对齐",
};

function getImageAltText(fileName: string, selectedText: string) {
  const normalizedSelection = selectedText.trim().replace(/[\r\n\]]+/g, " ");
  if (normalizedSelection) {
    return normalizedSelection;
  }

  const normalizedFileName = fileName.trim().replace(/\.[^.]+$/, "").replace(/[\r\n\]]+/g, " ");
  return normalizedFileName || "图片";
}

export default function EditorPane() {
  const content = useEditorStore((state) => state.content);
  const setContent = useEditorStore((state) => state.setContent);
  const editorReady = usePersistHydration(useEditorStore);
  const [draftContent, setDraftContent] = useState("");
  const [imageMessage, setImageMessage] = useState<string | null>(null);
  const [isAlignmentMenuOpen, setAlignmentMenuOpen] = useState(false);
  const draftContentRef = useRef(content);
  const persistedContentRef = useRef(content);
  const persistTimerRef = useRef<number | null>(null);
  const imageUploadId = useId();
  const imageUploadRef = useRef<HTMLInputElement | null>(null);
  const editorRef = useRef<EditorInstance | null>(null);

  const clearPersistTimer = () => {
    if (persistTimerRef.current === null) {
      return;
    }

    window.clearTimeout(persistTimerRef.current);
    persistTimerRef.current = null;
  };

  const flushDraftContent = useEffectEvent(() => {
    clearPersistTimer();

    const nextContent = draftContentRef.current;
    if (nextContent === persistedContentRef.current) {
      return;
    }

    persistedContentRef.current = nextContent;
    setContent(nextContent);
  });

  const alignmentActions = useMemo(
    () => alignmentOptions.map((option) => ({
      id: `align-${option}` as FormatAction,
      label: alignmentLabels[option],
    })),
    [],
  );
  const markdownCharacterCount = useMemo(
    () => Array.from(draftContent.replace(/\s/g, "")).length,
    [draftContent],
  );

  useEffect(() => {
    if (!editorReady) {
      return;
    }

    persistedContentRef.current = content;
    draftContentRef.current = content;
    setDraftContent(content);
  }, [content, editorReady]);

  useEffect(() => {
    if (!editorReady) {
      return undefined;
    }

    clearPersistTimer();
    persistTimerRef.current = window.setTimeout(() => {
      flushDraftContent();
    }, persistDelayMs);

    return () => {
      clearPersistTimer();
    };
  }, [draftContent, editorReady, flushDraftContent]);

  useEffect(() => {
    if (!editorReady) {
      return undefined;
    }

    const handleBeforeUnload = () => {
      flushDraftContent();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      flushDraftContent();
    };
  }, [editorReady, flushDraftContent]);

  const insertLocalImage = async (file: File) => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    const selection = editor.getSelection();
    if (!selection) {
      setImageMessage("请先把光标放到编辑器里，再插入图片。");
      return;
    }

    try {
      const selectedText = editor.getModel()?.getValueInRange(selection) || "";
      const { altText, id } = await saveLocalImage(file);
      const markdown = buildLocalImageMarkdown(id, getImageAltText(file.name || altText, selectedText));

      editor.executeEdits("local-image-insert", [{ range: selection, text: markdown }]);
      editor.pushUndoStop();
      editor.focus();
      setImageMessage(`已插入本地图片：${altText}`);
    } catch (error) {
      setImageMessage(error instanceof Error ? error.message : "插入图片失败，请稍后重试。");
    }
  };

  const handleImageFile = async (file: File | null | undefined) => {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setImageMessage("仅支持图片文件，请重新选择。");
      return;
    }

    await insertLocalImage(file);
  };

  const applyMarkdownFormat = (action: FormatAction) => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    const selection = editor.getSelection();
    if (!selection) {
      return;
    }

    const selectedText = editor.getModel()?.getValueInRange(selection) || "";
    const nextText = formatSelection(selectedText, action);

    editor.executeEdits("markdown-format", [{ range: selection, text: nextText }]);
    editor.pushUndoStop();
    editor.focus();
    setAlignmentMenuOpen(false);
    setImageMessage(null);
  };

  const handleToolbarAction = (action: FormatAction) => {
    if (action === "image") {
      imageUploadRef.current?.click();
      return;
    }

    applyMarkdownFormat(action);
  };

  const registerMarkdownShortcuts = (editor: EditorInstance, monaco: MonacoInstance) => {
    shortcutActions.forEach(({ action, keyCode, modifiers }) => {
      const baseKeyCode = monaco.KeyCode[keyCode];
      if (!baseKeyCode) {
        return;
      }

      const modifier =
        modifiers === "alt"
          ? monaco.KeyMod.Alt
          : modifiers === "shift"
            ? monaco.KeyMod.Shift
            : 0;

      editor.addCommand(monaco.KeyMod.CtrlCmd | modifier | baseKeyCode, () => {
        applyMarkdownFormat(action);
      });
    });
  };

  const handlePasteCapture = async (event: ClipboardEvent<HTMLDivElement>) => {
    const imageItem = Array.from(event.clipboardData?.items ?? []).find(
      (item) => item.kind === "file" && item.type.startsWith("image/"),
    );
    const file = imageItem?.getAsFile();
    if (!file) {
      return;
    }

    event.preventDefault();
    await insertLocalImage(file);
  };

  return (
    <section className="flex h-full min-h-[720px] flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)] xl:h-full xl:min-h-0">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50/80 p-3">
        {toolbarGroups.map((group, groupIndex) => (
          <div
            key={`group-${groupIndex}`}
            className="flex items-center gap-1 border-r border-slate-200 pr-2 last:border-r-0"
          >
            {group.map((action) => (
              <button
                key={action.id}
                aria-label={action.label}
                className="rounded-lg p-2 text-slate-600 transition hover:bg-white hover:text-slate-900"
                onClick={() => handleToolbarAction(action.id)}
                onMouseDown={(event) => event.preventDefault()}
                title={
                  shortcutLabels[action.id]
                    ? `${action.label} (${shortcutLabels[action.id]})`
                    : action.label
                }
                type="button"
              >
                {action.icon}
              </button>
            ))}
          </div>
        ))}

        <div className="relative flex items-center gap-1">
          <button
            aria-expanded={isAlignmentMenuOpen}
            aria-haspopup="menu"
            aria-label="文本对齐"
            className="flex items-center gap-1 rounded-lg bg-white px-3 py-2 text-sm text-slate-600 transition hover:text-slate-900"
            onClick={() => setAlignmentMenuOpen((current) => !current)}
            onMouseDown={(event) => event.preventDefault()}
            title="文本对齐"
            type="button"
          >
            <FiAlignLeft className="h-4 w-4" />
            <span>对齐</span>
            <FiChevronDown className="h-3.5 w-3.5" />
          </button>

          {isAlignmentMenuOpen ? (
            <div
              className="absolute left-0 top-full z-10 mt-2 w-36 rounded-xl border border-slate-200 bg-white p-1 shadow-lg"
              role="menu"
            >
              {alignmentActions.map((action) => (
                <button
                  key={action.id}
                  className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                  onClick={() => handleToolbarAction(action.id)}
                  onMouseDown={(event) => event.preventDefault()}
                  role="menuitem"
                  type="button"
                >
                  {action.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <input
          accept={localImageAccept}
          className="sr-only"
          id={imageUploadId}
          onChange={async (event) => {
            await handleImageFile(event.target.files?.[0]);
            event.target.value = "";
          }}
          ref={imageUploadRef}
          type="file"
        />

        {imageMessage ? <p className="text-xs text-slate-500">{imageMessage}</p> : null}
      </div>
      <div className="min-h-[520px] flex-1 overflow-hidden xl:min-h-0" onPasteCapture={handlePasteCapture}>
        {editorReady ? (
          <MonacoEditor
            className="h-full"
            height="100%"
            language="markdown"
            onChange={(value) => {
              const nextContent = value ?? "";
              draftContentRef.current = nextContent;
              setDraftContent(nextContent);
            }}
            onMount={(editor, monaco) => {
              const mountedEditor = editor as unknown as EditorInstance;
              editorRef.current = mountedEditor;
              registerMarkdownShortcuts(mountedEditor, monaco as unknown as MonacoInstance);
            }}
            options={{
              automaticLayout: true,
              minimap: { enabled: false },
              fontSize: 16,
              lineNumbers: "on",
              wordWrap: "on",
              contextmenu: true,
              padding: {
                top: 20,
              },
              scrollbar: {
                vertical: "visible",
                horizontal: "visible",
              },
            }}
            theme="light"
            value={draftContent}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-slate-50 text-sm text-slate-500">
            正在恢复编辑内容...
          </div>
        )}
      </div>
      <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/80 px-4 py-2 text-xs text-slate-500">
        <span>Markdown</span>
        <span className="font-medium text-slate-600">总字数 {markdownCharacterCount}</span>
      </div>
    </section>
  );
}
