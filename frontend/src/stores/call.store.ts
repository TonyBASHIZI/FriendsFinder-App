import { create } from 'zustand';

export interface IncomingCall {
  callerId: string;
  callerName: string;
  callerAvatar: string | null;
  offer: RTCSessionDescriptionInit;
}

interface CallState {
  status: 'idle' | 'calling' | 'ringing' | 'in-call';
  incomingCall: IncomingCall | null;
  targetUserId: string | null;
  targetName: string | null;
  targetAvatar: string | null;
  peerConnection: RTCPeerConnection | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  callStartTime: number | null;

  setStatus: (s: CallState['status']) => void;
  setIncomingCall: (call: IncomingCall | null) => void;
  setTarget: (id: string | null, name: string | null, avatar: string | null) => void;
  setPeerConnection: (pc: RTCPeerConnection | null) => void;
  setLocalStream: (s: MediaStream | null) => void;
  setRemoteStream: (s: MediaStream | null) => void;
  setCallStartTime: (t: number | null) => void;
  reset: () => void;
}

export const useCallStore = create<CallState>((set) => ({
  status: 'idle',
  incomingCall: null,
  targetUserId: null,
  targetName: null,
  targetAvatar: null,
  peerConnection: null,
  localStream: null,
  remoteStream: null,
  callStartTime: null,

  setStatus: (status) => set({ status }),
  setIncomingCall: (incomingCall) => set({ incomingCall }),
  setTarget: (targetUserId, targetName, targetAvatar) => set({ targetUserId, targetName, targetAvatar }),
  setPeerConnection: (peerConnection) => set({ peerConnection }),
  setLocalStream: (localStream) => set({ localStream }),
  setRemoteStream: (remoteStream) => set({ remoteStream }),
  setCallStartTime: (callStartTime) => set({ callStartTime }),

  reset: () => set({
    status: 'idle',
    incomingCall: null,
    targetUserId: null,
    targetName: null,
    targetAvatar: null,
    peerConnection: null,
    localStream: null,
    remoteStream: null,
    callStartTime: null,
  }),
}));