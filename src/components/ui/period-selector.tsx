/**
 * PeriodSelector - Generic period selector
 */

"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";
import { Text } from '@/src/components/ui';

interface Period {
  id: string;
  label: string;
}

interface PeriodSelectorProps {
  currentPeriod: Period;
  onPrevious?: () => void;
  onNext?: () => void;
  canGoPrevious?: boolean;
  canGoNext?: boolean;
}

export function PeriodSelector({
  currentPeriod,
  onPrevious,
  onNext,
  canGoPrevious = true,
  canGoNext = true
}: PeriodSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onPrevious}
        disabled={!canGoPrevious || !onPrevious}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Text variant="heading" size="md" className="min-w-[120px] text-center">
        {currentPeriod.label}
      </Text>
      <Button
        variant="outline"
        size="sm"
        onClick={onNext}
        disabled={!canGoNext || !onNext}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
