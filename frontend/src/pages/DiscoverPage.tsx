import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { api } from '../api/client';
import { avatarSrc } from '../utils/avatar';
import { useAuthStore } from '../stores/auth.store';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function createMeIcon(avatarUrl: string | null) {
  const src = avatarSrc(avatarUrl);
  const inner = src
    ? '<img src="' + src + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />'
    : '🧑';
  return L.divIcon({
    html: '<div style="width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#a855f7);border:3px solid white;box-shadow:0 0 0 3px rgba(99,102,241,0.4);display:flex;align-items:center;justify-content:center;overflow:hidden;font-size:18px;">' + inner + '</div>',
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    className: '',
  });
}

function createUserIcon(avatarUrl: string | null, isFriend: boolean) {
  const src = avatarSrc(avatarUrl);
  const inner = src
    ? '<img src="' + src + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />'
    : '🧑';
  const color = isFriend ? '#22c55e' : '#f59e0b';
  return L.divIcon({
    html: '<div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,' + color + ',' + color + ');border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;overflow:hidden;font-size:16px;">' + inner + '</div>',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    className: '',
  });
}

interface NearbyUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  gender: string | null;
  distanceKm: number;
  friendStatus: 'none' | 'pending' | 'accepted' | 'declined' | 'blocked';
}

function Avatar({ url, name }: { url: string | null; name: string }) {
  const src = avatarSrc(url);
  return (
    <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, overflow: 'hidden' }}>
      {src ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : '🧑'}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'accepted') return <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: '#052e16', color: '#86efac', border: '1px solid #14532d' }}>✓ Friend</span>;
  if (status === 'pending') return <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: '#1c1917', color: '#a8a29e', border: '1px solid #44403c' }}>⏳ Pending</span>;
  return null;
}

export function DiscoverPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [nearby, setNearby] = useState<NearbyUser[]>([]);
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState(10);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState('');
  const [noLocation, setNoLocation] = useState(false);

  useEffect(() => { fetchNearby(); }, [radius]);

  async function fetchNearby() {
    setLoading(true);
    try {
      const { data } = await api.get('/discovery/nearby?radius=' + radius);
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
      showToast('Friend request sent to ' + name + '!');
    } catch {
      showToast('Could not send request');
    }
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  function getAddBtn(u: NearbyUser) {
    if (u.friendStatus === 'accepted') return null;
    if (u.friendStatus === 'pending') return null;
    if (sentRequests.has(u.id)) return (
      <button style={{ padding: '6px 12px', background: '#27272a', border: 'none', borderRadius: 6, color: '#71717a', fontSize: 12, fontWeight: 500, fontFamily: 'inherit', cursor: 'default', whiteSpace: 'nowrap' }}>✓ Sent</button>
    );
    return (
      <button onClick={(e) => { e.stopPropagation(); sendRequest(u.id, u.displayName || u.username); }}
        style={{ padding: '6px 12px', background: '#6366f1', border: 'none', borderRadius: 6, color: 'white', fontSize: 12, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap' }}>
        + Add
      </button>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f10', fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #27272a', background: '#18181b' }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: '#fafafa' }}>🌍 Discover</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={radius} onChange={(e) => setRadius(Number(e.target.value))}
            style={{ background: '#09090b', border: '1px solid #27272a', borderRadius: 6, color: '#a1a1aa', fontSize: 12, padding: '4px 8px', fontFamily: 'inherit', outline: 'none' }}>
            <option value={1}>1 km</option>
            <option value={5}>5 km</option>
            <option value={10}>10 km</option>
            <option value={25}>25 km</option>
            <option value={50}>50 km</option>
          </select>
          <button onClick={() => navigate('/profile')} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', border: '1px solid #27272a', background: 'transparent', color: '#a1a1aa' }}>👤 Profile</button>
          <button onClick={() => navigate('/friends')} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', border: '1px solid #27272a', background: 'transparent', color: '#a1a1aa' }}>👥 Friends</button>
          <button onClick={() => navigate('/chat')} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', border: '1px solid #27272a', background: 'transparent', color: '#a1a1aa' }}>💬 Chat</button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, height: 'calc(100vh - 57px)' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          {myLocation ? (
            <MapContainer center={[myLocation.lat, myLocation.lng]} zoom={13} style={{ width: '100%', height: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="OpenStreetMap contributors" />
              <Circle center={[myLocation.lat, myLocation.lng]} radius={radius * 1000}
                pathOptions={{ color: '#6366f1', fillColor: '#6366f1', fillOpacity: 0.05, weight: 1 }} />
              <Marker position={[myLocation.lat, myLocation.lng]} icon={createMeIcon(user?.avatarUrl || null)}>
                <Popup>
                  <div style={{ textAlign: 'center', padding: 4 }}>
                    <strong>📍 You</strong><br />
                    <span style={{ fontSize: 12, color: '#666' }}>{user?.displayName || user?.username}</span>
                  </div>
                </Popup>
              </Marker>
              {nearby.map((u) => (
                <Marker key={u.id}
                  position={[myLocation.lat + (Math.random() - 0.5) * 0.01, myLocation.lng + (Math.random() - 0.5) * 0.01]}
                  icon={createUserIcon(u.avatarUrl, u.friendStatus === 'accepted')}>
                  <Popup>
                    <div style={{ textAlign: 'center', padding: 4 }}>
                      <strong>{u.displayName || u.username}</strong><br />
                      <span style={{ fontSize: 12, color: '#666' }}>📍 {u.distanceKm} km away</span>
                      {u.friendStatus === 'accepted' && <><br /><span style={{ fontSize: 12, color: '#22c55e' }}>✓ Friend</span></>}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#09090b', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 48 }}>🗺️</div>
              <div style={{ fontSize: 14, color: '#71717a' }}>{noLocation ? 'Share your location to see the map' : 'Loading map...'}</div>
              {noLocation && (
                <button onClick={() => navigate('/profile')} style={{ padding: '8px 16px', borderRadius: 8, background: '#6366f1', border: 'none', color: 'white', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Go to Profile and share location
                </button>
              )}
            </div>
          )}
        </div>

        <div style={{ width: 320, background: '#18181b', borderLeft: '1px solid #27272a', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: 16, borderBottom: '1px solid #27272a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#fafafa' }}>Nearby people</span>
            <span style={{ fontSize: 12, color: '#71717a' }}>{nearby.length} found</span>
          </div>

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#71717a', fontSize: 14 }}>Looking around...</div>
          ) : noLocation ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: 32, textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📍</div>
              <div style={{ fontSize: 14, color: '#71717a', marginBottom: 8 }}>Location not shared</div>
              <div style={{ fontSize: 12, color: '#52525b' }}>Go to your profile and share your location first</div>
            </div>
          ) : nearby.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: 32, textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>👀</div>
              <div style={{ fontSize: 14, color: '#71717a', marginBottom: 8 }}>No one nearby yet</div>
              <div style={{ fontSize: 12, color: '#52525b' }}>Try increasing the radius</div>
            </div>
          ) : (
            <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
              {nearby.map((u) => (
                <div key={u.id} onClick={() => setSelected(u.id === selected ? null : u.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 10, marginBottom: 4, cursor: 'pointer', background: selected === u.id ? '#1e1b4b' : 'transparent', border: selected === u.id ? '1px solid #4f46e5' : '1px solid transparent', transition: 'all 0.15s' }}>
                  <Avatar url={u.avatarUrl} name={u.displayName || u.username} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#fafafa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.displayName || u.username}</div>
                    <div style={{ fontSize: 12, color: '#71717a', marginTop: 2 }}>📍 {u.distanceKm} km away</div>
                    {u.bio && <div style={{ fontSize: 12, color: '#52525b', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.bio}</div>}
                    <div style={{ marginTop: 4 }}><StatusBadge status={u.friendStatus} /></div>
                  </div>
                  {getAddBtn(u)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#18181b', border: '1px solid #27272a', borderRadius: 10, padding: '12px 20px', color: '#fafafa', fontSize: 14, boxShadow: '0 4px 24px rgba(0,0,0,0.4)', zIndex: 9999 }}>
          {toast}
        </div>
      )}
    </div>
  );
}
