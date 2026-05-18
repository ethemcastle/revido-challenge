import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import SignOut from "./sign-out";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex flex-col gap-4 items-center">
        <h1 className="text-2xl font-semibold">Welcome!</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Signed in as {user.email}
        </p>
        <SignOut />
      </div>
    </div>
  );
}
