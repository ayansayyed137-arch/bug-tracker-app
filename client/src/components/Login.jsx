import React, { useState } from 'react';

export default function Login({ onLoginSuccess, switchToRegister }) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      console.log("Login Response Data:", data); // Debug ke liye

      if (response.ok) {
        // Token chahe data.token ho ya data.accessToken, yahan safely uth jayega
        const tokenToSave = data.token || data.accessToken || data.jwt;
        
        if (tokenToSave) {
          localStorage.setItem('token', tokenToSave);
          onLoginSuccess();
        } else {
          setError('Token not found in server response');
        }
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      console.error("Login error:", err);
      setError('Server error during login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center p-6 text-gray-100">
      <div className="glass-card p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/20 backdrop-blur-md">
        <h2 className="text-2xl font-extrabold text-white mb-6 text-center">Welcome Back</h2>
        
        {error && <div className="mb-4 p-3 bg-red-500/30 border border-red-500/50 text-red-200 text-sm rounded-xl">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-xl shadow-lg transition duration-200"
          >
            Login
          </button>
        </form>

        {switchToRegister && (
          <p className="text-sm text-gray-300 text-center mt-6">
            Don't have an account?{' '}
            <button onClick={switchToRegister} className="text-pink-400 hover:underline font-semibold">
              Register here
            </button>
          </p>
        )}
      </div>
    </div>
  );
}