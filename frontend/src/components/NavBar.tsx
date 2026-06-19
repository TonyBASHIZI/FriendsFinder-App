import { useNavigate, useLocation } from 'react-router-dom';
import { useSocketStore } from '../stores/socket.store';

export function NavButton({ label, path }: { label: string; path: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalUnread } = useSocketStore();
  const isChat = path === '/chat';
  const isActive = location.pathname === path;

  return (
    <button onClick={() => navigate(path)} style={{
      padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
      fontFamily: 'inherit', cursor: 'pointer',
      border: isActive ? '1px solid #6366f1' : '1px solid #27272a',
      background: isActive ? '#1e1b4b' : 'transparent',
      color: isActive ? '#fafafa' : '#a1a1aa',
      position: 'relative',
    }}>
      {label}
      {isChat && totalUnread > 0 && (
        <span style={{
          position: 'absolute', top: -6, right: -6,
          background: '#ef4444', color: 'white', fontSize: 10, fontWeight: 700,
          padding: '1px 5px', borderRadius: 99, minWidth: 16, textAlign: 'center',
          border: '2px solid #18181b',
        }}>
          {totalUnread > 9 ? '9+' : totalUnread}
        </span>
      )}
    </button>
  );
}