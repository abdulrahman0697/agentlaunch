"use client";

import { Button } from "@/components/ui/button";

export function ExportPdfButton() {
  return (
    <Button variant="outline" onClick={() => window.print()}>
      Export PDF
    </Button>
  );
}
