
import { useRef, useState, type FormEvent } from "react";
import {
  analyzeResumePdf,
  type ResumeAnalysisReport,
} from "../../services/api";


function downloadResumeReport(report: ResumeAnalysisReport) {
  const lines = [
    "HIREFLOW AI — RESUME ANALYSIS REPORT",
    "====================================",
    "",
    `Overall match score: ${report.matchScore}/100`,
    `Skill coverage: ${
      report.scoreBreakdown.skillScore === null
        ? "N/A"
        : `${report.scoreBreakdown.skillScore}%`
    }`,
    `Keyword coverage: ${
      report.scoreBreakdown.keywordScore === null
        ? "N/A"
        : `${report.scoreBreakdown.keywordScore}%`
    }`,
    "",
    "RESUME SECTION CHECKLIST",
    ...report.sectionChecks.map(
      (item) => `[${item.status.toUpperCase()}] ${item.label}: ${item.detail}`,
    ),
    "",
    "MATCHED SKILLS",
    ...(report.matchedSkills.length ? report.matchedSkills : ["None detected"]),
    "",
    "SKILLS TO REVIEW",
    ...(report.missingSkills.length ? report.missingSkills : ["None detected"]),
    "",
    "MATCHED KEYWORDS",
    ...(report.matchedKeywords.length ? report.matchedKeywords : ["None detected"]),
    "",
    "MISSING KEYWORDS",
    ...(report.missingKeywords.length ? report.missingKeywords : ["None detected"]),
    "",
    "SUGGESTIONS",
    ...report.suggestions.map((item, index) => `${index + 1}. ${item}`),
    "",
    "DISCLAIMER",
    report.disclaimer,
  ];

  const blob = new Blob([lines.join("\n")], {
    type: "text/plain;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "hireflow-resume-analysis.txt";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}


export default function ResumeAnalyzer() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [report, setReport] = useState<ResumeAnalysisReport | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleFileChange(selected: File | undefined) {
    setError("");
    setReport(null);

    if (!selected) {
      setFile(null);
      return;
    }

    if (!selected.name.toLowerCase().endsWith(".pdf")) {
      setFile(null);
      setError("Please select a PDF resume.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (selected.size > 5 * 1024 * 1024) {
      setFile(null);
      setError("The PDF must be 5 MB or smaller.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (selected.size === 0) {
      setFile(null);
      setError("The selected PDF is empty.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setFile(selected);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setReport(null);

    if (!file) {
      setError("Please upload your resume as a PDF.");
      return;
    }

    if (jobDescription.trim().length < 50) {
      setError("Enter a job description with at least 50 characters.");
      return;
    }

    setLoading(true);

    try {
      const result = await analyzeResumePdf(file, jobDescription.trim());
      setReport(result.report);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to analyze your resume. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  function resetAnalysis() {
    setReport(null);
    setError("");
    setFile(null);
    setJobDescription("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <main className="resume-analyzer-page">
      <header className="resume-page-header">
        <div>
          <p className="resume-eyebrow">CAREER TOOLS</p>
          <h1>Resume Analyzer</h1>
          <p>
            Compare your resume with a job description and identify
            opportunities to improve your application.
          </p>
        </div>
        <div className="resume-header-icon" aria-hidden="true">
          <span>CV</span>
          <span className="resume-sparkle">✦</span>
        </div>
      </header>

      <section className="resume-analyzer-layout">
        <form className="resume-form-card" onSubmit={handleSubmit}>
          <div className="resume-section-heading">
            <span className="resume-step-number">01</span>
            <div>
              <h2>Upload your resume</h2>
              <p>PDF format only · Maximum 5 MB</p>
            </div>
          </div>

          <label className="resume-upload-area" htmlFor="resume-pdf">
            <span className="resume-upload-icon" aria-hidden="true">↑</span>
            <strong>{file ? file.name : "Choose your resume PDF"}</strong>
            <span>
              {file
                ? `${(file.size / 1024).toFixed(0)} KB · Ready to analyze`
                : "Select a file from your computer"}
            </span>
            <span className="resume-browse-label">
              {file ? "Choose another file" : "Browse files"}
            </span>
          </label>

          <input
            ref={fileInputRef}
            id="resume-pdf"
            className="resume-file-input"
            type="file"
            accept=".pdf,application/pdf"
            onChange={(event) =>
              handleFileChange(event.currentTarget.files?.[0])
            }
          />

          <div className="resume-section-heading resume-job-heading">
            <span className="resume-step-number">02</span>
            <div>
              <h2>Add the job description</h2>
              <p>Paste the role you're applying for.</p>
            </div>
          </div>

          <label className="resume-field-label" htmlFor="job-description">
            Target job description
          </label>
          <textarea
            id="job-description"
            className="resume-job-textarea"
            value={jobDescription}
            onChange={(event) => {
              setJobDescription(event.target.value);
              setReport(null);
            }}
            placeholder="Paste the job responsibilities, required skills, qualifications, and experience here..."
            rows={9}
            maxLength={20000}
            required
          />
          <div className="resume-character-count">
            {jobDescription.length.toLocaleString()} / 20,000 characters
          </div>

          {error && (
            <p className="resume-error" role="alert">
              {error}
            </p>
          )}

          <button
            className="resume-analyze-button"
            type="submit"
            disabled={loading}
          >
            {loading ? "Analyzing resume..." : "Analyze my resume"}
            {!loading && <span aria-hidden="true"> →</span>}
          </button>

          <p className="resume-privacy-note">
            Your PDF is processed in backend memory and is not saved to disk
            by this endpoint.
          </p>
        </form>

        <aside className="resume-info-card">
          <span className="resume-info-icon" aria-hidden="true">✦</span>
          <h2>What you'll discover</h2>
          <ul>
            <li>
              <strong>Resume match score</strong>
              <span>An estimate based on skill and keyword coverage.</span>
            </li>
            <li>
              <strong>Matched skills</strong>
              <span>Recognized technologies present in your resume.</span>
            </li>
            <li>
              <strong>Missing keywords</strong>
              <span>Terms from the job description to review.</span>
            </li>
            <li>
              <strong>Improvement suggestions</strong>
              <span>Practical ideas for strengthening your resume.</span>
            </li>
          </ul>
          <div className="resume-info-disclaimer">
            This tool provides guidance, not an official ATS score or a
            prediction of hiring outcomes.
          </div>
        </aside>
      </section>

      {report && (
        <section className="resume-report" aria-live="polite">
          <div className="resume-report-header">
            <div>
              <p className="resume-eyebrow">YOUR ANALYSIS</p>
              <h2>Resume match report</h2>
              <p>Use these findings to prioritize your next improvements.</p>
            </div>
            <div className="resume-report-actions">
  <button
    type="button"
    className="resume-reset-button"
    onClick={() => downloadResumeReport(report)}
  >
    Download report
  </button>

  <button
    type="button"
    className="resume-reset-button"
    onClick={resetAnalysis}
  >
    Analyze another resume
  </button>
</div>
          </div>

          <div className="resume-score-grid">
            <article className="resume-score-card resume-score-primary">
              <span>Overall match</span>
              <strong>{report.matchScore}<small>/100</small></strong>
              <div
                className="resume-score-track"
                role="progressbar"
                aria-label="Overall resume match score"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={report.matchScore}
              >
                <span style={{ width: `${report.matchScore}%` }} />
              </div>
              <p>Rule-based estimate</p>
            </article>

            <article className="resume-score-card">
              <span>Skill coverage</span>
              <strong>
                {report.scoreBreakdown.skillScore === null
                  ? "N/A"
                  : `${report.scoreBreakdown.skillScore}%`}
              </strong>
              <p>
                {report.matchedSkills.length} of{" "}
                {report.totalRequiredSkills} recognized skills matched
              </p>
            </article>

            <article className="resume-score-card">
              <span>Keyword coverage</span>
              <strong>
                {report.scoreBreakdown.keywordScore === null
                  ? "N/A"
                  : `${report.scoreBreakdown.keywordScore}%`}
              </strong>
              <p>
                {report.matchedKeywords.length} of {report.totalKeywords}{" "}
                extracted keywords matched
              </p>
            </article>
          </div>

          
<div className="resume-results-grid">
  {report.sectionChecks.map((section) => (
    <article className="resume-result-card" key={section.key}>
      <h3>{section.label}</h3>
      <p>{section.detail}</p>
      <span
        className={`resume-chip ${
          section.status === "found"
            ? "resume-chip-success"
            : section.status === "not-detected"
              ? "resume-chip-warning"
              : ""
        }`}
      >
        {section.status === "found"
          ? "Found"
          : section.status === "not-detected"
            ? "Not detected"
            : "Optional"}
      </span>
    </article>
  ))}
</div>


          <div className="resume-results-grid">
            <article className="resume-result-card">
              <h3>Matched skills</h3>
              <p>Recognized skills found in the resume text.</p>
              <div className="resume-chip-list">
                {report.matchedSkills.length ? (
                  report.matchedSkills.map((skill) => (
                    <span className="resume-chip resume-chip-success" key={skill}>
                      ✓ {skill}
                    </span>
                  ))
                ) : (
                  <span className="resume-empty-result">
                    No recognized skill matches found.
                  </span>
                )}
              </div>
            </article>

            <article className="resume-result-card">
              <h3>Skills to review</h3>
              <p>Recognized skills in the job description not found in your resume.</p>
              <div className="resume-chip-list">
                {report.missingSkills.length ? (
                  report.missingSkills.map((skill) => (
                    <span className="resume-chip resume-chip-warning" key={skill}>
                      + {skill}
                    </span>
                  ))
                ) : (
                  <span className="resume-empty-result">
                    No missing recognized skills detected.
                  </span>
                )}
              </div>
            </article>

            <article className="resume-result-card">
              <h3>Matched keywords</h3>
              <div className="resume-chip-list">
                {report.matchedKeywords.length ? (
                  report.matchedKeywords.map((keyword) => (
                    <span className="resume-chip" key={keyword}>{keyword}</span>
                  ))
                ) : (
                  <span className="resume-empty-result">
                    No extracted keyword matches found.
                  </span>
                )}
              </div>
            </article>

            <article className="resume-result-card">
              <h3>Missing keywords</h3>
              <div className="resume-chip-list">
                {report.missingKeywords.length ? (
                  report.missingKeywords.map((keyword) => (
                    <span className="resume-chip resume-chip-warning" key={keyword}>
                      {keyword}
                    </span>
                  ))
                ) : (
                  <span className="resume-empty-result">
                    No missing extracted keywords detected.
                  </span>
                )}
              </div>
            </article>
          </div>

          <article className="resume-suggestions-card">
            <div>
              <p className="resume-eyebrow">NEXT STEPS</p>
              <h3>Suggestions to improve your resume</h3>
            </div>
            <ol>
              {report.suggestions.map((suggestion, index) => (
                <li key={`${index}-${suggestion}`}>{suggestion}</li>
              ))}
            </ol>
          </article>

          <p className="resume-report-disclaimer">{report.disclaimer}</p>
        </section>
      )}
    </main>
  );
}
