import { getExceptionText } from '@/lib/util/logging';

export async function getNavigatorPermission(
  name: PermissionName,
): Promise<PermissionState> {
  if (!navigator.permissions) {
    return 'prompt';
  }

  try {
    return (await navigator.permissions.query({ name })).state;
  } catch (ex) {
    console.error(
      getExceptionText(ex, `Error checking navigator permission "${name}"`),
    );
    return 'prompt';
  }
}
