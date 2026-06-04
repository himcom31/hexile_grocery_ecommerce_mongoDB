import React, { useState } from 'react';
import { X, Eye, EyeOff, ChevronDown } from 'lucide-react';

// ─────────────────────────────────────────────────────
// Base API URL — set this in your .env file
// REACT_APP_API_URL=http://localhost:5000
// ─────────────────────────────────────────────────────
const API_URL = 'http://localhost:5000';

const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Argentina', 'Australia',
  'Austria', 'Bangladesh', 'Belgium', 'Brazil', 'Canada',
  'China', 'Colombia', 'Czech Republic', 'Denmark', 'Egypt',
  'Ethiopia', 'Finland', 'France', 'Germany', 'Ghana',
  'Greece', 'Hungary', 'India', 'Indonesia', 'Iran',
  'Iraq', 'Ireland', 'Israel', 'Italy', 'Japan',
  'Jordan', 'Kenya', 'Malaysia', 'Mexico', 'Morocco',
  'Netherlands', 'New Zealand', 'Nigeria', 'Norway', 'Pakistan',
  'Philippines', 'Poland', 'Portugal', 'Romania', 'Russia',
  'Saudi Arabia', 'South Africa', 'South Korea', 'Spain', 'Sri Lanka',
  'Sweden', 'Switzerland', 'Thailand', 'Turkey', 'Ukraine',
  'United Arab Emirates', 'United Kingdom', 'United States', 'Vietnam',
];


// ── Login Form ────────────────────────────────────────
const LoginForm = ({ onSwitch, onClose, onLoginSuccess }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword]     = useState('');
  const [showPass, setShowPass]     = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  const handleSubmit = async () => {
    setError('');

    // ── Client-side validation ──
    if (!identifier.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      // ── POST /api/user/login ──
      const res = await fetch(`${API_URL}/api/user/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ identifier: identifier.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Show error message returned by the backend
        setError(data.message || 'Login failed. Please try again.');
        return;
      }

      // ── Success: save token + user, notify parent ──
      localStorage.setItem('userToken', data.token);
      localStorage.setItem('userInfo',  JSON.stringify(data.user));
      onLoginSuccess(data.token, data.user);

    } catch (err) {
      // Network error or server down
      setError('Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Allow submit on Enter key
  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSubmit(); };

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Welcome!</h2>
        <p className="text-gray-500 mt-1 text-sm">Please Login to continue</p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {/* Email / Phone */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email / Phone Number
        </label>
        <input
          type="text"
          value={identifier}
          onChange={e => setIdentifier(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="user@readygrocery.com"
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
        />
      </div>

      {/* Password */}
      <div className="mb-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <div className="relative">
          <input
            type={showPass ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="••••••"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPass(p => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPass ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
        </div>
      </div>

      {/* Forgot Password */}
      <div className="flex justify-end mb-6">
        <button className="text-sm text-gray-600 hover:text-green-600 transition">
          Forgot Password?
        </button>
      </div>

      {/* Login Button */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-semibold py-3 rounded-full text-sm transition-colors duration-200 flex items-center justify-center gap-2"
      >
        {loading && (
          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
        )}
        {loading ? 'Logging in...' : 'Log in'}
      </button>

      {/* Switch to Signup */}
      <p className="text-center text-sm text-gray-600 mt-5">
        Don't have an account?{' '}
        <button onClick={onSwitch} className="text-green-500 font-semibold hover:underline">
          Sign Up
        </button>
      </p>
    </>
  );
};


// ── Signup Form ───────────────────────────────────────
const SignupForm = ({ onSwitch, onClose }) => {
  const [fullName, setFullName] = useState('');
  const [country, setCountry]   = useState('');
  const [phone, setPhone]       = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    // ── Client-side validation ──
    if (!fullName.trim() || !country || !phone.trim() || !email.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      // ── POST /api/user/register ──
      const res = await fetch(`${API_URL}/api/user/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          fullName: fullName.trim(),
          country,
          phone:    phone.trim(),
          email:    email.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Registration failed. Please try again.');
        return;
      }

      // ── Success: show message then switch to login ──
      setSuccess('Account created successfully! Please log in.');
      setTimeout(() => onSwitch(), 1500);

    } catch (err) {
      setError('Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Welcome!</h2>
        <p className="text-gray-500 mt-1 text-sm">Create your account</p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {/* Success Banner */}
      {success && (
        <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          {success}
        </div>
      )}

      {/* Full Name */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
        <input
          type="text"
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          placeholder="Enter full name"
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
        />
      </div>

      {/* Country */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
        <div className="relative">
          <select
            value={country}
            onChange={e => setCountry(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-800 appearance-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition bg-white"
          >
            <option value="">Select Country</option>
            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Phone Number */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
        <div className="flex border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-green-500 focus-within:border-transparent transition">
          <span className="bg-gray-50 border-r border-gray-300 px-3 py-3 text-sm text-gray-600 font-medium flex items-center">
            +00
          </span>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="Enter phone number"
            className="flex-1 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none bg-white"
          />
        </div>
      </div>

      {/* Email */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Enter email address"
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
        />
      </div>

      {/* Password */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Create Password</label>
        <div className="relative">
          <input
            type={showPass ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter Password"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPass(p => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPass ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
        </div>
      </div>

      {/* Terms */}
      <p className="text-xs text-gray-500 mb-4">
        By clicking the 'Sign up' button, you agree with our{' '}
        <a href="#" className="text-green-500 hover:underline">Terms & Conditions</a>
        {' '}and{' '}
        <a href="#" className="text-green-500 hover:underline">Privacy Policy</a>
      </p>

      {/* Signup Button */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-semibold py-3 rounded-full text-sm transition-colors duration-200 flex items-center justify-center gap-2"
      >
        {loading && (
          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
        )}
        {loading ? 'Creating account...' : 'Sign up'}
      </button>

      {/* Switch to Login */}
      <p className="text-center text-sm text-gray-600 mt-5">
        Already have an account?{' '}
        <button onClick={onSwitch} className="text-green-500 font-semibold hover:underline">
          Log in
        </button>
      </p>
    </>
  );
};


// ── Main AuthModal ────────────────────────────────────
const AuthModal = ({ mode = 'login', onClose, onLoginSuccess }) => {
  const [currentMode, setCurrentMode] = useState(mode);

  // Prevent background scroll when modal is open
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative max-h-[90vh] overflow-y-auto">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition z-10"
        >
          <X size={16} />
        </button>

        <div className="p-8">
          {currentMode === 'login' ? (
            <LoginForm
              onSwitch={() => setCurrentMode('signup')}
              onClose={onClose}
              onLoginSuccess={onLoginSuccess}
            />
          ) : (
            <SignupForm
              onSwitch={() => setCurrentMode('login')}
              onClose={onClose}
            />
          )}
        </div>

      </div>
    </div>
  );
};

export default AuthModal;