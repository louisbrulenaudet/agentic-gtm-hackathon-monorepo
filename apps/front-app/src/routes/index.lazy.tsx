import { LandingPage } from "@pages/LandingPage";
import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/")({
  component: LandingPage,
});
