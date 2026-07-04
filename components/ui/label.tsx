import * as React from "react";

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className = "", children, ...props }, ref) => {
    const classes = ["text-sm font-medium text-slate-200", className].filter(Boolean).join(" ");
    return (
      <label ref={ref} className={classes} {...props}>
        {children}
      </label>
    );
  },
);

Label.displayName = "Label";
