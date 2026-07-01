import { redirect } from "next/navigation";

import { signOut } from "@/app/dashboard/actions";
import { DashboardNav } from "@/app/dashboard/dashboard-nav";
import { createClient } from "@/lib/supabase/server";
import { Footer } from "@/components/ui/footer";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="relative border-b border-border bg-card/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <span className="text-sm font-semibold text-primary">
            SubTrack
          </span>
          <DashboardNav email={user.email} signOutAction={signOut} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 pb-12 pt-10">
        {children}
      </main>

      <Footer />
    </div>
  );
}
