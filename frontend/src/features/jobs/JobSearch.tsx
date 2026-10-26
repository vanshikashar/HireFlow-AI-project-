import { useMemo, useState } from "react";
import { mockJobs } from "./mockJobs";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import type { Job } from "../../types";
import styles from "./JobSearch.module.css";

export default function JobSearch() {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("All locations");
  const [mode, setMode] = useState("All modes");
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const debouncedQuery = useDebouncedValue(query, 300);

  const jobs = useMemo(() => {
    const normalizedQuery = debouncedQuery.trim().toLowerCase();

    return mockJobs.filter((job: Job) => {
      const searchable = [
        job.title,
        job.company,
        job.description,
        ...job.skills
      ].join(" ").toLowerCase();

      const matchesQuery = searchable.includes(normalizedQuery);
      const matchesLocation =
        location === "All locations" || job.location === location;
      const matchesMode = mode === "All modes" || job.workMode === mode;

      return matchesQuery && matchesLocation && matchesMode;
    });
  }, [debouncedQuery, location, mode]);

  function toggleSaved(id: string) {
    setSavedIds((current) =>
      current.includes(id)
        ? current.filter((savedId) => savedId !== id)
        : [...current, id]
    );
  }

  return (
    <section className={styles.page}>
      <header>
        <p className={styles.eyebrow}>YOUR NEXT OPPORTUNITY</p>
        <h1>Find work that fits you.</h1>
        <p>Discover roles that match your skills and career goals.</p>
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
          <select value={location} onChange={(event) => setLocation(event.target.value)}>
            <option>All locations</option>
            {Array.from(new Set(mockJobs.map((job) => job.location))).map(
              (item) => <option key={item}>{item}</option>
            )}
          </select>
        </label>

        <label>
          Work mode
          <select value={mode} onChange={(event) => setMode(event.target.value)}>
            <option>All modes</option>
            <option>Remote</option>
            <option>Hybrid</option>
            <option>On-site</option>
          </select>
        </label>
      </div>

      <div className={styles.resultHeader}>
        <h2>Recommended opportunities</h2>
        <span>{jobs.length} jobs found</span>
      </div>

      {jobs.length === 0 ? (
        <div className={styles.empty}>
          <h3>No matching jobs</h3>
          <p>Try another keyword or remove a filter.</p>
          <button onClick={() => {
            setQuery("");
            setLocation("All locations");
            setMode("All modes");
          }}>
            Clear filters
          </button>
        </div>
      ) : (
        <div className={styles.jobGrid}>
          {jobs.map((job) => (
            <article key={job.id} className={styles.jobCard}>
              <div className={styles.cardTop}>
                <div>
                  <h3>{job.title}</h3>
                  <p>{job.company} · {job.location}</p>
                </div>
                <button
                  aria-label={savedIds.includes(job.id) ? "Unsave job" : "Save job"}
                  aria-pressed={savedIds.includes(job.id)}
                  onClick={() => toggleSaved(job.id)}
                >
                  {savedIds.includes(job.id) ? "★ Saved" : "☆ Save"}
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
                {job.salaryMin && job.salaryMax
                  ? `₹${(job.salaryMin / 100000).toFixed(1)}–${(job.salaryMax / 100000).toFixed(1)} LPA`
                  : "Salary not listed"}
              </p>

              <button
                className={styles.primary}
                onClick={() => window.alert(
                  `Next step: add ${job.title} to your application tracker.`
                )}
              >
                Track this job
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}