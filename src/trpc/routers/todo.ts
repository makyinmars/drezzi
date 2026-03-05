import type { TRPCRouterRecord } from "@trpc/server";
import { eq } from "drizzle-orm";
import { todo } from "@/db/schema";
import { apiTodoCreate, apiTodoId, apiTodoUpdate } from "@/validators/todo";
import { createErrors } from "../errors";
import { publicProcedure } from "../init";
import type { RouterOutput } from "../utils";

export type TodoListProcedure = RouterOutput["todo"]["list"];

export const todoRouter = {
  list: publicProcedure.query(
    async ({ ctx }) =>
      await ctx.db.query.todo.findMany({
        orderBy: (t, { desc }) => [desc(t.createdAt)],
      })
  ),
  byId: publicProcedure.input(apiTodoId).query(async ({ input, ctx }) => {
    const errors = createErrors(ctx.i18n);
    const parsed = apiTodoId.safeParse(input);
    if (!parsed.success) {
      throw errors.invalidInput();
    }

    const id = parsed.data.id;
    if (!id) {
      throw errors.todoNotFound();
    }

    const foundTodo = await ctx.db.query.todo.findFirst({
      where: (t, { eq: eqOp }) => eqOp(t.id, id),
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

      const [created] = await ctx.db
        .insert(todo)
        .values({
          id: crypto.randomUUID(),
          ...parsed.data,
        })
        .returning();

      return created;
    }),
  delete: publicProcedure.input(apiTodoId).mutation(async ({ input, ctx }) => {
    const errors = createErrors(ctx.i18n);

    const parsed = apiTodoId.safeParse(input);
    if (!parsed.success) {
      throw errors.invalidInput();
    }

    const id = parsed.data.id;
    if (!id) {
      throw errors.todoNotFound();
    }

    const [deleted] = await ctx.db
      .delete(todo)
      .where(eq(todo.id, id))
      .returning();

    if (!deleted) {
      throw errors.todoNotFound();
    }

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

      const [updated] = await ctx.db
        .update(todo)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(todo.id, id))
        .returning();

      if (!updated) {
        throw errors.todoNotFound();
      }

      return updated;
    }),
} satisfies TRPCRouterRecord;
