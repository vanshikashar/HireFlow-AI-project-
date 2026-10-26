
import { useCallback, useEffect, useState } from "react";
import {
  createApplication,
  getJobPreferences,
  getRecommendedJobs,
  saveJobPreferences,
  type JobPreferences,
  type RecommendedJob,
} from "../../services/api";

const emptyPreferences: JobPreferences = {
  skills: [],
  preferredLocations: [],
  preferredWorkModes: [],
  preferredEmploymentTypes: [],
  experienceLevel: "",
};

const workModes = ["Remote", "Hybrid", "On-site"] as const;
const employmentTypes = ["Full-time", "Internship", "Contract"] as const;

function splitValues(value: string): string[] {
  return [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))];
}

function formatSalary(job: RecommendedJob): string {
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

export default function Recommendations() {
  const [preferences, setPreferences] =
    useState<JobPreferences>(emptyPreferences);
  const [skillsText, setSkillsText] = useState("");
  const [locationsText, setLocationsText] = useState("");
  const [jobs, setJobs] = useState<RecommendedJob[]>([]);
  const [loadingPreferences, setLoadingPreferences] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyJobId, setBusyJobId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadRecommendations = useCallback(async () => {
    setLoadingJobs(true);
    setError("");

    try {
      const response = await getRecommendedJobs();
      setJobs(response.items);
      if (response.message) setMessage(response.message);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load job recommendations.",
      );
    } finally {
      setLoadingJobs(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadPreferences() {
      try {
        const response = await getJobPreferences();
        if (cancelled) return;

        const loaded: JobPreferences = {
          ...emptyPreferences,
          ...response.preferences,
        };

        setPreferences(loaded);
        setSkillsText(loaded.skills.join(", "));
        setLocationsText(loaded.preferredLocations.join(", "));
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load your preferences.",
          );
        }
      } finally {
        if (!cancelled) setLoadingPreferences(false);
      }
    }

    void loadPreferences();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!loadingPreferences) void loadRecommendations();
  }, [loadingPreferences, loadRecommendations]);

  function toggleWorkMode(mode: (typeof workModes)[number]) {
    setPreferences((current) => ({
      ...current,
      preferredWorkModes: current.preferredWorkModes.includes(mode)
        ? current.preferredWorkModes.filter((item) => item !== mode)
        : [...current.preferredWorkModes, mode],
    }));
  }

  function toggleEmploymentType(type: (typeof employmentTypes)[number]) {
    setPreferences((current) => ({
      ...current,
      preferredEmploymentTypes: current.preferredEmploymentTypes.includes(type)
        ? current.preferredEmploymentTypes.filter((item) => item !== type)
        : [...current.preferredEmploymentTypes, type],
    }));
  }

  async function handleSavePreferences(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    const updated: JobPreferences = {
      ...preferences,
      skills: splitValues(skillsText),
      preferredLocations: splitValues(locationsText),
    };

    try {
      const response = await saveJobPreferences(updated);
      const saved: JobPreferences = {
        ...updated,
        ...response.preferences,
      };

      setPreferences(saved);
      setSkillsText(saved.skills.join(", "));
      setLocationsText(saved.preferredLocations.join(", "));
      setMessage("Preferences saved. Your recommendations are updated.");
      await loadRecommendations();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save preferences.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleTrack(jobId: string) {
    setBusyJobId(jobId);
    setError("");
    setMessage("");

    try {
      await createApplication(jobId);
      setMessage("Job added to My Applications.");
    } catch (err) {
      const reason =
        err instanceof Error ? err.message : "Unable to track this job.";

      setError(
        /duplicate|e11000|already tracked|already applied/i.test(reason)
          ? "You have already tracked this job."
          : reason,
      );
    } finally {
      setBusyJobId("");
    }
  }

  return (
    <main className="recommendations-page">
      <header className="recommendations-heading">
        <p className="recommendations-eyebrow">YOUR NEXT CAREER MOVE</p>
        <h1>Recommended for you</h1>
        <p>
          Tell us what you are looking for and discover jobs that align with
          your preferences.
        </p>
      </header>

      {error && (
        <div className="recommendations-alert error" role="alert">
          {error}
        </div>
      )}

      {message && (
        <div className="recommendations-alert success" role="status">
          {message}
        </div>
      )}

      <section className="recommendations-preferences">
        <div className="recommendations-section-heading">
          <div>
            <h2>Your job preferences</h2>
            <p>Use commas to separate skills and locations.</p>
          </div>
          {loadingPreferences && <span>Loading preferences…</span>}
        </div>

        <form onSubmit={(event) => void handleSavePreferences(event)}>
          <label className="recommendations-field">
            Skills
            <input
              value={skillsText}
              onChange={(event) => setSkillsText(event.target.value)}
              placeholder="React, TypeScript, JavaScript"
              maxLength={3000}
            />
          </label>

          <label className="recommendations-field">
            Preferred locations
            <input
              value={locationsText}
              onChange={(event) => setLocationsText(event.target.value)}
              placeholder="Noida, Delhi, Remote"
              maxLength={2000}
            />
          </label>

          <fieldset className="recommendations-fieldset">
            <legend>Preferred work mode</legend>
            <div className="recommendations-options">
              {workModes.map((mode) => (
                <label key={mode}>
                  <input
                    type="checkbox"
                    checked={preferences.preferredWorkModes.includes(mode)}
                    onChange={() => toggleWorkMode(mode)}
                  />
                  {mode}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="recommendations-fieldset">
            <legend>Employment type</legend>
            <div className="recommendations-options">
              {employmentTypes.map((type) => (
                <label key={type}>
                  <input
                    type="checkbox"
                    checked={preferences.preferredEmploymentTypes.includes(type)}
                    onChange={() => toggleEmploymentType(type)}
                  />
                  {type}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="recommendations-field">
            Experience level
            <input
              value={preferences.experienceLevel}
              onChange={(event) =>
                setPreferences((current) => ({
                  ...current,
                  experienceLevel: event.target.value,
                }))
              }
              placeholder="e.g. Entry-level, Fresher, 0-1 years"
              maxLength={100}
            />
          </label>

          <button
            type="submit"
            className="recommendations-primary"
            disabled={saving || loadingPreferences}
          >
            {saving ? "Saving preferences…" : "Save preferences"}
          </button>
        </form>
      </section>

      <section className="recommendations-results">
        <div className="recommendations-section-heading">
          <div>
            <h2>Jobs picked for you</h2>
            <p>Ranked using your saved preferences.</p>
          </div>
          <button
            type="button"
            className="recommendations-refresh"
            onClick={() => void loadRecommendations()}
            disabled={loadingJobs}
          >
            {loadingJobs ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {loadingJobs ? (
          <div className="recommendations-empty" role="status">
            Finding jobs that fit your preferences…
          </div>
        ) : jobs.length === 0 ? (
          <div className="recommendations-empty">
            <h3>No recommendations yet</h3>
            <p>
              Save your skills and preferences above. Add skills that match the
              jobs in your catalogue to get more useful results.
            </p>
          </div>
        ) : (
          <div className="recommendations-grid">
            {jobs.map((job) => (
              <article className="recommendation-card" key={job._id}>
                <div className="recommendation-card-top">
                  <div className="recommendation-company-mark">
                    {job.company.charAt(0).toUpperCase()}
                  </div>
                  <div className="recommendation-match">
                    <strong>{job.matchScore}%</strong>
                    <span>match</span>
                  </div>
                </div>

                <h3>{job.title}</h3>
                <p className="recommendation-company">
                  {job.company} · {job.location}
                </p>

                <div className="recommendation-tags">
                  <span>{job.workMode}</span>
                  <span>{job.employmentType}</span>
                  <span>{job.experience}</span>
                </div>

                <p className="recommendation-description">
                  {job.description}
                </p>

                <p className="recommendation-salary">{formatSalary(job)}</p>

                <div className="recommendation-skills">
                  {job.skills.map((skill) => (
                    <span
                      key={skill}
                      className={
                        job.matchedSkills.some(
                          (matched) =>
                            matched.toLowerCase() === skill.toLowerCase(),
                        )
                          ? "matched"
                          : ""
                      }
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                <p className="recommendation-match-note">
                  {job.matchedSkills.length
                    ? `Matching skills: ${job.matchedSkills.join(", ")}`
                    : "No exact skill matches yet"}
                </p>

                <button
                  type="button"
                  className="recommendations-primary"
                  disabled={busyJobId !== ""}
                  onClick={() => void handleTrack(job._id)}
                >
                  {busyJobId === job._id
                    ? "Adding…"
                    : "Track this job"}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
