import { useState, useEffect, useCallback, useRef } from 'react';
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

  const isMountedRef = useRef(true);
  const unregisterPermissionOnchangeRef = useRef<(() => void) | null>(null);
  const pollingIdRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const init = useCallback(() => {
    if (!isMountedRef.current) return;

    unregisterPermissionOnchangeRef.current?.();
    clearInterval(pollingIdRef.current);

    getNavigatorPermission(permission).then(async (state) => {
      if (!isMountedRef.current) return;

      setState(state);

      if (state === 'unsupported') {
        return;
      }

      unregisterPermissionOnchangeRef.current = await permissionOnchange(
        permission,
        (state) => {
          if (isMountedRef.current) setState(state);
        },
      );

      if (!isMountedRef.current) return;

      if (!unregisterPermissionOnchangeRef.current) {
        startPolling();
      }
    });

    function startPolling() {
      if (pollingIdRef.current != null) return;

      const queuePermQuery = serializer();

      const handler = () => {
        if (!isMountedRef.current) return;

        queuePermQuery(async () => {
          const perm = await getNavigatorPermission(permission);
          if (isMountedRef.current) setState(perm);
        });
      };

      pollingIdRef.current = setInterval(handler, 2_000);
    }
  }, [permission]);

  useEffect(() => {
    isMountedRef.current = true;
    init();

    return () => {
      isMountedRef.current = false;
      unregisterPermissionOnchangeRef.current?.();
      clearInterval(pollingIdRef.current);
    };
  }, [init]);

  return {
    state,
    init,
  };
};
