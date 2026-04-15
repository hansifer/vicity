export const BUILT_IN_LABELS = [
  "garage sale",
  "accident",
  "speed trap",
  "construction",
  "suspicious activity",
  "road closure",
  "community event",
  "weather hazard",
  "police presence",
  "long line",
] as const;

export const DEFAULT_POST_RADIUS_METERS = 250;
export const DEFAULT_ACTIVITY_DURATION_MINUTES = 60;
export const MIN_POST_RADIUS_METERS = 50;
export const MAX_POST_RADIUS_METERS = 5_000;
export const MIN_ACTIVITY_DURATION_MINUTES = 15;
export const MAX_ACTIVITY_DURATION_MINUTES = 1_440;
export const MAX_PHOTO_COUNT = 3;
export const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;
