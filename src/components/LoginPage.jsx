
import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from "lucide-react";
import "./LoginPage.css";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("admin@postmark.app");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    setLoading(true);

    const user = {
      name: "Admin User",
      email: email.trim().toLowerCase(),
    };

    localStorage.setItem("postmark-user", JSON.stringify(user));

    setTimeout(() => {
      onLogin(user);
      setLoading(false);
    }, 350);
  };

  return (
    <main className="login-screen">
      <div className="login-top-brand">
        <div className="login-brand-icon"><Mail size={22} /></div>
        <span>POSTMARK<span className="login-brand-dot">.</span></span>
      </div>

      <section className="login-layout">
        <div className="login-intro">
          <span className="login-eyebrow">YOUR COMMUNICATION WORKSPACE</span>
          <h1>Make every<br />message <em>matter.</em></h1>
          <p>
            A clearer, more thoughtful way to manage your audience,
            create campaigns and understand delivery.
          </p>

          <div className="login-trust">
            <ShieldCheck size={17} />
            <span>Your workspace, all in one place.</span>
          </div>
          <div className="login-decoration" aria-hidden="true">
            <div className="login-envelope"><Mail size={68} strokeWidth={1} /></div>
            <span className="login-decoration-line" />
            <span className="login-decoration-dot" />
          </div>
        </div>

        <div className="login-card">
          <span className="login-eyebrow">WELCOME BACK</span>
          <h2>Sign in to POSTMARK</h2>
          <p className="login-card-description">
            Enter your details to access your workspace.
          </p>

          <form onSubmit={handleSubmit}>
            <label htmlFor="login-email">Email address</label>
            <div className="login-input-wrap">
              <Mail size={18} />
              <input
                id="login-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="username"
              />
            </div>

            <label htmlFor="login-password">Password</label>
            <div className="login-input-wrap">
              <Lock size={18} />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="login-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && <div className="login-error">{error}</div>}

            <button className="login-submit" type="submit" disabled={loading}>
              {loading ? "Opening workspace..." : "Sign in"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="login-demo-note">
            <ShieldCheck size={15} />
            <span>Project demonstration login. Use any valid email and a password of 6 or more characters.</span>
          </div>
        </div>
      </section>

      <footer className="login-footer">
        <span>© 2026 POSTMARK</span>
        <span>COMMUNICATION, WITHOUT THE NOISE.</span>
      </footer>
    </main>
  );
}
