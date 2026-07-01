"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { mapAuthError } from "@/lib/auth-errors";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types";

function validateCredentials(
  email: string,
  password: string
): ActionResult | null {
  if (!email.trim()) {
    return { success: false, error: "El email es requerido." };
  }

  if (!password.trim()) {
    return { success: false, error: "La contraseña es requerida." };
  }

  return null;
}

function getAuthCallbackUrl(): string {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configuredSiteUrl) {
    return `${configuredSiteUrl.replace(/\/$/, "")}/auth/callback`;
  }

  const requestHeaders = headers();
  const origin = requestHeaders.get("origin");
  if (origin) {
    return `${origin.replace(/\/$/, "")}/auth/callback`;
  }

  const host = requestHeaders.get("host");
  if (host) {
    return `https://${host}/auth/callback`;
  }

  return "/auth/callback";
}

export async function signIn(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const validationError = validateCredentials(email, password);
  if (validationError) {
    return validationError;
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    return { success: false, error: mapAuthError(error.message) };
  }

  redirect("/dashboard");
}

export async function signUp(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const validationError = validateCredentials(email, password);
  if (validationError) {
    return validationError;
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      emailRedirectTo: getAuthCallbackUrl(),
    },
  });

  if (error) {
    return { success: false, error: mapAuthError(error.message) };
  }

  if (data.session) {
    redirect("/dashboard");
  }

  return {
    success: true,
    data: undefined,
  };
}

export async function signInWithGoogle() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (data.url) redirect(data.url);
}