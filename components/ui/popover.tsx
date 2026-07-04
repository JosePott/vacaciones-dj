"use client";

import React from "react";

type PopoverContextValue = {
  open: boolean;
  setOpen: (v: boolean) => void;
};

const PopoverContext = React.createContext<PopoverContextValue | null>(null);

export function Popover({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);

  return (
    <PopoverContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block">{children}</div>
    </PopoverContext.Provider>
  );
}

type TriggerProps = React.HTMLAttributes<HTMLElement> & {
  asChild?: boolean;
  children: React.ReactNode;
};

export function PopoverTrigger({ children, asChild = false, ...props }: TriggerProps) {
  const ctx = React.useContext(PopoverContext);
  if (!ctx) return <>{children}</>;

  const child = React.isValidElement(children) ? children : <span>{children}</span>;

  const handleOpen = () => ctx.setOpen(!ctx.open);
  const handleEnter = () => ctx.setOpen(true);
  const handleLeave = () => ctx.setOpen(false);

  const triggerProps = {
    onClick: handleOpen,
    onMouseEnter: handleEnter,
    onMouseLeave: handleLeave,
    ...props,
  };

  if (asChild && React.isValidElement(child)) {
    return React.cloneElement(child as React.ReactElement, triggerProps);
  }

  return (
    <button type="button" {...triggerProps}>
      {child}
    </button>
  );
}

type ContentProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
};

export function PopoverContent({ children, className = "", ...props }: ContentProps) {
  const ctx = React.useContext(PopoverContext);
  if (!ctx || !ctx.open) return null;

  return (
    <div
      className={`absolute left-0 top-full z-20 mt-2 w-64 rounded-xl border border-[#273440] bg-[#0C1726] p-3 shadow-xl shadow-black/30 ${className}`}
      onMouseEnter={() => ctx.setOpen(true)}
      onMouseLeave={() => ctx.setOpen(false)}
      {...props}
    >
      {children}
    </div>
  );
}
