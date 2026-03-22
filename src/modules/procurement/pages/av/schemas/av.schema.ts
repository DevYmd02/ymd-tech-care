import { z } from 'zod';
import { PRLineSchema, PRBaseFormSchema } from '@/modules/procurement/schemas/pr-schemas';

// We extend PRLineSchema with AV-specific fields
export const AVLineSchema = PRLineSchema.extend({
    is_approved: z.boolean().default(true),
    approved_qty: z.number().min(0).default(0),
    remark: z.string().optional().nullable(),
    requested_qty: z.number().optional().nullable(),
});

export type AVLineFormData = z.infer<typeof AVLineSchema>;

// Extend the PR Form Schema to use the AV Lines
export const AVFormSchema = PRBaseFormSchema.extend({
    lines: z.array(AVLineSchema),
    av_no: z.string().optional().nullable(),
});

export type AVFormData = z.infer<typeof AVFormSchema>;
