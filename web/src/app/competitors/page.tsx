import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import CompetitorList from "./competitor-list";

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
    <div className="flex flex-1 flex-col items-center py-10 px-4">
      <div className="w-full max-w-2xl">
        <CompetitorList competitors={competitors ?? []} />
      </div>
    </div>
  );
}
