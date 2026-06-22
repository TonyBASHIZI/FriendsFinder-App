import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuthStore } from '../stores/auth.store';

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/verify-registration', { code });
      navigate('/discover');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    try {
      await api.post('/auth/resend-code');
      setResent(true);
      setTimeout(() => setResent(false), 3000);
    } catch (err: any) {
      console.error('Resend error:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to resend');
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0f0f10', fontFamily: 'Inter, sans-serif', padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 400, background: '#18181b', border: '1px solid #27272a', borderRadius: 16, padding: 40 }}>
        <div style={{ width: 44, height: 44, background: '#6366f1', borderRadius: 12, marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
          ✉️
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: '#fafafa', marginBottom: 6 }}>Verify your email</h1>
        <p style={{ fontSize: 14, color: '#71717a', marginBottom: 28 }}>
          We sent a 6-digit code to <strong style={{ color: '#a1a1aa' }}>{user?.email}</strong>
        </p>

        {error && (
          <div style={{ background: '#450a0a', border: '1px solid #7f1d1d', borderRadius: 8, padding: '10px 14px', color: '#fca5a5', fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {resent && (
          <div style={{ background: '#052e16', border: '1px solid #14532d', borderRadius: 8, padding: '10px 14px', color: '#86efac', fontSize: 13, marginBottom: 16 }}>
            Code resent! Check your inbox.
          </div>
        )}

        <form onSubmit={handleVerify}>
          <input
            type="text"
            placeholder="123456"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
            autoFocus
            style={{
              width: '100%', padding: '14px', background: '#09090b', border: '1px solid #27272a',
              borderRadius: 10, color: '#fafafa', fontSize: 24, letterSpacing: 8, textAlign: 'center',
              fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box', marginBottom: 16,
            }}
          />
          <button type="submit" disabled={loading || code.length !== 6}
            style={{
              width: '100%', padding: 11, background: code.length === 6 ? '#6366f1' : '#27272a',
              border: 'none', borderRadius: 8, color: code.length === 6 ? '#fff' : '#52525b',
              fontSize: 15, fontWeight: 500, fontFamily: 'inherit',
              cursor: code.length === 6 ? 'pointer' : 'default', transition: 'all 0.15s',
            }}>
            {loading ? 'Verifying...' : 'Verify email'}
          </button>
        </form>

        <button onClick={handleResend} style={{
          width: '100%', marginTop: 16, padding: 8, background: 'transparent', border: 'none',
          color: '#818cf8', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer',
        }}>
          Didn't get the code? Resend
        </button>
      </div>
    </div>
  );
}