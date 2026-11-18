import React, { useState } from 'react';

export default function Register({ onRegisterSuccess, switchToLogin }) {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Agar field 'name' hai, toh sirf alphabets aur spaces allow karein
    if (name === 'name') {
      const alphabetRegex = /^[A-Za-z\s]*$/;
      if (!alphabetRegex.test(value)) {
        return; 
      }
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const nameRegex = /^[A-Za-z\s]+$/;
    if (!nameRegex.test(formData.name.trim())) {
      setError('Name should contain only alphabets');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      
      if (response.ok) {
        setSuccessMsg('Registration successful! Please login.');
        setTimeout(() => {
          onRegisterSuccess();
        }, 1200);
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('Server error during registration');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="glass-card p-8 rounded-2xl shadow-2xl border border-white/20 backdrop-blur-md text-gray-100">
        <h2 className="text-2xl font-extrabold text-white mb-6 text-center">Create Account</h2>
        
        {error && <div className="mb-4 p-3 bg-red-500/30 border border-red-500/50 text-red-200 text-sm rounded-xl">{error}</div>}
        {successMsg && <div className="mb-4 p-3 bg-green-500/30 border border-green-500/50 text-green-200 text-sm rounded-xl">{successMsg}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
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
              className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-xl shadow-lg transition duration-200"
          >
            Register
          </button>
        </form>

        {switchToLogin && (
          <p className="text-sm text-gray-300 text-center mt-6">
            Already have an account?{' '}
            <button onClick={switchToLogin} className="text-pink-400 hover:underline font-semibold">
              Login here
            </button>
          </p>
        )}
      </div>
    </div>
  );
}