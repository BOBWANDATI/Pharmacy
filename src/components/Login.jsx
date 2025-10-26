import React, { useState } from 'react';
import './Login.css';

const Login = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    pharmacyName: '',
    phone: ''
  });

  // ✅ Backend base URL (Vercel → uses env variable)
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    'https://pharmacy-backend-qrb8.onrender.com';

  console.log('🔗 Using API Base URL:', API_BASE_URL);

  // ---------------------------
  // Handle input changes
  // ---------------------------
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  // ---------------------------
  // Submit form (Login / Register)
  // ---------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Define endpoint
      const endpoint = isLogin
        ? `${API_BASE_URL}/api/auth/login`
        : `${API_BASE_URL}/api/auth/register`;

      // Prepare request data
      const payload = isLogin
        ? {
            username: formData.username,
            password: formData.password
          }
        : {
            username: formData.username,
            email: formData.email,
            password: formData.password,
            pharmacyName: formData.pharmacyName,
            phone: formData.phone
          };

      // Simple validation
      if (!formData.username || !formData.password) {
        setError('Please enter your username and password');
        setLoading(false);
        return;
      }

      if (!isLogin && formData.password !== formData.confirmPassword) {
        setError('Passwords do not match!');
        setLoading(false);
        return;
      }

      // Send request to backend
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      console.log('✅ API Response:', data);

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data));
        onLogin(data);
      } else {
        setError(data.message || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('❌ Network/Auth error:', error);
      setError('Network error. Please check your connection or try again.');
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------
  // Switch between Login/Register
  // ---------------------------
  const switchMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      pharmacyName: '',
      phone: ''
    });
    setError('');
  };

  // ---------------------------
  // JSX
  // ---------------------------
  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="logo">
              <h1>PharmaLink</h1>
            </div>
            <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
            <p>
              {isLogin
                ? 'Sign in to your pharmacy management system'
                : 'Register your pharmacy to get started'}
            </p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            {!isLogin && (
              <div className="form-group">
                <label className="form-label">Pharmacy Name *</label>
                <input
                  type="text"
                  name="pharmacyName"
                  className="form-input"
                  value={formData.pharmacyName}
                  onChange={handleInputChange}
                  placeholder="Enter your pharmacy name"
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Username *</label>
              <input
                type="text"
                name="username"
                className="form-input"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Enter your username"
                required
              />
            </div>

            {!isLogin && (
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Password *</label>
              <input
                type="password"
                name="password"
                className="form-input"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                required
              />
            </div>

            {!isLogin && (
              <>
                <div className="form-group">
                  <label className="form-label">Confirm Password *</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    className="form-input"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm your password"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    className="form-input"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter your phone number"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              className={`btn btn-primary login-btn ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading
                ? 'Please wait...'
                : isLogin
                ? 'Sign In'
                : 'Create Account'}
            </button>
          </form>

          <div className="auth-switch">
            <p>
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button type="button" className="switch-btn" onClick={switchMode}>
                {isLogin ? 'Register here' : 'Sign in here'}
              </button>
            </p>
          </div>

          <div className="login-footer">
            <p>Pharmacy Management System © 2025</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
