import { useState, useEffect, useCallback } from 'react';
import {
  getNavigatorPermission,
  permissionOnchange,
} from '@/lib/util/permissions';
import { serializer } from '@/lib/util/async';

// provides reactive permission state
// - includes polling fallback for browsers that don't support permissions onchange

export const usePermission = (permission: PermissionName) => {
  const [state, setState] = useState<
    PermissionState | 'pending' | 'unsupported' | 'error'
  >('pending');

  useEffect(() => {
    let isMounted = true;
    let unregisterPermissionOnchange: (() => void) | null = null;
    let pollingId: NodeJS.Timeout | undefined = undefined;

    getNavigatorPermission(permission).then(async (state) => {
      if (!isMounted) return;

      setState(state);

      if (state === 'unsupported') {
        return;
      }

      unregisterPermissionOnchange = await permissionOnchange(
        permission,
        (state) => {
          if (isMounted) setState(state);
        },
      );

      if (!isMounted) return;

      if (!unregisterPermissionOnchange) {
        startPolling();
      }
    });

    return () => {
      isMounted = false;
      unregisterPermissionOnchange?.();
      clearInterval(pollingId);
    };

    function startPolling() {
      if (pollingId != null) return;

      const queuePermQuery = serializer();

      const handler = () => {
        if (!isMounted) return;

        queuePermQuery(async () => {
          const perm = await getNavigatorPermission(permission);
          if (isMounted) setState(perm);
        });
      };

      pollingId = setInterval(handler, 2_000);
    }
  }, [permission]);

  return {
    state,
  };
};
