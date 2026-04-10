import { z } from 'zod';
import { emailSchema, nameSchema } from './common';

export const createTeamSchema = z.object({
  name: nameSchema,
});

export const updateTeamSchema = z.object({
  name: nameSchema,
});

export const inviteMemberSchema = z.object({
  email: emailSchema,
  role: z.enum(['owner', 'member']),
});

export const removeMemberSchema = z.object({
  memberId: z.coerce.number().int().positive(),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
