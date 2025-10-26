import React, { useState, useEffect } from 'react';
import './Settings.css';

// ✅ Automatically uses your environment variable in Vercel
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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

  // ✅ Load user profile
  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/users/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUserProfile(userData);
        setProfileForm({
          username: userData.username,
          email: userData.email,
          pharmacyName: userData.pharmacyName,
          phone: userData.phone || '',
        });
      } else {
        setError('Failed to load profile');
      }
    } catch (err) {
      setError('Network error loading profile');
      console.error('Profile load error:', err);
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
    setMessage('');
    setError('');
  };

  const handleProfileChange = (e) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match!');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/users/password`, {
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

      const data = await response.json();

      if (response.ok) {
        setMessage('Password changed successfully!');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        setError(data.message || 'Failed to change password');
      }
    } catch (err) {
      setError('Network error changing password');
      console.error('Password change error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileForm),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Profile updated successfully!');
        setUserProfile((prev) => ({ ...prev, ...profileForm }));
        setEditMode(false);
        const storedUser = JSON.parse(localStorage.getItem('user'));
        localStorage.setItem('user', JSON.stringify({ ...storedUser, ...profileForm }));
      } else {
        setError(data.message || 'Failed to update profile');
      }
    } catch (err) {
      setError('Network error updating profile');
      console.error('Profile update error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/users/preferences`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userProfile.preferences),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Preferences updated successfully!');
        setUserProfile((prev) => ({
          ...prev,
          preferences: { ...prev.preferences, ...data.preferences },
        }));
      } else {
        setError(data.message || 'Failed to update preferences');
      }
    } catch (err) {
      setError('Network error updating preferences');
      console.error('Preferences update error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = (key, value) => {
    setUserProfile((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value,
      },
    }));
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      onLogout();
    }
  };

  return (
    <div className="settings">
      <div className="container">
        <div className="settings-header">
          <h1>Settings</h1>
          <p>Manage your account and system preferences</p>
        </div>

        {(message || error) && (
          <div className={`alert ${message ? 'alert-success' : 'alert-error'}`}>
            {message || error}
          </div>
        )}

        {/* Tabs */}
        <div className="settings-layout">
          <div className="settings-sidebar">
            <button className={`sidebar-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
              Profile
            </button>
            <button className={`sidebar-btn ${activeTab === 'password' ? 'active' : ''}`} onClick={() => setActiveTab('password')}>
              Change Password
            </button>
            <button className={`sidebar-btn ${activeTab === 'preferences' ? 'active' : ''}`} onClick={() => setActiveTab('preferences')}>
              Preferences
            </button>
          </div>

          <div className="settings-content">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="card">
                <div className="card-header">
                  <h2>Profile Information</h2>
                  <button className={`btn ${editMode ? 'btn-secondary' : 'btn-primary'}`} onClick={() => setEditMode(!editMode)}>
                    {editMode ? 'Cancel' : 'Edit Profile'}
                  </button>
                </div>

                {editMode ? (
                  <form onSubmit={handleProfileSubmit}>
                    <div className="form-group">
                      <label className="form-label">Username</label>
                      <input type="text" name="username" className="form-input" value={profileForm.username} onChange={handleProfileChange} required />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Email Address</label>
                      <input type="email" name="email" className="form-input" value={profileForm.email} onChange={handleProfileChange} required />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Pharmacy Name</label>
                      <input type="text" name="pharmacyName" className="form-input" value={profileForm.pharmacyName} onChange={handleProfileChange} required />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Phone Number</label>
                      <input type="tel" name="phone" className="form-input" value={profileForm.phone} onChange={handleProfileChange} />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </form>
                ) : (
                  <div className="profile-info">
                    <div className="profile-field"><label>Username</label><p>{userProfile.username}</p></div>
                    <div className="profile-field"><label>Email Address</label><p>{userProfile.email}</p></div>
                    <div className="profile-field"><label>Role</label><p>{userProfile.role}</p></div>
                    <div className="profile-field"><label>Pharmacy</label><p>{userProfile.pharmacyName}</p></div>
                    <div className="profile-field"><label>Phone</label><p>{userProfile.phone || 'Not provided'}</p></div>
                    <div className="profile-field"><label>Last Login</label><p>{userProfile.lastLogin ? new Date(userProfile.lastLogin).toLocaleString() : 'Never'}</p></div>
                  </div>
                )}
              </div>
            )}

            {/* Password Tab */}
            {activeTab === 'password' && (
              <div className="card">
                <h2>Change Password</h2>
                <form onSubmit={handlePasswordSubmit}>
                  <div className="form-group">
                    <label className="form-label">Current Password</label>
                    <input type="password" name="currentPassword" className="form-input" value={passwordForm.currentPassword} onChange={handlePasswordChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">New Password</label>
                    <input type="password" name="newPassword" className="form-input" value={passwordForm.newPassword} onChange={handlePasswordChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Confirm New Password</label>
                    <input type="password" name="confirmPassword" className="form-input" value={passwordForm.confirmPassword} onChange={handlePasswordChange} required />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Changing Password...' : 'Change Password'}
                  </button>
                </form>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="card">
                <h2>System Preferences</h2>
                <form onSubmit={handlePreferencesSubmit}>
                  {Object.entries(userProfile.preferences).map(([key, value]) => (
                    <div key={key} className="preference-item">
                      <label className="preference-label">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => handlePreferenceChange(key, e.target.checked)}
                        />
                        {key.replace(/([A-Z])/g, ' $1')}
                      </label>
                    </div>
                  ))}
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Preferences'}
                  </button>
                </form>
              </div>
            )}

            {/* Logout */}
            <div className="card danger-zone">
              <h2>Danger Zone</h2>
              <p>Once you logout, you'll need to login again to access the system.</p>
              <button className="btn btn-danger" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
