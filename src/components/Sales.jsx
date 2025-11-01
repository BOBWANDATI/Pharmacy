import React, { useState, useEffect } from 'react';
import './Sales.css';

const Sales = () => {
  const [cart, setCart] = useState([]);
  const [drugs, setDrugs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processingSale, setProcessingSale] = useState(false);
  const [saleData, setSaleData] = useState(null);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [error, setError] = useState('');

  // ✅ Use the same API base URL as other components
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    'https://pharmacy-backend-qrb8.onrender.com';

  console.log('🔗 Sales - Using API Base URL:', API_BASE_URL);

  useEffect(() => {
    fetchDrugs();
  }, []);

  // ---------------------------
  // Fetch Drugs from Backend
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
      console.log('📡 Fetching drugs for sales from:', endpoint);

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📊 Drugs response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Sales drugs data received:', data);
        
        // Handle different response structures
        if (data.drugs && Array.isArray(data.drugs)) {
          setDrugs(data.drugs);
        } else if (data.data && Array.isArray(data.data)) {
          setDrugs(data.data);
        } else if (Array.isArray(data)) {
          setDrugs(data);
        } else {
          console.warn('⚠️ Unexpected drugs response structure:', data);
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

  // ---------------------------
  // Cart Management
  // ---------------------------
  const filteredDrugs = drugs.filter(
    (drug) =>
      drug.name?.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (drug.quantity || 0) > 0
  );

  const addToCart = (drug) => {
    const existingItem = cart.find((item) => item.drugId === drug._id);
    const availableQuantity = drug.quantity || 0;
    
    if (existingItem) {
      if (existingItem.quantity < availableQuantity) {
        setCart(
          cart.map((item) =>
            item.drugId === drug._id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        );
      } else {
        alert(`Only ${availableQuantity} units available in stock`);
      }
    } else {
      if (availableQuantity > 0) {
        setCart([
          ...cart,
          {
            drugId: drug._id,
            name: drug.name,
            price: drug.price || 0,
            quantity: 1,
            maxQuantity: availableQuantity,
            batchNo: drug.batchNo,
          },
        ]);
      }
    }
  };

  const removeFromCart = (drugId) => {
    setCart(cart.filter((item) => item.drugId !== drugId));
  };

  const updateQuantity = (drugId, quantity) => {
    const item = cart.find((item) => item.drugId === drugId);
    if (quantity <= 0) {
      removeFromCart(drugId);
    } else if (item && quantity <= item.maxQuantity) {
      setCart(
        cart.map((item) =>
          item.drugId === drugId ? { ...item, quantity } : item
        )
      );
    } else {
      alert(`Maximum ${item?.maxQuantity || 0} units available`);
    }
  };

  const getTotal = () => cart.reduce((t, i) => t + (i.price || 0) * i.quantity, 0);
  const getTotalItems = () => cart.reduce((t, i) => t + i.quantity, 0);

  // ---------------------------
  // Complete Sale
  // ---------------------------
  const completeSale = async () => {
    if (cart.length === 0) {
      alert('Please add items to cart first');
      return;
    }

    setProcessingSale(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please login again.');
        setProcessingSale(false);
        return;
      }

      const endpoint = `${API_BASE_URL}/api/sales`;
      console.log('💰 Completing sale at:', endpoint);

      const salePayload = {
        items: cart.map((item) => ({
          drugId: item.drugId,
          quantity: item.quantity,
          unitPrice: item.price
        })),
        paymentMethod,
        customerName: customerInfo.name.trim() || 'Walk-in Customer',
        customerPhone: customerInfo.phone.trim() || '',
        totalAmount: getTotal()
      };

      console.log('📦 Sale payload:', salePayload);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(salePayload),
      });

      console.log('📊 Sale response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Sale completed successfully:', result);
        
        // Handle different response structures
        const saleResult = result.sale || result.data || result;
        setSaleData(saleResult);
        setShowReceipt(true);
        setCart([]);
        setCustomerInfo({ name: '', phone: '' });
        
        // Refresh drugs inventory
        await fetchDrugs();
        
        alert('Sale completed successfully!');
      } else if (response.status === 401) {
        setError('Session expired. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } else {
        const errorText = await response.text();
        console.error('❌ Sale error response:', errorText);
        
        let errorMessage = `Failed to complete sale: ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          // If it's not JSON, use the text directly
          errorMessage = errorText || errorMessage;
        }
        
        setError(errorMessage);
        alert(errorMessage);
      }
    } catch (error) {
      console.error('❌ Network error completing sale:', error);
      setError('Network error completing sale. Please check your connection.');
      alert('Network error completing sale. Please try again.');
    } finally {
      setProcessingSale(false);
    }
  };

  // ---------------------------
  // Receipt & UI Functions
  // ---------------------------
  const resetSale = () => {
    setShowReceipt(false);
    setSaleData(null);
    setError('');
  };

  const printReceipt = () => {
    const content = document.getElementById('receipt');
    const newWin = window.open('', '_blank');
    newWin.document.write(`
      <html>
        <head>
          <title>Receipt - PharmaLink</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              line-height: 1.4;
            }
            .receipt { 
              border: 1px solid #000; 
              padding: 20px; 
              max-width: 400px;
              margin: 0 auto;
            }
            .receipt-header { 
              text-align: center; 
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
              margin-bottom: 15px;
            }
            .receipt-items { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 10px 0; 
            }
            .receipt-items th, 
            .receipt-items td { 
              padding: 8px; 
              border-bottom: 1px solid #ddd; 
              text-align: left;
            }
            .receipt-items th {
              border-bottom: 2px solid #000;
            }
            .receipt-total { 
              text-align: right; 
              margin-top: 15px; 
              font-weight: bold;
              font-size: 1.1em;
              border-top: 2px solid #000;
              padding-top: 10px;
            }
            .customer-info {
              margin: 10px 0;
              padding: 10px;
              background: #f5f5f5;
            }
            .thank-you {
              text-align: center;
              margin-top: 15px;
              font-style: italic;
            }
          </style>
        </head>
        <body>
          ${content?.innerHTML || 'No receipt content'}
        </body>
      </html>`);
    newWin.document.close();
    newWin.print();
  };

  const clearCart = () => {
    if (cart.length > 0 && window.confirm('Clear all items from cart?')) {
      setCart([]);
    }
  };

  const getStockStatus = (quantity) => {
    if (quantity === 0) return 'out-of-stock';
    if (quantity <= 5) return 'low-stock';
    if (quantity <= 15) return 'warning';
    return 'normal';
  };

  const renderReceiptItems = () => {
    if (!saleData?.items) return null;
    
    return saleData.items.map((item, index) => (
      <tr key={index} className="receipt-item">
        <td>{item.drugName || item.name || 'Unknown Item'}</td>
        <td>{item.quantity}</td>
        <td>KSh {(item.unitPrice || item.price || 0).toLocaleString()}</td>
        <td>KSh {(item.totalPrice || (item.quantity * (item.unitPrice || item.price || 0))).toLocaleString()}</td>
      </tr>
    ));
  };

  // ---------------------------
  // JSX
  // ---------------------------
  return (
    <div className="sales">
      <div className="container">
        <div className="sales-header">
          <div className="header-content">
            <h1>Point of Sale</h1>
            <p>Process customer sales and generate receipts</p>
          </div>
          <div className="header-stats">
            <div className="stat-item">
              <span className="stat-label">Items in Cart:</span>
              <strong className="stat-value">{getTotalItems()}</strong>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Amount:</span>
              <strong className="stat-value">KSh {getTotal().toLocaleString()}</strong>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-error">
            <strong>Error:</strong> {error}
            <button onClick={() => setError('')} className="alert-close">
              ×
            </button>
          </div>
        )}

        <div className="sales-layout">
          {/* 🔹 Left: Drugs List */}
          <div className="pos-section">
            <div className="card">
              <div className="card-header">
                <h2>Available Drugs</h2>
                <div className="search-box">
                  <input
                    type="text"
                    placeholder="Search drug by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              {loading ? (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <p>Loading drugs inventory...</p>
                </div>
              ) : (
                <div className="drugs-grid">
                  {filteredDrugs.length === 0 ? (
                    <div className="no-drugs">
                      <p>No drugs found {searchTerm ? 'matching your search' : 'in stock'}</p>
                    </div>
                  ) : (
                    filteredDrugs.map((drug) => (
                      <div key={drug._id} className={`drug-card ${getStockStatus(drug.quantity || 0)}`}>
                        <div className="drug-info">
                          <h3>{drug.name || 'Unknown Drug'}</h3>
                          <p className="drug-price">KSh {(drug.price || 0).toLocaleString()}</p>
                          <p className="drug-quantity">
                            Stock: <span className={`stock-${getStockStatus(drug.quantity || 0)}`}>
                              {drug.quantity || 0}
                            </span>
                          </p>
                          {drug.batchNo && (
                            <p className="drug-batch">Batch: {drug.batchNo}</p>
                          )}
                        </div>
                        <button
                          className="btn btn-primary add-to-cart-btn"
                          disabled={(drug.quantity || 0) === 0}
                          onClick={() => addToCart(drug)}
                        >
                          {(drug.quantity || 0) === 0 ? 'Out of Stock' : 'Add to Cart'}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 🔹 Right: Cart & Customer Info */}
          <div className="cart-section">
            <div className="card">
              <div className="card-header">
                <h2>Shopping Cart</h2>
                {cart.length > 0 && (
                  <button className="btn btn-secondary" onClick={clearCart}>
                    Clear Cart
                  </button>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="empty-cart">
                  <div className="empty-cart-icon">🛒</div>
                  <p>Your cart is empty</p>
                  <p className="empty-cart-hint">Add drugs from the list to get started</p>
                </div>
              ) : (
                <>
                  <div className="cart-items">
                    {cart.map((item) => (
                      <div key={item.drugId} className="cart-item">
                        <div className="cart-item-info">
                          <div className="cart-item-name">{item.name}</div>
                          <div className="cart-item-price">
                            KSh {((item.price || 0) * item.quantity).toLocaleString()}
                          </div>
                        </div>
                        <div className="cart-item-controls">
                          <button 
                            className="btn-quantity"
                            onClick={() => updateQuantity(item.drugId, item.quantity - 1)}
                          >
                            -
                          </button>
                          <span className="quantity-display">{item.quantity}</span>
                          <button 
                            className="btn-quantity"
                            onClick={() => updateQuantity(item.drugId, item.quantity + 1)}
                          >
                            +
                          </button>
                          <button 
                            className="btn-remove"
                            onClick={() => removeFromCart(item.drugId)}
                            title="Remove from cart"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Customer Information */}
                  <div className="customer-section">
                    <h3>Customer Information</h3>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Customer Name</label>
                        <input
                          type="text"
                          className="form-input"
                          value={customerInfo.name}
                          onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                          placeholder="Optional - leave blank for walk-in"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Phone Number</label>
                        <input
                          type="tel"
                          className="form-input"
                          value={customerInfo.phone}
                          onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                          placeholder="Optional"
                        />
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Payment Method</label>
                      <select
                        className="form-input"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      >
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="mpesa">M-Pesa</option>
                        <option value="insurance">Insurance</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="cart-total">
                    <div className="total-line">
                      <span>Items:</span>
                      <span>{getTotalItems()}</span>
                    </div>
                    <div className="total-line grand-total">
                      <span>Total Amount:</span>
                      <span>KSh {getTotal().toLocaleString()}</span>
                    </div>
                  </div>

                  <button
                    className="btn btn-primary complete-sale-btn"
                    onClick={completeSale}
                    disabled={processingSale || cart.length === 0}
                  >
                    {processingSale ? (
                      <>
                        <div className="loading-spinner-small"></div>
                        Processing Sale...
                      </>
                    ) : (
                      `Complete Sale - KSh ${getTotal().toLocaleString()}`
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 🔹 Receipt Modal */}
        {showReceipt && saleData && (
          <div className="modal-overlay">
            <div className="modal-content receipt-modal">
              <div className="modal-header">
                <h2>Sale Completed Successfully! ✅</h2>
                <button className="close-btn" onClick={resetSale}>×</button>
              </div>
              
              <div id="receipt" className="receipt">
                <div className="receipt-header">
                  <h3>PharmaLink Pharmacy</h3>
                  <p>Quality Healthcare Solutions</p>
                </div>
                
                <div className="receipt-info">
                  <p><strong>Receipt #:</strong> {saleData.saleNumber || saleData._id || 'N/A'}</p>
                  <p><strong>Date:</strong> {new Date(saleData.createdAt || Date.now()).toLocaleString()}</p>
                  {saleData.customerName && saleData.customerName !== 'Walk-in Customer' && (
                    <p><strong>Customer:</strong> {saleData.customerName}</p>
                  )}
                  {saleData.customerPhone && (
                    <p><strong>Phone:</strong> {saleData.customerPhone}</p>
                  )}
                  <p><strong>Payment Method:</strong> {saleData.paymentMethod || 'Cash'}</p>
                </div>

                <table className="receipt-items">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {renderReceiptItems()}
                  </tbody>
                </table>

                <div className="receipt-total">
                  <strong>TOTAL: KSh {(saleData.totalAmount || getTotal()).toLocaleString()}</strong>
                </div>

                <div className="thank-you">
                  <p>Thank you for your business!</p>
                  <p>For inquiries: Contact PharmaLink Pharmacy</p>
                </div>
              </div>

              <div className="receipt-actions">
                <button className="btn btn-primary" onClick={printReceipt}>
                  🖨 Print Receipt
                </button>
                <button className="btn btn-secondary" onClick={resetSale}>
                  ➕ New Sale
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sales;
