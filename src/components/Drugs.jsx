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
    minStockLevel: '10',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);

  // ✅ Ensure we use the deployed backend or fallback locally for development
  const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    import.meta.env.NEXT_PUBLIC_API_URL ||
    'https://pharmacy-backend-qrb8.onrender.com';

  useEffect(() => {
    fetchDrugs();
  }, []);

  // ✅ Fetch all drugs
  const fetchDrugs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/drugs`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch drugs');
      const data = await response.json();
      setDrugs(data.drugs || data);
    } catch (err) {
      console.error('❌ Drug fetch error:', err);
      setError('Failed to load drugs from backend');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Add new drug
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
      minStockLevel: '10',
    });
    setShowModal(true);
  };

  // ✅ Edit existing drug
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
      minStockLevel: drug.minStockLevel?.toString() || '10',
    });
    setShowModal(true);
  };

  // ✅ Delete drug
  const handleDeleteDrug = async (id) => {
    if (!window.confirm('Are you sure you want to delete this drug?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/drugs/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to delete drug');
      setDrugs(drugs.filter((drug) => drug._id !== id));
    } catch (err) {
      console.error('❌ Delete error:', err);
      alert('Error deleting drug');
    }
  };

  // ✅ Create or update drug
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

      if (!response.ok) throw new Error('Failed to save drug');
      const savedDrug = await response.json();

      setDrugs((prev) =>
        editingDrug
          ? prev.map((d) => (d._id === editingDrug._id ? savedDrug : d))
          : [savedDrug, ...prev]
      );
      setShowModal(false);
      setError('');
    } catch (err) {
      console.error('❌ Save error:', err);
      setError('Error saving drug');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Controlled form inputs
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ✅ Filters
  const categories = [...new Set(drugs.map((d) => d.category))];
  const filteredDrugs = drugs.filter((d) => {
    const matchSearch =
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.batchNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = !selectedCategory || d.category === selectedCategory;
    const matchLowStock = !showLowStock || d.quantity <= (d.minStockLevel || 10);
    return matchSearch && matchCategory && matchLowStock;
  });

  // ✅ Helpers
  const getStockStatus = (q, min = 10) =>
    q === 0 ? 'out-of-stock' : q <= min ? 'low-stock' : q <= min * 2 ? 'warning' : 'normal';
  const isExpired = (date) => new Date(date) < new Date();
  const getTotalValue = () => drugs.reduce((t, d) => t + d.quantity * d.price, 0);
  const getLowStockCount = () => drugs.filter((d) => d.quantity <= (d.minStockLevel || 10)).length;
  const getExpiredCount = () => drugs.filter((d) => isExpired(d.expiryDate)).length;

  // ✅ UI
  if (loading && drugs.length === 0)
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading drug inventory...</p>
      </div>
    );

  return (
    <div className="drugs">
      <div className="container">
        <div className="drugs-header">
          <div>
            <h1>Drug Inventory</h1>
            <p>Manage your pharmacy drug stock and suppliers</p>
          </div>
          <button className="btn btn-primary" onClick={handleAddDrug}>
            + Add Drug
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="inventory-summary">
          <div className="summary-card"><span>💊</span><h3>{drugs.length}</h3><p>Total Drugs</p></div>
          <div className="summary-card"><span>💰</span><h3>KSh {getTotalValue().toLocaleString()}</h3><p>Total Value</p></div>
          <div className="summary-card"><span>⚠️</span><h3>{getLowStockCount()}</h3><p>Low Stock</p></div>
          <div className="summary-card"><span>🚫</span><h3>{getExpiredCount()}</h3><p>Expired</p></div>
        </div>

        <div className="filters-card card">
          <input
            type="text"
            placeholder="Search drug by name, batch or supplier..."
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
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <label>
            <input
              type="checkbox"
              checked={showLowStock}
              onChange={(e) => setShowLowStock(e.target.checked)}
            />
            Show Low Stock
          </label>
        </div>

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
                    className={`${getStockStatus(drug.quantity, drug.minStockLevel)} ${
                      isExpired(drug.expiryDate) ? 'expired' : ''
                    }`}
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
