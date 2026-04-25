// todo: internationalize
// todo: use date-fns or similar library for formatting and manipulating dates and times

const MIN_MS = 60_000;
const HOUR_MS = 60 * MIN_MS;

const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

export function formatDuration(durationMinutes: number) {
  if (durationMinutes < 60) {
    return `${durationMinutes} min`;
  }

  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  return minutes // wrap
    ? `${hours} hr ${minutes} min`
    : `${hours} hr`;
}

export function formatAbsoluteDate(dateString: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(dateString));
}

export function formatRelativeTime(dateString: string) {
  const deltaMinutes = Math.round(
    (+new Date(dateString) - Date.now()) / MIN_MS,
  );

  if (Math.abs(deltaMinutes) < 60) {
    return formatter.format(deltaMinutes, 'minute');
  }

  const deltaHours = Math.round(deltaMinutes / 60);

  if (Math.abs(deltaHours) < 48) {
    return formatter.format(deltaHours, 'hour');
  }

  const deltaDays = Math.round(deltaHours / 24);
  return formatter.format(deltaDays, 'day');
}

export function toLocalDateTimeISOString(date: Date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(+date - offset * MIN_MS);
  return local.toISOString().slice(0, 16);
}

export function addHours(date: Date, hours: number) {
  return new Date(+date + hours * HOUR_MS);
}
