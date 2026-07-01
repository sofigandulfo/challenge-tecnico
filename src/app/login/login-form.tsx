"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

import { signIn, signUp, signInWithGoogle } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionResult } from "@/types";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Procesando..." : label}
    </Button>
  );
}

function GoogleIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function AuthForm({
  action,
  submitLabel,
  successMessage,
}: {
  action: (
    prevState: ActionResult | null,
    formData: FormData,
  ) => Promise<ActionResult>;
  submitLabel: string;
  successMessage?: string;
}) {
  const [state, formAction] = useFormState(action, null);
  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="tu@email.com"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
        />
      </div>
      {state?.success === false && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}
      {state?.success === true && successMessage && (
        <p className="text-sm [color:hsl(var(--success))]" role="status">
          {successMessage}
        </p>
      )}
      <SubmitButton label={submitLabel} />
    </form>
  );
}

export function LoginForm() {
  const [tab, setTab] = useState<"sign-in" | "sign-up">("sign-in");

  return (
    <div className="w-full rounded-xl border border-border bg-card p-8 shadow-sm">
      <div className="mb-6 flex border-b">
        <button
          type="button"
          onClick={() => setTab("sign-in")}
          className={`flex-1 border-b-2 px-2 py-3 text-sm transition-colors duration-150 ${
            tab === "sign-in"
              ? "border-primary font-semibold text-foreground"
              : "border-transparent font-normal text-muted-foreground hover:text-foreground"
          }`}
        >
          Iniciar sesión
        </button>
        <button
          type="button"
          onClick={() => setTab("sign-up")}
          className={`flex-1 border-b-2 px-2 py-3 text-sm transition-colors duration-150 ${
            tab === "sign-up"
              ? "border-primary font-semibold text-foreground"
              : "border-transparent font-normal text-muted-foreground hover:text-foreground"
          }`}
        >
          Crear cuenta
        </button>
      </div>

      {tab === "sign-in" && (
        <>
          <AuthForm action={signIn} submitLabel="Iniciar sesión" />

          <div className="relative mt-5">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-card px-3 text-xs uppercase tracking-wider text-muted-foreground">
                o continuar con
              </span>
            </div>
          </div>

          <form action={signInWithGoogle} className="mt-3">
            <Button type="submit" variant="outline" className="w-full gap-2">
              <GoogleIcon />
              Continuar con Google
            </Button>
          </form>
        </>
      )}
      {tab === "sign-up" && (
        <AuthForm
          action={signUp}
          submitLabel="Crear cuenta"
          successMessage="Cuenta creada. Revisá tu email para confirmar la cuenta."
        />
      )}
    </div>
  );
}