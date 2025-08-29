"use client";

import * as React from "react";

type ButtonVariant = "primary" | "ghost";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", ...props }, ref) => {
    const base = "btn";
    const variantClass = variant === "ghost" ? "btn--ghost" : "btn--primary";
    return (
      <button ref={ref} className={`${base} ${variantClass} ${className}`} {...props} />
    );
  }
);

Button.displayName = "Button";


