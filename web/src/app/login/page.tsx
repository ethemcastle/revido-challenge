"use client";

import { useState } from "react";
import { signInWithEmail } from "./actions";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const result = await signInWithEmail(email);

    if (result.error) {
      setMessage(result.error);
    } else {
      setMessage("Check your email for the magic link!");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-1 items-center justify-center">
      <form onSubmit={handleLogin} className="flex flex-col gap-4 w-full max-w-sm p-8">
        <h1 className="text-2xl font-semibold">Sign In</h1>
        <input
          type="email"
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="border rounded-md px-4 py-2"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-foreground text-background rounded-md px-4 py-2 font-medium disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send Magic Link"}
        </button>
        {message && <p className="text-sm text-center">{message}</p>}
      </form>
    </div>
  );
}
