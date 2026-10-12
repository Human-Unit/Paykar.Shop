"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/admin-api";
import styles from "./admin.module.css";

export function AdminLogin() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  return (
    <main className={styles.login}>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setPending(true);
          setError("");
          const data = new FormData(event.currentTarget);
          try {
            await adminApi("auth/login", undefined, {
              email: data.get("email"),
              password: data.get("password"),
            });
            router.replace("/admin");
          } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Sign in failed");
          } finally {
            setPending(false);
          }
        }}
      >
        <span className={styles.eyebrow}>Paykar administration</span>
        <h1>Sign in</h1>
        <p>Restricted to store administrators.</p>
        <label>
          Email
          <input
            name="email"
            type="email"
            autoComplete="username"
            required
            maxLength={254}
          />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            maxLength={256}
          />
        </label>
        {error && <p role="alert">{error}</p>}
        <button className={styles.primary} disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </button>
        <Link href="/">Return to storefront</Link>
      </form>
    </main>
  );
}
