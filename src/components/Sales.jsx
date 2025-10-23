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

  // API configuration
  const API_BASE_URL = 'http://localhost:5000/api';

  useEffect(() => {
    fetchDrugs();
  }, []);

  const fetchDrugs = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please login again.');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/drugs`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch drugs: ${response.status}`);
      }

      const data = await response.json();
      setDrugs(data.drugs || data);
    } catch (error) {
      console.error('Sales drugs error:', error);
      setError(`Failed to load drugs: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredDrugs = drugs.filter(drug =>
    drug.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    drug.quantity > 0
  );

  const addToCart = (drug) => {
    const existingItem = cart.find(item => item.drugId === drug._id);
    if (existingItem) {
      if (existingItem.quantity < drug.quantity) {
        setCart(cart.map(item =>
          item.drugId === drug._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      } else {
        alert(`Only ${drug.quantity} units available in stock`);
      }
    } else {
      if (drug.quantity > 0) {
        setCart([...cart, { 
          drugId: drug._id, 
          name: drug.name,
          price: drug.price,
          quantity: 1,
          maxQuantity: drug.quantity,
          batchNo: drug.batchNo
        }]);
      }
    }
  };

  const removeFromCart = (drugId) => {
    setCart(cart.filter(item => item.drugId !== drugId));
  };

  const updateQuantity = (drugId, quantity) => {
    if (quantity === 0) {
      removeFromCart(drugId);
    } else {
      const item = cart.find(item => item.drugId === drugId);
      if (item && quantity <= item.maxQuantity) {
        setCart(cart.map(item =>
          item.drugId === drugId ? { ...item, quantity } : item
        ));
      } else {
        alert(`Maximum ${item.maxQuantity} units available`);
      }
    }
  };

  const getTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const completeSale = async () => {
    if (cart.length === 0) {
      alert('Please add items to cart before completing sale');
      return;
    }

    setProcessingSale(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please login again.');
        return;
      }

      const salePayload = {
        items: cart.map(item => ({
          drugId: item.drugId,
          quantity: item.quantity
        })),
        paymentMethod,
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone
      };

      console.log('Sending sale request...', salePayload);

      const response = await fetch(`${API_BASE_URL}/sales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(salePayload),
      });

      const responseText = await response.text();
      
      // Check if it's an HTML error page
      if (responseText.startsWith('<!DOCTYPE') || responseText.startsWith('<html')) {
        throw new Error('Server returned HTML error page. Check if backend is running correctly.');
      }

      // Try to parse as JSON
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}`);
      }

      if (!response.ok) {
        throw new Error(result.message || `Request failed with status ${response.status}`);
      }

      // Success case
      console.log('Sale completed successfully:', result);
      setSaleData(result.sale || result);
      setShowReceipt(true);
      setCart([]);
      setCustomerInfo({ name: '', phone: '' });
      
      // Refresh drugs list to show updated quantities
      await fetchDrugs();

    } catch (error) {
      console.error('Sale error:', error);
      setError(error.message || 'Failed to complete sale. Please try again.');
    } finally {
      setProcessingSale(false);
    }
  };

  const resetSale = () => {
    setShowReceipt(false);
    setSaleData(null);
    setError('');
  };

  const printReceipt = () => {
    try {
      const receiptContent = document.getElementById('receipt');
      if (!receiptContent) {
        console.error('Receipt element not found');
        return;
      }

      const receiptHtml = receiptContent.innerHTML;
      const printWindow = window.open('', '_blank');
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Receipt</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .receipt { border: 1px solid #000; padding: 20px; }
              .receipt-header { text-align: center; margin-bottom: 20px; }
              .receipt-items { width: 100%; border-collapse: collapse; margin: 20px 0; }
              .receipt-items th, .receipt-items td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
              .receipt-total { margin-top: 20px; text-align: right; }
              .thank-you { text-align: center; margin-top: 20px; font-style: italic; }
              @media print { body { margin: 0; } }
            </style>
          </head>
          <body>
            <div class="receipt">
              ${receiptHtml}
              <div class="print-footer">
                <p>Thank you for choosing PharmaLink Pharmacy</p>
                <p>For inquiries: +254 700 000 000</p>
              </div>
            </div>
            <script>
              window.onload = function() {
                window.print();
                setTimeout(() => window.close(), 500);
              };
            </script>
          </body>
        </html>
      `);
      
      printWindow.document.close();
    } catch (printError) {
      console.error('Print error:', printError);
      alert('Error printing receipt. Please try again.');
    }
  };

  const clearCart = () => {
    if (cart.length > 0 && window.confirm('Are you sure you want to clear the cart?')) {
      setCart([]);
      setCustomerInfo({ name: '', phone: '' });
    }
  };

  const getStockStatus = (quantity) => {
    if (quantity === 0) return 'out-of-stock';
    if (quantity <= 5) return 'low-stock';
    if (quantity <= 15) return 'warning';
    return 'normal';
  };

  // Safe render function for sale data
  const renderReceiptItems = () => {
    if (!saleData?.items) return null;
    
    return saleData.items.map((item, index) => (
      <div key={index} className="receipt-item">
        <span className="item-name">{item.drugName || 'Unknown Item'}</span>
        <span className="item-quantity">{item.quantity || 0}</span>
        <span className="item-price">KSh {item.unitPrice ? item.unitPrice.toLocaleString() : '0'}</span>
        <span className="item-total">KSh {item.totalPrice ? item.totalPrice.toLocaleString() : '0'}</span>
      </div>
    ));
  };

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
              <span className="stat-label">Items in Cart</span>
              <span className="stat-value">{getTotalItems()}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Amount</span>
              <span className="stat-value">KSh {getTotal().toLocaleString()}</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-error">
            <strong>Error:</strong> {error}
            <button 
              className="alert-close" 
              onClick={() => setError('')}
              aria-label="Close error"
            >
              ×
            </button>
          </div>
        )}

        <div className="sales-layout">
          <div className="pos-section">
            <div className="card">
              <div className="card-header">
                <h2>Search & Add Drugs</h2>
                <div className="drugs-count">
                  {filteredDrugs.length} drugs available
                </div>
              </div>
              
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search drugs by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input"
                />
              </div>

              {loading ? (
                <div className="loading-drugs">
                  <div className="loading-spinner"></div>
                  <p>Loading available drugs...</p>
                </div>
              ) : (
                <div className="drugs-grid">
                  {filteredDrugs.map(drug => {
                    const stockStatus = getStockStatus(drug.quantity);
                    return (
                      <div key={drug._id} className={`drug-card ${stockStatus}`}>
                        <div className="drug-info">
                          <h3>{drug.name}</h3>
                          <p className="drug-category">{drug.category}</p>
                          <p className="drug-batch">Batch: {drug.batchNo}</p>
                          <div className="drug-pricing">
                            <p className="drug-price">KSh {drug.price.toLocaleString()}</p>
                            {drug.costPrice && (
                              <p className="drug-cost">Cost: KSh {drug.costPrice.toLocaleString()}</p>
                            )}
                          </div>
                          <div className="drug-stock-info">
                            <span className={`stock-badge ${stockStatus}`}>
                              {stockStatus === 'out-of-stock' ? 'Out of Stock' :
                               stockStatus === 'low-stock' ? 'Low Stock' :
                               stockStatus === 'warning' ? 'Limited' : 'In Stock'}
                            </span>
                            <span className="stock-quantity">{drug.quantity} units</span>
                          </div>
                        </div>
                        <button
                          className="btn btn-primary"
                          onClick={() => addToCart(drug)}
                          disabled={drug.quantity === 0}
                        >
                          {drug.quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                        </button>
                      </div>
                    );
                  })}
                  
                  {filteredDrugs.length === 0 && (
                    <div className="no-drugs-found">
                      <div className="no-drugs-icon">💊</div>
                      <h3>No drugs found</h3>
                      <p>
                        {searchTerm 
                          ? `No drugs found matching "${searchTerm}"` 
                          : 'No drugs available in stock'
                        }
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="cart-section">
            <div className="card">
              <div className="card-header">
                <h2>Shopping Cart</h2>
                {cart.length > 0 && (
                  <button 
                    className="btn btn-secondary btn-clear"
                    onClick={clearCart}
                  >
                    Clear Cart
                  </button>
                )}
              </div>
              
              {cart.length === 0 ? (
                <div className="empty-cart">
                  <div className="empty-cart-icon">🛒</div>
                  <h3>Your cart is empty</h3>
                  <p>Add drugs from the left panel to start a sale</p>
                </div>
              ) : (
                <>
                  <div className="cart-items">
                    {cart.map(item => (
                      <div key={item.drugId} className="cart-item">
                        <div className="item-info">
                          <h4>{item.name}</h4>
                          <p className="item-batch">Batch: {item.batchNo}</p>
                          <p className="item-price">KSh {item.price.toLocaleString()} each</p>
                        </div>
                        <div className="item-controls">
                          <button
                            className="quantity-btn"
                            onClick={() => updateQuantity(item.drugId, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            -
                          </button>
                          <span className="quantity">{item.quantity}</span>
                          <button
                            className="quantity-btn"
                            onClick={() => updateQuantity(item.drugId, item.quantity + 1)}
                            disabled={item.quantity >= item.maxQuantity}
                          >
                            +
                          </button>
                        </div>
                        <div className="item-total">
                          <strong>KSh {(item.price * item.quantity).toLocaleString()}</strong>
                          <button
                            className="remove-btn"
                            onClick={() => removeFromCart(item.drugId)}
                            title="Remove from cart"
                            aria-label="Remove item"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="customer-info">
                    <h4>Customer Information</h4>
                    <div className="form-row">
                      <div className="form-group">
                        <input
                          type="text"
                          placeholder="Customer Name (Optional)"
                          value={customerInfo.name}
                          onChange={(e) => setCustomerInfo(prev => ({...prev, name: e.target.value}))}
                          className="form-input"
                        />
                      </div>
                      <div className="form-group">
                        <input
                          type="tel"
                          placeholder="Phone Number (Optional)"
                          value={customerInfo.phone}
                          onChange={(e) => setCustomerInfo(prev => ({...prev, phone: e.target.value}))}
                          className="form-input"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="payment-section">
                    <h4>Payment Method</h4>
                    <div className="payment-options">
                      <label className={`payment-option ${paymentMethod === 'cash' ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="cash"
                          checked={paymentMethod === 'cash'}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                        />
                        <span className="payment-icon">💵</span>
                        <span className="payment-label">Cash</span>
                      </label>
                      <label className={`payment-option ${paymentMethod === 'card' ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="card"
                          checked={paymentMethod === 'card'}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                        />
                        <span className="payment-icon">💳</span>
                        <span className="payment-label">Card</span>
                      </label>
                      <label className={`payment-option ${paymentMethod === 'mobile_money' ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="mobile_money"
                          checked={paymentMethod === 'mobile_money'}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                        />
                        <span className="payment-icon">📱</span>
                        <span className="payment-label">Mobile Money</span>
                      </label>
                    </div>
                  </div>

                  <div className="cart-summary">
                    <div className="summary-row">
                      <span>Items ({getTotalItems()}):</span>
                      <span>KSh {getTotal().toLocaleString()}</span>
                    </div>
                    <div className="summary-row total">
                      <span>Total Amount:</span>
                      <span className="total-amount">KSh {getTotal().toLocaleString()}</span>
                    </div>
                  </div>

                  <button
                    className="btn btn-primary complete-sale-btn"
                    onClick={completeSale}
                    disabled={processingSale}
                  >
                    {processingSale ? (
                      <>
                        <div className="btn-spinner"></div>
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

        {showReceipt && saleData && (
          <div className="modal-overlay">
            <div className="modal-content receipt-modal">
              <div className="modal-header">
                <h2>Sale Completed Successfully! 🎉</h2>
                <button className="close-btn" onClick={resetSale}>×</button>
              </div>
              
              <div className="receipt" id="receipt">
                <div className="receipt-header">
                  <h3>PharmaLink Pharmacy</h3>
                  <p>Quality Healthcare Solutions</p>
                  <div className="receipt-details">
                    <p><strong>Receipt #:</strong> {saleData.saleNumber || 'N/A'}</p>
                    <p><strong>Date:</strong> {new Date(saleData.createdAt || Date.now()).toLocaleDateString()}</p>
                    <p><strong>Time:</strong> {new Date(saleData.createdAt || Date.now()).toLocaleTimeString()}</p>
                  </div>
                </div>

                {(saleData.customerName || saleData.customerPhone) && (
                  <div className="customer-receipt-info">
                    {saleData.customerName && <p><strong>Customer:</strong> {saleData.customerName}</p>}
                    {saleData.customerPhone && <p><strong>Phone:</strong> {saleData.customerPhone}</p>}
                  </div>
                )}

                <div className="receipt-items">
                  <div className="receipt-items-header">
                    <span>Item</span>
                    <span>Qty</span>
                    <span>Price</span>
                    <span>Total</span>
                  </div>
                  {renderReceiptItems()}
                </div>

                <div className="receipt-total">
                  <div className="total-row">
                    <span>Subtotal:</span>
                    <span>KSh {(saleData.totalAmount || 0).toLocaleString()}</span>
                  </div>
                  <div className="total-row">
                    <span>Payment Method:</span>
                    <span className="payment-method">{(saleData.paymentMethod || 'cash').toUpperCase()}</span>
                  </div>
                  <div className="total-row grand-total">
                    <span>Total Amount:</span>
                    <span>KSh {(saleData.totalAmount || 0).toLocaleString()}</span>
                  </div>
                </div>

                <div className="receipt-footer">
                  <p className="thank-you">Thank you for your purchase!</p>
                  <p className="sold-by">Sold by: {saleData.soldBy?.username || 'Bob wandati'}</p>
                </div>
              </div>

              <div className="receipt-actions">
                <button className="btn btn-primary" onClick={printReceipt}>
                  🖨️ Print Receipt
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