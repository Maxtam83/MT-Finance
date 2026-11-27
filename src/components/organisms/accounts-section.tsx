import { EmptyState } from "@/components/molecules/empty-state";
import { SectionTitle } from "@/components/molecules/section-title";
import { AccountCard } from "@/components/organisms/account-card";
import type { AccountSummary } from "@/lib/joint-accounts/queries";

/** Comptes de la personne connectée. */
export function AccountsSection({ accounts }: { accounts: readonly AccountSummary[] }) {
  return (
    <section>
      <SectionTitle title="Mes comptes" />
      {accounts.length === 0 ? (
        <EmptyState message="Aucun compte pour le moment. La création de comptes arrivera dans un prochain lot." />
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-2">
          {accounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>
      )}
    </section>
  );
}
