"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      theme="dark"
      richColors
      closeButton
      duration={4000}
      toastOptions={{
        className:
          "border border-[#1E293B] bg-[#0B1221] text-white shadow-xl shadow-black/40 backdrop-blur-sm",
      }}
    />
  );
}
