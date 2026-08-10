import { z } from 'zod';

export const modelViewPresetSchema = z.object({
  id: z.string().min(1),
  labelEn: z.string().min(1),
  labelZh: z.string().min(1),
  position: z.tuple([z.number(), z.number(), z.number()]),
  target: z.tuple([z.number(), z.number(), z.number()]),
});

const modelPartMatchSchema = z.object({
  partId: z.string().min(1).optional(),
  nameIncludes: z.array(z.string().min(1)).optional(),
  meshIndex: z.number().int().nonnegative().optional(),
  meshRange: z.tuple([z.number().int().nonnegative(), z.number().int().nonnegative()]).optional(),
}).optional();

export const modelPartSchema = z.object({
  id: z.string().min(1),
  labelEn: z.string().min(1),
  labelZh: z.string().min(1),
  descriptionEn: z.string().min(1),
  descriptionZh: z.string().min(1),
  match: modelPartMatchSchema,
});

const modelAnimationTrackSchema = z.object({
  partIds: z.array(z.string().min(1)).min(1),
  offset: z.tuple([z.number(), z.number(), z.number()]),
  scale: z.tuple([z.number(), z.number(), z.number()]).optional(),
});

export const modelAnimationSchema = z.object({
  id: z.string().min(1),
  labelEn: z.string().min(1),
  labelZh: z.string().min(1),
  descriptionEn: z.string().min(1),
  descriptionZh: z.string().min(1),
  partIds: z.array(z.string().min(1)).min(1),
  offset: z.tuple([z.number(), z.number(), z.number()]),
  tracks: z.array(modelAnimationTrackSchema).optional(),
  durationMs: z.number().int().positive().optional(),
});

export const modelPreviewSchema = z.object({
  model: z.string().min(1),
  poster: z.string().min(1),
  fallbackImage: z.string().min(1),
  size: z.string().min(1),
  unit: z.enum(['mm', 'cm', 'm']).optional(),
  camera: z.object({
    fov: z.number().optional(),
    position: z.tuple([z.number(), z.number(), z.number()]).optional(),
    target: z.tuple([z.number(), z.number(), z.number()]).optional(),
    autoRotate: z.boolean().optional(),
    autoRotateSpeed: z.number().optional(),
  }).optional(),
  views: z.array(modelViewPresetSchema).optional(),
  parts: z.array(modelPartSchema).optional(),
  animations: z.array(modelAnimationSchema).optional(),
  noteEn: z.string().min(1).optional(),
  noteZh: z.string().min(1).optional(),
});

export const modelPreviewsSchema = z.object({
  droplet: modelPreviewSchema,
  aquara: modelPreviewSchema.optional(),
});

export type ModelViewPreset = z.infer<typeof modelViewPresetSchema>;
export type ModelPart = z.infer<typeof modelPartSchema>;
export type ModelAnimation = z.infer<typeof modelAnimationSchema>;
export type ModelAnimationTrack = z.infer<typeof modelAnimationTrackSchema>;
export type ModelPreviewConfig = z.infer<typeof modelPreviewSchema>;
export type ModelPreviews = z.infer<typeof modelPreviewsSchema>;
