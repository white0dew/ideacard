interface ExportOptions {
  canvasWidth?: number;
  canvasHeight?: number;
}

function shouldCacheBustImages(element: HTMLElement) {
  return !element.querySelector('img[src^="blob:"]');
}

export async function renderElementToPngBlob(
  element: HTMLElement,
  options: ExportOptions = {},
) {
  const htmlToImage = await import("html-to-image");
  const fallbackImage =
    "data:image/svg+xml;charset=utf-8," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">' +
        '<rect width="1200" height="630" fill="#e2e8f0" />' +
        '<text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" fill="#64748b" font-family="Inter, Arial, sans-serif" font-size="36">' +
        "Image unavailable" +
        "</text>" +
      "</svg>",
    );

  const blob = await htmlToImage.toBlob(element, {
    canvasWidth: options.canvasWidth,
    canvasHeight: options.canvasHeight,
    cacheBust: shouldCacheBustImages(element),
    imagePlaceholder: fallbackImage,
    pixelRatio: 2,
  });

  if (!blob) {
    throw new Error("导出失败，未生成图片数据。");
  }

  return blob;
}

export function downloadBlob(blob: Blob, fileName: string) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = fileName;
  link.href = objectUrl;
  link.click();

  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 1000);
}

export async function exportElementToPng(
  element: HTMLElement,
  fileName: string,
  options: ExportOptions = {},
) {
  const blob = await renderElementToPngBlob(element, options);
  downloadBlob(blob, fileName);
}
