
import { useCallback, useEffect, useState } from "react";
import {
  createApplication,
  getSavedJobs,
  removeSavedJob,
  type Job,
  type SavedJob,
} from "../../services/api";

function getJob(jobId: Job | string): Job | null {
  return typeof jobId === "string" ? null : jobId;
}

function formatSalary(job: Job): string {
  if (job.salaryMin == null && job.salaryMax == null) {
    return "Salary not specified";
  }

  const formatAmount = (amount: number) =>
    `₹${amount.toLocaleString("en-IN")}`;

  if (job.salaryMin != null && job.salaryMax != null) {
    return `${formatAmount(job.salaryMin)} – ${formatAmount(job.salaryMax)}`;
  }

  return job.salaryMin != null
    ? `From ${formatAmount(job.salaryMin)}`
    : `Up to ${formatAmount(job.salaryMax!)}`;
}

export default function SavedJobs() {
  const [items, setItems] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyJobId, setBusyJobId] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadSavedJobs = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getSavedJobs();
      setItems(response.items);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your saved jobs."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSavedJobs();
  }, [loadSavedJobs]);

  async function handleRemove(jobId: string) {
    setBusyJobId(jobId);
    setError("");
    setSuccessMessage("");

    try {
      await removeSavedJob(jobId);
      setItems((current) =>
        current.filter((item) => {
          const job = getJob(item.jobId);
          return job?._id !== jobId;
        })
      );
      setSuccessMessage("Job removed from your saved list.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to remove this job."
      );
    } finally {
      setBusyJobId("");
    }
  }

  async function handleTrack(jobId: string) {
    setBusyJobId(jobId);
    setError("");
    setSuccessMessage("");

    try {
      await createApplication(jobId);
      setSuccessMessage("Application added to My Applications.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to track this application."
      );
    } finally {
      setBusyJobId("");
    }
  }

  return (
    <main className="saved-jobs-page">
      <section className="saved-jobs-heading">
        <div>
          <p className="saved-jobs-eyebrow">YOUR CAREER WORKSPACE</p>
          <h1>Saved jobs</h1>
          <p className="saved-jobs-subtitle">
            Keep interesting opportunities close and track the ones you apply
            for.
          </p>
        </div>

        <button
          type="button"
          className="saved-jobs-refresh"
          onClick={() => void loadSavedJobs()}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </section>

      <section className="saved-jobs-summary">
        <div>
          <span className="saved-jobs-summary-icon" aria-hidden="true">
            ♡
          </span>
          <div>
            <p>Saved opportunities</p>
            <strong>{items.length}</strong>
          </div>
        </div>
        <p className="saved-jobs-summary-note">
          Your shortlist, all in one place.
        </p>
      </section>

      {error && (
        <div className="saved-jobs-alert saved-jobs-alert-error" role="alert">
          {error}
        </div>
      )}

      {successMessage && (
        <div
          className="saved-jobs-alert saved-jobs-alert-success"
          role="status"
        >
          {successMessage}
        </div>
      )}

      {loading ? (
        <div className="saved-jobs-state">
          <div className="saved-jobs-loader" />
          <p>Loading your saved jobs...</p>
        </div>
      ) : items.length === 0 ? (
        <section className="saved-jobs-empty">
          <div className="saved-jobs-empty-icon" aria-hidden="true">
            ♡
          </div>
          <h2>Your shortlist starts here</h2>
          <p>
            Save jobs from Find Jobs and they will appear here for easy access.
          </p>
          <p className="saved-jobs-empty-tip">
            Tip: compare opportunities before deciding which ones to track.
          </p>
        </section>
      ) : (
        <section className="saved-jobs-list">
          <div className="saved-jobs-list-heading">
            <h2>Your shortlist</h2>
            <span>{items.length} saved</span>
          </div>

          {items.map((item) => {
            const job = getJob(item.jobId);

            if (!job) {
              return (
                <article className="saved-job-card" key={item._id}>
                  <div>
                    <h3>Job details unavailable</h3>
                    <p>
                      This saved entry could not be matched to a job. Try
                      removing it and saving the job again.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="saved-job-remove"
                    onClick={() => void handleRemove(String(item.jobId))}
                    disabled={busyJobId !== ""}
                  >
                    Remove
                  </button>
                </article>
              );
            }

            return (
              <article className="saved-job-card" key={item._id}>
                <div className="saved-job-card-main">
                  <div className="saved-job-company-mark" aria-hidden="true">
                    {job.company?.charAt(0)?.toUpperCase() || "J"}
                  </div>

                  <div className="saved-job-details">
                    <h3>{job.title}</h3>
                    <p className="saved-job-company">{job.company}</p>

                    <div className="saved-job-tags">
                      {job.location && <span>⌖ {job.location}</span>}
                      {job.workMode && <span>{job.workMode}</span>}
                      {job.employmentType && (
                        <span>{job.employmentType}</span>
                      )}
                    </div>

                    <p className="saved-job-salary">{formatSalary(job)}</p>

                    {job.skills?.length > 0 && (
                      <div className="saved-job-skills">
                        {job.skills.slice(0, 5).map((skill) => (
                          <span key={skill}>{skill}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="saved-job-card-actions">
                  <button
                    type="button"
                    className="saved-job-track"
                    onClick={() => void handleTrack(job._id)}
                    disabled={busyJobId !== ""}
                  >
                    {busyJobId === job._id
                      ? "Please wait..."
                      : "Track application"}
                  </button>

                  <button
                    type="button"
                    className="saved-job-remove"
                    onClick={() => void handleRemove(job._id)}
                    disabled={busyJobId !== ""}
                  >
                    Remove
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
