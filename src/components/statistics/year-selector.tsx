"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface YearSelectorProps {
  year: number;
  onChange: (year: number) => void;
}

export function YearSelector({ year, onChange }: YearSelectorProps) {
  const currentYear = new Date().getFullYear();

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onChange(year - 1)}
        aria-label="Previous year"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <span className="w-16 text-center text-lg font-semibold">{year}</span>

      <Button
        variant="outline"
        size="icon"
        onClick={() => onChange(year + 1)}
        disabled={year >= currentYear}
        aria-label="Next year"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
