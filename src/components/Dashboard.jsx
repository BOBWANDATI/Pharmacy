import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // ✅ Use the same API base URL as other components
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    'https://pharmacy-backend-qrb8.onrender.com';

  console.log('🔗 Dashboard - Using API Base URL:', API_BASE_URL);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // ---------------------------
  // Fetch Dashboard Data
  // ---------------------------
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please login again.');
        setLoading(false);
        return;
      }

      const endpoint = `${API_BASE_URL}/api/dashboard`;
      console.log('📡 Fetching dashboard data from:', endpoint);

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📊 Dashboard response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Dashboard data received:', data);
        setDashboardData(data);
      } else if (response.status === 401) {
        setError('Session expired. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } else if (response.status === 404) {
        console.warn('⚠️ Dashboard endpoint not found, using fallback data');
        // If dashboard endpoint doesn't exist, create fallback data
        setDashboardData(generateFallbackData());
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to load dashboard:', response.status, errorText);
        setError(`Failed to load dashboard: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Network error loading dashboard:', error);
      setError('Network error loading dashboard. Please check your connection.');
      // Generate fallback data on network error
      setDashboardData(generateFallbackData());
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------
  // Fallback Data Generator
  // ---------------------------
  const generateFallbackData = () => {
    console.log('🔄 Generating fallback dashboard data');
    return {
      summary: {
        totalDrugs: 0,
        totalSales: 0,
        lowStock: 0,
        expiredDrugs: 0,
        todaySalesCount: 0,
        inventoryValue: 0,
        monthlyRevenue: 0
      },
      alerts: {
        lowStock: [],
        nearExpiry: []
      },
      recentSales: [],
      topSelling: [],
      monthlyTrend: []
    };
  };

  // ---------------------------
  // Quick Actions Handler
  // ---------------------------
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
      case 'view-inventory':
        navigate('/drugs');
        break;
      default:
        break;
    }
  };

  // ---------------------------
  // Format Currency
  // ---------------------------
  const formatCurrency = (amount) => {
    return `KSh ${(amount || 0).toLocaleString()}`;
  };

  // ---------------------------
  // Loading State
  // ---------------------------
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

  // ---------------------------
  // Error State
  // ---------------------------
  if (error && !dashboardData) {
    return (
      <div className="dashboard">
        <div className="container">
          <div className="error-message">
            <div className="error-icon">⚠️</div>
            <h3>Unable to Load Dashboard</h3>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={fetchDashboardData}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------
  // Data Preparation
  // ---------------------------
  const summaryData = dashboardData?.summary || {
    totalDrugs: 0,
    totalSales: 0,
    lowStock: 0,
    expiredDrugs: 0,
    todaySalesCount: 0,
    inventoryValue: 0,
    monthlyRevenue: 0
  };

  const alerts = [
    ...(dashboardData?.alerts?.lowStock || []).map(alert => ({
      ...alert,
      type: 'low-stock',
      message: alert.message || `Low stock: ${alert.drugName || alert.name} (${alert.currentStock || alert.quantity} remaining)`
    })),
    ...(dashboardData?.alerts?.nearExpiry || []).map(alert => ({
      ...alert,
      type: 'expiry',
      message: alert.message || `Near expiry: ${alert.drugName || alert.name} (expires ${new Date(alert.expiryDate).toLocaleDateString()})`
    })),
    ...(dashboardData?.alerts?.expired || []).map(alert => ({
      ...alert,
      type: 'expired',
      message: alert.message || `Expired: ${alert.drugName || alert.name}`
    }))
  ];

  const recentSales = dashboardData?.recentSales || [];
  const topSelling = dashboardData?.topSelling || [];

  // ---------------------------
  // JSX
  // ---------------------------
  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <div className="header-content">
            <h1>Dashboard Overview</h1>
            <p>Welcome back! Here's your pharmacy summary.</p>
          </div>
          <div className="header-actions">
            <button 
              className="btn btn-secondary btn-sm"
              onClick={fetchDashboardData}
              title="Refresh dashboard data"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="summary-cards">
          <div className="summary-card">
            <div className="card-icon drugs">
              <span>💊</span>
            </div>
            <div className="card-content">
              <h3>{summaryData.totalDrugs?.toLocaleString() || '0'}</h3>
              <p>Total Drugs</p>
              <small>{summaryData.totalCategories || '0'} categories</small>
            </div>
          </div>

          <div className="summary-card">
            <div className="card-icon sales">
              <span>💰</span>
            </div>
            <div className="card-content">
              <h3>{formatCurrency(summaryData.totalSales)}</h3>
              <p>Total Sales Today</p>
              <small>{summaryData.todaySalesCount || '0'} transactions</small>
            </div>
          </div>

          <div className="summary-card">
            <div className="card-icon revenue">
              <span>📈</span>
            </div>
            <div className="card-content">
              <h3>{formatCurrency(summaryData.monthlyRevenue)}</h3>
              <p>Monthly Revenue</p>
              <small>Current month</small>
            </div>
          </div>

          <div className="summary-card">
            <div className="card-icon inventory">
              <span>🏪</span>
            </div>
            <div className="card-content">
              <h3>{formatCurrency(summaryData.inventoryValue)}</h3>
              <p>Inventory Value</p>
              <small>Total stock worth</small>
            </div>
          </div>

          <div className="summary-card">
            <div className="card-icon alert">
              <span>⚠️</span>
            </div>
            <div className="card-content">
              <h3>{summaryData.lowStock?.toLocaleString() || '0'}</h3>
              <p>Low Stock Alerts</p>
              <small>Needs restocking</small>
            </div>
          </div>

          <div className="summary-card">
            <div className="card-icon expired">
              <span>🚫</span>
            </div>
            <div className="card-content">
              <h3>{summaryData.expiredDrugs?.toLocaleString() || '0'}</h3>
              <p>Expired Drugs</p>
              <small>Requires attention</small>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="dashboard-content">
          {/* Alerts Section */}
          <div className="alerts-section card">
            <div className="section-header">
              <h2>Recent Alerts</h2>
              <span className={`badge ${alerts.length > 0 ? 'badge-warning' : 'badge-success'}`}>
                {alerts.length} {alerts.length === 1 ? 'alert' : 'alerts'}
              </span>
            </div>
            <div className="alerts-list">
              {alerts.length > 0 ? (
                alerts.slice(0, 6).map((alert, index) => (
                  <div key={alert._id || index} className={`alert-item ${alert.type}`}>
                    <div className="alert-icon">
                      {alert.type === 'low-stock' ? '⚠️' : 
                       alert.type === 'expiry' ? '📅' : '🚫'}
                    </div>
                    <div className="alert-content">
                      <p className="alert-message">{alert.message}</p>
                      <div className="alert-details">
                        {alert.drug && (
                          <span className="alert-drug">{alert.drug}</span>
                        )}
                        {alert.batchNo && (
                          <span className="alert-batch">Batch: {alert.batchNo}</span>
                        )}
                        {alert.expiryDate && (
                          <span className="alert-expiry">
                            {new Date(alert.expiryDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-alerts">
                  <div className="no-alerts-icon">✅</div>
                  <p>No alerts at the moment</p>
                  <span>Everything is running smoothly!</span>
                </div>
              )}
            </div>
            {alerts.length > 6 && (
              <div className="section-footer">
                <button className="btn-link" onClick={() => navigate('/drugs')}>
                  View all alerts →
                </button>
              </div>
            )}
          </div>

          {/* Recent Sales */}
          <div className="recent-activity card">
            <div className="section-header">
              <h2>Recent Sales</h2>
              <span className="badge">{recentSales.length}</span>
            </div>
            <div className="activity-list">
              {recentSales.length > 0 ? (
                recentSales.map((sale) => (
                  <div key={sale._id} className="activity-item">
                    <div className="activity-info">
                      <h4>Sale #{sale.saleNumber || sale._id?.slice(-6) || 'N/A'}</h4>
                      <p>{new Date(sale.createdAt || sale.date || Date.now()).toLocaleDateString()}</p>
                      <small>{sale.items?.length || 0} items</small>
                    </div>
                    <div className="activity-amount">
                      <strong>{formatCurrency(sale.totalAmount)}</strong>
                      <span className={`payment-method ${sale.paymentMethod || 'cash'}`}>
                        {sale.paymentMethod || 'Cash'}
                      </span>
                      {sale.soldBy && (
                        <span className="sold-by">by {sale.soldBy?.username || 'System'}</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-activity">
                  <div className="no-activity-icon">🛒</div>
                  <p>No recent sales</p>
                  <span>Start making sales to see activity here</span>
                </div>
              )}
            </div>
            {recentSales.length > 0 && (
              <div className="section-footer">
                <button className="btn-link" onClick={() => navigate('/sales')}>
                  View all sales →
                </button>
              </div>
            )}
          </div>

          {/* Top Selling Drugs */}
          {topSelling.length > 0 && (
            <div className="top-selling card">
              <div className="section-header">
                <h2>Top Selling Drugs</h2>
                <span className="badge">Top {topSelling.length}</span>
              </div>
              <div className="top-list">
                {topSelling.map((drug, index) => (
                  <div key={drug._id || index} className="top-item">
                    <div className="item-rank">
                      <span className={`rank rank-${index + 1}`}>#{index + 1}</span>
                    </div>
                    <div className="item-info">
                      <h4>{drug.name || drug.drugName || 'Unknown Drug'}</h4>
                      <p>Sold: {drug.totalSold || drug.quantitySold || 0} units</p>
                    </div>
                    <div className="item-revenue">
                      <strong>{formatCurrency(drug.totalRevenue || drug.revenue)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="quick-actions-section">
          <div className="card">
            <div className="section-header">
              <h2>Quick Actions</h2>
              <span className="quick-actions-hint">Frequently used tasks</span>
            </div>
            <div className="action-buttons">
              <button 
                className="btn btn-primary action-btn" 
                onClick={() => handleQuickAction('new-sale')}
              >
                <span className="btn-icon">💰</span>
                <span className="btn-text">New Sale</span>
                <span className="btn-hint">Process customer sale</span>
              </button>
              
              <button 
                className="btn btn-secondary action-btn"
                onClick={() => handleQuickAction('add-drug')}
              >
                <span className="btn-icon">💊</span>
                <span className="btn-text">Add Drug</span>
                <span className="btn-hint">Add new inventory</span>
              </button>
              
              <button 
                className="btn btn-secondary action-btn"
                onClick={() => handleQuickAction('view-inventory')}
              >
                <span className="btn-icon">📋</span>
                <span className="btn-text">View Inventory</span>
                <span className="btn-hint">Manage drugs stock</span>
              </button>
              
              <button 
                className="btn btn-secondary action-btn"
                onClick={() => handleQuickAction('view-reports')}
              >
                <span className="btn-icon">📊</span>
                <span className="btn-text">View Reports</span>
                <span className="btn-hint">Sales & analytics</span>
              </button>
              
              <button 
                className="btn btn-secondary action-btn"
                onClick={() => handleQuickAction('manage-suppliers')}
              >
                <span className="btn-icon">🚚</span>
                <span className="btn-text">Suppliers</span>
                <span className="btn-hint">Manage vendors</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Footer */}
        <div className="dashboard-footer">
          <div className="last-updated">
            <small>
              Last updated: {new Date().toLocaleTimeString()} • 
              Data refreshes automatically
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
