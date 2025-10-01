"use client";

import { CheckCircle2, Circle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

type Requirement = {
  label: string;
  test: (pw: string) => boolean;
};

const REQUIREMENTS: Requirement[] = [
  { label: 'Almeno 8 caratteri', test: (pw) => pw.length >= 8 },
  { label: 'Maiuscole e minuscole', test: (pw) => /[a-z]/.test(pw) && /[A-Z]/.test(pw) },
  { label: 'Almeno un numero', test: (pw) => /[0-9]/.test(pw) },
  { label: 'Almeno un simbolo', test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

export function getRequirementsStatus(password: string) {
  const results = REQUIREMENTS.map((r) => r.test(password));
  const meetsAll = results.every(Boolean);
  return { results, meetsAll };
}

export function PasswordRequirements({ password }: { password: string }) {
  const { results } = getRequirementsStatus(password);

  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
      {REQUIREMENTS.map((req, i) => (
        <li key={req.label} className="flex items-center gap-1.5">
          <AnimatePresence mode="popLayout" initial={false}>
            {results[i] ? (
              <motion.span
                key="ok"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 350, damping: 16 }}
                className="inline-flex"
              >
                <CheckCircle2 className="h-3 w-3 text-[hsl(var(--color-accent))]" />
              </motion.span>
            ) : (
              <motion.span
                key="pending"
                initial={false}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0.8 }}
                className="inline-flex"
              >
                <Circle className="h-3 w-3 text-gray-400" />
              </motion.span>
            )}
          </AnimatePresence>
          <span className={results[i] ? 'text-gray-900 font-medium' : 'text-gray-500'}>{req.label}</span>
        </li>
      ))}
    </ul>
  );
}

export default PasswordRequirements;
