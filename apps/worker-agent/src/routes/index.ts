import { Hono } from "hono";

import { healthRoutes } from "./health";

export function createRoutes(): Hono {
  const routes = new Hono();
  routes.route("/", healthRoutes);
  return routes;
}
