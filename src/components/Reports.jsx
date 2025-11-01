import React, { useState, useEffect } from 'react';
import './Reports.css';

const Reports = () => {
  const [activeReport, setActiveReport] = useState('sales');
  const [period, setPeriod] = useState('daily');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [salesData, setSalesData] = useState(null);
  const [stockData, setStockData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);

  // ✅ Use the same API base URL as other components
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    'https://pharmacy-backend-qrb8.onrender.com';

  console.log('🔗 Reports - Using API Base URL:', API_BASE_URL);

  useEffect(() => {
    fetchReportData();
  }, [activeReport, period]);

  // ---------------------------
  // Fetch Report Data
  // ---------------------------
  const fetchReportData = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please login again.');
        setLoading(false);
        return;
      }

      let endpoint = '';
      let queryParams = '';

      switch (activeReport) {
        case 'sales':
          endpoint = `${API_BASE_URL}/api/reports/sales`;
          queryParams = `?period=${period}`;
          break;
        case 'stock':
          endpoint = `${API_BASE_URL}/api/reports/stock`;
          break;
        case 'analytics':
          endpoint = `${API_BASE_URL}/api/reports/analytics`;
          queryParams = `?period=${period}`;
          break;
        default:
          endpoint = `${API_BASE_URL}/api/reports/sales`;
      }

      const url = endpoint + queryParams;
      console.log(`📡 Fetching ${activeReport} report from:`, url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log(`📊 ${activeReport} report response status:`, response.status);

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${activeReport} report data received:`, data);
        
        // Handle different response structures
        switch (activeReport) {
          case 'sales':
            setSalesData(data.report || data);
            break;
          case 'stock':
            setStockData(data.report || data);
            break;
          case 'analytics':
            setAnalyticsData(data.analytics || data);
            break;
          default:
            setSalesData(data);
        }
      } else if (response.status === 401) {
        setError('Session expired. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } else if (response.status === 404) {
        console.warn(`⚠️ ${activeReport} report endpoint not found`);
        setError(`${activeReport.replace(/-/g, ' ')} report endpoint not available`);
        generateFallbackData();
      } else {
        const errorText = await response.text();
        console.error(`❌ Failed to fetch ${activeReport} report:`, response.status, errorText);
        setError(`Failed to load ${activeReport} report: ${response.status}`);
      }
    } catch (error) {
      console.error(`❌ Network error fetching ${activeReport} report:`, error);
      setError('Network error loading report. Please check your connection.');
      generateFallbackData();
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------
  // Generate Fallback Data
  // ---------------------------
  const generateFallbackData = () => {
    console.log('🔄 Generating fallback report data');
    
    const fallbackSalesData = {
      summary: {
        totalSales: 0,
        totalRevenue: 0,
        totalItems: 0,
        averageSale: 0
      },
      dailyTrend: [],
      topSelling: []
    };

    const fallbackStockData = {
      summary: {
        totalDrugs: 0,
        totalValue: 0,
        lowStock: 0,
        expired: 0
      },
      categories: [],
      lowStock: [],
      expired: []
    };

    const fallbackAnalyticsData = {
      summary: {
        totalPeriodSales: 0,
        totalPeriodRevenue: 0,
        averageDailySales: 0,
        uniqueCustomers: 0
      },
      salesTrend: [],
      topDrugs: [],
      paymentDistribution: []
    };

    switch (activeReport) {
      case 'sales':
        setSalesData(fallbackSalesData);
        break;
      case 'stock':
        setStockData(fallbackStockData);
        break;
      case 'analytics':
        setAnalyticsData(fallbackAnalyticsData);
        break;
    }
  };

  // ---------------------------
  // Export Report
  // ---------------------------
  const handleExport = async (format) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication required. Please login again.');
        return;
      }

      const endpoint = `${API_BASE_URL}/api/reports/export`;
      console.log(`📤 Exporting ${activeReport} report as ${format}:`, endpoint);

      const response = await fetch(endpoint, {
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
        alert(`${data.message || 'Report exported successfully!'}`);
        
        // If the backend returns a download URL, trigger download
        if (data.downloadUrl) {
          window.open(data.downloadUrl, '_blank');
        }
      } else if (response.status === 404) {
        alert('Export feature not available yet');
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to export report');
      }
    } catch (error) {
      console.error('❌ Export error:', error);
      alert('Error exporting report. Please try again.');
    }
  };

  // ---------------------------
  // Chart Rendering Functions
  // ---------------------------
  const renderSalesChart = () => {
    const trendData = salesData?.dailyTrend || salesData?.salesTrend || [];
    if (trendData.length === 0) {
      return (
        <div className="chart-container">
          <h3>Sales Trend</h3>
          <div className="no-data">
            <p>No sales data available for the selected period</p>
          </div>
        </div>
      );
    }

    const maxRevenue = Math.max(...trendData.map(d => d.totalRevenue || 0), 1);

    return (
      <div className="chart-container">
        <h3>Sales Trend - {period.charAt(0).toUpperCase() + period.slice(1)}</h3>
        <div className="chart">
          {trendData.map((day, index) => (
            <div key={index} className="chart-bar">
              <div 
                className="bar" 
                style={{ 
                  height: `${((day.totalRevenue || 0) / maxRevenue) * 100}%` 
                }}
                title={`${new Date(day.date).toLocaleDateString()}: KSh ${(day.totalRevenue || 0).toLocaleString()}`}
              ></div>
              <span className="bar-label">
                {new Date(day.date).toLocaleDateString('en-US', { 
                  [period === 'daily' ? 'weekday' : 'month']: 'short',
                  day: period === 'daily' ? '2-digit' : undefined
                })}
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
          {analyticsData.salesTrend && analyticsData.salesTrend.length > 0 ? (
            <div className="chart">
              {analyticsData.salesTrend.map((day, index) => (
                <div key={index} className="chart-bar">
                  <div 
                    className="bar" 
                    style={{ 
                      height: `${((day.totalRevenue || 0) / Math.max(...analyticsData.salesTrend.map(d => d.totalRevenue || 1))) * 100}%` 
                    }}
                  ></div>
                  <span className="bar-label">
                    {new Date(day.date).getDate()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-data">
              <p>No trend data available</p>
            </div>
          )}
        </div>

        <div className="chart-section">
          <h3>Top Selling Drugs</h3>
          {analyticsData.topDrugs && analyticsData.topDrugs.length > 0 ? (
            <div className="horizontal-chart">
              {analyticsData.topDrugs.slice(0, 5).map((drug, index) => {
                const maxRevenue = Math.max(...analyticsData.topDrugs.map(d => d.totalRevenue || 0), 1);
                return (
                  <div key={index} className="horizontal-bar">
                    <div className="drug-name">{drug._id || drug.name || 'Unknown Drug'}</div>
                    <div className="bar-container">
                      <div 
                        className="bar horizontal"
                        style={{ 
                          width: `${((drug.totalRevenue || 0) / maxRevenue) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <div className="bar-value">KSh {(drug.totalRevenue || 0).toLocaleString()}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="no-data">
              <p>No top selling drugs data</p>
            </div>
          )}
        </div>
      </div>
    );
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
      <div className="reports">
        <div className="container">
          <div className="loading-screen">
            <div className="loading-spinner"></div>
            <p>Loading {activeReport} report data...</p>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------
  // JSX
  // ---------------------------
  return (
    <div className="reports">
      <div className="container">
        <div className="reports-header">
          <div className="header-content">
            <h1>Reports & Analytics</h1>
            <p>Generate and export detailed reports for your pharmacy</p>
          </div>
          <div className="header-actions">
            <button 
              className="btn btn-secondary btn-sm"
              onClick={fetchReportData}
              title="Refresh report data"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="alert alert-error">
            <strong>Error:</strong> {error}
            <button className="alert-close" onClick={() => setError('')}>×</button>
          </div>
        )}

        <div className="reports-controls">
          <div className="reports-tabs">
            <button 
              className={`tab-btn ${activeReport === 'sales' ? 'active' : ''}`}
              onClick={() => setActiveReport('sales')}
            >
              📊 Sales Report
            </button>
            <button 
              className={`tab-btn ${activeReport === 'stock' ? 'active' : ''}`}
              onClick={() => setActiveReport('stock')}
            >
              📦 Stock Report
            </button>
            <button 
              className={`tab-btn ${activeReport === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveReport('analytics')}
            >
              📈 Analytics
            </button>
          </div>

          <div className="controls-right">
            {(activeReport === 'sales' || activeReport === 'analytics') && (
              <div className="period-selector">
                <label>Time Period:</label>
                <select 
                  value={period} 
                  onChange={(e) => setPeriod(e.target.value)}
                  className="form-select"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Sales Report */}
        {activeReport === 'sales' && salesData && (
          <div className="report-content">
            <div className="report-summary">
              <div className="summary-card">
                <div className="card-icon">💰</div>
                <div className="card-content">
                  <h3>Total Sales</h3>
                  <p className="amount">{(salesData.summary?.totalSales || 0).toLocaleString()}</p>
                  <small>Transactions</small>
                </div>
              </div>
              <div className="summary-card">
                <div className="card-icon">📈</div>
                <div className="card-content">
                  <h3>Total Revenue</h3>
                  <p className="amount">{formatCurrency(salesData.summary?.totalRevenue)}</p>
                  <small>{period.charAt(0).toUpperCase() + period.slice(1)}</small>
                </div>
              </div>
              <div className="summary-card">
                <div className="card-icon">🛒</div>
                <div className="card-content">
                  <h3>Items Sold</h3>
                  <p className="amount">{(salesData.summary?.totalItems || 0).toLocaleString()}</p>
                  <small>Total quantity</small>
                </div>
              </div>
              <div className="summary-card">
                <div className="card-icon">📊</div>
                <div className="card-content">
                  <h3>Average Sale</h3>
                  <p className="amount">{formatCurrency(salesData.summary?.averageSale)}</p>
                  <small>Per transaction</small>
                </div>
              </div>
            </div>

            {renderSalesChart()}

            <div className="report-details">
              <div className="card">
                <div className="card-header">
                  <h2>Top Selling Drugs</h2>
                  <span className="badge">Top {salesData.topSelling?.length || 0}</span>
                </div>
                {salesData.topSelling && salesData.topSelling.length > 0 ? (
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>Drug Name</th>
                        <th>Quantity Sold</th>
                        <th>Revenue</th>
                        <th>Average Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesData.topSelling.map((drug, index) => (
                        <tr key={index}>
                          <td>{drug.name || drug._id || 'Unknown Drug'}</td>
                          <td>{(drug.quantity || drug.totalSold || 0).toLocaleString()}</td>
                          <td>{formatCurrency(drug.revenue || drug.totalRevenue)}</td>
                          <td>{formatCurrency(drug.averagePrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="no-data">
                    <p>No sales data available</p>
                  </div>
                )}
              </div>
            </div>

            <div className="export-actions">
              <div className="card">
                <h3>Export Report</h3>
                <p>Download this report for offline analysis or sharing</p>
                <div className="export-buttons">
                  <button 
                    className="btn btn-primary"
                    onClick={() => handleExport('pdf')}
                  >
                    📄 Export as PDF
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => handleExport('excel')}
                  >
                    📊 Export as Excel
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => handleExport('csv')}
                  >
                    📋 Export as CSV
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stock Report */}
        {activeReport === 'stock' && stockData && (
          <div className="report-content">
            <div className="report-summary">
              <div className="summary-card">
                <div className="card-icon">💊</div>
                <div className="card-content">
                  <h3>Total Drugs</h3>
                  <p className="amount">{(stockData.summary?.totalDrugs || 0).toLocaleString()}</p>
                  <small>In inventory</small>
                </div>
              </div>
              <div className="summary-card">
                <div className="card-icon">💰</div>
                <div className="card-content">
                  <h3>Inventory Value</h3>
                  <p className="amount">{formatCurrency(stockData.summary?.totalValue)}</p>
                  <small>Total worth</small>
                </div>
              </div>
              <div className="summary-card warning">
                <div className="card-icon">⚠️</div>
                <div className="card-content">
                  <h3>Low Stock Items</h3>
                  <p className="amount">{(stockData.summary?.lowStock || 0).toLocaleString()}</p>
                  <small>Needs restocking</small>
                </div>
              </div>
              <div className="summary-card danger">
                <div className="card-icon">🚫</div>
                <div className="card-content">
                  <h3>Expired Drugs</h3>
                  <p className="amount">{(stockData.summary?.expired || 0).toLocaleString()}</p>
                  <small>Requires attention</small>
                </div>
              </div>
            </div>

            <div className="report-details">
              <div className="card">
                <div className="card-header">
                  <h2>Drugs by Category</h2>
                  <span className="badge">{stockData.categories?.length || 0} categories</span>
                </div>
                {stockData.categories && stockData.categories.length > 0 ? (
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
                          <td>{category._id || category.category || 'Uncategorized'}</td>
                          <td>{(category.count || 0).toLocaleString()}</td>
                          <td>{(category.totalQuantity || 0).toLocaleString()}</td>
                          <td>{formatCurrency(category.totalValue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="no-data">
                    <p>No category data available</p>
                  </div>
                )}
              </div>

              <div className="card-grid">
                <div className="card">
                  <div className="card-header">
                    <h3>Low Stock Items</h3>
                    <span className="badge badge-warning">{stockData.lowStock?.length || 0}</span>
                  </div>
                  {stockData.lowStock && stockData.lowStock.length > 0 ? (
                    <div className="alert-list">
                      {stockData.lowStock.slice(0, 10).map((drug, index) => (
                        <div key={index} className="alert-item warning">
                          <span className="drug-name">{drug.name || drug.drugName || 'Unknown Drug'}</span>
                          <span className="drug-quantity">{(drug.quantity || 0).toLocaleString()} units</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-data">
                      <p>No low stock items</p>
                    </div>
                  )}
                </div>

                <div className="card">
                  <div className="card-header">
                    <h3>Expired Drugs</h3>
                    <span className="badge badge-danger">{stockData.expired?.length || 0}</span>
                  </div>
                  {stockData.expired && stockData.expired.length > 0 ? (
                    <div className="alert-list">
                      {stockData.expired.slice(0, 10).map((drug, index) => (
                        <div key={index} className="alert-item danger">
                          <span className="drug-name">{drug.name || drug.drugName || 'Unknown Drug'}</span>
                          <span className="drug-expiry">
                            {drug.expiryDate ? new Date(drug.expiryDate).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-data">
                      <p>No expired drugs</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="export-actions">
              <div className="card">
                <h3>Export Stock Report</h3>
                <p>Download inventory report for audit or ordering</p>
                <div className="export-buttons">
                  <button 
                    className="btn btn-primary"
                    onClick={() => handleExport('pdf')}
                  >
                    📄 Export as PDF
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => handleExport('excel')}
                  >
                    📊 Export as Excel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Report */}
        {activeReport === 'analytics' && analyticsData && (
          <div className="report-content">
            <div className="report-summary">
              <div className="summary-card">
                <div className="card-icon">💰</div>
                <div className="card-content">
                  <h3>Total Sales</h3>
                  <p className="amount">{(analyticsData.summary?.totalPeriodSales || 0).toLocaleString()}</p>
                  <small>{period} transactions</small>
                </div>
              </div>
              <div className="summary-card">
                <div className="card-icon">📈</div>
                <div className="card-content">
                  <h3>Total Revenue</h3>
                  <p className="amount">{formatCurrency(analyticsData.summary?.totalPeriodRevenue)}</p>
                  <small>{period} revenue</small>
                </div>
              </div>
              <div className="summary-card">
                <div className="card-icon">📊</div>
                <div className="card-content">
                  <h3>Avg Daily Sales</h3>
                  <p className="amount">{formatCurrency(analyticsData.summary?.averageDailySales)}</p>
                  <small>Per day average</small>
                </div>
              </div>
              <div className="summary-card">
                <div className="card-icon">👥</div>
                <div className="card-content">
                  <h3>Unique Customers</h3>
                  <p className="amount">{(analyticsData.summary?.uniqueCustomers || 0).toLocaleString()}</p>
                  <small>Returning customers</small>
                </div>
              </div>
            </div>

            {renderAnalyticsCharts()}

            <div className="analytics-details">
              <div className="card">
                <div className="card-header">
                  <h2>Top Performing Drugs</h2>
                  <span className="badge">Top {analyticsData.topDrugs?.length || 0}</span>
                </div>
                {analyticsData.topDrugs && analyticsData.topDrugs.length > 0 ? (
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
                          <td>{drug._id || drug.name || 'Unknown Drug'}</td>
                          <td>{drug.category || 'Uncategorized'}</td>
                          <td>{(drug.totalSold || drug.quantity || 0).toLocaleString()}</td>
                          <td>{formatCurrency(drug.totalRevenue || drug.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="no-data">
                    <p>No top performing drugs data</p>
                  </div>
                )}
              </div>

              <div className="card">
                <div className="card-header">
                  <h2>Payment Method Distribution</h2>
                  <span className="badge">{analyticsData.paymentDistribution?.length || 0} methods</span>
                </div>
                {analyticsData.paymentDistribution && analyticsData.paymentDistribution.length > 0 ? (
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
                          <td>{method._id || method.paymentMethod || 'Unknown'}</td>
                          <td>{(method.count || 0).toLocaleString()}</td>
                          <td>{formatCurrency(method.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="no-data">
                    <p>No payment distribution data</p>
                  </div>
                )}
              </div>
            </div>

            <div className="export-actions">
              <div className="card">
                <h3>Export Analytics</h3>
                <p>Download comprehensive analytics for business insights</p>
                <div className="export-buttons">
                  <button 
                    className="btn btn-primary"
                    onClick={() => handleExport('pdf')}
                  >
                    📄 Export as PDF
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => handleExport('excel')}
                  >
                    📊 Export as Excel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
