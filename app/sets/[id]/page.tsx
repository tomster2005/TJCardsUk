import { Layout } from "@/components/Layout";
import { SetDetailsExperience } from "@/components/sets/SetDetailsExperience";
import { getSetById, discoverSets } from "@/lib/demo-data/sets";

type SetPageProps = {
  params: { id: string };
};

export function generateStaticParams() {
  return discoverSets.map((set) => ({ id: set.id }));
}

export default function SetDetailPage({ params }: SetPageProps) {
  const set = getSetById(params.id);

  if (!set) {
    return (
      <Layout>
        <div className="rounded-3xl border border-white/10 bg-zinc-950/80 p-8 text-center text-white">
          Set not found.
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SetDetailsExperience set={set} />
    </Layout>
  );
}
