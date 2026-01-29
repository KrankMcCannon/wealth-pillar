"use client";

import type { ReactNode } from "react";
import { authStyles } from "../theme";

type AuthPageWrapperProps = {
  children: ReactNode;
};

/**
 * AuthPageWrapper - Shared layout wrapper for sign-in and sign-up pages.
 * Renders decorative background blobs and centers the auth content.
 */
export function AuthPageWrapper({ children }: Readonly<AuthPageWrapperProps>) {
  return (
    <>
      <div className={authStyles.page.bgBlobTop} />
      <div className={authStyles.page.bgBlobBottom} />
      <div className={authStyles.page.wrapper}>{children}</div>
    </>
  );
}

export default AuthPageWrapper;
