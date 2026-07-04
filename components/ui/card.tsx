import * as React from "react";

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className = "", ...props }: CardProps) {
  const classes = [
    "rounded-[1.35rem] border border-white/10 bg-[#0A1024]/78 shadow-2xl shadow-black/25 backdrop-blur-xl",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return <div className={classes} {...props} />;
}

export function CardHeader({ className = "", ...props }: CardProps) {
  const classes = ["flex flex-col gap-1 p-6", className].filter(Boolean).join(" ");
  return <div className={classes} {...props} />;
}

export function CardTitle({ className = "", ...props }: CardProps) {
  const classes = ["text-xl font-semibold tracking-tight text-white", className]
    .filter(Boolean)
    .join(" ");
  return <h3 className={classes} {...props} />;
}

export function CardDescription({ className = "", ...props }: CardProps) {
  const classes = ["text-sm text-slate-400", className].filter(Boolean).join(" ");
  return <p className={classes} {...props} />;
}

export function CardContent({ className = "", ...props }: CardProps) {
  const classes = ["p-6 pt-0", className].filter(Boolean).join(" ");
  return <div className={classes} {...props} />;
}

export function CardFooter({ className = "", ...props }: CardProps) {
  const classes = ["p-6 pt-0", className].filter(Boolean).join(" ");
  return <div className={classes} {...props} />;
}
