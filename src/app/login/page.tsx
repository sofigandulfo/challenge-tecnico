import { LoginForm } from "@/app/login/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 [background-image:radial-gradient(circle,hsl(var(--border))_1px,transparent_1px)] [background-size:24px_24px]">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            SubTrack
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestioná tus suscripciones en un solo lugar.
          </p>
        </div>

        <LoginForm />
      </div>
    </main>
  );
}
