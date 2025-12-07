import { createTRPCRouter } from "./init";
import { authRouter } from "./routers/auth";
import { creditsRouter } from "./routers/credits";
import { dashboardRouter } from "./routers/dashboard";
import { garmentRouter } from "./routers/garment";
import { lookbookRouter } from "./routers/lookbook";
import { profileRouter } from "./routers/profile";
import { styleTipRouter } from "./routers/style-tip";
import { todoRouter } from "./routers/todo";
import { tryOnRouter } from "./routers/tryOn";
import { upscaleRouter } from "./routers/upscale";
import { userRouter } from "./routers/user";

export const trpcRouter = createTRPCRouter({
  auth: authRouter,
  credits: creditsRouter,
  dashboard: dashboardRouter,
  garment: garmentRouter,
  lookbook: lookbookRouter,
  profile: profileRouter,
  styleTip: styleTipRouter,
  todo: todoRouter,
  tryOn: tryOnRouter,
  upscale: upscaleRouter,
  user: userRouter,
});
export type TRPCRouter = typeof trpcRouter;
