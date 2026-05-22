'use client';

import { useRouter } from '@/i18n/routing';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib';
const backButtonStyles = {
  base: 'hover:bg-primary/10 text-primary rounded-xl transition-all',
  icon: 'h-5 w-5 sm:h-6 sm:w-6',
} as const;

interface BackButtonProps {
  onClick?: () => void;
  className?: string;
  variant?: 'ghost' | 'outline';
  size?: 'sm' | 'default' | 'lg' | 'icon';
}

export function BackButton({
  onClick,
  className,
  variant = 'ghost',
  size = 'sm',
}: Readonly<BackButtonProps>) {
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
      className={cn(backButtonStyles.base, className)}
    >
      <ArrowLeft className={backButtonStyles.icon} />
    </Button>
  );
}
