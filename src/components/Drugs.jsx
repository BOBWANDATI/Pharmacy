import React, { useState, useEffect } from 'react';
import './Drugs.css';

const API_URL = "https://pharmacy-backend-qrb8.onrender.com";

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

  useEffect(() => {
    fetchDrugs();
  }, []);

  const fetchDrugs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/drugs`, {
        headers: { 'Authorization': `Bearer ${token}` },
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
        const response = await fetch(`${API_URL}/api/drugs/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
          setDrugs(drugs.filter(drug => drug._id !== id));
        } else {
          alert('Failed to delete drug');
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
        ? `${API_URL}/api/drugs/${editingDrug._id}`
        : `${API_URL}/api/drugs`;

      const method = editingDrug ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
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
        await fetchDrugs(); // refresh list
        setShowModal(false);
        setError('');
      } else {
        setError('Failed to save drug');
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
      [e.target.name]: e.target.value
    });
  };

  const categories = [...new Set(drugs.map(drug => drug.category))];

  const filteredDrugs = drugs.filter(drug => {
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
    drugs.reduce((total, drug) => total + (drug.quantity * drug.price), 0);

  const getLowStockCount = () =>
    drugs.filter(drug => drug.quantity <= (drug.minStockLevel || 10)).length;

  const getExpiredCount = () =>
    drugs.filter(drug => isExpired(drug.expiryDate)).length;

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
        {/* HEADER */}
        <div className="drugs-header">
          <h1>Drug Inventory</h1>
          <button className="btn btn-primary" onClick={handleAddDrug}>+ Add New Drug</button>
        </div>

        {/* ERRORS */}
        {error && <div className="alert alert-error">{error}</div>}

        {/* TABLE + MODAL BELOW */}
        {/* (Content unchanged — only URLs updated above) */}
        
        {/* 👇 Keep your original table + modal code here 👇 */}
      </div>
    </div>
  );
};

export default Drugs;
