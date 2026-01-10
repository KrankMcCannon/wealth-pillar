"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib";
import { backButtonStyles } from "./theme/back-button-styles";

interface BackButtonProps {
  onClick?: () => void;
  className?: string;
  variant?: "ghost" | "outline";
  size?: "sm" | "default" | "lg" | "icon";
}

export function BackButton({
  onClick,
  className,
  variant = "ghost",
  size = "sm"
}: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.back();
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={cn(
        backButtonStyles.base,
        className
      )}
    >
      <ArrowLeft className={backButtonStyles.icon} />
    </Button>
  );
}
