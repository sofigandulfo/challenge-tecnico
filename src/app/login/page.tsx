import { LoginForm } from "@/app/login/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">SaaS-Track</h1>
          <p className="text-sm text-muted-foreground">
            Gestioná tus suscripciones en un solo lugar.
          </p>
        </div>

        <LoginForm />
      </div>
    </main>
  );
}
