import { useState, useEffect } from 'react';
import { BackgroundAnimation } from '../components/BackgroundAnimation';
import { FloatingNotes } from '../components/FloatingNotes';
import { ParticleField } from '../components/ParticleField';
import { PulsingRings } from '../components/PulsingRings';
import { io } from 'socket.io-client';
import { djLogin } from '../utils/apiClient';
import styles from './DJLoginAuthBox.module.css';

const API_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000';
const SOCKET_URL = (import.meta as any).env?.VITE_SOCKET_URL || 'http://localhost:5000';

interface DJLoginProps {
  onLoginSuccess: () => void;
}

export function DJLogin({ onLoginSuccess }: DJLoginProps) {
  const [username, setUsername] = useState('');
  const [authKey, setAuthKey] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'pending' | 'approved' | 'denied'>('idle');
  const [error, setError] = useState('');
  const [requestId, setRequestId] = useState('');

  useEffect(() => {
    if (status !== 'pending' || !requestId) return;

    const socket = io(SOCKET_URL, { transports: ['websocket'] });

    const joinAccessRoom = () => {
      socket.emit('join_dj_access', { requestId });
    };

    socket.on('connect', joinAccessRoom);
    joinAccessRoom();

    socket.on('dj.access.approved', async ({ requestId: approvedId }) => {
      if (approvedId === requestId) {
        try {
          await djLogin(username, authKey);
        } catch (error) {
          console.error('DJ token login failed after approval:', error);
          setError('Could not start DJ session');
          setStatus('idle');
          return;
        }

        setStatus('approved');
        // Store DJ session
        sessionStorage.setItem('dj_username', username);
        sessionStorage.setItem('dj_authKey', authKey);
        sessionStorage.setItem('dj_authenticated', 'true');
        window.dispatchEvent(new Event('dj_session_ready'));
        // Redirect after brief delay
        setTimeout(() => {
          onLoginSuccess();
        }, 1500);
      }
    });

    socket.on('dj.access.denied', ({ requestId: deniedId }) => {
      if (deniedId === requestId) {
        setStatus('denied');
        setError('Access denied by administrator');
      }
    });

    return () => {
      socket.emit('leave_dj_access');
      socket.disconnect();
    };
  }, [status, requestId, username, authKey, onLoginSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStatus('submitting');

    try {
      const response = await fetch(`${API_URL}/dj-access-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, authKey })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === 'invalid_credentials') {
          setError('Invalid username or authentication key');
        } else if (data.error === 'dj_has_active_session') {
          setError('You already have an active session at another venue. Please logout from that venue first.');
        } else {
          setError(data.error || 'Request failed');
        }
        setStatus('idle');
        return;
      }

      if (data.message === 'request_already_pending') {
        setRequestId(data.request.id);
        setStatus('pending');
        return;
      }

      setRequestId(data.request.id);
      setStatus('pending');
    } catch (err) {
      setError('Network error. Please try again.');
      setStatus('idle');
    }
  };

  const handleRetry = () => {
    setStatus('idle');
    setError('');
    setRequestId('');
    setUsername('');
    setAuthKey('');
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-900 via-indigo-900 to-pink-900">
      <BackgroundAnimation />
      <PulsingRings />
      <FloatingNotes />
      <ParticleField />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-10">
        <div className={styles.authCard}>
          <div className={styles.header}>
            <h1 className={styles.title}>DJ COMMAND CENTER</h1>
            <p className={styles.subtitle}>Authorization required to control the live queue</p>
          </div>

          {status === 'idle' || status === 'submitting' ? (
            <form onSubmit={handleSubmit} className={styles.form}>
              {error && <div className={styles.error}>{error}</div>}
              <div className={styles.field}>
                <label className={styles.label} htmlFor="dj-username">
                  Username
                </label>
                <input
                  id="dj-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={status === 'submitting'}
                  className={styles.input}
                  placeholder="Enter your DJ username"
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="dj-auth-key">
                  Authentication Key
                </label>
                <input
                  id="dj-auth-key"
                  type="password"
                  value={authKey}
                  onChange={(e) => setAuthKey(e.target.value)}
                  disabled={status === 'submitting'}
                  className={styles.input}
                  placeholder="Enter your auth key"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={status === 'submitting' || !username || !authKey}
                className={styles.button}
              >
                Request Access
              </button>

              <p className={styles.helper}>
                Only authorized DJs can enter the command center.
                <br />
                Contact your administrator to obtain credentials.
              </p>
            </form>
          ) : status === 'pending' ? (
            <div className={styles.statusPanel}>
              <p className={styles.statusTitle}>Awaiting Approval</p>
              <p className={styles.statusText}>Your access request was sent to the administrator.</p>
              <p className={styles.statusMuted}>Hold tight while the request is reviewed...</p>
            </div>
          ) : status === 'approved' ? (
            <div className={styles.statusPanel}>
              <p className={styles.statusTitle}>Access Granted</p>
              <p className={styles.statusText}>Signing you in...</p>
            </div>
          ) : (
            <div className={styles.statusPanel}>
              <p className={styles.statusTitle}>Access Denied</p>
              <p className={styles.statusText}>{error}</p>
              <button type="button" onClick={handleRetry} className={styles.retryButton}>
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
