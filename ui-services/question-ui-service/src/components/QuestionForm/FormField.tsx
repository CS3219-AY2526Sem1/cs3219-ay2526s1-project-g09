import React from "react";
import { cn } from "@/lib/utils"; // only if you use class merging helpers

interface FormFieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  children,
  className,
}) => {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label className="font-semibold text-gray-200">{label}</label>
      {children}
      {error && <p className="text-red-400 text-sm">{error}</p>}
    </div>
  );
};

export default FormField;
