import { cn } from "@/lib";

export interface SkeletonBoxProps {
  height: string;
  width?: string;
  variant?: "light" | "medium" | "dark";
  className?: string;
}

export function SkeletonBox({
  height,
  width,
  variant = "medium",
  className
}: SkeletonBoxProps) {
  const variantClasses = {
    light: "bg-primary/10",
    medium: "bg-primary/15",
    dark: "bg-primary/20"
  };

  return (
    <div
      className={cn(
        variantClasses[variant],
        "rounded-lg animate-pulse",
        height,
        width,
        className
      )}
    />
  );
}
