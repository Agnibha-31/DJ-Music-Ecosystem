import { useNavigate } from 'react-router';
import { useState } from 'react';
import styles from './AdminLogin.module.css';
import { setAdminAuth, setCurrentAdminProfile } from '../utils/adminStorage';
import { adminSignup } from '../utils/apiClient';

export function AdminSignUp() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isValidName = (value: string) => /^[A-Z][a-zA-Z]{1,}$/.test(value.trim());
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

  const handleCreateAccount = async () => {
    const nextErrors: Record<string, string> = {};
    if (!isValidName(firstName)) {
      nextErrors.firstName = 'First name must be 2+ letters, start uppercase, letters only.';
    }
    if (!isValidName(lastName)) {
      nextErrors.lastName = 'Last name must be 2+ letters, start uppercase, letters only.';
    }
    if (!email.trim()) {
      nextErrors.email = 'Email is required.';
    }
    if (!isValidPassword(password)) {
      nextErrors.password = 'Password must be 8 chars with upper, lower, number, special.';
    }
    if (password !== confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      alert('Please fix the highlighted errors.');
      return;
    }

    const profile = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      username: firstName.trim().toLowerCase()
    };

    try {
      await adminSignup({
        username: profile.username,
        email: profile.email,
        password: password.trim(),
        firstName: profile.firstName,
        lastName: profile.lastName
      });
      setCurrentAdminProfile(profile);
      setAdminAuth(true);
      navigate('/');
    } catch {
      alert('Unable to create account. Please try another email or username.');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Create Account</h1>
          <p className={styles.subtitle}>Set up your admin profile</p>
        </div>
        <form className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="admin-first-name">
              First Name
            </label>
            <input
              className={styles.input}
              id="admin-first-name"
              type="text"
              placeholder="Enter your first name"
              value={firstName}
              onChange={(e) => {
                const value = e.target.value;
                setFirstName(value);
                if (!value.trim()) {
                  clearFieldError('firstName');
                } else if (!isValidName(value)) {
                  setFieldError('firstName', 'First name must be 2+ letters, start uppercase, letters only.');
                } else {
                  clearFieldError('firstName');
                }
              }}
            />
            {errors.firstName && <span className={styles.errorText}>{errors.firstName}</span>}
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="admin-last-name">
              Last Name
            </label>
            <input
              className={styles.input}
              id="admin-last-name"
              type="text"
              placeholder="Enter your last name"
              value={lastName}
              onChange={(e) => {
                const value = e.target.value;
                setLastName(value);
                if (!value.trim()) {
                  clearFieldError('lastName');
                } else if (!isValidName(value)) {
                  setFieldError('lastName', 'Last name must be 2+ letters, start uppercase, letters only.');
                } else {
                  clearFieldError('lastName');
                }
              }}
            />
            {errors.lastName && <span className={styles.errorText}>{errors.lastName}</span>}
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
                if (confirmPassword && value !== confirmPassword) {
                  setFieldError('confirmPassword', 'Passwords do not match.');
                } else {
                  clearFieldError('confirmPassword');
                }
              }}
            />
            {errors.password && <span className={styles.errorText}>{errors.password}</span>}
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="admin-confirm-password">
              Confirm Password
            </label>
            <input
              className={styles.input}
              id="admin-confirm-password"
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => {
                const value = e.target.value;
                setConfirmPassword(value);
                if (!value) {
                  clearFieldError('confirmPassword');
                } else if (value !== password) {
                  setFieldError('confirmPassword', 'Passwords do not match.');
                } else {
                  clearFieldError('confirmPassword');
                }
              }}
            />
            {errors.confirmPassword && <span className={styles.errorText}>{errors.confirmPassword}</span>}
          </div>
          <button className={styles.button} type="button" onClick={handleCreateAccount}>
            Create Account
          </button>
        </form>
      </div>
    </div>
  );
}
