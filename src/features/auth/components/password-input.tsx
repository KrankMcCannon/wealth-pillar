'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/src/components/ui';
import { cn } from '@/src/lib';

type PasswordInputProps = React.ComponentProps<typeof Input> & {
  wrapperClassName?: string;
  showCapsLockWarning?: boolean;
};

export function PasswordInput({ className, wrapperClassName, showCapsLockWarning = true, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const [capsOn, setCapsOn] = useState(false);

  return (
    <div className={cn('relative', wrapperClassName)}>
      <Input
        type={visible ? 'text' : 'password'}
        className={cn('pr-10', className)}
        onKeyDown={(e) => setCapsOn(e.getModifierState && e.getModifierState('CapsLock'))}
        onKeyUp={(e) => setCapsOn(e.getModifierState && e.getModifierState('CapsLock'))}
        {...props}
      />
      <button
        type="button"
        aria-label={visible ? 'Nascondi password' : 'Mostra password'}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-[color:var(--text-secondary)] hover:text-[hsl(var(--color-primary))] transition-colors"
        onClick={() => setVisible((v) => !v)}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
      {showCapsLockWarning && capsOn && (
        <div className="mt-1 text-xs text-[color:var(--text-secondary)]">
          <span className="text-[hsl(var(--color-warning))] font-medium">Bloc Maiusc attivo</span> — la password è sensibile alle maiuscole
        </div>
      )}
    </div>
  );
}

export default PasswordInput;
