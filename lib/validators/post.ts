import { z } from "zod";

import {
  BUILT_IN_LABELS,
  MAX_ACTIVITY_DURATION_MINUTES,
  MAX_PHOTO_COUNT,
  MAX_POST_RADIUS_METERS,
  MIN_ACTIVITY_DURATION_MINUTES,
  MIN_POST_RADIUS_METERS,
} from "@/lib/constants";

export const createPostSchema = z
  .object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    locationName: z.string().trim().max(180).optional(),
    activityDescription: z.string().trim().min(8).max(600),
    startDate: z.string().datetime(),
    activityDurationMinutes: z
      .number()
      .int()
      .min(MIN_ACTIVITY_DURATION_MINUTES)
      .max(MAX_ACTIVITY_DURATION_MINUTES),
    distanceRangeMeters: z
      .number()
      .int()
      .min(MIN_POST_RADIUS_METERS)
      .max(MAX_POST_RADIUS_METERS),
    labels: z.array(z.enum(BUILT_IN_LABELS)).max(4).optional(),
    photoUrls: z.array(z.string().url()).max(MAX_PHOTO_COUNT).optional(),
    photoPaths: z.array(z.string().min(1)).max(MAX_PHOTO_COUNT).optional(),
  })
  .superRefine((value, ctx) => {
    if ((value.photoUrls?.length ?? 0) !== (value.photoPaths?.length ?? 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Photo paths and URLs must be paired.",
        path: ["photoPaths"],
      });
    }
  });
