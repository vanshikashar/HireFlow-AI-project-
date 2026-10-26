
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  getApplications,
  type ApplicationStatus,
  type TrackedApplication,
} from "../../services/api";

type Props = {
  refreshKey: number;
};

const stages: ApplicationStatus[] = [
  "Applied",
  "Shortlisted",
  "Interview",
  "Offer",
  "Rejected",
];

const stageColors: Record<ApplicationStatus, string> = {
  Applied: "#7867f5",
  Shortlisted: "#5686e8",
  Interview: "#13a89e",
  Offer: "#20a36a",
  Rejected: "#e36b7a",
};

const statusColors: Record<string, string> = {
  Applied: "dashboard-status-applied",
  Shortlisted: "dashboard-status-shortlisted",
  Interview: "dashboard-status-interview",
  Offer: "dashboard-status-offer",
  Rejected: "dashboard-status-rejected",
};

function getJobTitle(item: TrackedApplication) {
  return typeof item.jobId === "string"
    ? "Job details unavailable"
    : item.jobId.title;
}

function getCompany(item: TrackedApplication) {
  return typeof item.jobId === "string"
    ? "Company unavailable"
    : item.jobId.company;
}

function getDate(item: TrackedApplication) {
  return item.updatedAt ?? item.appliedAt;
}

function formatDate(date: string) {
  const parsed = new Date(date);

  return Number.isNaN(parsed.getTime())
    ? "Date unavailable"
    : parsed.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

function getInsight(
  total: number,
  responseCount: number,
  interviews: number,
  offers: number,
  responseRate: number,
) {
  if (total === 0) {
    return {
      title: "Start building your career pipeline",
      description:
        "Track your first job application to unlock personalized statistics and progress insights.",
      icon: "✦",
    };
  }

  if (offers > 0) {
    return {
      title: "You have an offer in your pipeline",
      description:
        "Review the offer details and keep your application notes up to date.",
      icon: "✓",
    };
  }

  if (interviews > 0) {
    return {
      title: "You're reaching the interview stage",
      description:
        "Prioritize interview preparation and follow up on opportunities where a response is pending.",
      icon: "↗",
    };
  }

  if (responseCount === 0) {
    return {
      title: "Keep your application pipeline moving",
      description:
        "No tracked applications have a response yet. Continue applying to relevant roles and review your resume for each position.",
      icon: "◎",
    };
  }

  if (responseRate >= 30) {
    return {
      title: "You're getting responses",
      description:
        "Keep tracking each stage and use your notes to plan timely follow-ups.",
      icon: "✦",
    };
  }

  return {
    title: "Build momentum with targeted applications",
    description:
      "Review the skills and requirements in each job description and tailor your applications to the most relevant roles.",
    icon: "↗",
  };
}

export default function Dashboard({ refreshKey }: Props) {
  const [applications, setApplications] = useState<TrackedApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getApplications();
      setApplications(result.items);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load dashboard data.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard, refreshKey]);

  const metrics = useMemo(() => {
    const total = applications.length;

    const countByStatus = stages.reduce(
      (counts, status) => {
        counts[status] = applications.filter(
          (item) => item.status === status,
        ).length;
        return counts;
      },
      {} as Record<ApplicationStatus, number>,
    );

    const responseCount =
      countByStatus.Shortlisted +
      countByStatus.Interview +
      countByStatus.Offer +
      countByStatus.Rejected;

    const responseRate =
      total > 0 ? Math.round((responseCount / total) * 100) : 0;

    const interviewConversion =
      total > 0
        ? Math.round(
            ((countByStatus.Interview + countByStatus.Offer) / total) * 100,
          )
        : 0;

    const pipelineData = stages.map((status) => ({
      status,
      count: countByStatus[status],
      fill: stageColors[status],
    }));

    const distributionData = pipelineData.filter((item) => item.count > 0);

    return {
      total,
      interviews: countByStatus.Interview,
      offers: countByStatus.Offer,
      shortlisted: countByStatus.Shortlisted,
      rejected: countByStatus.Rejected,
      responseCount,
      responseRate,
      interviewConversion,
      pipelineData,
      distributionData,
    };
  }, [applications]);

  const recentApplications = useMemo(
    () =>
      [...applications]
        .sort(
          (a, b) =>
            new Date(getDate(b)).getTime() -
            new Date(getDate(a)).getTime(),
        )
        .slice(0, 5),
    [applications],
  );

  const insight = getInsight(
    metrics.total,
    metrics.responseCount,
    metrics.interviews,
    metrics.offers,
    metrics.responseRate,
  );

  return (
    <main className="dashboard-page">
      <header className="dashboard-heading">
        <div>
          <p className="dashboard-eyebrow">YOUR CAREER AT A GLANCE</p>
          <h1>Welcome to your dashboard</h1>
          <p>
            Track your progress, understand your application pipeline, and
            plan your next career move.
          </p>
        </div>

        <button
          type="button"
          className="dashboard-refresh"
          onClick={() => void loadDashboard()}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "↻ Refresh"}
        </button>
      </header>

      {error && (
        <div className="dashboard-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => void loadDashboard()}>
            Try again
          </button>
        </div>
      )}

      <section
        className="dashboard-stats"
        aria-label="Application statistics"
      >
        <article className="dashboard-stat dashboard-stat-purple">
          <span className="dashboard-stat-icon" aria-hidden="true">
            ▤
          </span>
          <p>Total applications</p>
          <strong>{loading ? "—" : metrics.total}</strong>
          <span className="dashboard-stat-caption">
            Jobs you're tracking
          </span>
        </article>

        <article className="dashboard-stat dashboard-stat-teal">
          <span className="dashboard-stat-icon" aria-hidden="true">
            ◷
          </span>
          <p>Interviews</p>
          <strong>{loading ? "—" : metrics.interviews}</strong>
          <span className="dashboard-stat-caption">
            Currently at interview stage
          </span>
        </article>

        <article className="dashboard-stat dashboard-stat-green">
          <span className="dashboard-stat-icon" aria-hidden="true">
            ✓
          </span>
          <p>Offers</p>
          <strong>{loading ? "—" : metrics.offers}</strong>
          <span className="dashboard-stat-caption">Offers received</span>
        </article>

        <article className="dashboard-stat dashboard-stat-orange">
          <span className="dashboard-stat-icon" aria-hidden="true">
            ↗
          </span>
          <p>Response rate</p>
          <strong>{loading ? "—" : `${metrics.responseRate}%`}</strong>
          <span className="dashboard-stat-caption">
            Applications with a response
          </span>
        </article>
      </section>

      <section className="dashboard-insight" aria-label="Career insight">
        <div className="dashboard-insight-icon" aria-hidden="true">
          {insight.icon}
        </div>
        <div className="dashboard-insight-copy">
          <p className="dashboard-insight-eyebrow">CAREER INSIGHT</p>
          <h2>{insight.title}</h2>
          <p>{insight.description}</p>
        </div>
      </section>

      <section className="dashboard-analytics-grid">
        <article className="dashboard-panel dashboard-chart-panel">
          <div className="dashboard-panel-heading">
            <div>
              <h2>Application pipeline</h2>
              <p>Applications across each stage</p>
            </div>
            <span className="dashboard-chart-label">By status</span>
          </div>

          {loading ? (
            <div className="dashboard-chart-state" role="status">
              Loading pipeline data...
            </div>
          ) : metrics.total === 0 ? (
            <div className="dashboard-chart-state">
              <span aria-hidden="true">▤</span>
              <h3>Your journey starts here</h3>
              <p>Track a job to see your application pipeline.</p>
            </div>
          ) : (
            <div className="dashboard-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={metrics.pipelineData}
                  margin={{ top: 12, right: 8, left: -20, bottom: 2 }}
                >
                  <CartesianGrid
                    stroke="var(--dashboard-grid)"
                    strokeDasharray="4 4"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="status"
                    tick={{
                      fill: "var(--dashboard-muted)",
                      fontSize: 11,
                    }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    tickMargin={10}
                  />
                  <YAxis
                    allowDecimals={false}
                    domain={[0, "auto"]}
                    tick={{
                      fill: "var(--dashboard-muted)",
                      fontSize: 11,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--dashboard-hover)" }}
                    contentStyle={{
                      background: "var(--dashboard-tooltip)",
                      border: "1px solid var(--dashboard-border)",
                      borderRadius: 10,
                      color: "var(--dashboard-text)",
                      fontSize: 12,
                    }}
                    formatter={(value) => [value, "Applications"]}
                  />
                  <Bar
                    dataKey="count"
                    name="Applications"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  >
                    {metrics.pipelineData.map((item) => (
                      <Cell key={item.status} fill={item.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>

        <article className="dashboard-panel dashboard-chart-panel">
          <div className="dashboard-panel-heading">
            <div>
              <h2>Status distribution</h2>
              <p>How your tracked jobs are progressing</p>
            </div>
          </div>

          {loading ? (
            <div className="dashboard-chart-state" role="status">
              Loading status data...
            </div>
          ) : metrics.total === 0 ? (
            <div className="dashboard-chart-state">
              <span aria-hidden="true">◉</span>
              <h3>No data to display</h3>
              <p>Your chart will appear after you track a job.</p>
            </div>
          ) : (
            <div className="dashboard-distribution-layout">
              <div className="dashboard-donut-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metrics.distributionData}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      innerRadius="59%"
                      outerRadius="82%"
                      paddingAngle={3}
                      stroke="none"
                    >
                      {metrics.distributionData.map((item) => (
                        <Cell
                          key={item.status}
                          fill={item.fill}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "var(--dashboard-tooltip)",
                        border: "1px solid var(--dashboard-border)",
                        borderRadius: 10,
                        color: "var(--dashboard-text)",
                        fontSize: 12,
                      }}
                      formatter={(value, name) => [
                        value,
                        name,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="dashboard-donut-center">
                  <strong>{metrics.total}</strong>
                  <span>Total jobs</span>
                </div>
              </div>

              <div className="dashboard-legend">
                {metrics.distributionData.map((item) => (
                  <div
                    className="dashboard-legend-item"
                    key={item.status}
                  >
                    <span
                      className="dashboard-legend-dot"
                      style={{ background: item.fill }}
                    />
                    <span className="dashboard-legend-name">
                      {item.status}
                    </span>
                    <strong>{item.count}</strong>
                    <span className="dashboard-legend-percent">
                      {Math.round((item.count / metrics.total) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </article>
      </section>

      <section className="dashboard-conversion-grid">
        <article className="dashboard-conversion-card">
          <span className="dashboard-conversion-label">
            Applications with a response
          </span>
          <strong>
            {loading ? "—" : `${metrics.responseRate}%`}
          </strong>
          <div className="dashboard-conversion-track">
            <span
              style={{
                width: `${metrics.responseRate}%`,
              }}
            />
          </div>
          <p>
            {metrics.responseCount} of {metrics.total} applications
          </p>
        </article>

        <article className="dashboard-conversion-card">
          <span className="dashboard-conversion-label">
            Reached interview or offer
          </span>
          <strong>
            {loading ? "—" : `${metrics.interviewConversion}%`}
          </strong>
          <div className="dashboard-conversion-track">
            <span
              style={{
                width: `${metrics.interviewConversion}%`,
              }}
            />
          </div>
          <p>
            {metrics.interviews + metrics.offers} of {metrics.total} applications
          </p>
        </article>
      </section>

      <section className="dashboard-panel dashboard-recent-panel">
        <div className="dashboard-panel-heading">
          <div>
            <h2>Recent applications</h2>
            <p>Your latest updated opportunities</p>
          </div>
          <span className="dashboard-chart-label">
            {loading ? "Loading..." : `${metrics.total} total`}
          </span>
        </div>

        {loading ? (
          <div className="dashboard-chart-state" role="status">
            Loading applications...
          </div>
        ) : recentApplications.length === 0 ? (
          <div className="dashboard-chart-state">
            <span aria-hidden="true">✦</span>
            <h3>No applications yet</h3>
            <p>
              Track a job from Find jobs or Recommended jobs to see it here.
            </p>
          </div>
        ) : (
          <div className="dashboard-recent-list">
            {recentApplications.map((item) => (
              <article
                className="dashboard-recent-item"
                key={item._id}
              >
                <div className="dashboard-company-avatar">
                  {getCompany(item).charAt(0).toUpperCase()}
                </div>

                <div className="dashboard-recent-info">
                  <h3>{getJobTitle(item)}</h3>
                  <p>{getCompany(item)}</p>
                  <time dateTime={getDate(item)}>
                    Updated {formatDate(getDate(item))}
                  </time>
                </div>

                <span
                  className={`dashboard-status ${
                    statusColors[item.status] ?? ""
                  }`}
                >
                  {item.status}
                </span>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
