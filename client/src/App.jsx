import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    const handleStorageChange = () => {
      setToken(localStorage.getItem('token'));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleLoginSuccess = () => {
    setToken(localStorage.getItem('token'));
  };

  const handleRegisterSuccess = () => {
    // Register hone ke baad user ko seedha Login tab par bhej do
    setIsLogin(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  // If token exists, show the Dashboard directly
  if (token) {
    return <Dashboard onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-gray-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <h1 className="text-4xl font-extrabold text-white tracking-tight">Bug Tracker App</h1>
        <p className="mt-2 text-sm text-gray-300">Track and manage your project issues efficiently</p>
        
        <div className="mt-6 flex justify-center space-x-4">
          <button
            onClick={() => setIsLogin(true)}
            className={`px-6 py-2.5 font-bold rounded-xl transition duration-200 ${
              isLogin 
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' 
                : 'bg-white/10 text-gray-200 border border-white/20 hover:bg-white/20 backdrop-blur-md'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`px-6 py-2.5 font-bold rounded-xl transition duration-200 ${
              !isLogin 
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' 
                : 'bg-white/10 text-gray-200 border border-white/20 hover:bg-white/20 backdrop-blur-md'
            }`}
          >
            Register
          </button>
        </div>
      </div>

      <div className="mt-2 flex justify-center px-4">
        <div className="w-full max-w-md">
          {isLogin ? (
            <Login onLoginSuccess={handleLoginSuccess} />
          ) : (
            <Register onRegisterSuccess={handleRegisterSuccess} />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;