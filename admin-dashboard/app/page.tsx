const navItems = [
  { label: 'Dashboard Overview', icon: 'grid', active: true },
  { label: 'Users Management', icon: 'users' },
  { label: 'Reports / Moderation', icon: 'alert' },
  { label: 'Listings / Properties', icon: 'home' },
  { label: 'Payments / Premium Plans', icon: 'wallet' },
  { label: 'Analytics', icon: 'chart' },
  { label: 'Settings', icon: 'settings' },
];

const stats = [
  { label: 'Total Users', value: '5,342', meta: '+12.5% from last month', accent: 'mint', icon: 'users' },
  { label: 'Active Users', value: '3,821', meta: '+8.2% this week', accent: 'peach', icon: 'active' },
  { label: 'New Signups', value: '247', meta: '+18% today', accent: 'mint', icon: 'signup' },
  { label: 'Revenue', value: '$53,240', meta: '+24.8% this month', accent: 'peach', icon: 'revenue' },
];

const summaryItems = [
  { label: 'Monthly user retention', value: '91.6%', badge: 'good' },
  { label: 'Premium conversion', value: '18.4%', badge: 'warn' },
  { label: 'Disputed reports', value: '14 open cases', badge: 'warn' },
];

const activities = [
  { initials: 'AR', title: 'Amina Rahman', subtitle: 'Reported a duplicate property listing', time: '4 min ago' },
  { initials: 'JB', title: 'Jonas Becker', subtitle: 'Premium plan upgraded successfully', time: '18 min ago' },
  { initials: 'LK', title: 'Leila Karim', subtitle: 'New profile completed and verified', time: '1 hour ago' },
];

const moderationRows = [
  { item: 'Property #3812', owner: 'Olivia Martin', type: 'Spam report', status: 'pending' },
  { item: 'User #9187', owner: 'Hassan Ali', type: 'Identity check', status: 'approved' },
  { item: 'Property #4041', owner: 'Sofia Nguyen', type: 'Image issue', status: 'flagged' },
];

function Icon({ name }: { name: string }) {
  const common = { stroke: 'currentColor', strokeWidth: 1.8, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  switch (name) {
    case 'grid':
      return (
        <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
          <rect {...common} x="3" y="3" width="7" height="7" rx="1.8" />
          <rect {...common} x="14" y="3" width="7" height="7" rx="1.8" />
          <rect {...common} x="3" y="14" width="7" height="7" rx="1.8" />
          <rect {...common} x="14" y="14" width="7" height="7" rx="1.8" />
        </svg>
      );
    case 'users':
      return (
        <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path {...common} d="M17 20v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle {...common} cx="10.5" cy="7.5" r="3.5" />
          <path {...common} d="M20 20v-1.5a3.5 3.5 0 0 0-2.8-3.4" />
          <path {...common} d="M15.5 4.5a3.5 3.5 0 0 1 0 6.8" />
        </svg>
      );
    case 'alert':
      return (
        <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path {...common} d="M10.2 4.3 2.8 18a1.8 1.8 0 0 0 1.6 2.7h15.2a1.8 1.8 0 0 0 1.6-2.7L14 4.3a1.8 1.8 0 0 0-3.8 0Z" />
          <path {...common} d="M12 9v4" />
          <circle {...common} cx="12" cy="16.5" r="1" />
        </svg>
      );
    case 'home':
      return (
        <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path {...common} d="M4 11.5 12 4l8 7.5" />
          <path {...common} d="M6.5 10.8V20h11V10.8" />
          <path {...common} d="M10 20v-5h4v5" />
        </svg>
      );
    case 'wallet':
      return (
        <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path {...common} d="M4 7.5h16a1 1 0 0 1 1 1V17a3 3 0 0 1-3 3H6a2 2 0 0 1-2-2V7.5Z" />
          <path {...common} d="M18 11h3" />
          <circle {...common} cx="17" cy="13" r="1.2" />
        </svg>
      );
    case 'chart':
      return (
        <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path {...common} d="M4 19V5" />
          <path {...common} d="M4 19h16" />
          <path {...common} d="M8 16v-4" />
          <path {...common} d="M12 16V8" />
          <path {...common} d="M16 16v-6" />
        </svg>
      );
    case 'settings':
      return (
        <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path {...common} d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
          <path {...common} d="m19.4 15-.2-2.1 1.8-1.5-1.7-2.9-2.3.4-1.6-1.3.2-2.3H9.4l.2 2.3-1.6 1.3-2.3-.4-1.7 2.9 1.8 1.5-.2 2.1 1.9 1.1.7 2.1h3.3l.7-2.1 1.9-1.1Z" />
        </svg>
      );
    case 'bell':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
          <path {...common} d="M15 17H9a4 4 0 0 1-4-4v-2.4A7 7 0 0 1 12 3a7 7 0 0 1 7 7v3a4 4 0 0 1-4 4Z" />
          <path {...common} d="M10 19a2 2 0 0 0 4 0" />
        </svg>
      );
    case 'search':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
          <circle {...common} cx="11" cy="11" r="6.5" />
          <path {...common} d="m16.2 16.2 4 4" />
        </svg>
      );
    case 'gear':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
          <path {...common} d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
          <path {...common} d="m19.4 15-.2-2.1 1.8-1.5-1.7-2.9-2.3.4-1.6-1.3.2-2.3H9.4l.2 2.3-1.6 1.3-2.3-.4-1.7 2.9 1.8 1.5-.2 2.1 1.9 1.1.7 2.1h3.3l.7-2.1 1.9-1.1Z" />
        </svg>
      );
    case 'user':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
          <circle {...common} cx="12" cy="8" r="3.5" />
          <path {...common} d="M5 20v-1.2a7 7 0 0 1 14 0V20" />
        </svg>
      );
    case 'user-add':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
          <circle {...common} cx="10" cy="8" r="3.5" />
          <path {...common} d="M4.5 20v-1.2a6.5 6.5 0 0 1 11-4.8" />
          <path {...common} d="M17 7v6" />
          <path {...common} d="M14 10h6" />
        </svg>
      );
    case 'growth':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
          <path {...common} d="M4 18h16" />
          <path {...common} d="M5 15.5 9.5 11l4 3.5 5.5-7" />
          <path {...common} d="m16 7h3v3" />
        </svg>
      );
    case 'cash':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
          <path {...common} d="M4 7h16v10H4z" />
          <path {...common} d="M7 10a2.5 2.5 0 1 0 0 5h10a2.5 2.5 0 1 0 0-5Z" />
          <path {...common} d="M12 9v6" />
        </svg>
      );
    case 'logout':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
          <path {...common} d="M10 17 15 12l-5-5" />
          <path {...common} d="M15 12H4" />
          <path {...common} d="M20 4v16" />
        </svg>
      );
    default:
      return null;
  }
}

function LineChart({ variant }: { variant: 'users' | 'revenue' }) {
  const userPoints = 'M0 196 40 184 80 172 120 162 160 146 200 126 240 108 280 84 320 58';
  const revenuePoints = 'M0 198 40 182 80 168 120 148 160 118 200 98 240 74 280 44 320 18';
  const points = variant === 'users' ? userPoints : revenuePoints;
  const dots = variant === 'users'
    ? [
        { cx: 0, cy: 196 },
        { cx: 40, cy: 184 },
        { cx: 80, cy: 172 },
        { cx: 120, cy: 162 },
        { cx: 160, cy: 146 },
        { cx: 200, cy: 126 },
        { cx: 240, cy: 108 },
        { cx: 280, cy: 84 },
        { cx: 320, cy: 58 },
      ]
    : [
        { cx: 0, cy: 198 },
        { cx: 40, cy: 182 },
        { cx: 80, cy: 168 },
        { cx: 120, cy: 148 },
        { cx: 160, cy: 118 },
        { cx: 200, cy: 98 },
        { cx: 240, cy: 74 },
        { cx: 280, cy: 44 },
        { cx: 320, cy: 18 },
      ];

  return (
    <svg viewBox="0 0 360 240" role="img" aria-label={variant === 'users' ? 'User growth chart' : 'Revenue analytics chart'}>
      <defs>
        <linearGradient id={`${variant}-fill`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#a7dbca" stopOpacity="0.52" />
          <stop offset="100%" stopColor="#a7dbca" stopOpacity="0.08" />
        </linearGradient>
      </defs>
      <g opacity="0.9" stroke="#e6e9ea" strokeWidth="1">
        <path d="M50 40H330" />
        <path d="M50 88H330" />
        <path d="M50 136H330" />
        <path d="M50 184H330" />
        <path d="M90 24V200" />
        <path d="M150 24V200" />
        <path d="M210 24V200" />
        <path d="M270 24V200" />
      </g>
      <g fill="#a0a7b4" fontSize="12" fontFamily="inherit">
        {variant === 'users' ? (
          <>
            <text x="14" y="188">1500</text>
            <text x="14" y="140">3000</text>
            <text x="14" y="92">4500</text>
            <text x="14" y="44">6000</text>
          </>
        ) : (
          <>
            <text x="8" y="188">15000</text>
            <text x="8" y="140">30000</text>
            <text x="8" y="92">45000</text>
            <text x="8" y="44">60000</text>
          </>
        )}
      </g>
      <path d={`${points} L 320 220 L 0 220 Z`} fill={`url(#${variant}-fill)`} />
      <path d={points} fill="none" stroke="#9cd7c3" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      {dots.map((dot, index) => (
        <circle key={`${variant}-${index}`} cx={dot.cx} cy={dot.cy} r="4.5" fill="#ffffff" stroke="#a7dbca" strokeWidth="3" />
      ))}
    </svg>
  );
}

export default function DashboardPage() {
  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand">
          <h1 className="brand-title">Roominder</h1>
          <p className="brand-subtitle">Admin Dashboard</p>
        </div>

        <nav className="nav" aria-label="Navigation principale">
          {navItems.map((item) => (
            <a key={item.label} className={`nav-item${item.active ? ' active' : ''}`} href="#">
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        <div className="sidebar-spacer" />

        <a className="logout" href="#">
          <Icon name="logout" />
          <span>Logout</span>
        </a>
      </aside>

      <main className="main">
        <header className="topbar">
          <label className="searchbar" aria-label="Search users, reports, listings">
            <Icon name="search" />
            <input type="search" placeholder="Search users, reports, listings..." />
          </label>

          <div className="topbar-actions">
            <button className="icon-button" type="button" aria-label="Notifications">
              <Icon name="bell" />
              <span className="notification-dot" />
            </button>
            <button className="icon-button" type="button" aria-label="Settings">
              <Icon name="gear" />
            </button>
            <div className="profile-pill">
              <div className="profile-avatar">
                <Icon name="user" />
              </div>
              <div>
                <p className="profile-name">Admin User</p>
                <p className="profile-mail">admin@roominder.com</p>
              </div>
            </div>
          </div>
        </header>

        <section className="page-head">
          <h2 className="page-title">Dashboard Overview</h2>
          <p className="page-subtitle">Welcome back! Here&apos;s what&apos;s happening with Roominder today.</p>
        </section>

        <section className="stats-grid" aria-label="Key metrics">
          {stats.map((stat) => (
            <article key={stat.label} className="stat-card">
              <div>
                <p className="stat-label">{stat.label}</p>
                <p className="stat-value">{stat.value}</p>
                <p className="stat-meta">{stat.meta}</p>
              </div>
              <div className={`stat-badge ${stat.accent}`} aria-hidden="true">
                <Icon name={stat.icon} />
              </div>
            </article>
          ))}
        </section>

        <section className="content-grid">
          <article className="panel">
            <div className="panel-head">
              <div>
                <h3 className="panel-title">User Growth</h3>
                <p className="panel-subtitle">Total users over time</p>
              </div>
              <div className="panel-icon" aria-hidden="true">
                <Icon name="growth" />
              </div>
            </div>
            <div className="chart-frame">
              <LineChart variant="users" />
            </div>
          </article>

          <div className="summary-stack">
            <article className="summary-card">
              <div className="panel-head">
                <div>
                  <h3 className="panel-title">Revenue Analytics</h3>
                  <p className="panel-subtitle">Total vs Premium revenue</p>
                </div>
                <div className="panel-icon" aria-hidden="true">
                  <Icon name="cash" />
                </div>
              </div>
              <div className="chart-frame">
                <LineChart variant="revenue" />
              </div>
            </article>

            <article className="summary-card">
              <div className="panel-head">
                <div>
                  <h3 className="panel-title">Live Summary</h3>
                  <p className="panel-subtitle">Operational pulse</p>
                </div>
              </div>
              <ul className="summary-list">
                {summaryItems.map((item) => (
                  <li key={item.label} className="summary-item">
                    <div>
                      <div className="summary-kicker">{item.label}</div>
                      <div className="summary-value">{item.value}</div>
                    </div>
                    <span className={`badge ${item.badge}`}>{item.badge === 'good' ? 'Healthy' : 'Review'}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </section>

        <section className="lower-grid">
          <article className="panel">
            <div className="panel-head">
              <div>
                <h3 className="panel-title">Recent Activity</h3>
                <p className="panel-subtitle">Latest platform events</p>
              </div>
            </div>
            <ul className="activity-list">
              {activities.map((activity) => (
                <li key={activity.title} className="activity-item">
                  <div className="avatar-mini">{activity.initials}</div>
                  <div>
                    <p className="activity-title">{activity.title}</p>
                    <p className="activity-subtitle">{activity.subtitle}</p>
                  </div>
                  <span className="activity-time">{activity.time}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="panel">
            <div className="panel-head">
              <div>
                <h3 className="panel-title">Moderation Queue</h3>
                <p className="panel-subtitle">Cases requiring admin review</p>
              </div>
            </div>

            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Owner</th>
                    <th>Type</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {moderationRows.map((row) => (
                    <tr key={row.item}>
                      <td>{row.item}</td>
                      <td>{row.owner}</td>
                      <td>{row.type}</td>
                      <td>
                        <span className={`row-tag ${row.status}`}>{row.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}
