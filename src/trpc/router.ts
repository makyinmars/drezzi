import { createTRPCRouter } from "./init";
import { authRouter } from "./routers/auth";
import { garmentRouter } from "./routers/garment";
import { profileRouter } from "./routers/profile";
import { todoRouter } from "./routers/todo";
import { tryOnRouter } from "./routers/tryOn";

export const trpcRouter = createTRPCRouter({
  auth: authRouter,
  garment: garmentRouter,
  profile: profileRouter,
  todo: todoRouter,
  tryOn: tryOnRouter,
});
export type TRPCRouter = typeof trpcRouter;
