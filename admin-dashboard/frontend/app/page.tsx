"use client";

import { FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginAdmin } from "./src/api/admin";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSigningIn(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");

    try {
      await loginAdmin(email, password);
      router.push("/dashboard");
    } catch {
      setError("Invalid admin email or password");
    } finally {
      setIsSigningIn(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-card">
        <div className="login-brand">
          <div className="login-logo">RA</div>
          <div>
            <h1>Roominder Admin</h1>
            <p>Sign in to manage your dashboard</p>
          </div>
        </div>

        <form className="login-form" onSubmit={signIn}>
          <label>
            Email
            <input name="email" type="email" defaultValue="admin@roominder.com" required />
          </label>

          <label>
            Password
            <input name="password" type="password" defaultValue="admin" required />
          </label>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" disabled={isSigningIn}>
            {isSigningIn ? "Signing In..." : "Sign In"}
          </button>

          <div className="login-secondary-action">
            <Link href="/signup">Sign up</Link>
          </div>
        </form>
      </section>
    </main>
  );
}
