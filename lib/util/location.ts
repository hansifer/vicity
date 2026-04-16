import { getNavigatorPermission } from '@/lib/util/permissions';

// Utility functions related to location access and geolocation APIs

export const locationPermission = () => getNavigatorPermission('geolocation');

const opts = {
  enableHighAccuracy: false, // true may be slower and consume more battery
  timeout: 30_000, // may involve waiting for user interaction
  maximumAge: 60_000,
};

// promise-based version of navigator.geolocation.getCurrentPosition
export const getGeoPosition = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      resolve,
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(
              new Error('Permission to access location was denied.', {
                cause: error,
              }),
            );
            break;
          case error.POSITION_UNAVAILABLE:
            reject(
              new Error('Location information is unavailable.', {
                cause: error,
              }),
            );
            break;
          case error.TIMEOUT:
            reject(
              new Error('The request to get location timed out.', {
                cause: error,
              }),
            );
            break;
          default:
            reject(
              new Error('An unknown error occurred while getting location.', {
                cause: error,
              }),
            );
        }
      },
      opts,
    );
  });
};

// returns an unsubscribe function
// handler receives position or { error: string }
export const watchGeoPosition = (
  handler: (position: GeolocationPosition | { error: string }) => void,
): (() => void) => {
  if (!navigator.geolocation) {
    throw new Error('Geolocation is not supported by your browser.');
  }

  const watchId = navigator.geolocation.watchPosition(
    handler,
    (error) => {
      handler({
        error:
          error.code === error.PERMISSION_DENIED
            ? 'Permission to access location was denied.'
            : error.code === error.POSITION_UNAVAILABLE
              ? 'Location information is unavailable.'
              : error.code === error.TIMEOUT
                ? 'The request to get location timed out.'
                : 'An unknown error occurred while getting location.',
      });
    },
    opts,
  );

  if (!watchId) {
    throw new Error('Failed to start watching location.');
  }

  return () => {
    navigator.geolocation.clearWatch(watchId);
  };
};
