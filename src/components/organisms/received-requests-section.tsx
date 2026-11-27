import { SectionTitle } from "@/components/molecules/section-title";
import { ReceivedRequestCard } from "@/components/organisms/received-request-card";
import type { ReceivedRequest } from "@/lib/joint-accounts/queries";

/** Demandes à examiner ; la section disparaît quand il n'y en a aucune. */
export function ReceivedRequestsSection({ requests }: { requests: readonly ReceivedRequest[] }) {
  if (requests.length === 0) return null;

  return (
    <section className="mb-10">
      <SectionTitle title="Demandes reçues" />
      <div className="grid items-start gap-4 lg:grid-cols-2">
        {requests.map((request) => (
          <ReceivedRequestCard key={request.id} request={request} />
        ))}
      </div>
    </section>
  );
}
