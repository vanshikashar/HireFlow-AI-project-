
import { useEffect, useState } from "react";
import JobSearch from "./features/jobs/JobSearch";
import AuthPage from "./features/auth/AuthPage";
import ApplicationTracker from "./features/applications/ApplicationTracker";
import Dashboard from "./features/dashboard/Dashboard";
import SavedJobs from "./features/saved-jobs/SavedJobs";
import Recommendations from "./features/recommendations/Recommendations";
import {
  getCurrentUser,
  logoutUser,
  type AuthUser,
} from "./services/api";

type Theme = "light" | "dark";

type ActiveView =
  | "dashboard"
  | "jobs"
  | "saved"
  | "recommendations"
  | "applications";

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [logoutError, setLogoutError] = useState("");
  const [activeView, setActiveView] =
    useState<ActiveView>("dashboard");
  const [trackerRefreshKey, setTrackerRefreshKey] = useState(0);

  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return window.localStorage.getItem("hireflow-theme") === "dark"
        ? "dark"
        : "light";
    } catch {
      return "light";
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    root.dataset.theme = theme;
    body.dataset.theme = theme;

    root.style.colorScheme = theme;
    body.style.backgroundColor =
      theme === "dark" ? "#10121b" : "#f6f8fc";
    body.style.color =
      theme === "dark" ? "#edf0fa" : "#172033";

    try {
      window.localStorage.setItem("hireflow-theme", theme);
    } catch {
      // The selected theme still works for this session.
    }
  }, [theme]);

  useEffect(() => {
    let cancelled = false;

    getCurrentUser()
      .then((result) => {
        if (!cancelled) {
          setUser(result.user);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setCheckingSession(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogout() {
    setLogoutError("");

    try {
      await logoutUser();
      setUser(null);
      setActiveView("dashboard");
    } catch (err) {
      setLogoutError(
        err instanceof Error ? err.message : "Unable to sign out."
      );
    }
  }

  function toggleTheme() {
    setTheme((current) =>
      current === "light" ? "dark" : "light"
    );
  }

  if (checkingSession) {
    return <main className="auth-page">Checking your session...</main>;
  }

  if (!user) {
    return <AuthPage onAuthenticated={setUser} />;
  }

  return (
    <>
      <header className="session-header">
        <a className="session-brand" href="/">
          <span className="brand-mark">H</span>
          <span>
            HireFlow <strong>AI</strong>
          </span>
        </a>

        <nav className="app-nav" aria-label="Main navigation">
          <button
            type="button"
            className={activeView === "dashboard" ? "active" : ""}
            aria-current={activeView === "dashboard" ? "page" : undefined}
            onClick={() => setActiveView("dashboard")}
          >
            Dashboard
          </button>

          <button
            type="button"
            className={activeView === "jobs" ? "active" : ""}
            aria-current={activeView === "jobs" ? "page" : undefined}
            onClick={() => setActiveView("jobs")}
          >
            Find jobs
          </button>

          <button
            type="button"
            className={activeView === "saved" ? "active" : ""}
            aria-current={activeView === "saved" ? "page" : undefined}
            onClick={() => setActiveView("saved")}
          >
            Saved jobs
          </button>

          <button
            type="button"
            className={
              activeView === "recommendations" ? "active" : ""
            }
            aria-current={
              activeView === "recommendations" ? "page" : undefined
            }
            onClick={() => setActiveView("recommendations")}
          >
            Recommended jobs
          </button>

          <button
            type="button"
            className={activeView === "applications" ? "active" : ""}
            aria-current={
              activeView === "applications" ? "page" : undefined
            }
            onClick={() => {
              setActiveView("applications");
              setTrackerRefreshKey((key) => key + 1);
            }}
          >
            My applications
          </button>
        </nav>

        <div className="session-actions">
          <span className="session-greeting">
            Welcome, <strong>{user.name}</strong>
          </span>

          <button
            type="button"
            className={`theme-toggle ${
              theme === "dark"
                ? "theme-toggle-dark"
                : "theme-toggle-light"
            }`}
            onClick={toggleTheme}
            aria-label={`Switch to ${
              theme === "light" ? "dark" : "light"
            } theme`}
            aria-pressed={theme === "dark"}
          >
            <span className="theme-toggle-icon" aria-hidden="true">
              {theme === "light" ? "☾" : "☀"}
            </span>

            <span className="theme-toggle-label">
              {theme === "light" ? "Dark" : "Light"}
            </span>

            <span className="theme-toggle-track" aria-hidden="true">
              <span className="theme-toggle-thumb" />
            </span>
          </button>

          <button
            type="button"
            className="signout-button"
            onClick={() => void handleLogout()}
          >
            Sign out
          </button>
        </div>

        {logoutError && (
          <p className="session-error" role="alert">
            {logoutError}
          </p>
        )}
      </header>

      {activeView === "dashboard" ? (
        <Dashboard refreshKey={trackerRefreshKey} />
      ) : activeView === "jobs" ? (
        <JobSearch />
      ) : activeView === "saved" ? (
        <SavedJobs />
      ) : activeView === "recommendations" ? (
        <Recommendations />
      ) : (
        <ApplicationTracker refreshKey={trackerRefreshKey} />
      )}
    </>
  );
}
