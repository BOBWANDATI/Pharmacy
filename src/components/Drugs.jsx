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

  // ✅ Use same environment setup as Dashboard
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://pharmacy-backend-qrb8.onrender.com';

  useEffect(() => {
    fetchDrugs();
  }, []);

  const fetchDrugs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/drugs`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDrugs(data.drugs || data);
      } else {
        setError('Failed to load drugs');
      }
    } catch (error) {
      setError('Network error loading drugs');
      console.error('Drugs error:', error);
    } finally {
      setLoading(false);
    }
  };

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
  };

  const handleEditDrug = (drug) => {
    setEditingDrug(drug);
    setFormData({
      name: drug.name,
      category: drug.category,
      batchNo: drug.batchNo,
      quantity: drug.quantity.toString(),
      price: drug.price.toString(),
      costPrice: drug.costPrice?.toString() || drug.price.toString(),
      expiryDate: drug.expiryDate.split('T')[0],
      supplier: drug.supplier,
      minStockLevel: drug.minStockLevel?.toString() || '10'
    });
    setShowModal(true);
  };

  const handleDeleteDrug = async (id) => {
    if (window.confirm('Are you sure you want to delete this drug?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/drugs/${id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          setDrugs(drugs.filter((drug) => drug._id !== id));
        } else {
          const errorData = await response.json();
          alert(errorData.message || 'Failed to delete drug');
        }
      } catch (error) {
        alert('Network error deleting drug');
        console.error('Delete drug error:', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const url = editingDrug
        ? `${API_BASE_URL}/api/drugs/${editingDrug._id}`
        : `${API_BASE_URL}/api/drugs`;

      const method = editingDrug ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          quantity: parseInt(formData.quantity),
          price: parseFloat(formData.price),
          costPrice: parseFloat(formData.costPrice),
          minStockLevel: parseInt(formData.minStockLevel),
        }),
      });

      if (response.ok) {
        const updatedDrug = await response.json();
        if (editingDrug) {
          setDrugs(drugs.map((d) => (d._id === editingDrug._id ? updatedDrug : d)));
        } else {
          setDrugs([updatedDrug, ...drugs]);
        }
        setShowModal(false);
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to save drug');
      }
    } catch (error) {
      setError('Network error saving drug');
      console.error('Save drug error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const categories = [...new Set(drugs.map((drug) => drug.category))];

  const filteredDrugs = drugs.filter((drug) => {
    const matchesSearch =
      drug.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      drug.batchNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      drug.supplier.toLowerCase().includes(searchTerm.toLowerCase());
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

  const isExpired = (expiryDate) => new Date(expiryDate) < new Date();

  const getTotalInventoryValue = () =>
    drugs.reduce((total, drug) => total + drug.quantity * drug.price, 0);

  const getLowStockCount = () =>
    drugs.filter((drug) => drug.quantity <= (drug.minStockLevel || 10)).length;

  const getExpiredCount = () =>
    drugs.filter((drug) => isExpired(drug.expiryDate)).length;

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

  return (
    <div className="drugs">
      <div className="container">
        <div className="drugs-header">
          <div className="header-content">
            <h1>Drug Inventory</h1>
            <p>Manage your pharmacy drug stock and inventory</p>
          </div>
          <button className="btn btn-primary" onClick={handleAddDrug}>
            <span className="btn-icon">+</span> Add New Drug
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="inventory-summary">
          <div className="summary-card"><span>💊</span><h3>{drugs.length}</h3><p>Total Drugs</p></div>
          <div className="summary-card"><span>💰</span><h3>KSh {getTotalInventoryValue().toLocaleString()}</h3><p>Inventory Value</p></div>
          <div className="summary-card"><span>⚠️</span><h3>{getLowStockCount()}</h3><p>Low Stock</p></div>
          <div className="summary-card"><span>🚫</span><h3>{getExpiredCount()}</h3><p>Expired</p></div>
        </div>

        {/* Filters */}
        <div className="filters-card card">
          <div className="filters">
            <input
              type="text"
              placeholder="Search drugs by name, batch, or supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="form-input"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <label>
              <input
                type="checkbox"
                checked={showLowStock}
                onChange={(e) => setShowLowStock(e.target.checked)}
              />
              Show Low Stock Only
            </label>
          </div>
          <div className="drugs-count">
            <span>{filteredDrugs.length} of {drugs.length} drugs</span>
          </div>
        </div>

        {/* ✅ Drug Table */}
        <div className="drugs-table card">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Batch</th>
                <th>Category</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Expiry</th>
                <th>Supplier</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDrugs.length > 0 ? (
                filteredDrugs.map((drug) => (
                  <tr
                    key={drug._id}
                    className={`${getStockStatus(drug.quantity, drug.minStockLevel)} ${isExpired(drug.expiryDate) ? 'expired' : ''}`}
                  >
                    <td>{drug.name}</td>
                    <td>{drug.batchNo}</td>
                    <td>{drug.category}</td>
                    <td>{drug.quantity}</td>
                    <td>KSh {drug.price}</td>
                    <td>{new Date(drug.expiryDate).toLocaleDateString()}</td>
                    <td>{drug.supplier}</td>
                    <td>
                      <button className="btn-edit" onClick={() => handleEditDrug(drug)}>✏️</button>
                      <button className="btn-delete" onClick={() => handleDeleteDrug(drug._id)}>🗑️</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center' }}>No drugs found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Drugs;
