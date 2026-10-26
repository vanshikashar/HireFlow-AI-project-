
import { useEffect, useMemo, useState } from "react";
import {
  createApplication,
  getJobs,
  getSavedJobs,
  saveJob,
  removeSavedJob,
} from "../../services/api";
import type { Job } from "../../services/api";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import styles from "./JobSearch.module.css";

export default function JobSearch() {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("All locations");
  const [mode, setMode] = useState("All modes");

  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [allJobs, setAllJobs] = useState<Job[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [trackingJobId, setTrackingJobId] = useState("");
  const [trackingMessage, setTrackingMessage] = useState("");
  const [trackingError, setTrackingError] = useState("");

  const [savingJobId, setSavingJobId] = useState("");
  const [savedError, setSavedError] = useState("");
  const [savedJobsLoading, setSavedJobsLoading] = useState(true);

  const debouncedQuery = useDebouncedValue(query, 300);

  // Load jobs from the backend.
  useEffect(() => {
    let cancelled = false;

    async function loadJobs() {
      setLoading(true);
      setError("");

      try {
        const response = await getJobs();

        if (!cancelled) {
          setAllJobs(response.items);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load jobs.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadJobs();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  // Load saved jobs belonging to the signed-in user.
  useEffect(() => {
    let cancelled = false;

    async function loadSavedJobs() {
      setSavedJobsLoading(true);
      setSavedError("");

      try {
        const response = await getSavedJobs();

        if (!cancelled) {
          const ids = response.items.map((item) =>
            typeof item.jobId === "string"
              ? item.jobId
              : item.jobId._id,
          );

          setSavedIds(ids);
        }
      } catch (err) {
        if (!cancelled) {
          setSavedError(
            err instanceof Error
              ? err.message
              : "Unable to load your saved jobs.",
          );
        }
      } finally {
        if (!cancelled) {
          setSavedJobsLoading(false);
        }
      }
    }

    void loadSavedJobs();

    return () => {
      cancelled = true;
    };
  }, []);

  // Build the available location filter options.
  const locations = useMemo(
    () =>
      [
        ...new Set(
          allJobs.map((job) => job.location).filter(Boolean),
        ),
      ].sort(),
    [allJobs],
  );

  // Filter jobs by keyword, location, and work mode.
  const jobs = useMemo(() => {
    const normalizedQuery = debouncedQuery.trim().toLowerCase();

    return allJobs.filter((job) => {
      const searchable = [
        job.title,
        job.company,
        job.description,
        ...job.skills,
      ]
        .join(" ")
        .toLowerCase();

      const matchesQuery =
        normalizedQuery === "" ||
        searchable.includes(normalizedQuery);

      const matchesLocation =
        location === "All locations" ||
        job.location === location;

      const matchesMode =
        mode === "All modes" || job.workMode === mode;

      return matchesQuery && matchesLocation && matchesMode;
    });
  }, [allJobs, debouncedQuery, location, mode]);

  // Save or unsave a job using the backend API.
  async function toggleSaved(jobId: string) {
    if (savingJobId || savedJobsLoading) {
      return;
    }

    const wasSaved = savedIds.includes(jobId);

    setSavingJobId(jobId);
    setSavedError("");

    try {
      if (wasSaved) {
        await removeSavedJob(jobId);

        setSavedIds((current) =>
          current.filter((id) => id !== jobId),
        );
      } else {
        await saveJob(jobId);

        setSavedIds((current) =>
          current.includes(jobId)
            ? current
            : [...current, jobId],
        );
      }
    } catch (err) {
      setSavedError(
        err instanceof Error
          ? err.message
          : "Unable to update your saved jobs.",
      );
    } finally {
      setSavingJobId("");
    }
  }

  function clearFilters() {
    setQuery("");
    setLocation("All locations");
    setMode("All modes");
  }

  // Add a job to the application tracker.
  async function trackJob(jobId: string) {
    setTrackingJobId(jobId);
    setTrackingMessage("");
    setTrackingError("");

    try {
      await createApplication(jobId);
      setTrackingMessage(
        "Job added to your application tracker.",
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to track this job.";

      const normalizedMessage = message.toLowerCase();

      setTrackingError(
        normalizedMessage.includes("duplicate") ||
          normalizedMessage.includes("e11000") ||
          normalizedMessage.includes("already tracked") ||
          normalizedMessage.includes("already applied")
          ? "You have already tracked this job."
          : message,
      );
    } finally {
      setTrackingJobId("");
    }
  }

  return (
    <section className={styles.page}>
      <header>
        <p className={styles.eyebrow}>YOUR NEXT OPPORTUNITY</p>
        <h1>Find work that fits you.</h1>
        <p>
          Discover roles that match your skills and career goals.
        </p>

        <button
          type="button"
          onClick={() => setRefreshKey((key) => key + 1)}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh jobs"}
        </button>
      </header>

      <div className={styles.filters}>
        <label>
          Search jobs
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="React, frontend, company..."
          />
        </label>

        <label>
          Location
          <select
            value={location}
            onChange={(event) => setLocation(event.target.value)}
          >
            <option>All locations</option>
            {locations.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label>
          Work mode
          <select
            value={mode}
            onChange={(event) => setMode(event.target.value)}
          >
            <option>All modes</option>
            <option>Remote</option>
            <option>Hybrid</option>
            <option>On-site</option>
          </select>
        </label>
      </div>

      <div className={styles.resultHeader}>
        <h2>Recommended opportunities</h2>
        <span>
          {loading ? "Loading jobs..." : `${jobs.length} jobs found`}
        </span>
      </div>

      {savedError && (
        <p role="alert" className="tracking-error">
          {savedError}
        </p>
      )}

      {savedJobsLoading && (
        <p role="status">Loading your saved jobs...</p>
      )}

      {trackingMessage && (
        <p role="status" className="tracking-message">
          {trackingMessage}
        </p>
      )}

      {trackingError && (
        <p role="alert" className="tracking-error">
          {trackingError}
        </p>
      )}

      {loading ? (
        <div className={styles.empty} role="status">
          <p>Loading the latest jobs from HireFlow AI...</p>
        </div>
      ) : error ? (
        <div className={styles.empty} role="alert">
          <h3>We couldn't load jobs</h3>
          <p>{error}</p>
          <p>Check that your backend is running on port 5000.</p>
          <button
            type="button"
            onClick={() => setRefreshKey((key) => key + 1)}
          >
            Try again
          </button>
        </div>
      ) : jobs.length === 0 ? (
        <div className={styles.empty}>
          <h3>No matching jobs</h3>
          <p>Try another keyword or remove a filter.</p>
          <button type="button" onClick={clearFilters}>
            Clear filters
          </button>
        </div>
      ) : (
        <div className={styles.jobGrid}>
          {jobs.map((job) => {
            const isSaved = savedIds.includes(job._id);
            const isSaving = savingJobId === job._id;

            return (
              <article
                key={job._id}
                className={styles.jobCard}
              >
                <div className={styles.cardTop}>
                  <div>
                    <h3>{job.title}</h3>
                    <p>
                      {job.company} · {job.location}
                    </p>
                  </div>

                  <button
                    type="button"
                    aria-label={isSaved ? "Unsave job" : "Save job"}
                    aria-pressed={isSaved}
                    disabled={isSaving || savedJobsLoading}
                    onClick={() => void toggleSaved(job._id)}
                  >
                    {isSaving
                      ? "Saving..."
                      : isSaved
                        ? "★ Saved"
                        : "☆ Save"}
                  </button>
                </div>

                <div className={styles.tags}>
                  <span>{job.workMode}</span>
                  <span>{job.employmentType}</span>
                  <span>{job.experience}</span>
                </div>

                <p>{job.description}</p>

                <div className={styles.skills}>
                  {job.skills.map((skill) => (
                    <span key={skill}>{skill}</span>
                  ))}
                </div>

                <p className={styles.salary}>
                  {job.salaryMin != null &&
                  job.salaryMax != null
                    ? `₹${(job.salaryMin / 100000).toFixed(1)}–${(
                        job.salaryMax / 100000
                      ).toFixed(1)} LPA`
                    : "Salary not listed"}
                </p>

                <button
                  type="button"
                  className={styles.primary}
                  disabled={trackingJobId === job._id}
                  onClick={() => void trackJob(job._id)}
                >
                  {trackingJobId === job._id
                    ? "Adding..."
                    : "Track this job"}
                </button>
              </article>
            );
          })}
        </div>
      )}

      {!loading && !error && allJobs.length > 0 && (
        <p>
          Showing {jobs.length} of {allJobs.length} jobs returned
          by the API.
        </p>
      )}
    </section>
  );
}
