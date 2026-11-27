"use client";

import { linkAccountMember } from "@/actions/admin";
import { useActionForm } from "@/components/admin/use-action-form";
import { FormFeedback } from "@/components/form-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { TAG_OWNER_CHOICES } from "@/lib/validations/admin";

const TAG_OWNER_OPTIONS: { value: (typeof TAG_OWNER_CHOICES)[number]; label: string }[] = [
  { value: "CURRENT_OWNER", label: "Le propriétaire actuel du compte" },
  { value: "NEW_MEMBER", label: "La personne ajoutée" },
];

export function LinkAccountForm() {
  const { state, isPending, formProps } = useActionForm(linkAccountMember);

  return (
    <form {...formProps} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="account-id">Identifiant du compte</Label>
        <Input
          id="account-id"
          name="accountId"
          autoComplete="off"
          spellCheck={false}
          maxLength={64}
          required
          className="h-9 font-mono"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="member-email">Email d&apos;un utilisateur inscrit</Label>
        <Input
          id="member-email"
          name="email"
          type="email"
          autoComplete="off"
          maxLength={254}
          required
          className="h-9"
        />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Référent des tags</legend>
        <RadioGroup name="tagOwner" defaultValue="CURRENT_OWNER">
          {TAG_OWNER_OPTIONS.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2 text-sm">
              <RadioGroupItem value={value} />
              {label}
            </label>
          ))}
        </RadioGroup>
        <p className="text-xs text-muted-foreground">
          Ses tags s&apos;appliqueront au compte joint. Le choix est fixé à la première liaison.
        </p>
      </fieldset>

      <Button type="submit" size="lg" disabled={isPending} className="self-start">
        Lier au compte
      </Button>
      <FormFeedback state={state} />
    </form>
  );
}
