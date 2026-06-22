import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { useSocketStore } from '../stores/socket.store';
import { authApi, api } from '../api/client';

export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const { token, setAuth, logout, setLoading } = useAuthStore();
  const { connect, disconnect, setTotalUnread } = useSocketStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setReady(true);
      return;
    }
    authApi.me()
      .then(async ({ data }) => {
        setAuth(data, token);
        connect(token);
        try {
          const { data: convos } = await api.get('/chat/conversations');
          const total = convos.reduce((sum: number, c: any) => sum + (Number(c.unreadCount) || 0), 0);
          setTotalUnread(total);
        } catch {}
        setReady(true);
      })
      .catch(() => {
        logout();
        disconnect();
        setReady(true);
      });
  }, []);

  if (!ready) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#0f0f10',
      color: '#71717a', fontFamily: 'Inter, sans-serif', fontSize: 14,
    }}>
      Loading…
    </div>
  );

  return <>{children}</>;
}

export function ProtectedRoute() {
  const { user } = useAuthStore();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace />;
  if (!(user as any).emailVerified && location.pathname !== '/verify-email') {
    return <Navigate to="/verify-email" replace />;
  }
  return <Outlet />;
}

export function GuestRoute() {
  const { user } = useAuthStore();
  return user ? <Navigate to="/discover" replace /> : <Outlet />;
}