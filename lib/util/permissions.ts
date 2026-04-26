import { getExceptionText } from '@/lib/util/logging';

export async function getNavigatorPermission(
  name: PermissionName,
): Promise<PermissionState | 'unsupported' | 'error'> {
  if (!navigator.permissions) {
    return 'unsupported';
  }

  try {
    return (await navigator.permissions.query({ name })).state;
  } catch (ex) {
    console.warn(getExceptionText(ex, `Error checking permission "${name}"`));

    return ex instanceof DOMException && ex.name === 'InvalidStateError'
      ? 'error'
      : 'unsupported';
  }
}

// returns unregister function or null if error or onchange is not supported
export async function permissionOnchange(
  name: PermissionName,
  callback: (state: PermissionState) => void,
): Promise<(() => void) | null> {
  if (!navigator.permissions) {
    return null;
  }

  try {
    const status = await navigator.permissions.query({ name });

    // some browsers may support onchange but not have it defined until it's accessed
    const _ = status.onchange;

    // todo: is this the best way to detect support for onchange?
    if ('onchange' in status) {
      status.onchange = (e) => callback((e.target as PermissionStatus).state);

      return () => {
        status.onchange = null;
      };
    }
  } catch (ex) {
    console.warn(getExceptionText(ex, `Error setting onchange for "${name}"`));
  }

  return null;
}
