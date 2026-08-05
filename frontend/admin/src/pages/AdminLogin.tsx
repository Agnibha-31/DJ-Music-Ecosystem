import { Link, useNavigate } from 'react-router';
import { useState } from 'react';
import styles from './AdminLogin.module.css';
import { setAdminAuth, setCurrentAdminProfile } from '../utils/adminStorage';
import { adminLogin } from '../utils/apiClient';
import { AlertCircle } from 'lucide-react';

export function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isValidPassword = (value: string) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(value);

  const setFieldError = (key: string, message: string) => {
    setErrors((prev) => ({ ...prev, [key]: message }));
  };

  const clearFieldError = (key: string) => {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleLogin = async () => {
    setLoginError(null);
    const nextErrors: Record<string, string> = {};
    if (!username.trim()) {
      nextErrors.username = 'Username is required.';
    }
    if (!email.trim()) {
      nextErrors.email = 'Email is required.';
    }
    if (!isValidPassword(password)) {
      nextErrors.password = 'Password must be 8 chars with upper, lower, number, special.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setLoginError('Please fix the highlighted errors.');
      return;
    }

    setIsLoading(true);

    try {
      await adminLogin({ username: username.trim(), email: email.trim(), password });
      setCurrentAdminProfile({ username: username.trim(), email: email.trim() });
      setAdminAuth(true);
      navigate('/');
    } catch {
      setLoginError('Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Admin Login</h1>
          <p className={styles.subtitle}>Enter your admin credentials</p>
        </div>

        {loginError && (
          <div className="mb-4 flex items-center gap-3 rounded-lg border border-red-500 bg-red-500/10 p-3 text-red-500">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span className="font-medium text-sm">
              {loginError}
            </span>
          </div>
        )}

        <form className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="admin-username">
              Username
            </label>
            <input
              className={styles.input}
              id="admin-username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => {
                const value = e.target.value;
                setUsername(value);
                if (value.trim()) {
                  clearFieldError('username');
                }
              }}
              disabled={isLoading}
            />
            {errors.username && <span className={styles.errorText}>{errors.username}</span>}
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="admin-email">
              Email
            </label>
            <input
              className={styles.input}
              id="admin-email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => {
                const value = e.target.value;
                setEmail(value);
                if (value.trim()) {
                  clearFieldError('email');
                }
              }}
              disabled={isLoading}
            />
            {errors.email && <span className={styles.errorText}>{errors.email}</span>}
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="admin-password">
              Password
            </label>
            <input
              className={styles.input}
              id="admin-password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                const value = e.target.value;
                setPassword(value);
                if (!value) {
                  clearFieldError('password');
                } else if (!isValidPassword(value)) {
                  setFieldError('password', 'Password must be 8 chars with upper, lower, number, special.');
                } else {
                  clearFieldError('password');
                }
              }}
              disabled={isLoading}
            />
            {errors.password && <span className={styles.errorText}>{errors.password}</span>}
          </div>
          <button
            className={`${styles.button} ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            type="button"
            onClick={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? 'Logging In...' : 'Log In'}
          </button>
          <Link className={`${styles.link} ${isLoading ? 'pointer-events-none opacity-50' : ''}`} to="/signup">
            New ? Create Account !
          </Link>
        </form>
      </div>
    </div>
  );
}
