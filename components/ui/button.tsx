import * as React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
};

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  default:
    "border border-blue-400/40 bg-blue-500/90 text-white shadow-lg shadow-blue-950/30 hover:bg-blue-400 focus-visible:outline-blue-300",
  outline:
    "border border-white/12 bg-white/[0.03] text-white hover:border-blue-300/45 hover:bg-blue-400/10 focus-visible:outline-blue-300",
  ghost: "text-slate-300 hover:bg-white/8 hover:text-white focus-visible:outline-blue-300",
  destructive:
    "border border-rose-500/70 bg-rose-600/90 text-white hover:bg-rose-500 focus-visible:outline-rose-400",
};

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-base",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "md", type = "button", ...props }, ref) => {
    const classes = [
      "inline-flex items-center justify-center rounded-xl font-medium transition-colors",
      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
      "disabled:pointer-events-none disabled:opacity-60",
      variantClasses[variant],
      sizeClasses[size],
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return <button ref={ref} className={classes} type={type} {...props} />;
  },
);

Button.displayName = "Button";
