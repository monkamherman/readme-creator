import { z } from 'zod';

export const couponSchema = z.object({
  title: z
    .string()
    .min(1, 'Le titre est requis')
    .max(35, 'Le titre ne peut pas dépasser 35 caractères')
    .trim()
    .refine((val) => val.trim().length > 0, 'Le titre ne peut pas être vide'),
  discount: z
    .number()
    .min(1, 'La réduction doit être au minimum 1%')
    .max(100, 'La réduction ne peut pas dépasser 100%'),
  enabled: z.boolean(),
});

export type CouponFormData = z.infer<typeof couponSchema>;

export const validateCoupon = (data: unknown) => {
  return couponSchema.safeParse(data);
};
