"use client";

import { SessionProvider } from "next-auth/react";
import PwaRegister from "./PwaRegister";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PwaRegister />
      {children}
    </SessionProvider>
  );
}
