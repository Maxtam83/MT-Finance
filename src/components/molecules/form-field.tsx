import type { ComponentProps, ReactNode } from "react";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";

type FormFieldProps = ComponentProps<"input"> & {
  id: string;
  label: string;
  /** Élément placé à côté du champ, par exemple le bouton d'envoi. */
  trailing?: ReactNode;
};

/** Champ de saisie accompagné de son libellé. */
export function FormField({ id, label, trailing, ...inputProps }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input id={id} autoComplete="off" {...inputProps} />
        {trailing}
      </div>
    </div>
  );
}
