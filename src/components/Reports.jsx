import React, { useState, useEffect } from 'react';
import './Reports.css';

const Reports = () => {
  const [activeReport, setActiveReport] = useState('sales');
  const [period, setPeriod] = useState('daily');
  const [loading, setLoading] = useState(false);
  const [salesData, setSalesData] = useState(null);
  const [stockData, setStockData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);

  // ✅ Use environment variable for both local + deployed
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (activeReport === 'sales') fetchSalesReport();
    else if (activeReport === 'stock') fetchStockReport();
    else if (activeReport === 'analytics') fetchAnalytics();
  }, [activeReport, period]);

  // ---------------------------
  // ✅ Fetch Sales Report
  // ---------------------------
  const fetchSalesReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/reports/sales?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` },
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

  // ---------------------------
  // ✅ Fetch Stock Report
  // ---------------------------
  const fetchStockReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/reports/stock`, {
        headers: { Authorization: `Bearer ${token}` },
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

  // ---------------------------
  // ✅ Fetch Analytics
  // ---------------------------
  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/reports/analytics?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` },
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

  // ---------------------------
  // ✅ Export Report (PDF/Excel)
  // ---------------------------
  const handleExport = async (format) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/reports/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reportType: activeReport,
          format,
          period,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message || `Report exported as ${format.toUpperCase()}`);
      } else {
        alert('Failed to export report');
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Error exporting report');
    }
  };

  // ---------------------------
  // ✅ Render Charts
  // ---------------------------
  const renderSalesChart = () => {
    if (!salesData?.dailyTrend) return null;

    const maxRevenue = Math.max(...salesData.dailyTrend.map((d) => d.totalRevenue || 0));

    return (
      <div className="chart-container">
        <h3>Sales Trend</h3>
        <div className="chart">
          {salesData.dailyTrend.map((day, index) => (
            <div key={index} className="chart-bar">
              <div
                className="bar"
                style={{ height: `${(day.totalRevenue / maxRevenue) * 100}%` }}
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

    const maxRevenue = Math.max(...analyticsData.topDrugs.map((d) => d.totalRevenue || 0));

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
                <span className="bar-label">{new Date(day.date).getDate()}</span>
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
                    style={{ width: `${(drug.totalRevenue / maxRevenue) * 100}%` }}
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

  // ---------------------------
  // ✅ Loading State
  // ---------------------------
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

  // ---------------------------
  // ✅ Main Render
  // ---------------------------
  return (
    <div className="reports">
      <div className="container">
        <div className="reports-header">
          <h1>Reports & Analytics</h1>
          <p>Generate and export detailed reports for your pharmacy</p>
        </div>

        {/* Report Tabs */}
        <div className="reports-controls">
          <div className="reports-tabs">
            {['sales', 'stock', 'analytics'].map((type) => (
              <button
                key={type}
                className={`tab-btn ${activeReport === type ? 'active' : ''}`}
                onClick={() => setActiveReport(type)}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)} Report
              </button>
            ))}
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

        {/* Render Content */}
        {activeReport === 'sales' && salesData && (
          <>
            {renderSalesChart()}
            <div className="export-actions">
              <h3>Export Report</h3>
              <div className="export-buttons">
                <button className="btn btn-primary" onClick={() => handleExport('pdf')}>
                  Export as PDF
                </button>
                <button className="btn btn-secondary" onClick={() => handleExport('excel')}>
                  Export as Excel
                </button>
              </div>
            </div>
          </>
        )}

        {activeReport === 'stock' && stockData && (
          <>
            <div className="export-actions">
              <h3>Export Report</h3>
              <div className="export-buttons">
                <button className="btn btn-primary" onClick={() => handleExport('pdf')}>
                  Export as PDF
                </button>
                <button className="btn btn-secondary" onClick={() => handleExport('excel')}>
                  Export as Excel
                </button>
              </div>
            </div>
          </>
        )}

        {activeReport === 'analytics' && analyticsData && (
          <>
            {renderAnalyticsCharts()}
            <div className="export-actions">
              <h3>Export Analytics</h3>
              <div className="export-buttons">
                <button className="btn btn-primary" onClick={() => handleExport('pdf')}>
                  Export as PDF
                </button>
                <button className="btn btn-secondary" onClick={() => handleExport('excel')}>
                  Export as Excel
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Reports;
