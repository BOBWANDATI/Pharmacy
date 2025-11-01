import React, { useState, useEffect } from 'react';
import './Drugs.css';

const Drugs = () => {
  const [drugs, setDrugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDrug, setEditingDrug] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    batchNo: '',
    quantity: '',
    price: '',
    costPrice: '',
    expiryDate: '',
    supplier: '',
    minStockLevel: '10'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);

  // ✅ Use the same API base URL as Login component
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    'https://pharmacy-backend-qrb8.onrender.com';

  console.log('🔗 Drugs - Using API Base URL:', API_BASE_URL);

  // ---------------------------
  // Fetch drugs from backend
  // ---------------------------
  const fetchDrugs = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please login again.');
        setLoading(false);
        return;
      }

      const endpoint = `${API_BASE_URL}/api/drugs`;
      console.log('📡 Fetching drugs from:', endpoint);

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📊 Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Drugs data received:', data);
        
        // Handle different response structures
        if (data.drugs && Array.isArray(data.drugs)) {
          setDrugs(data.drugs);
        } else if (data.data && Array.isArray(data.data)) {
          setDrugs(data.data);
        } else if (Array.isArray(data)) {
          setDrugs(data);
        } else {
          console.warn('⚠️ Unexpected response structure:', data);
          setDrugs([]);
        }
      } else if (response.status === 401) {
        setError('Session expired. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to load drugs:', response.status, errorText);
        setError(`Failed to load drugs: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Network error loading drugs:', error);
      setError('Network error loading drugs. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrugs();
  }, []);

  // ---------------------------
  // Add/Edit Drug Handlers
  // ---------------------------
  const handleAddDrug = () => {
    setEditingDrug(null);
    setFormData({
      name: '',
      category: '',
      batchNo: '',
      quantity: '',
      price: '',
      costPrice: '',
      expiryDate: '',
      supplier: '',
      minStockLevel: '10'
    });
    setShowModal(true);
    setError('');
  };

  const handleEditDrug = (drug) => {
    setEditingDrug(drug);
    setFormData({
      name: drug.name || '',
      category: drug.category || '',
      batchNo: drug.batchNo || '',
      quantity: drug.quantity?.toString() || '',
      price: drug.price?.toString() || '',
      costPrice: drug.costPrice?.toString() || drug.price?.toString() || '',
      expiryDate: drug.expiryDate ? drug.expiryDate.split('T')[0] : '',
      supplier: drug.supplier || '',
      minStockLevel: drug.minStockLevel?.toString() || '10'
    });
    setShowModal(true);
    setError('');
  };

  // ---------------------------
  // Delete Drug
  // ---------------------------
  const handleDeleteDrug = async (id) => {
    if (!window.confirm('Are you sure you want to delete this drug? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const endpoint = `${API_BASE_URL}/api/drugs/${id}`;
      
      console.log('🗑️ Deleting drug:', endpoint);

      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        console.log('✅ Drug deleted successfully');
        setDrugs(drugs.filter(drug => drug._id !== id));
        alert('Drug deleted successfully');
      } else if (response.status === 401) {
        setError('Session expired. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } else {
        const errorData = await response.json();
        alert(errorData.message || `Failed to delete drug: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Delete drug error:', error);
      alert('Network error deleting drug. Please try again.');
    }
  };

  // ---------------------------
  // Submit Drug Form
  // ---------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please login again.');
        setLoading(false);
        return;
      }

      // Validation
      if (!formData.name || !formData.category || !formData.batchNo || !formData.quantity || !formData.price) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      const isEditing = !!editingDrug;
      const endpoint = isEditing 
        ? `${API_BASE_URL}/api/drugs/${editingDrug._id}`
        : `${API_BASE_URL}/api/drugs`;
      
      const method = isEditing ? 'PUT' : 'POST';

      console.log('📤 Submitting drug data to:', endpoint);

      const requestBody = {
        name: formData.name.trim(),
        category: formData.category.trim(),
        batchNo: formData.batchNo.trim(),
        quantity: parseInt(formData.quantity) || 0,
        price: parseFloat(formData.price) || 0,
        costPrice: parseFloat(formData.costPrice) || parseFloat(formData.price) || 0,
        expiryDate: formData.expiryDate,
        supplier: formData.supplier.trim(),
        minStockLevel: parseInt(formData.minStockLevel) || 10
      };

      console.log('📦 Request body:', requestBody);

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📊 Save response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Save drug result:', result);
        
        // Handle different response structures
        const savedDrug = result.drug || result.data || result;
        
        if (isEditing) {
          setDrugs(drugs.map(drug => drug._id === editingDrug._id ? savedDrug : drug));
        } else {
          setDrugs([savedDrug, ...drugs]);
        }
        
        setShowModal(false);
        alert(isEditing ? 'Drug updated successfully!' : 'Drug added successfully!');
      } else if (response.status === 401) {
        setError('Session expired. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } else {
        const errorData = await response.json();
        console.error('❌ Save drug error response:', errorData);
        setError(errorData.message || `Failed to save drug: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Save drug error:', error);
      setError('Network error saving drug. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------
  // Form Input Handler
  // ---------------------------
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // ---------------------------
  // Utility Functions
  // ---------------------------
  const categories = [...new Set(drugs.map(drug => drug.category).filter(Boolean))];

  const filteredDrugs = drugs.filter(drug => {
    const matchesSearch = 
      (drug.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (drug.batchNo?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (drug.supplier?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || drug.category === selectedCategory;
    const matchesLowStock = !showLowStock || drug.quantity <= (drug.minStockLevel || 10);
    
    return matchesSearch && matchesCategory && matchesLowStock;
  });

  const getStockStatus = (quantity, minStockLevel = 10) => {
    if (quantity === 0) return 'out-of-stock';
    if (quantity <= minStockLevel) return 'low-stock';
    if (quantity <= minStockLevel * 2) return 'warning';
    return 'normal';
  };

  const isExpired = (expiryDate) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const getTotalInventoryValue = () => {
    return drugs.reduce((total, drug) => total + ((drug.quantity || 0) * (drug.price || 0)), 0);
  };

  const getLowStockCount = () => {
    return drugs.filter(drug => (drug.quantity || 0) <= (drug.minStockLevel || 10)).length;
  };

  const getExpiredCount = () => {
    return drugs.filter(drug => isExpired(drug.expiryDate)).length;
  };

  // ---------------------------
  // Loading State
  // ---------------------------
  if (loading && drugs.length === 0) {
    return (
      <div className="drugs">
        <div className="container">
          <div className="loading-screen">
            <div className="loading-spinner"></div>
            <p>Loading drugs inventory...</p>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------
  // JSX
  // ---------------------------
  return (
    <div className="drugs">
      <div className="container">
        <div className="drugs-header">
          <div className="header-content">
            <h1>Drug Inventory</h1>
            <p>Manage your pharmacy drug stock and inventory</p>
          </div>
          <button className="btn btn-primary" onClick={handleAddDrug}>
            <span className="btn-icon">+</span>
            Add New Drug
          </button>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
            <button className="alert-close" onClick={() => setError('')}>×</button>
          </div>
        )}

        <div className="inventory-summary">
          <div className="summary-card">
            <div className="summary-icon">
              <span>💊</span>
            </div>
            <div className="summary-content">
              <h3>{drugs.length}</h3>
              <p>Total Drugs</p>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">
              <span>💰</span>
            </div>
            <div className="summary-content">
              <h3>KSh {getTotalInventoryValue().toLocaleString()}</h3>
              <p>Inventory Value</p>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">
              <span>⚠️</span>
            </div>
            <div className="summary-content">
              <h3>{getLowStockCount()}</h3>
              <p>Low Stock</p>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">
              <span>🚫</span>
            </div>
            <div className="summary-content">
              <h3>{getExpiredCount()}</h3>
              <p>Expired</p>
            </div>
          </div>
        </div>

        <div className="filters-card card">
          <div className="filters">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search drugs by name, batch, or supplier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="form-input category-filter"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <label className="filter-checkbox">
              <input
                type="checkbox"
                checked={showLowStock}
                onChange={(e) => setShowLowStock(e.target.checked)}
              />
              <span>Show Low Stock Only</span>
            </label>
          </div>
          <div className="drugs-count">
            <span>{filteredDrugs.length} of {drugs.length} drugs</span>
          </div>
        </div>

        <div className="card">
          <div className="table-container">
            <table className="drugs-table">
              <thead>
                <tr>
                  <th>Drug Name</th>
                  <th>Category</th>
                  <th>Batch No</th>
                  <th>Quantity</th>
                  <th>Price (KSh)</th>
                  <th>Cost (KSh)</th>
                  <th>Expiry Date</th>
                  <th>Supplier</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDrugs.map(drug => {
                  const stockStatus = getStockStatus(drug.quantity, drug.minStockLevel);
                  const expired = isExpired(drug.expiryDate);
                  
                  return (
                    <tr key={drug._id} className={expired ? 'expired-row' : ''}>
                      <td>
                        <div className="drug-name">
                          <strong>{drug.name || 'N/A'}</strong>
                          {expired && <span className="expired-badge">Expired</span>}
                        </div>
                      </td>
                      <td>
                        <span className="category-tag">{drug.category || 'Uncategorized'}</span>
                      </td>
                      <td className="batch-number">{drug.batchNo || 'N/A'}</td>
                      <td>
                        <span className={`quantity ${stockStatus}`}>
                          {drug.quantity || 0}
                        </span>
                      </td>
                      <td className="price">{(drug.price || 0).toLocaleString()}</td>
                      <td className="cost">{(drug.costPrice || drug.price || 0).toLocaleString()}</td>
                      <td>
                        <span className={expired ? 'expired-date' : 'expiry-date'}>
                          {drug.expiryDate ? new Date(drug.expiryDate).toLocaleDateString() : 'N/A'}
                        </span>
                      </td>
                      <td className="supplier">{drug.supplier || 'N/A'}</td>
                      <td>
                        <span className={`status-badge ${stockStatus}`}>
                          {stockStatus === 'out-of-stock' ? 'Out of Stock' :
                           stockStatus === 'low-stock' ? 'Low Stock' :
                           stockStatus === 'warning' ? 'Warning' : 'Normal'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="btn-action btn-edit"
                            onClick={() => handleEditDrug(drug)}
                            title="Edit drug"
                          >
                            ✏️ Edit
                          </button>
                          <button 
                            className="btn-action btn-delete"
                            onClick={() => handleDeleteDrug(drug._id)}
                            title="Delete drug"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {filteredDrugs.length === 0 && (
              <div className="no-drugs">
                <div className="no-drugs-icon">💊</div>
                <h3>No drugs found</h3>
                <p>
                  {searchTerm || selectedCategory || showLowStock 
                    ? 'Try adjusting your search filters' 
                    : 'Get started by adding your first drug'
                  }
                </p>
                {!searchTerm && !selectedCategory && !showLowStock && (
                  <button className="btn btn-primary" onClick={handleAddDrug}>
                    Add Your First Drug
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>{editingDrug ? 'Edit Drug' : 'Add New Drug'}</h2>
                <button 
                  className="close-btn"
                  onClick={() => setShowModal(false)}
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleSubmit}>
                {error && (
                  <div className="alert alert-error">
                    {error}
                  </div>
                )}
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Drug Name *</label>
                    <input
                      type="text"
                      name="name"
                      className="form-input"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter drug name"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <input
                      type="text"
                      name="category"
                      className="form-input"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g., Pain Relief, Antibiotic"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Batch Number *</label>
                    <input
                      type="text"
                      name="batchNo"
                      className="form-input"
                      value={formData.batchNo}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter batch number"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Quantity *</label>
                    <input
                      type="number"
                      name="quantity"
                      className="form-input"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      min="0"
                      required
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Selling Price (KSh) *</label>
                    <input
                      type="number"
                      name="price"
                      className="form-input"
                      value={formData.price}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      required
                      placeholder="0.00"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Cost Price (KSh) *</label>
                    <input
                      type="number"
                      name="costPrice"
                      className="form-input"
                      value={formData.costPrice}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      required
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Expiry Date *</label>
                    <input
                      type="date"
                      name="expiryDate"
                      className="form-input"
                      value={formData.expiryDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Min Stock Level</label>
                    <input
                      type="number"
                      name="minStockLevel"
                      className="form-input"
                      value={formData.minStockLevel}
                      onChange={handleInputChange}
                      min="1"
                      placeholder="10"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Supplier *</label>
                  <input
                    type="text"
                    name="supplier"
                    className="form-input"
                    value={formData.supplier}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter supplier name"
                  />
                </div>

                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : (editingDrug ? 'Update Drug' : 'Add Drug')}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Drugs;
