import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { openCoach } from "@/lib/open-coach";

export const Route = createFileRoute("/coach/")({
  codeSplitGroupings: [],
  component: CoachRedirect,
});

function CoachRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    openCoach("resume");
    void navigate({ to: "/truck", replace: true });
  }, [navigate]);
  return null;
}
