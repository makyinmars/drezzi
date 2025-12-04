import { TodoStatus } from "generated/prisma/browser";
import z from "zod/v4";

export const apiTodoCreate = z.object({
  text: z.string().min(1),
  description: z.string().optional(),
  active: z.boolean().optional().default(true),
  status: z
    .enum([
      TodoStatus.NOT_STARTED,
      TodoStatus.IN_PROGRESS,
      TodoStatus.COMPLETED,
    ])
    .optional()
    .default(TodoStatus.NOT_STARTED),
});

export const apiTodoUpdate = z.object({
  id: z.uuid(),
  text: z.string().min(1).optional(),
  description: z.string().optional(),
  active: z.boolean().optional(),
  status: z
    .enum([
      TodoStatus.NOT_STARTED,
      TodoStatus.IN_PROGRESS,
      TodoStatus.COMPLETED,
    ])
    .optional(),
});

export const apiTodoCreateAndUpdate = z.object({
  id: z.uuid().optional(),
  text: z.string().min(3).max(250),
  description: z.string().optional(),
  status: z.enum([
    TodoStatus.NOT_STARTED,
    TodoStatus.IN_PROGRESS,
    TodoStatus.COMPLETED,
  ]),
  active: z.boolean(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const apiTodoId = z.object({
  id: z.uuid().optional(),
});

export type TodoCreate = z.infer<typeof apiTodoCreate>;
export type TodoUpdate = z.infer<typeof apiTodoUpdate>;
export type TodoCreateAndUpdate = z.infer<typeof apiTodoCreateAndUpdate>;
