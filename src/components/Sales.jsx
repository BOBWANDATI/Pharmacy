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

  // ✅ Use env variable for both local + deployed environments
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

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
          Authorization: `Bearer ${token}`,
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

  const filteredDrugs = drugs.filter(
    (drug) =>
      drug.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      drug.quantity > 0
  );

  const addToCart = (drug) => {
    const existingItem = cart.find((item) => item.drugId === drug._id);
    if (existingItem) {
      if (existingItem.quantity < drug.quantity) {
        setCart(
          cart.map((item) =>
            item.drugId === drug._id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        );
      } else {
        alert(`Only ${drug.quantity} units available in stock`);
      }
    } else {
      if (drug.quantity > 0) {
        setCart([
          ...cart,
          {
            drugId: drug._id,
            name: drug.name,
            price: drug.price,
            quantity: 1,
            maxQuantity: drug.quantity,
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

  const getTotal = () => cart.reduce((t, i) => t + i.price * i.quantity, 0);
  const getTotalItems = () => cart.reduce((t, i) => t + i.quantity, 0);

  const completeSale = async () => {
    if (cart.length === 0) return alert('Please add items to cart first');

    setProcessingSale(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) return setError('Authentication required. Please login again.');

      const salePayload = {
        items: cart.map((i) => ({ drugId: i.drugId, quantity: i.quantity })),
        paymentMethod,
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
      };

      const response = await fetch(`${API_BASE_URL}/sales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(salePayload),
      });

      const text = await response.text();

      // check if backend returned HTML (error page)
      if (text.startsWith('<!DOCTYPE')) {
        throw new Error('Server returned HTML error page. Backend may be down.');
      }

      const result = JSON.parse(text);

      if (!response.ok) {
        throw new Error(result.message || 'Failed to complete sale');
      }

      setSaleData(result.sale || result);
      setShowReceipt(true);
      setCart([]);
      setCustomerInfo({ name: '', phone: '' });

      await fetchDrugs();
    } catch (err) {
      console.error('Sale error:', err);
      setError(err.message || 'Failed to complete sale');
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
    const content = document.getElementById('receipt');
    const newWin = window.open('', '_blank');
    newWin.document.write(`
      <html><head><title>Receipt</title>
      <style>
        body{font-family:Arial;margin:20px;}
        .receipt{border:1px solid #000;padding:20px;}
        .receipt-header{text-align:center;}
        .receipt-items{width:100%;border-collapse:collapse;margin:10px 0;}
        .receipt-items th,.receipt-items td{padding:6px;border-bottom:1px solid #ddd;}
        .receipt-total{text-align:right;margin-top:10px;}
      </style></head><body>${content.innerHTML}</body></html>`);
    newWin.document.close();
    newWin.print();
  };

  const clearCart = () => {
    if (cart.length && window.confirm('Clear all items from cart?')) setCart([]);
  };

  const getStockStatus = (q) => {
    if (q === 0) return 'out-of-stock';
    if (q <= 5) return 'low-stock';
    if (q <= 15) return 'warning';
    return 'normal';
  };

  const renderReceiptItems = () =>
    saleData?.items?.map((item, i) => (
      <div key={i} className="receipt-item">
        <span>{item.drugName}</span>
        <span>{item.quantity}</span>
        <span>KSh {item.unitPrice.toLocaleString()}</span>
        <span>KSh {item.totalPrice.toLocaleString()}</span>
      </div>
    ));

  return (
    <div className="sales">
      <div className="container">
        <div className="sales-header">
          <h1>Point of Sale</h1>
          <div className="header-stats">
            <div>
              Items: <strong>{getTotalItems()}</strong>
            </div>
            <div>
              Total: <strong>KSh {getTotal().toLocaleString()}</strong>
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
              </div>

              <input
                type="text"
                placeholder="Search drug..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input"
              />

              {loading ? (
                <p>Loading...</p>
              ) : (
                <div className="drugs-grid">
                  {filteredDrugs.map((drug) => (
                    <div key={drug._id} className={`drug-card ${getStockStatus(drug.quantity)}`}>
                      <h3>{drug.name}</h3>
                      <p>Price: KSh {drug.price.toLocaleString()}</p>
                      <p>Qty: {drug.quantity}</p>
                      <button
                        className="btn btn-primary"
                        disabled={drug.quantity === 0}
                        onClick={() => addToCart(drug)}
                      >
                        {drug.quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 🔹 Right: Cart */}
          <div className="cart-section">
            <div className="card">
              <div className="card-header">
                <h2>Cart</h2>
                {cart.length > 0 && (
                  <button className="btn btn-secondary" onClick={clearCart}>
                    Clear
                  </button>
                )}
              </div>

              {cart.length === 0 ? (
                <p>No items in cart</p>
              ) : (
                <>
                  {cart.map((item) => (
                    <div key={item.drugId} className="cart-item">
                      <div>
                        {item.name} ({item.quantity})
                      </div>
                      <div>
                        KSh {(item.price * item.quantity).toLocaleString()}
                      </div>
                      <div>
                        <button onClick={() => updateQuantity(item.drugId, item.quantity - 1)}>-</button>
                        <button onClick={() => updateQuantity(item.drugId, item.quantity + 1)}>+</button>
                        <button onClick={() => removeFromCart(item.drugId)}>x</button>
                      </div>
                    </div>
                  ))}

                  <button
                    className="btn btn-primary complete-sale-btn"
                    onClick={completeSale}
                    disabled={processingSale}
                  >
                    {processingSale
                      ? 'Processing...'
                      : `Complete Sale - KSh ${getTotal().toLocaleString()}`}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 🔹 Receipt Modal */}
        {showReceipt && saleData && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Sale Completed ✅</h2>
              <div id="receipt">
                <h3>PharmaLink Pharmacy</h3>
                <p>Receipt #{saleData.saleNumber}</p>
                <p>Date: {new Date(saleData.createdAt).toLocaleString()}</p>
                {renderReceiptItems()}
                <div className="receipt-total">
                  <strong>Total:</strong> KSh {saleData.totalAmount.toLocaleString()}
                </div>
              </div>
              <div className="receipt-actions">
                <button className="btn btn-primary" onClick={printReceipt}>
                  🖨 Print
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
