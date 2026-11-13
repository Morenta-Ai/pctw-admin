"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { errorMessage, type ApiError } from "@/core/api/api-error";
import { safeRedirectPath } from "@/core/auth/roles";
import { clearSession, getSession, saveSession } from "@/core/auth/session";
import { getAuthRepository } from "@/features/auth/data/auth-repository";
import { loginInputSchema } from "@/features/auth/data/models";
import { sessionFromTokens } from "@/features/auth/session-refresh";

export type LoginState = {
  error?: string;
  fieldErrors?: { email?: string; password?: string };
  /** Echoed back so the form keeps what was typed after a failed attempt. */
  email?: string;
};

export async function login(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const parsed = loginInputSchema.safeParse({
    email,
    password: formData.get("password") ?? "",
  });
  if (!parsed.success) {
    const fields = z.flattenError(parsed.error).fieldErrors;
    return {
      email,
      fieldErrors: { email: fields.email?.[0], password: fields.password?.[0] },
    };
  }

  const result = await getAuthRepository().login(parsed.data);
  if (!result.ok) return { email, error: loginErrorMessage(result.error) };

  await saveSession(sessionFromTokens(result.data));
  redirect(safeRedirectPath(String(formData.get("next") ?? "")));
}

export async function logout(): Promise<void> {
  const session = await getSession();
  if (session) {
    // Revoke the refresh token if we can; sign out locally either way.
    await getAuthRepository().logout(session.refreshToken);
  }
  await clearSession();
  redirect("/login");
}

function loginErrorMessage(error: ApiError): string {
  switch (error.code) {
    case "INVALID_CREDENTIALS":
      return "Email or password is wrong.";
    case "ACCOUNT_SUSPENDED":
      return "This account is suspended. Ask an admin to reactivate it.";
    case "TOO_MANY_ATTEMPTS":
      return "Too many attempts. Wait a few minutes and try again.";
    default:
      return errorMessage(error);
  }
}
