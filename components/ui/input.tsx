import * as React from "react";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", type = "text", ...props }, ref) => {
    const classes = [
      "app-field flex h-10 w-full rounded-xl px-3 py-2 text-sm",
      "transition disabled:cursor-not-allowed disabled:opacity-50",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return <input ref={ref} type={type} className={classes} {...props} />;
  },
);

Input.displayName = "Input";
