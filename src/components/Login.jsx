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

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error when user starts typing
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        // Login logic
        if (!formData.username || !formData.password) {
          setError('Please enter both username and password');
          setLoading(false);
          return;
        }

        const response = await fetch('https://pharmacy-backend-qrb8.onrender.com/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: formData.username,
            password: formData.password
          }),
        });

        const data = await response.json();

        if (response.ok) {
          // Store token and user data
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data));
          onLogin(data);
        } else {
          setError(data.message || 'Login failed');
        }
      } else {
        // Registration logic
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match!');
          setLoading(false);
          return;
        }
        if (!formData.username || !formData.email || !formData.password || !formData.pharmacyName) {
          setError('Please fill in all required fields');
          setLoading(false);
          return;
        }

        const response = await fetch('http://localhost:5000/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: formData.username,
            email: formData.email,
            password: formData.password,
            pharmacyName: formData.pharmacyName,
            phone: formData.phone
          }),
        });

        const data = await response.json();

        if (response.ok) {
          // Store token and user data
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data));
          onLogin(data);
        } else {
          setError(data.message || 'Registration failed');
        }
      }
    } catch (error) {
      setError('Network error. Please try again.');
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

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
                : 'Register your pharmacy to get started'
              }
            </p>
          </div>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

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
                  required={!isLogin}
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
                  required={!isLogin}
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
                    required={!isLogin}
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
              {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <div className="auth-switch">
            <p>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button type="button" className="switch-btn" onClick={switchMode}>
                {isLogin ? 'Register here' : 'Sign in here'}
              </button>
            </p>
          </div>

          {isLogin && (
            <div className="login-demo">
              <p>
                <strong>Demo Credentials:</strong><br />
                Use any valid credentials from your database
              </p>
            </div>
          )}

          <div className="login-footer">
            <p>Pharmacy Management System © 2024</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
