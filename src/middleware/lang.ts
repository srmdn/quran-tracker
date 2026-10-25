import { createMiddleware } from "hono/factory";
import type { Env } from "../types.ts";

export const langMiddleware = createMiddleware<Env>(async (c, next) => {
  c.set("lang", "id");
  await next();
});
