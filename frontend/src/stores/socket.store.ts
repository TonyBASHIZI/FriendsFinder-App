
import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

interface SocketState {
  socket: Socket | null;
  onlineUsers: Set<string>;
  totalUnread: number;
  connect: (token: string) => void;
  disconnect: () => void;
  setTotalUnread: (n: number) => void;
  incrementUnread: () => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  onlineUsers: new Set(),
  totalUnread: 0,

  connect: (token: string) => {
    const existing = get().socket;
    if (existing?.connected) return;

    const s = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000', {
      auth: { token },
      transports: ['websocket'],
    });

    s.on('connect', () => console.log('Global socket connected'));

    s.on('online_users', (userIds: string[]) => {
      set({ onlineUsers: new Set(userIds) });
    });

    s.on('user_online', ({ userId }: { userId: string }) => {
      set((state) => ({ onlineUsers: new Set([...state.onlineUsers, userId]) }));
    });

    s.on('user_offline', ({ userId }: { userId: string }) => {
      set((state) => {
        const n = new Set(state.onlineUsers);
        n.delete(userId);
        return { onlineUsers: n };
      });
    });

    set({ socket: s });
  },

  disconnect: () => {
    get().socket?.disconnect();
    set({ socket: null, onlineUsers: new Set(), totalUnread: 0 });
  },

  setTotalUnread: (n: number) => set({ totalUnread: n }),
  incrementUnread: () => set((state) => ({ totalUnread: state.totalUnread + 1 })),
}));