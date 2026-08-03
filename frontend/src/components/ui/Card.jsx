import { clsx } from "clsx";
import React from "react";

function Card({ className, ...props }) {
  return <div className={clsx("rounded-3xl border border-slate-200 bg-white shadow-sm", className)} {...props} />;
}

function CardHeader({ className, ...props }) {
  return <div className={clsx("space-y-2 p-6", className)} {...props} />;
}

function CardTitle({ className, ...props }) {
  return <h2 className={clsx("text-2xl font-semibold text-slate-950", className)} {...props} />;
}

function CardDescription({ className, ...props }) {
  return <p className={clsx("text-sm text-slate-600", className)} {...props} />;
}

function CardContent({ className, ...props }) {
  return <div className={clsx("p-6 pt-0", className)} {...props} />;
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent };
