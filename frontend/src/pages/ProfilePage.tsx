import { useState, useEffect, FormEvent, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuthStore } from '../stores/auth.store';

export function ProfilePage() {
  const { user, setAuth, logout, token } = useAuthStore();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    displayName: '', bio: '', birthdate: '', gender: '', avatarUrl: '',
  });
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'active' | 'error'>('idle');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
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

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm((f) => ({ ...f, avatarUrl: data.avatarUrl }));
      setSuccess('Photo uploaded!');
      setTimeout(() => setSuccess(''), 2000);
    } catch {
      setError('Failed to upload photo');
    } finally {
      setUploading(false);
    }
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

  const avatarSrc = form.avatarUrl
    ? (form.avatarUrl.startsWith('/uploads')
      ? 'http://localhost:3000' + form.avatarUrl
      : form.avatarUrl)
    : null;

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f10', fontFamily: 'Inter, sans-serif', padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Header */}
      <div style={{ width: '100%', maxWidth: 500, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, paddingTop: 8 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: '#fafafa' }}>My Profile</h1>
        <button onClick={() => navigate('/discover')} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #27272a', background: 'transparent', color: '#a1a1aa', fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer' }}>
          Discover →
        </button>
      </div>

      <div style={{ width: '100%', maxWidth: 500, background: '#18181b', border: '1px solid #27272a', borderRadius: 16, padding: 32 }}>

        {/* Avatar upload section */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{ width: 90, height: 90, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, marginBottom: 10, overflow: 'hidden', cursor: 'pointer', position: 'relative', border: '3px solid #27272a' }}
          >
            {avatarSrc
              ? <img src={avatarSrc} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : '🧑'
            }
            {/* Overlay on hover */}
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.15s' }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
            >
              <span style={{ fontSize: 20 }}>📷</span>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleAvatarUpload}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{ padding: '6px 16px', borderRadius: 8, border: '1px solid #27272a', background: 'transparent', color: '#a1a1aa', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', marginBottom: 6 }}
          >
            {uploading ? 'Uploading...' : '📷 Change photo'}
          </button>

          <div style={{ fontSize: 15, fontWeight: 600, color: '#fafafa' }}>{form.displayName || user?.username}</div>
          <div style={{ fontSize: 13, color: '#71717a', marginTop: 2 }}>@{user?.username}</div>
        </div>

        {error && <div style={{ background: '#450a0a', border: '1px solid #7f1d1d', borderRadius: 8, padding: '10px 14px', color: '#fca5a5', fontSize: 13, marginBottom: 16 }}>{error}</div>}
        {success && <div style={{ background: '#052e16', border: '1px solid #14532d', borderRadius: 8, padding: '10px 14px', color: '#86efac', fontSize: 13, marginBottom: 16 }}>{success}</div>}

        <form onSubmit={handleSave}>
          <div style={{ fontSize: 12, fontWeight: 500, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>About you</div>

          {[
            { label: 'Display name', field: 'displayName', type: 'text', placeholder: 'How friends will see you' },
            { label: 'Birthdate', field: 'birthdate', type: 'date', placeholder: '' },
          ].map(({ label, field, type, placeholder }) => (
            <div key={field} style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#a1a1aa', marginBottom: 6 }}>{label}</label>
              <input
                type={type}
                placeholder={placeholder}
                value={(form as any)[field]}
                onChange={(e) => update(field, e.target.value)}
                style={{ width: '100%', padding: '10px 14px', background: '#09090b', border: '1px solid #27272a', borderRadius: 8, color: '#fafafa', fontSize: 15, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          ))}

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#a1a1aa', marginBottom: 6 }}>Bio</label>
            <textarea
              placeholder="Tell people about yourself..."
              value={form.bio}
              onChange={(e) => update('bio', e.target.value)}
              maxLength={300}
              style={{ width: '100%', padding: '10px 14px', background: '#09090b', border: '1px solid #27272a', borderRadius: 8, color: '#fafafa', fontSize: 15, fontFamily: 'inherit', outline: 'none', resize: 'vertical', minHeight: 90, boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#a1a1aa', marginBottom: 6 }}>Gender</label>
            <select
              value={form.gender}
              onChange={(e) => update('gender', e.target.value)}
              style={{ width: '100%', padding: '10px 14px', background: '#09090b', border: '1px solid #27272a', borderRadius: 8, color: '#fafafa', fontSize: 15, fontFamily: 'inherit', outline: 'none' }}
            >
              <option value="">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="non_binary">Non-binary</option>
            </select>
          </div>

          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: 11, background: '#6366f1', border: 'none', borderRadius: 8, color: '#fff', fontSize: 15, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', marginTop: 4 }}>
            {loading ? 'Saving...' : 'Save profile'}
          </button>
        </form>

        <div style={{ height: 1, background: '#27272a', margin: '24px 0' }} />

        {/* Location */}
        <div style={{ fontSize: 12, fontWeight: 500, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>Location</div>
        <div style={{ background: '#09090b', border: '1px solid #27272a', borderRadius: 10, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: locationStatus === 'active' ? '#22c55e' : '#52525b', flexShrink: 0, boxShadow: locationStatus === 'active' ? '0 0 0 3px rgba(34,197,94,0.2)' : 'none' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: '#a1a1aa' }}>
              {locationStatus === 'idle' && 'Location not shared yet'}
              {locationStatus === 'loading' && 'Getting your location...'}
              {locationStatus === 'active' && 'Location active'}
              {locationStatus === 'error' && 'Location access denied'}
            </div>
            {location && <div style={{ fontSize: 12, color: '#52525b', marginTop: 2 }}>{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</div>}
          </div>
        </div>
        <button onClick={requestLocation} disabled={locationStatus === 'loading'}
          style={{ width: '100%', padding: 11, background: 'transparent', border: '1px solid #27272a', borderRadius: 8, color: '#a1a1aa', fontSize: 15, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', marginTop: 12 }}>
          {locationStatus === 'active' ? '📍 Update location' : '📍 Share my location'}
        </button>

        <div style={{ height: 1, background: '#27272a', margin: '24px 0' }} />

        <button onClick={handleLogout}
          style={{ width: '100%', padding: 11, background: 'transparent', border: '1px solid #7f1d1d', borderRadius: 8, color: '#fca5a5', fontSize: 15, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer' }}>
          Sign out
        </button>
      </div>
    </div>
  );
}
