"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

import { signIn, signUp } from "@/app/login/actions";
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

function AuthForm({
  action,
  submitLabel,
  successMessage,
}: {
  action: (prevState: ActionResult | null, formData: FormData) => Promise<ActionResult>;
  submitLabel: string;
  successMessage?: string;
}) {
  const [state, formAction] = useFormState(action, null);
  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder="tu@email.com" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required placeholder="••••••••" />
      </div>
      {state?.success === false && (
        <p className="text-sm text-red-500" role="alert">{state.error}</p>
      )}
      {state?.success === true && successMessage && (
        <p className="text-sm text-green-600" role="status">{successMessage}</p>
      )}
      <SubmitButton label={submitLabel} />
    </form>
  );
}

export function LoginForm() {
  const [tab, setTab] = useState<"sign-in" | "sign-up">("sign-in");

  return (
    <div className="w-full">
      <div className="flex border-b mb-6">
        <button
          onClick={() => setTab("sign-in")}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            tab === "sign-in"
              ? "border-b-2 border-slate-900 text-slate-900"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Iniciar sesión
        </button>
        <button
          onClick={() => setTab("sign-up")}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            tab === "sign-up"
              ? "border-b-2 border-slate-900 text-slate-900"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Crear cuenta
        </button>
      </div>

      {tab === "sign-in" && (
        <AuthForm action={signIn} submitLabel="Iniciar sesión" />
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