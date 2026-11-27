import { Checkbox } from "@/components/atoms/checkbox";

/** Case d'accord explicite, jamais cochée à l'avance. */
export function ConsentCheckbox({ name, label }: { name: string; label: string }) {
  return (
    <label className="flex items-start gap-2.5 text-sm">
      <Checkbox name={name} className="mt-0.5" />
      <span>{label}</span>
    </label>
  );
}
