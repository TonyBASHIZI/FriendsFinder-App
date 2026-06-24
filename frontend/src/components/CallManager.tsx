import { useEffect, useRef, useState } from 'react';
import { useSocketStore } from '../stores/socket.store';
import { useCallStore } from '../stores/call.store';
import { useAuthStore } from '../stores/auth.store';
import { avatarSrc } from '../utils/avatar';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export function CallManager() {
  const { socket } = useSocketStore();
  const { user } = useAuthStore();
  const {
    status, incomingCall, targetUserId, targetName, targetAvatar,
    peerConnection, localStream, remoteStream, callStartTime,
    setStatus, setIncomingCall, setTarget, setPeerConnection,
    setLocalStream, setRemoteStream, setCallStartTime, reset,
  } = useCallStore();

  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const [elapsed, setElapsedDisplay] = useState('00:00');
  const ringtoneIntervalRef = useRef<any>(null);

  function playRingBeep() {
    try {
      const ctx = new AudioContext();
      const o1 = ctx.createOscillator();
      const o2 = ctx.createOscillator();
      const g = ctx.createGain();
      o1.connect(g);
      o2.connect(g);
      g.connect(ctx.destination);
      o1.frequency.value = 480;
      o2.frequency.value = 620;
      g.gain.setValueAtTime(0.15, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      o1.start(ctx.currentTime);
      o2.start(ctx.currentTime);
      o1.stop(ctx.currentTime + 0.6);
      o2.stop(ctx.currentTime + 0.6);
    } catch {}
  }

  function startRingtone() {
    playRingBeep();
    ringtoneIntervalRef.current = setInterval(playRingBeep, 1500);
  }

  function stopRingtone() {
    if (ringtoneIntervalRef.current) {
      clearInterval(ringtoneIntervalRef.current);
      ringtoneIntervalRef.current = null;
    }
  }

  useEffect(() => {
    if (status !== 'in-call' || !callStartTime) return;
    const interval = setInterval(() => {
      const secs = Math.floor((Date.now() - callStartTime) / 1000);
      const m = Math.floor(secs / 60).toString().padStart(2, '0');
      const s = (secs % 60).toString().padStart(2, '0');
      setElapsedDisplay(m + ':' + s);
    }, 1000);
    return () => clearInterval(interval);
  }, [status, callStartTime]);

  useEffect(() => {
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  function cleanupCall() {
    stopRingtone();
    const pc = useCallStore.getState().peerConnection;
    const stream = useCallStore.getState().localStream;
    pc?.close();
    stream?.getTracks().forEach((t) => t.stop());
    reset();
    setElapsedDisplay('00:00');
  }

  useEffect(() => {
    if (!socket) return;

    socket.on('incoming_call', (data) => {
      setIncomingCall(data);
      setStatus('ringing');
      startRingtone();
    });

    socket.on('call_answered', async ({ answer }) => {
      const pc = useCallStore.getState().peerConnection;
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        setStatus('in-call');
        setCallStartTime(Date.now());
      }
    });

    socket.on('ice_candidate', async ({ candidate }) => {
      const pc = useCallStore.getState().peerConnection;
      if (pc && candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('Error adding ICE candidate', e);
        }
      }
    });

    socket.on('call_ended', () => {
      cleanupCall();
    });

    socket.on('call_declined', () => {
      console.log('call_declined event received on frontend!');
      cleanupCall();
    });
    socket.on('call_timeout', () => {
      cleanupCall();
    });

    return () => {
      socket.off('incoming_call');
      socket.off('call_answered');
      socket.off('ice_candidate');
      socket.off('call_ended');
      socket.off('call_declined');
      socket.off('call_timeout');
    };
  }, [socket]);

  async function startCall(targetId: string, name: string, avatar: string | null) {
    setTarget(targetId, name, avatar);
    setStatus('calling');

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    setLocalStream(stream);

    const pc = new RTCPeerConnection(ICE_SERVERS);
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket?.emit('ice_candidate', { targetUserId: targetId, candidate: event.candidate });
      }
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    setPeerConnection(pc);

    socket?.emit('call_user', {
      targetUserId: targetId,
      offer,
      callerName: user?.displayName || user?.username,
      callerAvatar: user?.avatarUrl || null,
    });
  }

  async function acceptCall() {
    if (!incomingCall) return;
    stopRingtone();
    setStatus('in-call');
    setCallStartTime(Date.now());

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    setLocalStream(stream);

    const pc = new RTCPeerConnection(ICE_SERVERS);
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket?.emit('ice_candidate', { targetUserId: incomingCall.callerId, candidate: event.candidate });
      }
    };

    await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    setPeerConnection(pc);
    setTarget(incomingCall.callerId, incomingCall.callerName, incomingCall.callerAvatar);

    socket?.emit('answer_call', { callerId: incomingCall.callerId, answer });
    setIncomingCall(null);
  }

  function declineCall() {
    if (!incomingCall) return;
    stopRingtone();
    socket?.emit('decline_call', { callerId: incomingCall.callerId });
    setIncomingCall(null);
    setStatus('idle');
  }

  function endCall() {
    if (targetUserId) {
      socket?.emit('end_call', { targetUserId });
    }
    cleanupCall();
  }

  useEffect(() => {
    (window as any).__startCall = startCall;
  }, [socket, user]);

  if (status === 'idle') return null;

  const displayAvatar = avatarSrc(status === 'ringing' ? incomingCall?.callerAvatar || null : targetAvatar);
  const displayName = status === 'ringing' ? incomingCall?.callerName : targetName;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000,
      fontFamily: 'Inter, sans-serif',
    }}>
      <audio ref={remoteAudioRef} autoPlay />

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        <div style={{
          width: 120, height: 120, borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1, #a855f7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48,
          overflow: 'hidden', boxShadow: '0 0 0 8px rgba(99,102,241,0.15)',
          animation: status === 'ringing' || status === 'calling' ? 'callPulse 1.5s infinite' : 'none',
        }}>
          {displayAvatar ? <img src={displayAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🧑'}
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 600, color: '#fafafa' }}>{displayName}</div>
          <div style={{ fontSize: 14, color: '#a1a1aa', marginTop: 6 }}>
            {status === 'calling' && 'Calling...'}
            {status === 'ringing' && 'Incoming call...'}
            {status === 'in-call' && elapsed}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 20, marginTop: 10 }}>
          {status === 'ringing' ? (
            <>
              <button onClick={declineCall} style={{
                width: 60, height: 60, borderRadius: '50%', background: '#ef4444', border: 'none',
                color: 'white', fontSize: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>✕</button>
              <button onClick={acceptCall} style={{
                width: 60, height: 60, borderRadius: '50%', background: '#22c55e', border: 'none',
                color: 'white', fontSize: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>📞</button>
            </>
          ) : (
            <button onClick={endCall} style={{
              width: 60, height: 60, borderRadius: '50%', background: '#ef4444', border: 'none',
              color: 'white', fontSize: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>✕</button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes callPulse {
          0%, 100% { box-shadow: 0 0 0 8px rgba(99,102,241,0.15); }
          50% { box-shadow: 0 0 0 16px rgba(99,102,241,0.25); }
        }
      `}</style>
    </div>
  );
}