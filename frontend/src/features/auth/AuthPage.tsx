
import { useState, type FormEvent } from "react";
import {
  loginUser,
  registerUser,
  type AuthUser,
} from "../../services/api";

type AuthPageProps = {
  onAuthenticated: (user: AuthUser) => void;
};

export default function AuthPage({ onAuthenticated }: AuthPageProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (mode === "register" && name.trim().length < 2) {
      setError("Name must contain at least 2 characters.");
      return;
    }

    if (mode === "register" && password.length < 12) {
      setError("Password must contain at least 12 characters.");
      return;
    }

    setLoading(true);

    try {
      const result =
        mode === "register"
          ? await registerUser({
              name: name.trim(),
              email: email.trim(),
              password,
            })
          : await loginUser({
              email: email.trim(),
              password,
            });

      onAuthenticated(result.user);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Authentication failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="auth-eyebrow">YOUR NEXT OPPORTUNITY</p>
        <h1>HireFlow AI</h1>
        <p>
          {mode === "login"
            ? "Welcome back. Sign in to manage your career journey."
            : "Create an account to start tracking your opportunities."}
        </p>

        <div className="auth-tabs">
          <button
            type="button"
            aria-pressed={mode === "login"}
            onClick={() => {
              setMode("login");
              setError("");
            }}
          >
            Sign in
          </button>
          <button
            type="button"
            aria-pressed={mode === "register"}
            onClick={() => {
              setMode("register");
              setError("");
            }}
          >
            Create account
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === "register" && (
            <label>
              Full name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                minLength={2}
                maxLength={80}
                required
              />
            </label>
          )}

          <label>
            Email address
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              maxLength={254}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={
                mode === "register" ? "new-password" : "current-password"
              }
              minLength={mode === "register" ? 12 : 1}
              maxLength={128}
              required
            />
          </label>

          {mode === "register" && (
            <p className="auth-hint">
              Use at least 12 characters for your password.
            </p>
          )}

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading
              ? "Please wait..."
              : mode === "login"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>

        <p className="auth-footer">
          Your account is managed securely by HireFlow AI.
        </p>
      </section>
    </main>
  );
}
