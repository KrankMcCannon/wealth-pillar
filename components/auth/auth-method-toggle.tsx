'use client';

type Props = {
  mode: 'password' | 'email_code';
  onChange: (mode: 'password' | 'email_code') => void;
};

export function AuthMethodToggle({ mode, onChange }: Props) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-[color:var(--text-secondary)]">Metodo di accesso</div>
      <div className="flex gap-1 rounded-lg bg-[hsl(var(--color-muted)/0.4)] p-1">
        <button
          type="button"
          onClick={() => onChange('password')}
          className={`px-3 py-1 text-sm rounded-md transition ${mode==='password' ? 'bg-[hsl(var(--color-card))] shadow text-[color:var(--text-primary)]' : 'text-[color:var(--text-secondary)]'}`}
        >Password</button>
        <button
          type="button"
          onClick={() => onChange('email_code')}
          className={`px-3 py-1 text-sm rounded-md transition ${mode==='email_code' ? 'bg-[hsl(var(--color-card))] shadow text-[color:var(--text-primary)]' : 'text-[color:var(--text-secondary)]'}`}
        >Codice email</button>
      </div>
    </div>
  );
}

export default AuthMethodToggle;

