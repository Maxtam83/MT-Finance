import { RadioGroup, RadioGroupItem } from "@/components/atoms/radio-group";

export interface RadioOption {
  value: string;
  label: string;
}

interface RadioOptionGroupProps {
  name: string;
  legend: string;
  options: readonly RadioOption[];
  defaultValue: string;
  hint?: string;
}

/** Groupe de boutons radio avec sa légende et son aide. */
export function RadioOptionGroup({
  name,
  legend,
  options,
  defaultValue,
  hint,
}: RadioOptionGroupProps) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-medium">{legend}</legend>
      <RadioGroup name={name} defaultValue={defaultValue}>
        {options.map(({ value, label }) => (
          <label key={value} className="flex items-center gap-2 text-sm">
            <RadioGroupItem value={value} />
            {label}
          </label>
        ))}
      </RadioGroup>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </fieldset>
  );
}
