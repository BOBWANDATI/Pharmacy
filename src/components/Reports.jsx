import React, { useState, useEffect } from 'react';
import './Reports.css';

const Reports = () => {
  const [activeReport, setActiveReport] = useState('sales');
  const [period, setPeriod] = useState('daily');
  const [loading, setLoading] = useState(false);
  const [salesData, setSalesData] = useState(null);
  const [stockData, setStockData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);

  const API_BASE_URL = 'http://localhost:5000/api';

  useEffect(() => {
    if (activeReport === 'sales') {
      fetchSalesReport();
    } else if (activeReport === 'stock') {
      fetchStockReport();
    } else if (activeReport === 'analytics') {
      fetchAnalytics();
    }
  }, [activeReport, period]);

  const fetchSalesReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/reports/sales?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSalesData(data.report);
      } else {
        console.error('Failed to fetch sales report');
      }
    } catch (error) {
      console.error('Sales report error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStockReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/reports/stock`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStockData(data.report);
      } else {
        console.error('Failed to fetch stock report');
      }
    } catch (error) {
      console.error('Stock report error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/reports/analytics?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data.analytics);
      } else {
        console.error('Failed to fetch analytics');
      }
    } catch (error) {
      console.error('Analytics error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/reports/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          reportType: activeReport,
          format,
          period
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`${data.message}`);
        // In real implementation, you would trigger download
      } else {
        alert('Failed to export report');
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Error exporting report');
    }
  };

  const renderSalesChart = () => {
    if (!salesData?.dailyTrend) return null;

    return (
      <div className="chart-container">
        <h3>Sales Trend</h3>
        <div className="chart">
          {salesData.dailyTrend.map((day, index) => (
            <div key={index} className="chart-bar">
              <div 
                className="bar" 
                style={{ height: `${(day.totalRevenue / Math.max(...salesData.dailyTrend.map(d => d.totalRevenue))) * 100}%` }}
                title={`${new Date(day.date).toLocaleDateString()}: KSh ${day.totalRevenue.toLocaleString()}`}
              ></div>
              <span className="bar-label">
                {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAnalyticsCharts = () => {
    if (!analyticsData) return null;

    return (
      <div className="analytics-charts">
        <div className="chart-section">
          <h3>Sales Trend</h3>
          <div className="chart">
            {analyticsData.salesTrend.map((day, index) => (
              <div key={index} className="chart-bar">
                <div 
                  className="bar" 
                  style={{ height: `${(day.totalRevenue / Math.max(...analyticsData.salesTrend.map(d => d.totalRevenue || 1))) * 100}%` }}
                ></div>
                <span className="bar-label">
                  {new Date(day.date).getDate()}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-section">
          <h3>Top Selling Drugs</h3>
          <div className="horizontal-chart">
            {analyticsData.topDrugs.slice(0, 5).map((drug, index) => (
              <div key={index} className="horizontal-bar">
                <div className="drug-name">{drug._id}</div>
                <div className="bar-container">
                  <div 
                    className="bar horizontal"
                    style={{ width: `${(drug.totalRevenue / Math.max(...analyticsData.topDrugs.map(d => d.totalRevenue))) * 100}%` }}
                  ></div>
                </div>
                <div className="bar-value">KSh {drug.totalRevenue.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="reports">
        <div className="container">
          <div className="loading-screen">
            <div className="loading-spinner"></div>
            <p>Loading report data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reports">
      <div className="container">
        <div className="reports-header">
          <h1>Reports & Analytics</h1>
          <p>Generate and export detailed reports for your pharmacy</p>
        </div>

        <div className="reports-controls">
          <div className="reports-tabs">
            <button 
              className={`tab-btn ${activeReport === 'sales' ? 'active' : ''}`}
              onClick={() => setActiveReport('sales')}
            >
              Sales Report
            </button>
            <button 
              className={`tab-btn ${activeReport === 'stock' ? 'active' : ''}`}
              onClick={() => setActiveReport('stock')}
            >
              Stock Report
            </button>
            <button 
              className={`tab-btn ${activeReport === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveReport('analytics')}
            >
              Analytics
            </button>
          </div>

          {(activeReport === 'sales' || activeReport === 'analytics') && (
            <div className="period-selector">
              <label>Period:</label>
              <select value={period} onChange={(e) => setPeriod(e.target.value)}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          )}
        </div>

        {activeReport === 'sales' && salesData && (
          <div className="report-content">
            <div className="report-summary">
              <div className="summary-card">
                <h3>Total Sales</h3>
                <p className="amount">{salesData.summary.totalSales}</p>
                <small>Transactions</small>
              </div>
              <div className="summary-card">
                <h3>Total Revenue</h3>
                <p className="amount">KSh {salesData.summary.totalRevenue.toLocaleString()}</p>
                <small>{period.charAt(0).toUpperCase() + period.slice(1)}</small>
              </div>
              <div className="summary-card">
                <h3>Items Sold</h3>
                <p className="amount">{salesData.summary.totalItems}</p>
                <small>Total quantity</small>
              </div>
              <div className="summary-card">
                <h3>Average Sale</h3>
                <p className="amount">KSh {Math.round(salesData.summary.averageSale).toLocaleString()}</p>
                <small>Per transaction</small>
              </div>
            </div>

            {renderSalesChart()}

            <div className="report-details">
              <div className="card">
                <h2>Top Selling Drugs</h2>
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Drug Name</th>
                      <th>Quantity Sold</th>
                      <th>Revenue (KSh)</th>
                      <th>Average Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesData.topSelling.map((drug, index) => (
                      <tr key={index}>
                        <td>{drug.name}</td>
                        <td>{drug.quantity}</td>
                        <td>{drug.revenue.toLocaleString()}</td>
                        <td>{drug.averagePrice.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="export-actions">
              <h3>Export Report</h3>
              <div className="export-buttons">
                <button 
                  className="btn btn-primary"
                  onClick={() => handleExport('pdf')}
                >
                  Export as PDF
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => handleExport('excel')}
                >
                  Export as Excel
                </button>
              </div>
            </div>
          </div>
        )}

        {activeReport === 'stock' && stockData && (
          <div className="report-content">
            <div className="report-summary">
              <div className="summary-card">
                <h3>Total Drugs</h3>
                <p className="amount">{stockData.summary.totalDrugs}</p>
              </div>
              <div className="summary-card">
                <h3>Inventory Value</h3>
                <p className="amount">KSh {stockData.summary.totalValue.toLocaleString()}</p>
              </div>
              <div className="summary-card">
                <h3>Low Stock Items</h3>
                <p className="amount warning">{stockData.summary.lowStock}</p>
              </div>
              <div className="summary-card">
                <h3>Expired Drugs</h3>
                <p className="amount danger">{stockData.summary.expired}</p>
              </div>
            </div>

            <div className="report-details">
              <div className="card">
                <h2>Drugs by Category</h2>
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Number of Drugs</th>
                      <th>Total Quantity</th>
                      <th>Total Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockData.categories.map((category, index) => (
                      <tr key={index}>
                        <td>{category._id}</td>
                        <td>{category.count}</td>
                        <td>{category.totalQuantity}</td>
                        <td>KSh {category.totalValue.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="card-grid">
                <div className="card">
                  <h3>Low Stock Items</h3>
                  <div className="alert-list">
                    {stockData.lowStock.slice(0, 10).map((drug, index) => (
                      <div key={index} className="alert-item">
                        <span className="drug-name">{drug.name}</span>
                        <span className="drug-quantity">{drug.quantity} units</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <h3>Expired Drugs</h3>
                  <div className="alert-list">
                    {stockData.expired.slice(0, 10).map((drug, index) => (
                      <div key={index} className="alert-item expired">
                        <span className="drug-name">{drug.name}</span>
                        <span className="drug-expiry">
                          {new Date(drug.expiryDate).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="export-actions">
              <h3>Export Report</h3>
              <div className="export-buttons">
                <button 
                  className="btn btn-primary"
                  onClick={() => handleExport('pdf')}
                >
                  Export as PDF
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => handleExport('excel')}
                >
                  Export as Excel
                </button>
              </div>
            </div>
          </div>
        )}

        {activeReport === 'analytics' && analyticsData && (
          <div className="report-content">
            <div className="report-summary">
              <div className="summary-card">
                <h3>Total Sales</h3>
                <p className="amount">{analyticsData.summary.totalPeriodSales}</p>
                <small>{period} transactions</small>
              </div>
              <div className="summary-card">
                <h3>Total Revenue</h3>
                <p className="amount">KSh {analyticsData.summary.totalPeriodRevenue.toLocaleString()}</p>
                <small>{period} revenue</small>
              </div>
              <div className="summary-card">
                <h3>Avg Daily Sales</h3>
                <p className="amount">KSh {Math.round(analyticsData.summary.averageDailySales).toLocaleString()}</p>
                <small>Per day average</small>
              </div>
              <div className="summary-card">
                <h3>Unique Customers</h3>
                <p className="amount">{analyticsData.summary.uniqueCustomers}</p>
                <small>Returning customers</small>
              </div>
            </div>

            {renderAnalyticsCharts()}

            <div className="analytics-details">
              <div className="card">
                <h2>Top Performing Drugs</h2>
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Drug Name</th>
                      <th>Category</th>
                      <th>Quantity Sold</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.topDrugs.slice(0, 10).map((drug, index) => (
                      <tr key={index}>
                        <td>{drug._id}</td>
                        <td>{drug.category}</td>
                        <td>{drug.totalSold}</td>
                        <td>KSh {drug.totalRevenue.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="card">
                <h2>Payment Method Distribution</h2>
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Payment Method</th>
                      <th>Transactions</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.paymentDistribution.map((method, index) => (
                      <tr key={index}>
                        <td>{method._id}</td>
                        <td>{method.count}</td>
                        <td>KSh {method.revenue.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="export-actions">
              <h3>Export Analytics</h3>
              <div className="export-buttons">
                <button 
                  className="btn btn-primary"
                  onClick={() => handleExport('pdf')}
                >
                  Export as PDF
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => handleExport('excel')}
                >
                  Export as Excel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
