import { redirect } from "next/navigation";
import Link from "next/link";

import { signOut } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

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
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <span className="text-sm font-medium">SaaS-Track</span>

          <div className="flex items-center gap-4">
            <nav className="flex items-center gap-3 text-sm">
              <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
                Dashboard
              </Link>
              <Link href="/dashboard/subscriptions" className="text-muted-foreground hover:text-foreground">
                Suscripciones
              </Link>
            </nav>
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <form action={signOut}>
              <Button type="submit" variant="outline" size="sm">
                Cerrar sesión
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
