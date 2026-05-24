"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signupAdmin } from "../src/api/admin";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSigningUp, setIsSigningUp] = useState(false);

  async function signUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSigningUp(true);

    const formData = new FormData(event.currentTarget);
    const fullName = String(formData.get("fullName") || "");
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");
    const confirmPassword = String(formData.get("confirmPassword") || "");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsSigningUp(false);
      return;
    }

    try {
      await signupAdmin(fullName, email, password);
      router.push("/dashboard");
    } catch {
      setError("Unable to create this admin account");
    } finally {
      setIsSigningUp(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-card signup-card">
        <div className="login-brand">
          <div className="login-logo">RA</div>
          <div>
            <h1>Create Admin</h1>
            <p>Set up a Roominder admin account</p>
          </div>
        </div>

        <form className="login-form" onSubmit={signUp}>
          <label>
            Full name
            <input name="fullName" type="text" placeholder="Roominder Admin" required />
          </label>

          <label>
            Email
            <input name="email" type="email" placeholder="admin@roominder.com" required />
          </label>

          <label>
            Password
            <input name="password" type="password" minLength={6} required />
          </label>

          <label>
            Confirm password
            <input name="confirmPassword" type="password" minLength={6} required />
          </label>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" disabled={isSigningUp}>
            {isSigningUp ? "Creating Account..." : "Create Account"}
          </button>

          <div className="login-secondary-action">
            <Link href="/">Back to sign in</Link>
          </div>
        </form>
      </section>
    </main>
  );
}
