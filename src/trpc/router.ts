import { createTRPCRouter } from "./init";
import { authRouter } from "./routers/auth";
import { profileRouter } from "./routers/profile";
import { todoRouter } from "./routers/todo";

export const trpcRouter = createTRPCRouter({
  auth: authRouter,
  profile: profileRouter,
  todo: todoRouter,
});
export type TRPCRouter = typeof trpcRouter;
