import { useState, useEffect, FormEvent, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuthStore } from '../stores/auth.store';

const countryCodes = [
  { code: '+1', country: '🇺🇸 US/CA' },
  { code: '+44', country: '🇬🇧 UK' },
  { code: '+33', country: '🇫🇷 FR' },
  { code: '+49', country: '🇩🇪 DE' },
  { code: '+34', country: '🇪🇸 ES' },
  { code: '+39', country: '🇮🇹 IT' },
  { code: '+212', country: '🇲🇦 MA' },
  { code: '+213', country: '🇩🇿 DZ' },
  { code: '+216', country: '🇹🇳 TN' },
  { code: '+225', country: '🇨🇮 CI' },
  { code: '+221', country: '🇸🇳 SN' },
  { code: '+243', country: '🇨🇩 CD' },
  { code: '+237', country: '🇨🇲 CM' },
  { code: '+27', country: '🇿🇦 ZA' },
  { code: '+234', country: '🇳🇬 NG' },
  { code: '+254', country: '🇰🇪 KE' },
  { code: '+91', country: '🇮🇳 IN' },
  { code: '+86', country: '🇨🇳 CN' },
  { code: '+81', country: '🇯🇵 JP' },
  { code: '+55', country: '🇧🇷 BR' },
];

export function ProfilePage() {
  const { user, setAuth, logout, token } = useAuthStore();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    displayName: '', bio: '', birthdate: '', gender: '', avatarUrl: '', phoneNumber: '',
  });
  const [countryCode, setCountryCode] = useState('+1');
  const [verificationStep, setVerificationStep] = useState<'idle' | 'code-sent' | 'verified'>('idle');
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [emailVerifyStep, setEmailVerifyStep] = useState<'idle' | 'code-sent' | 'verified'>('idle');
  const [emailVerifyCode, setEmailVerifyCode] = useState('');
  const [emailVerifyError, setEmailVerifyError] = useState('');
  const [sendingEmailCode, setSendingEmailCode] = useState(false);
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
        phoneNumber: (user as any).phoneNumber || '',
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
      const fullPhone = form.phoneNumber ? countryCode + form.phoneNumber : undefined;
      const { data } = await api.patch('/users/me', {
        displayName: form.displayName || undefined,
        bio: form.bio || undefined,
        birthdate: form.birthdate || undefined,
        gender: form.gender || undefined,
        avatarUrl: form.avatarUrl || undefined,
        phoneNumber: fullPhone,
      });
      setAuth(data, token!);
      setSuccess('Profile saved!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }
  async function sendVerificationCode() {
    if (!form.phoneNumber) return;
    setSendingCode(true);
    setVerifyError('');
    try {
      const fullPhone = countryCode + form.phoneNumber;
      await api.post('/users/me/phone/send-code', { phoneNumber: fullPhone });
      setVerificationStep('code-sent');
    } catch (err: any) {
      setVerifyError(err.response?.data?.message || 'Failed to send code');
    } finally {
      setSendingCode(false);
    }
  }

  async function confirmVerificationCode() {
    setVerifyError('');
    try {
      await api.post('/users/me/phone/verify', { code: verifyCode });
      setVerificationStep('verified');
      setVerifyCode('');
    } catch (err: any) {
      setVerifyError(err.response?.data?.message || 'Invalid code');
    }
  }

  async function sendEmailVerificationCode() {
    setSendingEmailCode(true);
    setEmailVerifyError('');
    try {
      await api.post('/users/me/email/send-code');
      setEmailVerifyStep('code-sent');
    } catch (err: any) {
      setEmailVerifyError(err.response?.data?.message || 'Failed to send code');
    } finally {
      setSendingEmailCode(false);
    }
  }

  async function confirmEmailVerificationCode() {
    setEmailVerifyError('');
    try {
      await api.post('/users/me/email/verify', { code: emailVerifyCode });
      setEmailVerifyStep('verified');
      setEmailVerifyCode('');
    } catch (err: any) {
      setEmailVerifyError(err.response?.data?.message || 'Invalid code');
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
      ? (import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000') + form.avatarUrl
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
          <div style={{ background: '#09090b', border: '1px solid #27272a', borderRadius: 10, padding: 14, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 13, color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: 6 }}>
                  ✉️ {user?.email}
                  {(user as any)?.emailVerified && <span style={{ color: '#22c55e', fontSize: 12 }}>✓ Verified</span>}
                </div>
              </div>
              {!(user as any)?.emailVerified && emailVerifyStep !== 'code-sent' && (
                <button type="button" onClick={sendEmailVerificationCode} disabled={sendingEmailCode}
                  style={{ padding: '6px 12px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 6, color: '#a1a1aa', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer' }}>
                  {sendingEmailCode ? 'Sending...' : 'Verify email'}
                </button>
              )}
            </div>

            {emailVerifyStep === 'code-sent' && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 12, color: '#71717a', marginBottom: 8 }}>Enter the 6-digit code sent to your email</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    placeholder="123456"
                    maxLength={6}
                    value={emailVerifyCode}
                    onChange={(e) => setEmailVerifyCode(e.target.value.replace(/[^0-9]/g, ''))}
                    style={{ flex: 1, padding: '8px 12px', background: '#000', border: '1px solid #27272a', borderRadius: 6, color: '#fafafa', fontSize: 16, letterSpacing: 4, textAlign: 'center', fontFamily: 'monospace', outline: 'none' }}
                  />
                  <button type="button" onClick={confirmEmailVerificationCode}
                    style={{ padding: '8px 16px', background: '#6366f1', border: 'none', borderRadius: 6, color: 'white', fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer' }}>
                    Confirm
                  </button>
                </div>
                {emailVerifyError && <div style={{ fontSize: 12, color: '#fca5a5', marginTop: 6 }}>{emailVerifyError}</div>}
              </div>
            )}

            {emailVerifyStep === 'verified' && (
              <div style={{ marginTop: 8, fontSize: 12, color: '#22c55e' }}>✓ Email verified successfully!</div>
            )}
          </div>

          <div style={{ fontSize: 12, fontWeight: 500, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>About you</div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#a1a1aa', marginBottom: 6 }}>Display name</label>
            <input
              type="text"
              placeholder="How friends will see you"
              value={form.displayName}
              onChange={(e) => update('displayName', e.target.value)}
              style={{ width: '100%', padding: '10px 14px', background: '#09090b', border: '1px solid #27272a', borderRadius: 8, color: '#fafafa', fontSize: 15, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#a1a1aa', marginBottom: 6 }}>
              Phone number {(user as any)?.phoneVerified && <span style={{ color: '#22c55e', fontSize: 12 }}>✓ Verified</span>}
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                style={{ width: 110, padding: '10px 8px', background: '#09090b', border: '1px solid #27272a', borderRadius: 8, color: '#fafafa', fontSize: 14, fontFamily: 'inherit', outline: 'none', flexShrink: 0 }}
              >
                {countryCodes.map((c) => (
                  <option key={c.code} value={c.code}>{c.country} {c.code}</option>
                ))}
              </select>
              <input
                type="tel"
                placeholder="234 567 8900"
                value={form.phoneNumber}
                onChange={(e) => { update('phoneNumber', e.target.value.replace(/[^0-9]/g, '')); setVerificationStep('idle'); }}
                style={{ flex: 1, padding: '10px 14px', background: '#09090b', border: '1px solid #27272a', borderRadius: 8, color: '#fafafa', fontSize: 15, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
              />
              {form.phoneNumber && verificationStep !== 'verified' && !(user as any)?.phoneVerified && (
                <button type="button" onClick={sendVerificationCode} disabled={sendingCode}
                  style={{ padding: '10px 14px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 8, color: '#a1a1aa', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {sendingCode ? 'Sending...' : verificationStep === 'code-sent' ? 'Resend' : 'Verify'}
                </button>
              )}
            </div>

            {verificationStep === 'code-sent' && (
              <div style={{ marginTop: 10, padding: 12, background: '#09090b', border: '1px solid #27272a', borderRadius: 8 }}>
                <div style={{ fontSize: 12, color: '#71717a', marginBottom: 8 }}>Enter the 6-digit code sent by SMS</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    placeholder="123456"
                    maxLength={6}
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value.replace(/[^0-9]/g, ''))}
                    style={{ flex: 1, padding: '8px 12px', background: '#000', border: '1px solid #27272a', borderRadius: 6, color: '#fafafa', fontSize: 16, letterSpacing: 4, textAlign: 'center', fontFamily: 'monospace', outline: 'none' }}
                  />
                  <button type="button" onClick={confirmVerificationCode}
                    style={{ padding: '8px 16px', background: '#6366f1', border: 'none', borderRadius: 6, color: 'white', fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer' }}>
                    Confirm
                  </button>
                </div>
                {verifyError && <div style={{ fontSize: 12, color: '#fca5a5', marginTop: 6 }}>{verifyError}</div>}
              </div>
            )}

            {verificationStep === 'verified' && (
              <div style={{ marginTop: 8, fontSize: 12, color: '#22c55e' }}>✓ Phone verified successfully!</div>
            )}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#a1a1aa', marginBottom: 6 }}>Birthdate</label>
            <input
              type="date"
              value={form.birthdate}
              onChange={(e) => update('birthdate', e.target.value)}
              style={{ width: '100%', padding: '10px 14px', background: '#09090b', border: '1px solid #27272a', borderRadius: 8, color: '#fafafa', fontSize: 15, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

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
