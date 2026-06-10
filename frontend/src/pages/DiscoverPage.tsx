import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { api } from '../api/client';
import { useAuthStore } from '../stores/auth.store';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const meIcon = L.divIcon({
  html: '<div style="width:14px;height:14px;border-radius:50%;background:#6366f1;border:3px solid white;box-shadow:0 0 0 3px rgba(99,102,241,0.4)"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  className: '',
});

const userIcon = L.divIcon({
  html: '<div style="width:12px;height:12px;border-radius:50%;background:#22c55e;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
  className: '',
});

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .discover-root {
    min-height: 100vh; background: #0f0f10;
    font-family: 'Inter', sans-serif; display: flex; flex-direction: column;
  }
  .discover-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 24px; border-bottom: 1px solid #27272a; background: #18181b;
  }
  .discover-title { font-size: 18px; font-weight: 600; color: #fafafa; display: flex; align-items: center; gap: 8px; }
  .header-actions { display: flex; gap: 8px; }
  .header-btn {
    padding: 7px 14px; border-radius: 8px; font-size: 13px; font-weight: 500;
    font-family: inherit; cursor: pointer; border: 1px solid #27272a;
    background: transparent; color: #a1a1aa; transition: all 0.15s;
  }
  .header-btn:hover { bor
cd ~/friendfinder/frontend
cat > src/pages/DiscoverPage.tsx << 'EOF'
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { api } from '../api/client';
import { useAuthStore } from '../stores/auth.store';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const meIcon = L.divIcon({
  html: '<div style="width:14px;height:14px;border-radius:50%;background:#6366f1;border:3px solid white;box-shadow:0 0 0 3px rgba(99,102,241,0.4)"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  className: '',
});

const userIcon = L.divIcon({
  html: '<div style="width:12px;height:12px;border-radius:50%;background:#22c55e;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
  className: '',
});

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .discover-root {
    min-height: 100vh; background: #0f0f10;
    font-family: 'Inter', sans-serif; display: flex; flex-direction: column;
  }
  .discover-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 24px; border-bottom: 1px solid #27272a; background: #18181b;
  }
  .discover-title { font-size: 18px; font-weight: 600; color: #fafafa; display: flex; align-items: center; gap: 8px; }
  .header-actions { display: flex; gap: 8px; }
  .header-btn {
    padding: 7px 14px; border-radius: 8px; font-size: 13px; font-weight: 500;
    font-family: inherit; cursor: pointer; border: 1px solid #27272a;
    background: transparent; color: #a1a1aa; transition: all 0.15s;
  }
  .header-btn:hover { border-color: #6366f1; color: #fafafa; }
  .header-btn.primary { background: #6366f1; border-color: #6366f1; color: white; }
  .header-btn.primary:hover { background: #4f46e5; }
  .discover-body { display: flex; flex: 1; height: calc(100vh - 57px); }
  .map-section { flex: 1; position: relative; }
  .leaflet-container { width: 100%; height: 100%; }
  .sidebar {
    width: 320px; background: #18181b; border-left: 1px solid #27272a;
    display: flex; flex-direction: column; overflow: hidden;
  }
  .sidebar-header {
    padding: 16px; border-bottom: 1px solid #27272a;
    display: flex; align-items: center; justify-content: space-between;
  }
  .sidebar-title { font-size: 14px; font-weight: 600; color: #fafafa; }
  .sidebar-count { font-size: 12px; color: #71717a; }
  .radius-select {
    background: #09090b; border: 1px solid #27272a; border-radius: 6px;
    color: #a1a1aa; font-size: 12px; padding: 4px 8px; font-family: inherit; outline: none;
  }
  .users-list { flex: 1; overflow-y: auto; padding: 8px; }
  .user-card {
    display: flex; align-items: center; gap: 12px;
    padding: 12px; border-radius: 10px; margin-bottom: 4px;
    cursor: pointer; transition: background 0.15s; border: 1px solid transparent;
  }
  .user-card:hover { background: #27272a; }
  .user-card.selected { background: #1e1b4b; border-color: #4f46e5; }
  .user-avatar {
    width: 42px; height: 42px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #a855f7);
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; flex-shrink: 0; overflow: hidden;
  }
  .user-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .user-info { flex: 1; min-width: 0; }
  .user-name { font-size: 14px; font-weight: 500; color: #fafafa; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .user-meta { font-size: 12px; color: #71717a; margin-top: 2px; }
  .user-bio { font-size: 12px; color: #52525b; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .add-btn {
    padding: 6px 12px; background: #6366f1; border: none; border-radius: 6px;
    color: white; font-size: 12px; font-weight: 500; font-family: inherit;
    cursor: pointer; transition: background 0.15s; white-space: nowrap;
  }
  .add-btn:hover { background: #4f46e5; }
  .add-btn.sent { background: #27272a; color: #71717a; cursor: default; }
  .empty-state {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    flex: 1; padding: 32px; text-align: center; color: #52525b;
  }
  .empty-icon { font-size: 40px; margin-bottom: 12px; }
  .empty-text { font-size: 14px; color: #71717a; margin-bottom: 8px; }
  .empty-sub { font-size: 12px; color: #52525b; }
  .loading-state {
    display: flex; align-items: center; justify-content: center;
    flex: 1; color: #71717a; font-size: 14px;
  }
  .toast {
    position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
    background: #18181b; border: 1px solid #27272a; border-radius: 10px;
    padding: 12px 20px; color: #fafafa; font-size: 14px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.4); z-index: 9999;
    animation: fadeIn 0.2s ease;
  }
  @keyframes fadeIn { from { opacity: 0; transform: translateX(-50%) translateY(8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
`;

interface NearbyUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  gender: string | null;
  distanceKm: number;
}

export function DiscoverPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [nearby, setNearby] = useState<NearbyUser[]>([]);
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState(10);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState('');
  const [noLocation, setNoLocation] = useState(false);

  useEffect(() => {
    fetchNearby();
  }, [radius]);

  async function fetchNearby() {
    setLoading(true);
    try {
      const { data } = await api.get(`/discovery/nearby?radius=${radius}`);
      if (data.message) {
        setNoLocation(true);
      } else {
        setNearby(data.users);
        setMyLocation(data.myLocation);
        setNoLocation(false);
      }
    } catch {
      setNoLocation(true);
    } finally {
      setLoading(false);
    }
  }

  async function sendRequest(toUserId: string, name: string) {
    try {
      await api.post('/friends/request', { receiverId: toUserId });
      setSentRequests((s) => new Set([...s, toUserId]));
      showToast(`Friend request sent to ${name}! 🎉`);
    } catch {
      showToast('Could not send request');
    }
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  return (
    <>
      <style>{styles}</style>
      <div className="discover-root">
        <div className="discover-header">
          <div className="discover-title">🌍 Discover</div>
          <div className="header-actions">
            <select className="radius-select" value={radius} onChange={(e) => setRadius(Number(e.target.value))}>
              <option value={1}>1 km</option>
              <option value={5}>5 km</option>
              <option value={10}>10 km</option>
              <option value={25}>25 km</option>
              <option value={50}>50 km</option>
            </select>
            <button className="header-btn" onClick={() => navigate('/profile')}>👤 Profile</button>
            <button className="header-btn" onClick={() => navigate('/friends')}>👥 Friends</button>
          </div>
        </div>

        <div className="discover-body">
          <div className="map-section">
            {myLocation ? (
              <MapContainer center={[myLocation.lat, myLocation.lng]} zoom={13} style={{ width: '100%', height: '100%' }}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                />
                <Circle
                  center={[myLocation.lat, myLocation.lng]}
                  radius={radius * 1000}
                  pathOptions={{ color: '#6366f1', fillColor: '#6366f1', fillOpacity: 0.05, weight: 1 }}
                />
                <Marker position={[myLocation.lat, myLocation.lng]} icon={meIcon}>
                  <Popup>📍 You are here</Popup>
                </Marker>
                {nearby.map((u) => (
                  <Marker key={u.id} position={[0, 0]} icon={userIcon}>
                    <Popup>
                      <strong>{u.displayName || u.username}</strong><br />
                      {u.distanceKm} km away
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#09090b', color: '#52525b', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 48 }}>🗺️</div>
                <div style={{ fontSize: 14, color: '#71717a' }}>
                  {noLocation ? 'Share your location to see the map' : 'Loading map…'}
                </div>
                {noLocation && (
                  <button className="header-btn primary" onClick={() => navigate('/profile')}>
                    📍 Go to Profile → Share location
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="sidebar">
            <div className="sidebar-header">
              <span className="sidebar-title">Nearby people</span>
              <span className="sidebar-count">{nearby.length} found</span>
            </div>

            {loading ? (
              <div className="loading-state">Looking around…</div>
            ) : noLocation ? (
              <div className="empty-state">
                <div className="empty-icon">📍</div>
                <div className="empty-text">Location not shared</div>
                <div className="empty-sub">Go to your profile and share your location first</div>
              </div>
            ) : nearby.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👀</div>
                <div className="empty-text">No one nearby yet</div>
                <div className="empty-sub">Try increasing the radius or check back later</div>
              </div>
            ) : (
              <div className="users-list">
                {nearby.map((u) => (
                  <div
                    key={u.id}
                    className={`user-card ${selected === u.id ? 'selected' : ''}`}
                    onClick={() => setSelected(u.id === selected ? null : u.id)}
                  >
                    <div className="user-avatar">
                      {u.avatarUrl ? <img src={u.avatarUrl} alt={u.username} /> : '🧑'}
                    </div>
                    <div className="user-info">
                      <div className="user-name">{u.displayName || u.username}</div>
                      <div className="user-meta">📍 {u.distanceKm} km away</div>
                      {u.bio && <div className="user-bio">{u.bio}</div>}
                    </div>
                    <button
                      className={`add-btn ${sentRequests.has(u.id) ? 'sent' : ''}`}
                      onClick={(e) => { e.stopPropagation(); if (!sentRequests.has(u.id)) sendRequest(u.id, u.displayName || u.username); }}
                    >
                      {sentRequests.has(u.id) ? '✓ Sent' : '+ Add'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
