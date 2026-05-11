"use client";

import { useEffect, useState } from "react";
import { downloadBlob, renderElementToPngBlob } from "@/lib/export-to-image";
import { buildArchiveName, createArchiveBlob } from "@/lib/export-archive";
import { buildExportPlan } from "@/lib/export-plan";
import { parsePlainText } from "@/lib/plain-text";
import EditorPane from "@/components/workbench/editor-pane";
import PreviewPane from "@/components/workbench/preview-pane";
import SettingsSidebar from "@/components/workbench/settings-sidebar";
import TopBar from "@/components/workbench/top-bar";
import useEditorStore from "@/stores/editor-store";
import useSettingsStore from "@/stores/settings-store";

export default function Workbench() {
  const content = useEditorStore((state) => state.content);
  const selectedPreset = useSettingsStore((state) => state.selectedPreset);
  const [exportStatus, setExportStatus] = useState<"idle" | "exporting" | "success" | "error">("idle");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copying" | "success" | "error">("idle");
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  useEffect(() => {
    if (exportStatus !== "success" && copyStatus !== "success") {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setExportStatus("idle");
      setCopyStatus("idle");
      setExportMessage(null);
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [copyStatus, exportStatus]);

  const handleExport = async () => {
    const preview = document.getElementById("preview");
    if (!preview) {
      setExportStatus("error");
      setExportMessage("未找到可导出的预览区域。");
      return;
    }

    try {
      setCopyStatus("idle");
      setExportStatus("exporting");
      setExportMessage("正在生成 PNG 文件...");
      const pageNodes = Array.from(
        preview.querySelectorAll<HTMLElement>(".pages-wrapper > *"),
      );
      const exportTargets = pageNodes.length > 0 ? pageNodes : [preview];
      const exportPlan = buildExportPlan({
        cardCount: exportTargets.length,
        fileName: "ideaCard.png",
        preset: selectedPreset,
        renderedHeight: exportTargets[0].offsetHeight,
        renderedWidth: exportTargets[0].offsetWidth,
      });

      const blobs = [];
      for (const [index, target] of exportTargets.entries()) {
        const planItem = exportPlan[Math.min(index, exportPlan.length - 1)];
        const blob = await renderElementToPngBlob(target, {
          canvasWidth: planItem.canvasWidth,
          canvasHeight: planItem.canvasHeight,
        });
        blobs.push({ fileName: planItem.fileName, blob });
      }

      if (blobs.length > 1) {
        const archiveBlob = await createArchiveBlob(blobs);
        downloadBlob(archiveBlob, buildArchiveName("ideaCard.png"));
      } else if (blobs.length === 1) {
        downloadBlob(blobs[0].blob, blobs[0].fileName);
      }

      setExportStatus("success");
      setExportMessage(
        exportPlan.length > 1
          ? `已导出 ${exportPlan.length} 张 PNG，并打包为 ZIP，尺寸 ${exportPlan[0].canvasWidth}×${exportPlan[0].canvasHeight}。`
          : selectedPreset === "custom"
            ? "PNG 已生成，浏览器应已开始下载。"
            : `PNG 已生成，按 ${exportPlan[0].canvasWidth}×${exportPlan[0].canvasHeight} 导出。`,
      );
    } catch (error) {
      setExportStatus("error");
      setExportMessage(
        error instanceof Error ? error.message : "导出失败，请稍后重试。",
      );
    }
  };

  const handleCopyPlainText = async () => {
    try {
      setExportStatus("idle");
      setCopyStatus("copying");
      setExportMessage("正在复制纯文本...");

      if (!navigator.clipboard?.writeText) {
        throw new Error("当前浏览器不支持剪贴板写入。");
      }

      const plainText = await parsePlainText(content);
      if (!plainText) {
        setCopyStatus("error");
        setExportMessage("当前没有可复制的正文文本。");
        return;
      }

      await navigator.clipboard.writeText(plainText);
      setCopyStatus("success");
      setExportMessage("纯文本已复制到剪贴板。");
    } catch (error) {
      setCopyStatus("error");
      setExportMessage(
        error instanceof Error ? error.message : "复制纯文本失败，请稍后重试。",
      );
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-100 xl:h-screen xl:overflow-hidden">
      <TopBar
        copyStatus={copyStatus}
        exportMessage={exportMessage}
        exportStatus={exportStatus}
        onCopyPlainText={handleCopyPlainText}
        onExport={handleExport}
      />
      <main className="flex-1 min-h-0 px-4 py-4 lg:px-5 lg:py-5 xl:h-[calc(100vh-72px)] xl:overflow-hidden">
        <div className="mx-auto grid w-full max-w-420 grid-cols-1 items-start gap-5 xl:h-full xl:items-stretch xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)_320px]">
          <div className="min-w-0 xl:h-full xl:min-h-0">
            <EditorPane />
          </div>
          <div className="min-w-0 xl:h-full xl:min-h-0">
            <PreviewPane />
          </div>
          <div className="min-w-0 xl:min-h-0">
            <SettingsSidebar />
          </div>
        </div>
      </main>
    </div>
  );
}
