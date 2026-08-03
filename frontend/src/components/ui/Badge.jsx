import { Slot } from "@radix-ui/react-slot";
import { clsx } from "clsx";
import React from "react";

const Badge = React.forwardRef(({ asChild = false, className, variant = "default", ...props }, ref) => {
  const Comp = asChild ? Slot : "span";
  return (
    <Comp
      ref={ref}
      className={clsx(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]",
        variant === "default" && "bg-slate-100 text-slate-700",
        variant === "accent" && "bg-amber-100 text-amber-700",
        className,
      )}
      {...props}
    />
  );
});
Badge.displayName = "Badge";

export { Badge };
