import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { authApi } from '../api/client';

export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const { token, setAuth, logout, setLoading } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setReady(true);
      return;
    }
    authApi.me()
      .then(({ data }) => {
        setAuth(data, token);
        setReady(true);
      })
      .catch(() => {
        logout();
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
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

export function GuestRoute() {
  const { user } = useAuthStore();
  return user ? <Navigate to="/discover" replace /> : <Outlet />;
}
