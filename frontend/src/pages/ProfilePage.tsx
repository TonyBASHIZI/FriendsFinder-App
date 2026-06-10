import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuthStore } from '../stores/auth.store';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .profile-root {
    min-height: 100vh; background: #0f0f10;
    font-family: 'Inter', sans-serif; padding: 24px;
    display: flex; flex-direction: column; align-items: center;
  }
  .profile-header {
    width: 100%; max-width: 500px; display: flex;
    align-items: center; justify-content: space-between;
    margin-bottom: 32px; padding-top: 8px;
  }
  .profile-title { font-size: 20px; font-weight: 600; color: #fafafa; }
  .profile-card {
    width: 100%; max-width: 500px; background: #18181b;
    border: 1px solid #27272a; border-radius: 16px; padding: 32px;
  }
  .avatar-section {
    display: flex; flex-direction: column; align-items: center; margin-bottom: 28px;
  }
  .avatar {
    width: 80px; height: 80px; border-radius: 50%;
    background: linear-gradient(135deg, #6366f1, #a855f7);
    display: flex; align-items: center; justify-content: center;
    font-size: 32px; margin-bottom: 10px; overflow: hidden;
  }
  .avatar img { width: 100%; height: 100%; object-fit: cover; }
  .avatar-name { font-size: 16px; font-weight: 600; color: #fafafa; }
  .avatar-username { font-size: 13px; color: #71717a; margin-top: 2px; }
  .section-title {
    font-size: 12px; font-weight: 500; color: #52525b;
    text-transform: uppercase; letter-spacing: 0.05em;
    margin-bottom: 16px; margin-top: 8px;
  }
  .profile-field { margin-bottom: 16px; }
  .profile-label { display: block; font-size: 13px; font-weight: 500; color: #a1a1aa; margin-bottom: 6px; }
  .profile-input {
    width: 100%; padding: 10px 14px; background: #09090b;
    border: 1px solid #27272a; border-radius: 8px; color: #fafafa;
    font-size: 15px; font-family: inherit; outline: none; transition: border-color 0.15s;
  }
  .profile-input:focus { border-color: #6366f1; }
  .profile-input::placeholder { color: #52525b; }
  textarea.profile-input { resize: vertical; min-height: 90px; }
  .profile-select {
    width: 100%; padding: 10px 14px; background: #09090b;
    border: 1px solid #27272a; border-radius: 8px; color: #fafafa;
    font-size: 15px; font-family: inherit; outline: none; cursor: pointer;
  }
  .profile-select:focus { border-color: #6366f1; }
  .profile-error {
    background: #450a0a; border: 1px solid #7f1d1d; border-radius: 8px;
    padding: 10px 14px; color: #fca5a5; font-size: 13px; margin-bottom: 16px;
  }
  .profile-success {
    background: #052e16; border: 1px solid #14532d; border-radius: 8px;
    padding: 10px 14px; color: #86efac; font-size: 13px; margin-bottom: 16px;
  }
  .profile-btn {
    width: 100%; padding: 11px; background: #6366f1; border: none;
    border-radius: 8px; color: #fff; font-size: 15px; font-weight: 500;
    font-family: inherit; cursor: pointer; transition: background 0.15s; margin-top: 8px;
  }
  .profile-btn:hover { background: #4f46e5; }
  .profile-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .profile-btn-outline {
    width: 100%; padding: 11px; background: transparent;
    border: 1px solid #27272a; border-radius: 8px; color: #a1a1aa;
    font-size: 15px; font-weight: 500; font-family: inherit;
    cursor: pointer; transition: border-color 0.15s; margin-top: 8px;
  }
  .profile-btn-outline:hover { border-color: #6366f1; color: #fafafa; }
  .location-box {
    background: #09090b; border: 1px solid #27272a; border-radius: 10px;
    padding: 14px; display: flex; align-items: center; gap: 12px;
  }
  .location-dot { width: 10px; height: 10px; border-radius: 50%; background: #52525b; flex-shrink: 0; }
  .location-dot.active { background: #22c55e; box-shadow: 0 0 0 3px rgba(34,197,94,0.2); }
  .location-text { flex: 1; }
  .location-label { font-size: 13px; color: #a1a1aa; }
  .location-value { font-size: 12px; color: #52525b; margin-top: 2px; }
  .divider { height: 1px; background: #27272a; margin: 24px 0; }
  .logout-btn {
    width: 100%; padding: 11px; background: transparent;
    border: 1px solid #7f1d1d; border-radius: 8px; color: #fca5a5;
    font-size: 15px; font-weight: 500; font-family: inherit;
    cursor: pointer; transition: background 0.15s; margin-top: 8px;
  }
  .logout-btn:hover { background: #450a0a; }
`;

export function ProfilePage() {
  const { user, setAuth, logout, token } = useAuthStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    displayName: '', bio: '', birthdate: '', gender: '', avatarUrl: '',
  });
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'active' | 'error'>('idle');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setForm({
        displayName: user.displayName || '',
        bio: (user as any).bio || '',
        birthdate: (user as any).birthdate || '',
        gender: (user as any).gender || '',
        avatarUrl: user.avatarUrl || '',
      });
    }
  }, [user]);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);
    try {
      const { data } = await api.patch('/users/me', {
        displayName: form.displayName || undefined,
        bio: form.bio || undefined,
        birthdate: form.birthdate || undefined,
        gender: form.gender || undefined,
        avatarUrl: form.avatarUrl || undefined,
      });
      setAuth(data, token!);
      setSuccess('Profile saved!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  function requestLocation() {
    setLocationStatus('loading');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setLocation({ lat: latitude, lng: longitude });
        setLocationStatus('active');
        try {
          await api.patch('/users/me/location', {
            latitude, longitude, accuracyMeters: accuracy, isVisible: true,
          });
        } catch {
          setLocationStatus('error');
        }
      },
      () => setLocationStatus('error'),
      { enableHighAccuracy: true },
    );
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <>
      <style>{styles}</style>
      <div className="profile-root">
        <div className="profile-header">
          <h1 className="profile-title">My Profile</h1>
          <button className="profile-btn-outline" style={{ width: 'auto', padding: '8px 16px', marginTop: 0 }}
            onClick={() => navigate('/discover')}>
            Discover →
          </button>
        </div>

        <div className="profile-card">
          <div className="avatar-section">
            <div className="avatar">
              {form.avatarUrl ? <img src={form.avatarUrl} alt="avatar" /> : '🧑'}
            </div>
            <div className="avatar-name">{form.displayName || user?.username}</div>
            <div className="avatar-username">@{user?.username}</div>
          </div>

          {error && <div className="profile-error">{error}</div>}
          {success && <div className="profile-success">{success}</div>}

          <form onSubmit={handleSave}>
            <div className="section-title">About you</div>

            <div className="profile-field">
              <label className="profile-label">Display name</label>
              <input className="profile-input" type="text" placeholder="How friends will see you"
                value={form.displayName} onChange={(e) => update('displayName', e.target.value)} />
            </div>

            <div className="profile-field">
              <label className="profile-label">Bio</label>
              <textarea className="profile-input" placeholder="Tell people about yourself…"
                value={form.bio} onChange={(e) => update('bio', e.target.value)} maxLength={300} />
            </div>

            <div className="profile-field">
              <label className="profile-label">Birthdate</label>
              <input className="profile-input" type="date"
                value={form.birthdate} onChange={(e) => update('birthdate', e.target.value)} />
            </div>

            <div className="profile-field">
              <label className="profile-label">Gender</label>
              <select className="profile-select" value={form.gender} onChange={(e) => update('gender', e.target.value)}>
                <option value="">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non_binary">Non-binary</option>
              </select>
            </div>

            <div className="profile-field">
              <label className="profile-label">Avatar URL <span style={{color:'#52525b'}}>(optional)</span></label>
              <input className="profile-input" type="url" placeholder="https://..."
                value={form.avatarUrl} onChange={(e) => update('avatarUrl', e.target.value)} />
            </div>

            <button className="profile-btn" type="submit" disabled={loading}>
              {loading ? 'Saving…' : 'Save profile'}
            </button>
          </form>

          <div className="divider" />

          <div className="section-title">Location</div>
          <div className="location-box">
            <div className={`location-dot ${locationStatus === 'active' ? 'active' : ''}`} />
            <div className="location-text">
              <div className="location-label">
                {locationStatus === 'idle' && 'Location not shared yet'}
                {locationStatus === 'loading' && 'Getting your location…'}
                {locationStatus === 'active' && 'Location active'}
                {locationStatus === 'error' && 'Location access denied'}
              </div>
              {location && (
                <div className="location-value">
                  {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </div>
              )}
            </div>
          </div>
          <button className="profile-btn-outline" onClick={requestLocation}
            disabled={locationStatus === 'loading'} style={{ marginTop: '12px' }}>
            {locationStatus === 'active' ? '📍 Update location' : '📍 Share my location'}
          </button>

          <div className="divider" />

          <button className="logout-btn" onClick={handleLogout}>Sign out</button>
        </div>
      </div>
    </>
  );
}
