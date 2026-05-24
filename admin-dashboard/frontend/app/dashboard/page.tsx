"use client";
import { useEffect, useState } from "react";
import {
  approveModerationCase,
  getStats,
  getModerationQueue,
  getActivities,
} from "../src/api/admin";
import { useRouter } from "next/navigation";

type Stat = {
  label: string;
  value: string | number;
  meta: string;
  accent: string;
  icon: string;
};

type Activity = {
  initials: string;
  title: string;
  subtitle: string;
  time: string;
};

type ModerationRow = {
  item: string;
  owner: string;
  type: string;
  status: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stat[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [moderationRows, setModerationRows] = useState<ModerationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const statBoxColors = ["#b7e0d1", "#ffc89f"];
  const sidebarItems = [
    { label: "Profile", icon: "profile" },
    { label: "Dashboard Overview", icon: "dashboard", active: true },
    { label: "Settings", icon: "settings" },
    { label: "Payments", icon: "payments" },
  ];

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const [statsData, activitiesData, moderationData] = await Promise.all([
          getStats(),
          getActivities(),
          getModerationQueue(),
        ]);

        setStats(statsData);
        setActivities(activitiesData);
        setModerationRows(moderationData);
      } catch (err) {
        console.error("Dashboard API error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  async function approveCase(id: string) {
    await approveModerationCase(id);

    const updated = await getModerationQueue();
    setModerationRows(updated);
  }

  function Icon({ name }: { name: string }) {
    const common = {
      stroke: "currentColor",
      strokeWidth: 1.8,
      fill: "none",
      strokeLinecap: "round" as const,
      strokeLinejoin: "round" as const,
    };

    switch (name) {
      case "users":
        return (
          <svg viewBox="0 0 24 24">
            <circle {...common} cx="12" cy="8" r="3.5" />
            <path {...common} d="M5 20v-1.2a7 7 0 0 1 14 0V20" />
          </svg>
        );

      case "alert":
        return (
          <svg viewBox="0 0 24 24">
            <path {...common} d="M12 4 2 20h20L12 4Z" />
            <path {...common} d="M12 9v4" />
            <circle {...common} cx="12" cy="16" r="1" />
          </svg>
        );

      case "profile":
        return (
          <svg viewBox="0 0 24 24">
            <circle {...common} cx="12" cy="8" r="4" />
            <path {...common} d="M4.5 20a7.5 7.5 0 0 1 15 0" />
          </svg>
        );

      case "dashboard":
        return (
          <svg viewBox="0 0 24 24">
            <rect {...common} x="4" y="4" width="6" height="7" rx="1.5" />
            <rect {...common} x="14" y="4" width="6" height="4" rx="1.5" />
            <rect {...common} x="4" y="15" width="6" height="5" rx="1.5" />
            <rect {...common} x="14" y="12" width="6" height="8" rx="1.5" />
          </svg>
        );

      case "settings":
        return (
          <svg viewBox="0 0 24 24">
            <circle {...common} cx="12" cy="12" r="3" />
            <path {...common} d="M12 3v2" />
            <path {...common} d="M12 19v2" />
            <path {...common} d="M4.2 7.5 6 8.5" />
            <path {...common} d="M18 15.5l1.8 1" />
            <path {...common} d="M4.2 16.5 6 15.5" />
            <path {...common} d="M18 8.5l1.8-1" />
          </svg>
        );

      case "payments":
        return (
          <svg viewBox="0 0 24 24">
            <rect {...common} x="3.5" y="6" width="17" height="12" rx="2" />
            <path {...common} d="M3.5 10h17" />
            <path {...common} d="M7 15h4" />
          </svg>
        );

      case "logout":
        return (
          <svg viewBox="0 0 24 24">
            <path {...common} d="M10 6H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h4" />
            <path {...common} d="M14 16l4-4-4-4" />
            <path {...common} d="M18 12H9" />
          </svg>
        );

      default:
        return null;
    }
  }

  if (loading) {
    return <div style={{ padding: 20 }}>Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-shell">

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="admin-brand">
          <h2>Roominder Admin</h2>
        </div>

        <nav className="nav" aria-label="Admin navigation">
          {sidebarItems.map((item) => (
            <button
              key={item.label}
              type="button"
              className={`nav-item${item.active ? " active" : ""}`}
            >
              <span className="nav-icon">
                <Icon name={item.icon} />
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <button type="button" className="nav-item logout" onClick={() => router.push("/")}>
          <span className="nav-icon">
            <Icon name="logout" />
          </span>
          <span>Logout</span>
        </button>
      </aside>

      {/* MAIN */}
      <main className="main">
        <div className="dashboard-account-bar">
          <div className="admin-account admin-account-compact">
            <div className="admin-account-avatar">RA</div>
            <div className="admin-account-details">
              <p className="admin-account-name">Roominder Admin</p>
              <p className="admin-account-email">admin@roominder.com</p>
            </div>
          </div>
        </div>

        {/* STATS */}
        <section className="stats-grid">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="stat-card"
              style={{ backgroundColor: statBoxColors[i % statBoxColors.length] }}
            >
              <h3>{stat.label}</h3>
              <p>{stat.value}</p>
              <small>{stat.meta}</small>
            </div>
          ))}
        </section>

        {/* ACTIVITIES */}
        <section className="recent-activity-box">
          <div className="recent-activity-head">
            <h2>Recent Activity</h2>
          </div>

          <div className="recent-activity-row">
            {activities.slice(0, 3).map((a, i) => (
              <article key={i} className="recent-activity-card">
                <div className="recent-activity-avatar">{a.initials || "NU"}</div>
                <div>
                  <strong>{a.title}</strong>
                  <p>{a.subtitle}</p>
                  <span>{a.time}</span>
                </div>
              </article>
            ))}

            {activities.length === 0 && (
              <div className="recent-activity-empty">No recent activity</div>
            )}
          </div>
        </section>

        {/* MODERATION QUEUE */}
        <section>
          <h2>Moderation Queue</h2>

          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Owner</th>
                <th>Type</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {moderationRows.map((row, i) => (
                <tr key={i}>
                  <td>{row.item}</td>
                  <td>{row.owner}</td>
                  <td>{row.type}</td>
                  <td>{row.status}</td>
                  <td>
                    {row.status === "pending" && (
                      <button onClick={() => approveCase(row.item)}>
                        Approve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

        </section>

      </main>
    </div>
  );
}
