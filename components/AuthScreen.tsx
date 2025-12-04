
import React, { useState, useEffect } from 'react';

interface AuthScreenProps {
  onLogin: (role: 'rep' | 'admin') => void;
}

export default function AuthScreen({ onLogin }: AuthScreenProps) {
  const [view, setView] = useState<'pin' | 'admin'>('pin');
  const [pin, setPin] = useState('');
  const [storedPin, setStoredPin] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const s = localStorage.getItem('leadAppPin');
    setStoredPin(s);
  }, []);

  const handlePinSubmit = () => {
    if (!pin) return;
    if (storedPin) {
      if (pin === storedPin) onLogin('rep');
      else setError('Incorrect PIN');
    } else {
      localStorage.setItem('leadAppPin', pin);
      setStoredPin(pin);
      onLogin('rep');
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        onLogin('admin');
      } else {
        const data = await res.json();
        setError(data.error || 'Invalid admin credentials');
      }
    } catch (err) {
      setError('Login failed. Could not connect to the server.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Lead Manager</h1>
        
        {view === 'pin' ? (
          <>
            <h2 className="text-lg mb-4 text-gray-700 text-center">
              {storedPin ? 'Enter Rep PIN' : 'Set Rep PIN (First Time)'}
            </h2>
            <input
              type="password"
              className="w-full border p-3 rounded-lg mb-4 text-2xl text-center tracking-widest text-black focus:ring-2 focus:ring-blue-500 focus:outline-none"
              maxLength={4}
              value={pin}
              onChange={(e) => { setError(''); setPin(e.target.value); }}
              placeholder="••••"
              onKeyUp={(e) => e.key === 'Enter' && handlePinSubmit()}
            />
            {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
            <button
              onClick={handlePinSubmit}
              className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              {storedPin ? 'Login' : 'Set PIN'}
            </button>
            <div className="mt-4 text-center">
              <button onClick={() => { setView('admin'); setError(''); }} className="text-sm text-gray-500 hover:underline">
                Admin Login
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleAdminLogin}>
            <h2 className="text-lg mb-4 text-gray-700 text-center">Admin Access</h2>
            <input
              className="w-full border p-2 rounded-lg mb-3 text-black focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <input
              className="w-full border p-2 rounded-lg mb-4 text-black focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-800 text-white p-3 rounded-lg font-semibold hover:bg-gray-900 transition disabled:bg-gray-500"
            >
              {loading ? 'Logging in...' : 'Login as Admin'}
            </button>
            <div className="mt-4 text-center">
              <button type="button" onClick={() => { setView('pin'); setError(''); }} className="text-sm text-gray-500 hover:underline">
                Back to Rep Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}