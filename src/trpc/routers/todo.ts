import type { TRPCRouterRecord } from "@trpc/server";
import { apiTodoCreate, apiTodoId, apiTodoUpdate } from "@/validators/todo";
import { createErrors } from "../errors";
import { publicProcedure } from "../init";
import type { RouterOutput } from "../utils";

export type TodoListProcedure = RouterOutput["todo"]["list"];

export const todoRouter = {
  list: publicProcedure.query(
    async ({ ctx }) =>
      await ctx.prisma.todo.findMany({
        orderBy: { createdAt: "desc" },
      })
  ),
  byId: publicProcedure.input(apiTodoId).query(async ({ input, ctx }) => {
    const errors = createErrors(ctx.i18n);
    const parsed = apiTodoId.safeParse(input);
    if (!parsed.success) {
      throw errors.invalidInput();
    }

    if (!parsed.data.id) {
      throw errors.todoNotFound();
    }

    const foundTodo = await ctx.prisma.todo.findFirst({
      where: { id: parsed.data.id },
    });

    if (!foundTodo) {
      throw errors.todoNotFound();
    }

    return foundTodo;
  }),
  create: publicProcedure
    .input(apiTodoCreate)
    .mutation(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);
      const parsed = apiTodoCreate.safeParse(input);

      if (!parsed.success) {
        throw errors.invalidInput();
      }

      const created = await ctx.prisma.todo.create({
        data: parsed.data,
      });

      return created;
    }),
  delete: publicProcedure.input(apiTodoId).mutation(async ({ input, ctx }) => {
    const errors = createErrors(ctx.i18n);

    const parsed = apiTodoId.safeParse(input);
    if (!parsed.success) {
      throw errors.invalidInput();
    }

    if (!parsed.data.id) {
      throw errors.todoNotFound();
    }

    const deleted = await ctx.prisma.todo.delete({
      where: { id: parsed.data.id },
    });

    return deleted;
  }),
  update: publicProcedure
    .input(apiTodoUpdate)
    .mutation(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);
      const parsed = apiTodoUpdate.safeParse(input);

      if (!parsed.success) {
        throw errors.invalidInput();
      }

      const { id, ...data } = parsed.data;

      const updated = await ctx.prisma.todo.update({
        where: { id },
        data,
      });

      return updated;
    }),
} satisfies TRPCRouterRecord;
