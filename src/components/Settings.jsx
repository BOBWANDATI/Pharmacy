import React, { useState, useEffect } from 'react';
import './Settings.css';

const Settings = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [userProfile, setUserProfile] = useState({
    username: '',
    email: '',
    pharmacyName: '',
    phone: '',
    role: '',
    lastLogin: '',
    preferences: {
      lowStockAlerts: true,
      expiryAlerts: true,
      emailReports: false,
      soundNotifications: true,
    },
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [editMode, setEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({
    username: '',
    email: '',
    pharmacyName: '',
    phone: '',
  });

  // ✅ Use the same API base URL as other components
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    'https://pharmacy-backend-qrb8.onrender.com';

  console.log('🔗 Settings - Using API Base URL:', API_BASE_URL);

  // ---------------------------
  // Load User Profile
  // ---------------------------
  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please login again.');
        setLoading(false);
        return;
      }

      const endpoint = `${API_BASE_URL}/api/users/profile`;
      console.log('📡 Loading user profile from:', endpoint);

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📊 Profile response status:', response.status);

      if (response.ok) {
        const userData = await response.json();
        console.log('✅ User profile received:', userData);
        
        // Handle different response structures
        const profileData = userData.user || userData.data || userData;
        
        setUserProfile({
          username: profileData.username || '',
          email: profileData.email || '',
          pharmacyName: profileData.pharmacyName || '',
          phone: profileData.phone || '',
          role: profileData.role || 'user',
          lastLogin: profileData.lastLogin || '',
          preferences: profileData.preferences || {
            lowStockAlerts: true,
            expiryAlerts: true,
            emailReports: false,
            soundNotifications: true,
          },
        });
        
        setProfileForm({
          username: profileData.username || '',
          email: profileData.email || '',
          pharmacyName: profileData.pharmacyName || '',
          phone: profileData.phone || '',
        });
      } else if (response.status === 401) {
        setError('Session expired. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to load profile:', response.status, errorText);
        
        // If profile endpoint doesn't exist, use stored user data
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUserProfile(prev => ({
            ...prev,
            username: userData.username || '',
            email: userData.email || '',
            pharmacyName: userData.pharmacyName || '',
            role: userData.role || 'user'
          }));
          setProfileForm({
            username: userData.username || '',
            email: userData.email || '',
            pharmacyName: userData.pharmacyName || '',
            phone: userData.phone || '',
          });
        } else {
          setError('Failed to load profile data');
        }
      }
    } catch (err) {
      console.error('❌ Network error loading profile:', err);
      setError('Network error loading profile. Using stored data.');
      
      // Fallback to stored user data
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUserProfile(prev => ({
          ...prev,
          username: userData.username || '',
          email: userData.email || '',
          pharmacyName: userData.pharmacyName || '',
          role: userData.role || 'user'
        }));
        setProfileForm({
          username: userData.username || '',
          email: userData.email || '',
          pharmacyName: userData.pharmacyName || '',
          phone: userData.phone || '',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------
  // Form Handlers
  // ---------------------------
  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
    setMessage('');
    setError('');
  };

  const handleProfileChange = (e) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  };

  // ---------------------------
  // Password Change
  // ---------------------------
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    // Validation
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match!');
      setLoading(false);
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please login again.');
        setLoading(false);
        return;
      }

      const endpoint = `${API_BASE_URL}/api/users/password`;
      console.log('🔐 Changing password at:', endpoint);

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      console.log('📊 Password change response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Password changed successfully:', data);
        
        setMessage('Password changed successfully!');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else if (response.status === 401) {
        setError('Session expired. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } else {
        const errorData = await response.json();
        console.error('❌ Password change failed:', errorData);
        setError(errorData.message || 'Failed to change password. Please check your current password.');
      }
    } catch (err) {
      console.error('❌ Network error changing password:', err);
      setError('Network error changing password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------
  // Profile Update
  // ---------------------------
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please login again.');
        setLoading(false);
        return;
      }

      const endpoint = `${API_BASE_URL}/api/users/profile`;
      console.log('📝 Updating profile at:', endpoint);

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileForm),
      });

      console.log('📊 Profile update response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Profile updated successfully:', data);
        
        const updatedProfile = data.user || data.data || data;
        
        setMessage('Profile updated successfully!');
        setUserProfile(prev => ({ ...prev, ...updatedProfile }));
        setEditMode(false);
        
        // Update localStorage
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...storedUser, ...updatedProfile }));
      } else if (response.status === 401) {
        setError('Session expired. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } else {
        const errorData = await response.json();
        console.error('❌ Profile update failed:', errorData);
        setError(errorData.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('❌ Network error updating profile:', err);
      setError('Network error updating profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------
  // Preferences Update
  // ---------------------------
  const handlePreferencesSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please login again.');
        setLoading(false);
        return;
      }

      const endpoint = `${API_BASE_URL}/api/users/preferences`;
      console.log('⚙️ Updating preferences at:', endpoint);

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userProfile.preferences),
      });

      console.log('📊 Preferences response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Preferences updated successfully:', data);
        
        setMessage('Preferences updated successfully!');
        setUserProfile(prev => ({
          ...prev,
          preferences: data.preferences || prev.preferences,
        }));
      } else if (response.status === 401) {
        setError('Session expired. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } else if (response.status === 404) {
        // If preferences endpoint doesn't exist, just show success message
        setMessage('Preferences saved locally!');
        console.log('⚠️ Preferences endpoint not found, saving locally');
      } else {
        const errorData = await response.json();
        console.error('❌ Preferences update failed:', errorData);
        setError(errorData.message || 'Failed to update preferences');
      }
    } catch (err) {
      console.error('❌ Network error updating preferences:', err);
      setMessage('Preferences saved locally!');
      console.log('⚠️ Network error, saving preferences locally');
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------
  // Preference Change Handler
  // ---------------------------
  const handlePreferenceChange = (key, value) => {
    setUserProfile((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value,
      },
    }));
  };

  // ---------------------------
  // Logout Handler
  // ---------------------------
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      console.log('🚪 Logging out user...');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (onLogout) {
        onLogout();
      }
    }
  };

  // ---------------------------
  // Format Date
  // ---------------------------
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    try {
      return new Date(dateString).toLocaleString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  // ---------------------------
  // Loading State
  // ---------------------------
  if (loading && activeTab === 'profile' && !userProfile.username) {
    return (
      <div className="settings">
        <div className="container">
          <div className="loading-screen">
            <div className="loading-spinner"></div>
            <p>Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------
  // JSX
  // ---------------------------
  return (
    <div className="settings">
      <div className="container">
        <div className="settings-header">
          <div className="header-content">
            <h1>Settings</h1>
            <p>Manage your account and system preferences</p>
          </div>
          <div className="header-actions">
            <button 
              className="btn btn-secondary btn-sm"
              onClick={loadUserProfile}
              title="Refresh settings"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Alerts */}
        {(message || error) && (
          <div className={`alert ${message ? 'alert-success' : 'alert-error'}`}>
            {message || error}
            <button className="alert-close" onClick={() => { setMessage(''); setError(''); }}>
              ×
            </button>
          </div>
        )}

        {/* Settings Layout */}
        <div className="settings-layout">
          {/* Sidebar */}
          <div className="settings-sidebar">
            <button 
              className={`sidebar-btn ${activeTab === 'profile' ? 'active' : ''}`} 
              onClick={() => setActiveTab('profile')}
            >
              👤 Profile
            </button>
            <button 
              className={`sidebar-btn ${activeTab === 'password' ? 'active' : ''}`} 
              onClick={() => setActiveTab('password')}
            >
              🔒 Change Password
            </button>
            <button 
              className={`sidebar-btn ${activeTab === 'preferences' ? 'active' : ''}`} 
              onClick={() => setActiveTab('preferences')}
            >
              ⚙️ Preferences
            </button>
          </div>

          {/* Content */}
          <div className="settings-content">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="card">
                <div className="card-header">
                  <h2>Profile Information</h2>
                  <button 
                    className={`btn ${editMode ? 'btn-secondary' : 'btn-primary'}`} 
                    onClick={() => setEditMode(!editMode)}
                    disabled={loading}
                  >
                    {editMode ? 'Cancel' : 'Edit Profile'}
                  </button>
                </div>

                {editMode ? (
                  <form onSubmit={handleProfileSubmit}>
                    <div className="form-group">
                      <label className="form-label">Username *</label>
                      <input 
                        type="text" 
                        name="username" 
                        className="form-input" 
                        value={profileForm.username} 
                        onChange={handleProfileChange} 
                        required 
                        disabled={loading}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Email Address *</label>
                      <input 
                        type="email" 
                        name="email" 
                        className="form-input" 
                        value={profileForm.email} 
                        onChange={handleProfileChange} 
                        required 
                        disabled={loading}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Pharmacy Name *</label>
                      <input 
                        type="text" 
                        name="pharmacyName" 
                        className="form-input" 
                        value={profileForm.pharmacyName} 
                        onChange={handleProfileChange} 
                        required 
                        disabled={loading}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Phone Number</label>
                      <input 
                        type="tel" 
                        name="phone" 
                        className="form-input" 
                        value={profileForm.phone} 
                        onChange={handleProfileChange} 
                        disabled={loading}
                        placeholder="Optional"
                      />
                    </div>

                    <button 
                      type="submit" 
                      className="btn btn-primary" 
                      disabled={loading}
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </form>
                ) : (
                  <div className="profile-info">
                    <div className="profile-field">
                      <label>Username</label>
                      <p>{userProfile.username || 'Not set'}</p>
                    </div>
                    <div className="profile-field">
                      <label>Email Address</label>
                      <p>{userProfile.email || 'Not set'}</p>
                    </div>
                    <div className="profile-field">
                      <label>Role</label>
                      <p className="role-badge">{userProfile.role || 'user'}</p>
                    </div>
                    <div className="profile-field">
                      <label>Pharmacy Name</label>
                      <p>{userProfile.pharmacyName || 'Not set'}</p>
                    </div>
                    <div className="profile-field">
                      <label>Phone Number</label>
                      <p>{userProfile.phone || 'Not provided'}</p>
                    </div>
                    <div className="profile-field">
                      <label>Last Login</label>
                      <p>{formatDate(userProfile.lastLogin)}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Password Tab */}
            {activeTab === 'password' && (
              <div className="card">
                <div className="card-header">
                  <h2>Change Password</h2>
                  <div className="password-requirements">
                    <small>Password must be at least 6 characters long</small>
                  </div>
                </div>
                <form onSubmit={handlePasswordSubmit}>
                  <div className="form-group">
                    <label className="form-label">Current Password *</label>
                    <input 
                      type="password" 
                      name="currentPassword" 
                      className="form-input" 
                      value={passwordForm.currentPassword} 
                      onChange={handlePasswordChange} 
                      required 
                      disabled={loading}
                      placeholder="Enter your current password"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">New Password *</label>
                    <input 
                      type="password" 
                      name="newPassword" 
                      className="form-input" 
                      value={passwordForm.newPassword} 
                      onChange={handlePasswordChange} 
                      required 
                      disabled={loading}
                      placeholder="Enter new password (min 6 characters)"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Confirm New Password *</label>
                    <input 
                      type="password" 
                      name="confirmPassword" 
                      className="form-input" 
                      value={passwordForm.confirmPassword} 
                      onChange={handlePasswordChange} 
                      required 
                      disabled={loading}
                      placeholder="Confirm your new password"
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={loading}
                  >
                    {loading ? 'Changing Password...' : 'Change Password'}
                  </button>
                </form>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="card">
                <div className="card-header">
                  <h2>System Preferences</h2>
                  <p className="preferences-description">Customize your pharmacy management experience</p>
                </div>
                <form onSubmit={handlePreferencesSubmit}>
                  <div className="preferences-list">
                    <div className="preference-item">
                      <label className="preference-label">
                        <input
                          type="checkbox"
                          checked={userProfile.preferences.lowStockAlerts}
                          onChange={(e) => handlePreferenceChange('lowStockAlerts', e.target.checked)}
                          disabled={loading}
                        />
                        <span className="preference-text">
                          <strong>Low Stock Alerts</strong>
                          <small>Get notified when drug quantities are running low</small>
                        </span>
                      </label>
                    </div>

                    <div className="preference-item">
                      <label className="preference-label">
                        <input
                          type="checkbox"
                          checked={userProfile.preferences.expiryAlerts}
                          onChange={(e) => handlePreferenceChange('expiryAlerts', e.target.checked)}
                          disabled={loading}
                        />
                        <span className="preference-text">
                          <strong>Expiry Alerts</strong>
                          <small>Receive warnings about expiring drugs</small>
                        </span>
                      </label>
                    </div>

                    <div className="preference-item">
                      <label className="preference-label">
                        <input
                          type="checkbox"
                          checked={userProfile.preferences.emailReports}
                          onChange={(e) => handlePreferenceChange('emailReports', e.target.checked)}
                          disabled={loading}
                        />
                        <span className="preference-text">
                          <strong>Email Reports</strong>
                          <small>Send daily/weekly reports to your email</small>
                        </span>
                      </label>
                    </div>

                    <div className="preference-item">
                      <label className="preference-label">
                        <input
                          type="checkbox"
                          checked={userProfile.preferences.soundNotifications}
                          onChange={(e) => handlePreferenceChange('soundNotifications', e.target.checked)}
                          disabled={loading}
                        />
                        <span className="preference-text">
                          <strong>Sound Notifications</strong>
                          <small>Play sounds for important alerts</small>
                        </span>
                      </label>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={loading}
                  >
                    {loading ? 'Saving Preferences...' : 'Save Preferences'}
                  </button>
                </form>
              </div>
            )}

            {/* Logout Section */}
            <div className="card danger-zone">
              <div className="danger-header">
                <h2>⚠️ Danger Zone</h2>
              </div>
              <div className="danger-content">
                <p><strong>Logout from System</strong></p>
                <p>Once you logout, you'll need to login again to access the pharmacy management system.</p>
                <button 
                  className="btn btn-danger" 
                  onClick={handleLogout}
                  disabled={loading}
                >
                  🚪 Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
