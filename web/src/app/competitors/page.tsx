import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import AddCompetitorForm from "./add-competitor-form";
import DeleteCompetitorButton from "./delete-competitor-button";

export default async function CompetitorsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: competitors } = await supabase
    .from("competitors")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-1 flex-col items-center py-12 px-4">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-semibold mb-6">Competitors</h1>

        <AddCompetitorForm />

        <div className="mt-8 space-y-3">
          {competitors?.map((c) => (
            <div key={c.id} className="border rounded-lg p-4 dark:border-zinc-700">
              <div className="flex items-center justify-between">
                <h2 className="font-medium">{c.name}</h2>
                <div className="flex items-center gap-3">
                  <a
                    href={c.homepage_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {c.homepage_url}
                  </a>
                  <DeleteCompetitorButton id={c.id} />
                </div>
              </div>
              {c.notes && (
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{c.notes}</p>
              )}
            </div>
          ))}
          {(!competitors || competitors.length === 0) && (
            <p className="text-zinc-500 text-sm">No competitors added yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
