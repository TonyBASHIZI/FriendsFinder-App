import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthBootstrap, ProtectedRoute, GuestRoute } from './components/AuthGuards';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import { ProfilePage } from './pages/ProfilePage';
import { DiscoverPage } from './pages/DiscoverPage';
import { FriendsPage } from './pages/FriendsPage';

const queryClient = new QueryClient();

const ComingSoon = ({ name }: { name: string }) => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0f10', color: '#a1a1aa', fontFamily: 'Inter, sans-serif', fontSize: 18 }}>
    {name} — coming soon
  </div>
);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthBootstrap>
          <Routes>
            <Route element={<GuestRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/discover" element={<DiscoverPage />} />
              <Route path="/friends" element={<FriendsPage />} />
              <Route path="/chat" element={<ComingSoon name="Chat" />} />
            </Route>
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AuthBootstrap>
      </BrowserRouter>
    </QueryClientProvider>
  );
}