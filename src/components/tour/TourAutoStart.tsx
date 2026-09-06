"use client";

import { useEffect } from "react";
import { useTourStore, hasSeenTour } from "@/lib/tour-store";

export function TourAutoStart() {
  const start = useTourStore((s) => s.start);

  useEffect(() => {
    if (!hasSeenTour()) {
      const timeout = setTimeout(start, 600);
      return () => clearTimeout(timeout);
    }
  }, [start]);

  return null;
}
