"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

type ToastKind = "success" | "error" | "info";

type ToastFlag = {
  param: string;
  message: string;
  type?: ToastKind;
};

const deliveredToastKeys = new Set<string>();

export function RouteToaster({ flags }: { flags: ToastFlag[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!searchParams) return;

    let triggered = false;
    const nextParams = new URLSearchParams(searchParams.toString());

    flags.forEach(({ param, message, type = "success" }) => {
      const value = searchParams.get(param);
      if (!value) return;

      triggered = true;
      nextParams.delete(param);

      const toastKey = `${pathname}:${param}:${value}`;
      if (deliveredToastKeys.has(toastKey)) return;
      deliveredToastKeys.add(toastKey);
      window.setTimeout(() => deliveredToastKeys.delete(toastKey), 10000);

      const notify =
        type === "error" ? toast.error : type === "info" ? toast : toast.success;
      notify(message);
    });

    if (triggered) {
      const query = nextParams.toString();
      const target = query ? `${pathname}?${query}` : pathname;
      router.replace(target, { scroll: false });
    }
  }, [flags, pathname, router, searchParams]);

  return null;
}
