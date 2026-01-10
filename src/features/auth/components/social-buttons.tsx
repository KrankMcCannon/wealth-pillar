"use client";

import { Button } from "@/components/ui";
import { Apple, Github } from "lucide-react";
import { authStyles } from "../theme";

type Props = {
  onClick: () => void;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
};

export function GoogleButton({ onClick, children = "Continua con Google", className, disabled }: Props) {
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

export function AppleButton({ onClick, children = "Continua con Apple", className, disabled }: Props) {
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

export function GitHubButton({ onClick, children = "Continua con GitHub", className, disabled }: Props) {
  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${authStyles.socialButtons.base} ${authStyles.socialButtons.github} ${className ?? ""}`}
    >
      <Github className={`${authStyles.socialButtons.icon} ${authStyles.socialButtons.iconAccent}`} />
      {children}
    </Button>
  );
}
