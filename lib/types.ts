import { BUILT_IN_LABELS } from '@/lib/constants';

export type BuiltInLabel = (typeof BUILT_IN_LABELS)[number];

export type Profile = {
  id: string;
  email: string;
  is_premium: boolean;
  created_at?: string;
};

export type FeedPost = {
  id: string;
  lat: number;
  lng: number;
  location_name: string | null;
  activity_description: string;
  labels: string[] | null;
  photo_urls: string[] | null;
  posted_at: string;
  activity_starts_at: string;
  activity_duration_minutes: number;
  activity_ends_at: string;
  activity_radius_meters: number;
  distance_meters: number;
};

export type CreatePostPayload = {
  lat: number;
  lng: number;
  locationName?: string;
  activityDescription: string;
  startDate: string;
  activityDurationMinutes: number;
  distanceRangeMeters: number;
  labels?: BuiltInLabel[];
  photoUrls?: string[];
  photoPaths?: string[];
};

export type CreatePostResponse = {
  ok: boolean;
  message: string;
  post?: FeedPost;
};
