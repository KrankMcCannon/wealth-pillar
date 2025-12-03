'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/src/components/ui';
import { cn } from '@/src/lib';
import { authStyles } from '@/features/auth/theme/auth-styles';

type PasswordInputProps = React.ComponentProps<typeof Input> & {
  wrapperClassName?: string;
  showCapsLockWarning?: boolean;
  icon?: React.ReactNode;
};

export function PasswordInput({ className, wrapperClassName, showCapsLockWarning = true, icon, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const [capsOn, setCapsOn] = useState(false);

  return (
    <>
      <div className={cn(authStyles.input.wrapper, wrapperClassName)}>
        {icon && <div className={authStyles.input.icon}>{icon}</div>}
        <Input
          type={visible ? 'text' : 'password'}
          className={cn(icon ? authStyles.input.field : 'h-9 text-sm bg-white border-[hsl(var(--color-primary))]/20 focus:border-[hsl(var(--color-primary))] focus:ring-[hsl(var(--color-primary))]/20', 'pr-10', className)}
          onKeyDown={(e) => setCapsOn(e.getModifierState && e.getModifierState('CapsLock'))}
          onKeyUp={(e) => setCapsOn(e.getModifierState && e.getModifierState('CapsLock'))}
          {...props}
        />
        <button
          type="button"
          aria-label={visible ? 'Nascondi password' : 'Mostra password'}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-[hsl(var(--color-primary))]/60 hover:text-[hsl(var(--color-primary))] transition-colors"
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {showCapsLockWarning && capsOn && (
        <div className="mt-1 text-xs text-[hsl(var(--color-primary))]/60">
          <span className="text-[hsl(var(--color-warning))] font-medium">Bloc Maiusc attivo</span> — la password è sensibile alle maiuscole
        </div>
      )}
    </>
  );
}

export default PasswordInput;
