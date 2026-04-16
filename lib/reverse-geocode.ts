import { z } from 'zod';

const coordinatesSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

type MapboxGeocodeResponse = {
  features?: MapboxFeature[];
};

type MapboxFeature = {
  properties?: {
    name: string;
    context?: {
      neighborhood?: { name: string };
      locality?: { name: string };
      place?: { name: string };
      postcode?: { name: string };
    };
  };
};

export async function getLocationName({
  lat,
  lng,
}: {
  lat: number;
  lng: number;
}) {
  const parsed = coordinatesSchema.safeParse({ lat, lng });

  if (!parsed.success) {
    // throw new Error('Invalid coordinates.');
    return '';
  }

  const access_token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  if (!access_token) {
    return '';
  }

  const searchParams = new URLSearchParams({
    access_token,
    limit: '1',
    types: 'neighborhood,locality,place,postcode',
  });

  const response = await fetch(
    `https://api.mapbox.com/search/geocode/v6/reverse?longitude=${lng}&latitude=${lat}&${searchParams.toString()}`,
    {
      headers: {
        'Content-Type': 'application/json',
        // 'Cache-Control': 'public, max-age=31536000, immutable',
      },
      next: {
        revalidate: false, // disable automatic revalidation
        // revalidate: 3_600,
      },
    },
  );

  if (!response.ok) {
    return '';
  }

  const payload = (await response.json()) as MapboxGeocodeResponse;

  const properties = payload.features?.[0]?.properties;

  if (!properties) {
    return '';
  }

  return (
    properties.name ||
    properties.context?.neighborhood?.name ||
    properties.context?.locality?.name ||
    properties.context?.place?.name ||
    properties.context?.postcode?.name ||
    ''
  );
}
