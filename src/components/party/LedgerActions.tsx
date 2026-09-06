"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/common/Button";

export function LedgerActions() {
  return (
    <Button variant="outline" size="sm" onClick={() => window.print()}>
      <Printer className="h-4 w-4" /> Print / Save PDF
    </Button>
  );
}
