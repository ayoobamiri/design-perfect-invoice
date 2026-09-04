import { createFileRoute, redirect } from "@tanstack/react-router";

// The old check-in page now lives at "/" so customers never see staff links.
export const Route = createFileRoute("/checkin")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
});
