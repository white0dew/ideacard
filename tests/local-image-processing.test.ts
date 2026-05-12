import assert from "node:assert/strict";
import test from "node:test";
import {
  LOCAL_IMAGE_MAX_EDGE_PX,
  LOCAL_IMAGE_WEBP_MIME_TYPE,
  LOCAL_IMAGE_WEBP_QUALITY,
  getLocalImageTargetDimensions,
  prepareLocalImageForStorage,
  shouldBypassLocalImageProcessing,
} from "@/lib/local-image-processing";

test("local image processing constants match the storage policy", () => {
  assert.equal(LOCAL_IMAGE_MAX_EDGE_PX, 2048);
  assert.equal(LOCAL_IMAGE_WEBP_MIME_TYPE, "image/webp");
  assert.equal(LOCAL_IMAGE_WEBP_QUALITY, 0.84);
});

test("local image processing skips svg and gif assets", async () => {
  const gifFile = new File(["gif"], "animated.gif", { type: "image/gif" });
  const svgFile = new File(["<svg/>"], "vector.svg", { type: "image/svg+xml" });
  let decodeCalls = 0;

  assert.equal(shouldBypassLocalImageProcessing(gifFile), true);
  assert.equal(shouldBypassLocalImageProcessing(svgFile), true);
  assert.equal(
    await prepareLocalImageForStorage(gifFile, {
      createFile: () => {
        throw new Error("should not create file");
      },
      decodeImage: async () => {
        decodeCalls += 1;
        throw new Error("should not decode");
      },
      renderImage: async () => {
        throw new Error("should not render");
      },
    }),
    gifFile,
  );
  assert.equal(decodeCalls, 0);
});

test("local image processing resizes wide bitmaps and converts them to webp when smaller", async () => {
  const file = new File([new Uint8Array(8_192)], "cover.png", { type: "image/png" });
  const renderedCalls: Array<{ width: number; height: number; type: string; quality: number }> = [];

  const processed = await prepareLocalImageForStorage(file, {
    createFile: (blob, originalFile, type) =>
      new File([blob], `${originalFile.name}.processed`, { type }),
    decodeImage: async () => ({
      height: 1024,
      source: {} as CanvasImageSource,
      width: 4096,
    }),
    renderImage: async (_source, options) => {
      renderedCalls.push(options);
      return new Blob([new Uint8Array(1_024)], { type: options.type });
    },
  });

  assert.equal(processed.type, LOCAL_IMAGE_WEBP_MIME_TYPE);
  assert.equal(processed.name, "cover.png.processed");
  assert.equal(renderedCalls.length, 1);
  assert.deepEqual(renderedCalls[0], {
    height: 512,
    quality: LOCAL_IMAGE_WEBP_QUALITY,
    type: LOCAL_IMAGE_WEBP_MIME_TYPE,
    width: LOCAL_IMAGE_MAX_EDGE_PX,
  });
});

test("local image processing keeps the original file when the encoded blob is larger", async () => {
  const file = new File([new Uint8Array(1_024)], "photo.jpg", { type: "image/jpeg" });

  const processed = await prepareLocalImageForStorage(file, {
    createFile: (blob, originalFile, type) => new File([blob], originalFile.name, { type }),
    decodeImage: async () => ({
      height: 1600,
      source: {} as CanvasImageSource,
      width: 1200,
    }),
    renderImage: async (_source, options) =>
      new Blob([new Uint8Array(2_048)], { type: options.type }),
  });

  assert.equal(processed, file);
});

test("local image processing calculates target dimensions from the longest edge", () => {
  assert.deepEqual(getLocalImageTargetDimensions(1000, 500), { height: 500, width: 1000 });
  assert.deepEqual(getLocalImageTargetDimensions(1000, 3000), { height: 2048, width: 683 });
});
