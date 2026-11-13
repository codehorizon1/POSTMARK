
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Send,
  Users,
  FileText,
  Activity,
  Settings,
  Search,
  Bell,
  Plus,
  Mail,
  CheckCircle2,
  Clock3,
  AlertCircle,
  LogOut,
  UserRound,
  X,
  Menu,
  ArrowUpRight,
  Sparkles,
  RefreshCw,
} from "lucide-react";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { Toaster, toast } from "sonner";

import CampaignComposer from "./components/CampaignComposer";
import AudienceManager from "./components/AudienceManager";
import CampaignTable from "./components/CampaignTable";

import "./App.css";

const navigation = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "campaigns", label: "Campaigns", icon: Send },
  { id: "audience", label: "Audience", icon: Users },
  { id: "templates", label: "Templates", icon: FileText },
  { id: "activity", label: "Activity", icon: Activity },
];

const chartData = [
  { day: "Mon", sent: 2400, delivered: 2300 },
  { day: "Tue", sent: 3200, delivered: 3100 },
  { day: "Wed", sent: 2800, delivered: 2700 },
  { day: "Thu", sent: 4100, delivered: 4000 },
  { day: "Fri", sent: 3600, delivered: 3500 },
  { day: "Sat", sent: 4700, delivered: 4600 },
  { day: "Sun", sent: 3900, delivered: 3800 },
];

const initialUser = {
  name: "Admin User",
  email: "admin@postmark.app",
  role: "Workspace administrator",
};

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("admin@postmark.app");
  const [password, setPassword] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.error("Enter your email and password.");
      return;
    }

    onLogin(email);
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-brand">
          <span className="brand-mark">
            <Mail size={25} />
          </span>
          <span>POSTMARK<span className="brand-dot">.</span></span>
        </div>

        <span className="eyebrow">YOUR EMAIL WORKSPACE</span>
        <h1>Welcome back.</h1>
        <p>Sign in to continue managing your campaigns.</p>

        <form onSubmit={handleSubmit}>
          <label>Email address</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
          />

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            required
          />

          <button type="submit" className="primary-button login-submit">
            Sign in <ArrowUpRight size={17} />
          </button>
        </form>

        <small className="login-note">
          Demo sign-in only. Connect backend authentication before production use.
        </small>
      </div>
    </div>
  );
}

function Sidebar({ activePage, setActivePage, user, onLogout, mobileOpen, setMobileOpen }) {
  return (
    <>
      {mobileOpen && (
        <button
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
        />
      )}

      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <span className="brand-mark">
            <Mail size={24} />
          </span>
          <span>POSTMARK<span className="brand-dot">.</span></span>
          <button
            className="sidebar-close"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X size={19} />
          </button>
        </div>

        <div className="workspace-label">
          <span className="online-dot" />
          <span>PERSONAL WORKSPACE</span>
          <strong>FREE</strong>
        </div>

        <div className="sidebar-section-label">WORKSPACE</div>

        <nav className="sidebar-nav">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                className={`nav-item ${activePage === item.id ? "active" : ""}`}
                onClick={() => {
                  setActivePage(item.id);
                  setMobileOpen(false);
                }}
              >
                <Icon size={20} />
                <span>{item.label}</span>
                {activePage === item.id && <span className="nav-arrow">›</span>}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-note">
          <span>A NOTE FROM POSTMARK</span>
          <p>Good communication starts with understanding your audience.</p>
          <Sparkles size={19} />
        </div>

        <button
          className={`nav-item settings-nav ${activePage === "profile" ? "active" : ""}`}
          onClick={() => {
            setActivePage("profile");
            setMobileOpen(false);
          }}
        >
          <Settings size={20} />
          <span>Profile & Settings</span>
        </button>

        <div className="sidebar-user">
          <div className="avatar">{user.name.slice(0, 2).toUpperCase()}</div>
          <div className="sidebar-user-info">
            <strong>{user.name}</strong>
            <small>{user.email}</small>
          </div>
          <button
            className="logout-icon"
            onClick={onLogout}
            title="Log out"
            aria-label="Log out"
          >
            <LogOut size={17} />
          </button>
        </div>
      </aside>
    </>
  );
}

function Topbar({ activePage, user, onProfile, onMenu }) {
  const currentPage =
    activePage === "profile"
      ? "PROFILE"
      : activePage.toUpperCase();

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="mobile-menu-button" onClick={onMenu}>
          <Menu size={22} />
        </button>
        <span>WORKSPACE</span>
        <span className="breadcrumb-slash">/</span>
        <strong>{currentPage}</strong>
      </div>

      <div className="topbar-actions">
        <button aria-label="Search" onClick={() => toast.info("Use the search field on the relevant page.")}>
          <Search size={21} />
        </button>
        <button aria-label="Notifications" onClick={() => toast.info("You are all caught up.")}>
          <Bell size={21} />
        </button>
        <button className="topbar-avatar" onClick={onProfile}>
          {user.name.slice(0, 2).toUpperCase()}
        </button>
      </div>
    </header>
  );
}

function OverviewPage({ onCreateCampaign, user }) {
  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <span className="eyebrow">POSTMARK WORKSPACE / OVERVIEW</span>
          <h1>Communication, without the noise.</h1>
          <p>A clearer view of your campaigns and delivery performance.</p>
        </div>

        <button className="primary-button" onClick={onCreateCampaign}>
          <Plus size={19} />
          Create campaign
        </button>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-top">
            <span>EMAILS SENT</span>
            <Mail size={20} />
          </div>
          <strong>24,580</strong>
          <small>Total emails processed</small>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span>DELIVERED</span>
            <Send size={20} />
          </div>
          <strong>23,940</strong>
          <small>97.4% delivery rate</small>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span>SCHEDULED</span>
            <Clock3 size={20} />
          </div>
          <strong>420</strong>
          <small>Awaiting dispatch</small>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span>FAILED</span>
            <AlertCircle size={20} />
          </div>
          <strong>220</strong>
          <small>Require attention</small>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="panel performance-panel">
          <span className="eyebrow">PERFORMANCE / 001</span>
          <h2>Delivery activity</h2>
          <p>Campaign performance over the last seven days.</p>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="sentGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E87956" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#E87956" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="deliveredGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#399B79" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#399B79" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid stroke="#E8E5DD" vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="sent"
                  stroke="#E87956"
                  fill="url(#sentGradient)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="delivered"
                  stroke="#399B79"
                  fill="url(#deliveredGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-legend">
            <span><i className="legend-coral" /> Emails sent</span>
            <span><i className="legend-green" /> Delivered</span>
          </div>
        </section>

        <section className="panel delivery-panel">
          <span className="eyebrow">DELIVERY / 002</span>
          <h2>Delivery health</h2>

          <div className="delivery-ring">
            <div className="delivery-ring-inner">
              <strong>97.4%</strong>
              <span>DELIVERED</span>
            </div>
          </div>

          <div className="delivery-detail">
            <span><CheckCircle2 size={16} /> Delivered</span>
            <strong>23,940</strong>
          </div>
          <div className="delivery-detail">
            <span><AlertCircle size={16} /> Failed</span>
            <strong>220</strong>
          </div>
          <small className="demo-disclaimer">
            Illustrative dashboard figures. Campaign history shows actual API records.
          </small>
        </section>
      </div>

      <div className="dashboard-bottom">
        <div>
          <span className="eyebrow">YOUR WORKSPACE</span>
          <h2>Ready to reach your audience, {user.name.split(" ")[0]}?</h2>
          <p>Create a campaign and send a thoughtful message.</p>
        </div>
        <button className="outline-button" onClick={onCreateCampaign}>
          Start a campaign <ArrowUpRight size={17} />
        </button>
      </div>
    </div>
  );
}

function ProfilePage({ user, onLogout }) {
  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <span className="eyebrow">WORKSPACE / ACCOUNT</span>
          <h1>Your profile.</h1>
          <p>Manage your POSTMARK account information.</p>
        </div>
      </div>

      <div className="profile-card">
        <div className="profile-avatar">
          {user.name.slice(0, 2).toUpperCase()}
        </div>

        <div className="profile-details">
          <span className="eyebrow">ACCOUNT DETAILS</span>
          <h2>{user.name}</h2>
          <p>{user.email}</p>
          <strong>{user.role}</strong>
        </div>

        <button className="outline-button" onClick={onLogout}>
          <LogOut size={17} /> Log out
        </button>
      </div>

      <div className="profile-security-note">
        <AlertCircle size={19} />
        <div>
          <strong>Account security</strong>
          <p>
            This interface currently uses demo sign-in. Real user authentication
            and protected backend routes must be configured before production use.
          </p>
        </div>
      </div>
    </div>
  );
}

function PlaceholderPage({ page }) {
  const content = {
    templates: {
      title: "Your templates.",
      description: "Reusable email templates will be available here.",
      icon: FileText,
    },
    activity: {
      title: "Workspace activity.",
      description: "Your recent workspace events will appear here.",
      icon: Activity,
    },
  };

  const item = content[page] || content.templates;
  const Icon = item.icon;

  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <span className="eyebrow">POSTMARK WORKSPACE</span>
          <h1>{item.title}</h1>
          <p>{item.description}</p>
        </div>
      </div>

      <div className="placeholder-panel">
        <Icon size={38} />
        <h2>This workspace is being prepared.</h2>
        <p>{item.description}</p>
      </div>
    </div>
  );
}

export default function App() {
  const [activePage, setActivePage] = useState("overview");
  const [showComposer, setShowComposer] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [drafts, setDrafts] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const savedSession = localStorage.getItem("postmark-session");
      if (savedSession) {
        setUser(JSON.parse(savedSession));
      }

      const savedDrafts = JSON.parse(
        localStorage.getItem("postmark-drafts") || "[]"
      );
      setDrafts(Array.isArray(savedDrafts) ? savedDrafts : []);
    } catch {
      localStorage.removeItem("postmark-session");
      localStorage.removeItem("postmark-drafts");
    }
  }, []);

  const handleLogin = (email) => {
    const loggedInUser = {
      ...initialUser,
      email,
      name: email === initialUser.email ? initialUser.name : "Workspace User",
    };

    localStorage.setItem("postmark-session", JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    toast.success("Welcome to POSTMARK.");
  };

  const handleLogout = () => {
    localStorage.removeItem("postmark-session");
    setUser(null);
    setShowComposer(false);
    setActivePage("overview");
    toast.success("You have logged out.");
  };

  const saveDraft = (draft) => {
    const updatedDrafts = [
      { ...draft, savedAt: new Date().toISOString() },
      ...drafts,
    ];

    setDrafts(updatedDrafts);
    localStorage.setItem("postmark-drafts", JSON.stringify(updatedDrafts));
    toast.success("Campaign draft saved.");
  };

  const openComposer = () => setShowComposer(true);
  const closeComposer = () => setShowComposer(false);

  if (!user) {
    return (
      <>
        <Toaster position="top-right" richColors />
        <LoginScreen onLogin={handleLogin} />
      </>
    );
  }

  return (
    <div className="app-shell">
      <Toaster position="top-right" richColors />

      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        user={user}
        onLogout={handleLogout}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <main className="main-content">
        <Topbar
          activePage={activePage}
          user={user}
          onProfile={() => setActivePage("profile")}
          onMenu={() => setMobileOpen(true)}
        />

        {activePage === "overview" && (
          <OverviewPage onCreateCampaign={openComposer} user={user} />
        )}

        {activePage === "campaigns" && (
          <div className="campaigns-page">
            <div className="campaigns-page-action">
              <button className="primary-button" onClick={openComposer}>
                <Plus size={18} /> Create campaign
              </button>
            </div>
            <CampaignTable />
            {drafts.length > 0 && (
              <section className="saved-drafts">
                <span className="eyebrow">LOCAL DRAFTS</span>
                <h2>Saved drafts ({drafts.length})</h2>
                {drafts.map((draft, index) => (
                  <div className="saved-draft-row" key={draft.savedAt || index}>
                    <div>
                      <strong>{draft.name || "Untitled campaign"}</strong>
                      <small>{draft.subject || "No subject"}</small>
                    </div>
                    <span>Draft</span>
                  </div>
                ))}
              </section>
            )}
          </div>
        )}

        {activePage === "audience" && <AudienceManager />}

        {activePage === "profile" && (
          <ProfilePage user={user} onLogout={handleLogout} />
        )}

        {(activePage === "templates" || activePage === "activity") && (
          <PlaceholderPage page={activePage} />
        )}
      </main>

      {showComposer && (
        <CampaignComposer
          onClose={closeComposer}
          onSaveDraft={saveDraft}
        />
      )}
    </div>
  );
}
