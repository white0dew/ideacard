export const MIN_CARD_WIDTH = 200;
export const MAX_CARD_WIDTH = 500;
export const MIN_CARD_HEIGHT = 200;

export function clampCardWidth(width: number) {
  if (!Number.isFinite(width)) {
    return MIN_CARD_WIDTH;
  }

  return Math.min(MAX_CARD_WIDTH, Math.max(MIN_CARD_WIDTH, Math.round(width)));
}

export function clampCardHeight(height: number) {
  if (!Number.isFinite(height)) {
    return MIN_CARD_HEIGHT;
  }

  return Math.max(MIN_CARD_HEIGHT, Math.round(height));
}
