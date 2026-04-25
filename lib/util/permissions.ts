import { getExceptionText } from '@/lib/util/logging';

export async function getNavigatorPermission(
  name: PermissionName,
): Promise<PermissionState | 'unsupported'> {
  if (!navigator.permissions) {
    return 'unsupported';
  }

  try {
    return (await navigator.permissions.query({ name })).state;
  } catch (ex) {
    console.warn(getExceptionText(ex, `Error checking permission "${name}"`));

    return 'unsupported';
  }
}
