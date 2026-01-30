"use client";

import { Button } from "@/components/ui";
import { Apple } from "lucide-react";
import { authStyles } from "../theme";

type Props = {
  onClick: () => void;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
};

export function GoogleButton({ onClick, children = "Continua con Google", className, disabled }: Readonly<Props>) {
  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${authStyles.socialButtons.base} ${authStyles.socialButtons.google} ${className ?? ""}`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className={authStyles.socialButtons.icon}>
        <path
          fill="#FFC107"
          d="M43.611,20.083H42V20H24v8h11.303C33.602,32.657,29.166,36,24,36c-6.627,0-12-5.373-12-12 s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.201,6.053,29.326,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
        />
        <path
          fill="#FF3D00"
          d="M6.306,14.691l6.571,4.819C14.655,16.108,18.961,14,24,14c3.059,0,5.842,1.154,7.961,3.039 l5.657-5.657C34.201,6.053,29.326,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
        />
        <path
          fill="#4CAF50"
          d="M24,44c5.113,0,9.83-1.963,13.409-5.163l-6.19-5.238C29.211,35.091,26.715,36,24,36 c-5.137,0-9.583-3.343-11.296-8.005l-6.553,5.046C9.463,39.556,16.198,44,24,44z"
        />
        <path
          fill="#1976D2"
          d="M43.611,20.083H42V20H24v8h11.303c-1.353,3.657-5.07,6.286-9.303,6.286 c-5.137,0-9.583-3.343-11.296-8.005l-6.553,5.046C9.463,39.556,16.198,44,24,44c8.822,0,19.5-6,19.5-20 C44,22.659,43.862,21.35,43.611,20.083z"
        />
      </svg>
      {children}
    </Button>
  );
}

export function AppleButton({ onClick, children = "Continua con Apple", className, disabled }: Readonly<Props>) {
  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${authStyles.socialButtons.base} ${authStyles.socialButtons.apple} ${className ?? ""}`}
    >
      <Apple className={`${authStyles.socialButtons.icon} ${authStyles.socialButtons.iconSecondary}`} />
      {children}
    </Button>
  );
}

export function GitHubButton({ onClick, children = "Continua con GitHub", className, disabled }: Readonly<Props>) {
  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${authStyles.socialButtons.base} ${authStyles.socialButtons.github} ${className ?? ""}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={`${authStyles.socialButtons.icon} ${authStyles.socialButtons.iconAccent}`}
      >
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
      </svg>
      {children}
    </Button>
  );
}
