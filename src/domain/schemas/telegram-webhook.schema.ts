import { z } from 'zod';

export const TelegramUserSchema = z.object({
  id: z.number(),
  is_bot: z.boolean(),
  first_name: z.string(),
  last_name: z.string().optional(),
  username: z.string().optional(),
  language_code: z.string().optional(),
});

export const TelegramChatSchema = z.object({
  id: z.number(),
  type: z.enum(['private', 'group', 'supergroup', 'channel']),
  title: z.string().optional(),
  username: z.string().optional(),
});

export const TelegramMessageSchema = z.object({
  message_id: z.number(),
  from: TelegramUserSchema.optional(),
  chat: TelegramChatSchema,
  date: z.number(),
  text: z.string().optional(),
});

export const TelegramCallbackQuerySchema = z.object({
  id: z.string(),
  from: TelegramUserSchema,
  message: TelegramMessageSchema.optional(),
  data: z.string().optional(),
});

export const TelegramUpdateSchema = z.object({
  update_id: z.number(),
  message: TelegramMessageSchema.optional(),
  callback_query: TelegramCallbackQuerySchema.optional(),
});

export type TelegramUserDto = z.infer<typeof TelegramUserSchema>;
export type TelegramChatDto = z.infer<typeof TelegramChatSchema>;
export type TelegramMessageDto = z.infer<typeof TelegramMessageSchema>;
export type TelegramCallbackQueryDto = z.infer<typeof TelegramCallbackQuerySchema>;
export type TelegramUpdateDto = z.infer<typeof TelegramUpdateSchema>;

export const TelegramGetMeResponseSchema = z.object({
  ok: z.boolean(),
  result: z.object({
    id: z.number(),
    is_bot: z.boolean(),
    first_name: z.string(),
    username: z.string().optional(),
    can_join_groups: z.boolean().optional(),
  }),
});

export const TelegramGetWebhookInfoResponseSchema = z.object({
  ok: z.boolean(),
  result: z.object({
    url: z.string(),
    has_custom_certificate: z.boolean(),
    pending_update_count: z.number(),
    last_error_date: z.number().optional(),
    last_error_message: z.string().optional(),
    max_connections: z.number().optional(),
    ip_address: z.string().optional(),
  }),
});

export type TelegramGetMeResponseDto = z.infer<typeof TelegramGetMeResponseSchema>;
export type TelegramGetWebhookInfoResponseDto = z.infer<typeof TelegramGetWebhookInfoResponseSchema>;

