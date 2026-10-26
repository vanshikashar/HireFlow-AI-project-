
import { useCallback, useEffect, useState } from "react";
import {
  deleteApplication,
  getApplications,
  updateApplication,
  type ApplicationStatus,
  type TrackedApplication,
  type Job,
} from "../../services/api";

const statuses: ApplicationStatus[] = [
  "Applied",
  "Shortlisted",
  "Interview",
  "Offer",
  "Rejected",
];

function getJob(jobId: Job | string): Job | null {
  return typeof jobId === "string" ? null : jobId;
}

function getStatusClass(status: ApplicationStatus) {
  return `tracker-status-${status.toLowerCase()}`;
}

type Props = {
  refreshKey: number;
};

export default function ApplicationTracker({ refreshKey }: Props) {
  const [items, setItems] = useState<TrackedApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const result = await getApplications();
      setItems(result.items);
      setDraftNotes(
        Object.fromEntries(
          result.items.map((item) => [item._id, item.notes ?? ""]),
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load applications.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadApplications();
  }, [loadApplications, refreshKey]);

  async function changeStatus(id: string, status: ApplicationStatus) {
    setBusyId(id);
    setError("");
    setSuccessMessage("");

    try {
      const result = await updateApplication(id, { status });
      setItems((current) =>
        current.map((item) => (item._id === id ? result.application : item)),
      );
      setSuccessMessage("Application status updated.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update status.",
      );
    } finally {
      setBusyId("");
    }
  }

  async function changeNotes(id: string) {
    setBusyId(id);
    setError("");
    setSuccessMessage("");

    try {
      const result = await updateApplication(id, {
        notes: draftNotes[id] ?? "",
      });
      setItems((current) =>
        current.map((item) => (item._id === id ? result.application : item)),
      );
      setDraftNotes((current) => ({
        ...current,
        [id]: result.application.notes ?? "",
      }));
      setSuccessMessage("Notes saved successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save notes.");
    } finally {
      setBusyId("");
    }
  }

  async function removeApplication(id: string) {
    if (!window.confirm("Remove this job from your application tracker?")) {
      return;
    }

    setBusyId(id);
    setError("");
    setSuccessMessage("");

    try {
      await deleteApplication(id);
      setItems((current) => current.filter((item) => item._id !== id));
      setDraftNotes((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      setSuccessMessage("Application removed from your tracker.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to remove application.",
      );
    } finally {
      setBusyId("");
    }
  }

  const interviewCount = items.filter(
    (item) => item.status === "Interview",
  ).length;
  const offerCount = items.filter((item) => item.status === "Offer").length;
 

  return (
    <main className="tracker-page">
      <header className="tracker-heading">
        <div>
          <p className="auth-eyebrow">YOUR CAREER WORKSPACE</p>
          <h1>Application tracker</h1>
          <p>Every opportunity, organized in one place.</p>
        </div>

        <button
          className="tracker-refresh"
          type="button"
          onClick={() => void loadApplications()}
          disabled={loading}
        >
          <span aria-hidden="true">↻</span>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </header>

      <section className="tracker-summary" aria-label="Application summary">
        <div className="tracker-stat tracker-stat-purple">
          <span className="tracker-stat-icon" aria-hidden="true">▤</span>
          <span className="tracker-stat-label">Total tracked</span>
          <strong>{items.length}</strong>
          <span className="tracker-stat-hint">Applications in your pipeline</span>
        </div>

        <div className="tracker-stat tracker-stat-teal">
          <span className="tracker-stat-icon" aria-hidden="true">◷</span>
          <span className="tracker-stat-label">Interviews</span>
          <strong>{interviewCount}</strong>
          <span className="tracker-stat-hint">Interview-stage applications</span>
        </div>

        <div className="tracker-stat tracker-stat-green">
          <span className="tracker-stat-icon" aria-hidden="true">✓</span>
          <span className="tracker-stat-label">Offers</span>
          <strong>{offerCount}</strong>
          <span className="tracker-stat-hint">Offers received</span>
        </div>
      </section>

      {error && (
        <div className="tracker-alert tracker-alert-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => void loadApplications()}>
            Try again
          </button>
        </div>
      )}

      {successMessage && !error && (
        <p className="tracker-alert tracker-alert-success" role="status">
          ✓ {successMessage}
        </p>
      )}

      <section className="tracker-list-section">
        <div className="tracker-list-heading">
          <div>
            <h2>Your applications</h2>
            <p>Update progress and keep notes on your next steps.</p>
          </div>
          <span className="tracker-count">
            {items.length} {items.length === 1 ? "application" : "applications"}
          </span>
        </div>

        {loading ? (
          <div className="tracker-empty" role="status">
            <span className="tracker-empty-icon" aria-hidden="true">◌</span>
            <h3>Loading your applications</h3>
            <p>Getting your latest application updates...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="tracker-empty">
            <span className="tracker-empty-icon" aria-hidden="true">↗</span>
            <h3>No applications yet</h3>
            <p>
              Your next opportunity could start here. Visit Find jobs and
              select “Track this job” to add an application.
            </p>
          </div>
        ) : (
          <div className="tracker-list">
            {items.map((item) => {
              const job = getJob(item.jobId);
              const isBusy = busyId === item._id;
              const currentNotes = draftNotes[item._id] ?? item.notes ?? "";
              const notesChanged = currentNotes !== (item.notes ?? "");

              return (
                <article className="tracker-card" key={item._id}>
                  <div className="tracker-card-top">
                    <div className="tracker-company-mark" aria-hidden="true">
                      {(job?.company || "J").charAt(0).toUpperCase()}
                    </div>

                    <div className="tracker-job-info">
                      <h3>{job?.title || "Job details unavailable"}</h3>
                      <p>
                        {job
                          ? `${job.company} · ${job.location}`
                          : "This job may no longer be available."}
                      </p>
                      <span className="tracker-applied-date">
                        Applied{" "}
                        {new Date(item.appliedAt).toLocaleDateString(
                          undefined,
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          },
                        )}
                      </span>
                    </div>

                    <span
                      className={`tracker-status ${getStatusClass(item.status)}`}
                    >
                      <span className="tracker-status-dot" />
                      {item.status}
                    </span>
                  </div>

                  {job && (
                    <div className="tracker-job-tags">
                      <span>{job.workMode}</span>
                      <span>{job.employmentType}</span>
                      <span>{job.experience}</span>
                    </div>
                  )}

                  <div className="tracker-card-divider" />

                  <div className="tracker-card-fields">
                    <label className="tracker-field">
                      <span>Application status</span>
                      <select
                        value={item.status}
                        disabled={isBusy}
                        onChange={(event) =>
                          void changeStatus(
                            item._id,
                            event.target.value as ApplicationStatus,
                          )
                        }
                      >
                        {statuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                      <small>Changes are saved automatically.</small>
                    </label>

                    <label className="tracker-field tracker-notes-field">
                      <span>Notes & next steps</span>
                      <textarea
                        rows={3}
                        maxLength={2000}
                        value={currentNotes}
                        disabled={isBusy}
                        onChange={(event) =>
                          setDraftNotes((current) => ({
                            ...current,
                            [item._id]: event.target.value,
                          }))
                        }
                        placeholder="Add interview details, follow-up dates, or notes..."
                      />
                      <small>{currentNotes.length}/2000 characters</small>
                    </label>
                  </div>

                  <footer className="tracker-card-footer">
                    <span className="tracker-save-hint">
                      {isBusy
                        ? "Saving changes..."
                        : notesChanged
                          ? "You have unsaved notes"
                          : "Your progress is up to date"}
                    </span>

                    <div className="tracker-card-actions">
                      <button
                        className="tracker-remove-button"
                        type="button"
                        disabled={isBusy}
                        onClick={() => void removeApplication(item._id)}
                      >
                        Remove
                      </button>

                      <button
                        className="tracker-save-button"
                        type="button"
                        disabled={isBusy || !notesChanged}
                        onClick={() => void changeNotes(item._id)}
                      >
                        {isBusy ? "Saving..." : "Save notes"}
                      </button>
                    </div>
                  </footer>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
