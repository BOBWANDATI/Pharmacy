import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else {
        setError('Failed to load dashboard data');
      }
    } catch (error) {
      setError('Network error loading dashboard');
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'new-sale':
        navigate('/sales');
        break;
      case 'add-drug':
        navigate('/drugs');
        break;
      case 'view-reports':
        navigate('/reports');
        break;
      case 'manage-suppliers':
        navigate('/suppliers');
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="container">
          <div className="loading-screen">
            <div className="loading-spinner"></div>
            <p>Loading dashboard data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="container">
          <div className="error-message">
            <p>{error}</p>
            <button className="btn btn-primary" onClick={fetchDashboardData}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const summaryData = dashboardData?.summary || {
    totalDrugs: 0,
    totalSales: 0,
    lowStock: 0,
    expiredDrugs: 0,
    todaySalesCount: 0
  };

  const alerts = [
    ...(dashboardData?.alerts?.lowStock || []).map(alert => ({
      ...alert,
      type: 'low-stock'
    })),
    ...(dashboardData?.alerts?.nearExpiry || []).map(alert => ({
      ...alert,
      type: 'expiry'
    }))
  ];

  const recentSales = dashboardData?.recentSales || [];

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>Dashboard Overview</h1>
          <p>Welcome back! Here's your pharmacy summary.</p>
        </div>

        <div className="summary-cards">
          <div className="summary-card">
            <div className="card-icon drugs">
              <span>💊</span>
            </div>
            <div className="card-content">
              <h3>{summaryData.totalDrugs}</h3>
              <p>Total Drugs</p>
            </div>
          </div>

          <div className="summary-card">
            <div className="card-icon sales">
              <span>💰</span>
            </div>
            <div className="card-content">
              <h3>KSh {summaryData.totalSales.toLocaleString()}</h3>
              <p>Total Sales Today</p>
              <small>{summaryData.todaySalesCount} transactions</small>
            </div>
          </div>

          <div className="summary-card">
            <div className="card-icon alert">
              <span>⚠️</span>
            </div>
            <div className="card-content">
              <h3>{summaryData.lowStock}</h3>
              <p>Low Stock Alerts</p>
            </div>
          </div>

          <div className="summary-card">
            <div className="card-icon expired">
              <span>🚫</span>
            </div>
            <div className="card-content">
              <h3>{summaryData.expiredDrugs}</h3>
              <p>Expired Drugs</p>
            </div>
          </div>
        </div>

        <div className="dashboard-content">
          <div className="alerts-section card">
            <div className="section-header">
              <h2>Recent Alerts</h2>
              <span className="badge">{alerts.length}</span>
            </div>
            <div className="alerts-list">
              {alerts.length > 0 ? (
                alerts.slice(0, 5).map(alert => (
                  <div key={alert._id} className={`alert-item ${alert.type}`}>
                    <div className="alert-icon">
                      {alert.type === 'low-stock' ? '⚠️' : '🚫'}
                    </div>
                    <div className="alert-content">
                      <p className="alert-message">{alert.message}</p>
                      <div className="alert-details">
                        <span className="alert-drug">{alert.drug}</span>
                        <span className="alert-batch">Batch: {alert.batchNo}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-alerts">
                  <p>No alerts at the moment</p>
                  <span>Everything is running smoothly!</span>
                </div>
              )}
            </div>
          </div>

          <div className="recent-activity card">
            <div className="section-header">
              <h2>Recent Sales</h2>
            </div>
            <div className="activity-list">
              {recentSales.length > 0 ? (
                recentSales.map(sale => (
                  <div key={sale._id} className="activity-item">
                    <div className="activity-info">
                      <h4>Sale #{sale.saleNumber}</h4>
                      <p>{new Date(sale.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="activity-amount">
                      <strong>KSh {sale.totalAmount?.toLocaleString() || '0'}</strong>
                      <span className="sold-by">by {sale.soldBy?.username || 'System'}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-activity">
                  <p>No recent sales</p>
                  <span>Start making sales to see activity here</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="quick-actions-section">
          <div className="card">
            <h2>Quick Actions</h2>
            <div className="action-buttons">
              <button 
                className="btn btn-primary" 
                onClick={() => handleQuickAction('new-sale')}
              >
                <span className="btn-icon">💰</span>
                New Sale
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => handleQuickAction('add-drug')}
              >
                <span className="btn-icon">💊</span>
                Add Drug
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => handleQuickAction('view-reports')}
              >
                <span className="btn-icon">📊</span>
                View Reports
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => handleQuickAction('manage-suppliers')}
              >
                <span className="btn-icon">🚚</span>
                Manage Suppliers
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;