// todo: internationalize

export function formatDistance(meters: number) {
  if (meters >= 1_000) {
    return `${(meters / 1_000).toFixed(1)} km`;
  }

  return `${Math.round(meters)} m`;
}
