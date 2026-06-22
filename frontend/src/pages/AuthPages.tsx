import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api/client';
import { useAuthStore } from '../stores/auth.store';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .auth-root {
    min-height: 100vh; display: flex; align-items: center;
    justify-content: center; background: #0f0f10;
    font-family: 'Inter', sans-serif; padding: 24px;
  }
  .auth-card {
    width: 100%; max-width: 400px; background: #18181b;
    border: 1px solid #27272a; border-radius: 16px; padding: 40px;
  }
  .auth-logo {
    width: 44px; height: 44px; background: #6366f1;
    border-radius: 12px; margin-bottom: 24px;
    display: flex; align-items: center; justify-content: center; font-size: 22px;
  }
  .auth-title { font-size: 22px; font-weight: 600; color: #fafafa; margin-bottom: 6px; }
  .auth-subtitle { font-size: 14px; color: #71717a; margin-bottom: 28px; }
  .auth-field { margin-bottom: 16px; }
  .auth-label { display: block; font-size: 13px; font-weight: 500; color: #a1a1aa; margin-bottom: 6px; }
  .auth-input {
    width: 100%; padding: 10px 14px; background: #09090b;
    border: 1px solid #27272a; border-radius: 8px; color: #fafafa;
    font-size: 15px; font-family: inherit; outline: none; transition: border-color 0.15s;
  }
  .auth-input:focus { border-color: #6366f1; }
  .auth-input::placeholder { color: #52525b; }
  .auth-error {
    background: #450a0a; border: 1px solid #7f1d1d; border-radius: 8px;
    padding: 10px 14px; color: #fca5a5; font-size: 13px; margin-bottom: 16px;
  }
  .auth-btn {
    width: 100%; padding: 11px; background: #6366f1; border: none;
    border-radius: 8px; color: #fff; font-size: 15px; font-weight: 500;
    font-family: inherit; cursor: pointer; transition: background 0.15s; margin-top: 4px;
  }
  .auth-btn:hover { background: #4f46e5; }
  .auth-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .auth-footer { text-align: center; margin-top: 20px; font-size: 14px; color: #71717a; }
  .auth-footer a { color: #818cf8; text-decoration: none; }
  .auth-footer a:hover { text-decoration: underline; }
  .auth-divider {
    display: flex; align-items: center; gap: 12px;
    margin: 4px 0 16px; color: #3f3f46; font-size: 12px;
  }
  .auth-divider::before, .auth-divider::after {
    content: ''; flex: 1; height: 1px; background: #27272a;
  }
`;

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await authApi.login({ email, password });
      setAuth(data.user, data.accessToken);
      navigate('/discover');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{styles}</style>
      <div className="auth-root">
        <div className="auth-card">
          <div className="auth-logo">🌍</div>
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to find friends near you</p>
          {error && <div className="auth-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label className="auth-label">Email</label>
              <input className="auth-input" type="email" placeholder="you@example.com"
                value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
            </div>
            <div className="auth-field">
              <label className="auth-label">Password</label>
              <input className="auth-input" type="password" placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <p className="auth-footer">No account? <Link to="/register">Create one</Link></p>
        </div>
      </div>
    </>
  );
}

export function RegisterPage() {
  const [form, setForm] = useState({ email: '', username: '', displayName: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      const { data } = await authApi.register({
        email: form.email,
        username: form.username,
        password: form.password,
        displayName: form.displayName || undefined,
      });
      setAuth(data.user, data.accessToken);
      navigate('/verify-email');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{styles}</style>
      <div className="auth-root">
        <div className="auth-card">
          <div className="auth-logo">🌍</div>
          <h1 className="auth-title">Create account</h1>
          <p className="auth-subtitle">Join and find friends around you</p>
          {error && <div className="auth-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label className="auth-label">Email</label>
              <input className="auth-input" type="email" placeholder="you@example.com"
                value={form.email} onChange={(e) => update('email', e.target.value)} required autoFocus />
            </div>
            <div className="auth-field">
              <label className="auth-label">Username</label>
              <input className="auth-input" type="text" placeholder="your_handle"
                value={form.username} onChange={(e) => update('username', e.target.value)}
                required minLength={3} maxLength={50} />
            </div>
            <div className="auth-field">
              <label className="auth-label">Display name <span style={{color:'#52525b'}}>(optional)</span></label>
              <input className="auth-input" type="text" placeholder="How friends will see you"
                value={form.displayName} onChange={(e) => update('displayName', e.target.value)} />
            </div>
            <div className="auth-divider">password</div>
            <div className="auth-field">
              <label className="auth-label">Password</label>
              <input className="auth-input" type="password" placeholder="Min 8 characters"
                value={form.password} onChange={(e) => update('password', e.target.value)}
                required minLength={8} />
            </div>
            <div className="auth-field">
              <label className="auth-label">Confirm password</label>
              <input className="auth-input" type="password" placeholder="••••••••"
                value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} required />
            </div>
            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
          <p className="auth-footer">Already have an account? <Link to="/login">Sign in</Link></p>
        </div>
      </div>
    </>
  );
}
