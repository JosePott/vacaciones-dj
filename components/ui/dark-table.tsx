import React from "react";

const base = {
  wrapper:
    "overflow-hidden rounded-[1.15rem] border border-white/10 bg-[#070C1C]/72 shadow-xl shadow-black/20 backdrop-blur-xl",
  table: "w-full text-sm",
  thead: "bg-white/[0.04] text-slate-400 uppercase text-xs tracking-wide",
  th: "px-4 py-3 font-medium text-left",
  tr: "text-white/90 transition-colors duration-150 hover:bg-blue-400/[0.07]",
  td: "px-4 py-4 align-middle text-white/90 border-t border-white/8",
  link: "app-link",
};

type WithChildren = {
  children: React.ReactNode;
  className?: string;
};

export function DarkTableWrapper({ children, className = "" }: WithChildren) {
  return <div className={`${base.wrapper} ${className}`.trim()}>{children}</div>;
}

export function DarkTable({ children, className = "" }: WithChildren) {
  return <table className={`${base.table} ${className}`.trim()}>{children}</table>;
}

export const darkTableWrapperClass = base.wrapper;
export const darkTableClass = base.table;
export const darkTheadClass = base.thead;
export const darkThClass = base.th;
export const darkTrClass = base.tr;
export const darkTdClass = base.td;
export const darkLinkClass = base.link;
