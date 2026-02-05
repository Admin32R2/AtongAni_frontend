import { useEffect, useState } from "react";
import { getPendingOrders, approveOrder, rejectOrder } from "../api/orders";
import "./FarmerOrdersManagement.css";

export default function FarmerOrdersManagement() {
  const [pendingOrders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    loadPendingOrders();
    // Poll for new orders every 3 seconds
    const interval = setInterval(loadPendingOrders, 3000);
    return () => clearInterval(interval);
  }, []);

  async function loadPendingOrders() {
    try {
      const res = await getPendingOrders();
      setOrders(res.data || []);
      setError("");
    } catch (err) {
      console.log(err);
      // Not a farmer or no orders
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(orderId) {
    try {
      setError("");
      await approveOrder(orderId);
      setSuccessMessage("Order approved successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
      await loadPendingOrders();
    } catch (err) {
      setError(
        err?.response?.data?.error || "Failed to approve order"
      );
    }
  }

  async function handleReject(orderId) {
    if (!rejectReason.trim()) {
      setError("Please provide a reason for rejection");
      return;
    }

    try {
      setError("");
      await rejectOrder(orderId, rejectReason);
      setSuccessMessage("Order rejected. Items returned to customer's cart.");
      setTimeout(() => setSuccessMessage(""), 3000);
      setRejectingId(null);
      setRejectReason("");
      await loadPendingOrders();
    } catch (err) {
      setError(
        err?.response?.data?.error || "Failed to reject order"
      );
    }
  }

  if (loading) {
    return (
      <div className="farmer-orders">
        <div className="loading">Loading pending orders...</div>
      </div>
    );
  }

  return (
    <div className="farmer-orders">
      <h3>Order Management</h3>

      {error && <div className="orders-error">{error}</div>}
      {successMessage && (
        <div className="success-message">{successMessage}</div>
      )}

      {pendingOrders.length === 0 ? (
        <div className="empty-orders">
          <p>No pending orders</p>
          <p className="empty-hint">
            Orders will appear here when customers place them
          </p>
        </div>
      ) : (
        <div className="pending-orders-list">
          {pendingOrders.map((order) => (
            <div key={order.id} className="farmer-order-card">
              <div className="order-customer-info">
                <h4>Order #{order.id}</h4>
                <p className="customer-name">
                  Customer: <strong>{order.customer_name}</strong>
                </p>
                <p className="order-time">
                  {new Date(order.created_at).toLocaleString()}
                </p>
              </div>

              <div className="order-items-section">
                <h5>Items for Your Review:</h5>
                <div className="items-list">
                  {order.items
                    .filter((item) => item.farmer_name === order.customer_name)
                    .length === 0
                    ? order.items.map((item) => (
                        <div key={item.id} className="farmer-order-item">
                          <div className="item-detail">
                            <p className="item-name">{item.post.title}</p>
                            <p className="item-quantity">
                              Quantity: {item.quantity} {item.unit}
                            </p>
                          </div>
                          <div className="item-price">
                            <p>₱{parseFloat(item.price) || 0}</p>
                            <p className="subtotal">
                              ₱{(parseFloat(item.total_price) || 0).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))
                    : order.items.map((item) => (
                        <div key={item.id} className="farmer-order-item">
                          <div className="item-detail">
                            <p className="item-name">{item.post.title}</p>
                            <p className="item-quantity">
                              Quantity: {item.quantity} {item.unit}
                            </p>
                          </div>
                          <div className="item-price">
                            <p>₱{parseFloat(item.price) || 0}</p>
                            <p className="subtotal">
                              ₱{(parseFloat(item.total_price) || 0).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                </div>
              </div>

              <div className="order-total-section">
                <p className="order-total">
                  Order Total: <strong>₱{(parseFloat(order.total_amount) || 0).toFixed(2)}</strong>
                </p>
              </div>

              <div className="farmer-actions">
                <button
                  onClick={() => handleApprove(order.id)}
                  className="approve-btn"
                  title="Approve and process this order"
                >
                  ✅ Accept Order
                </button>

                {rejectingId === order.id ? (
                  <div className="reject-form">
                    <textarea
                      placeholder="Why are you rejecting this order?"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="reject-textarea"
                    />
                    <div className="reject-actions">
                      <button
                        onClick={() => handleReject(order.id)}
                        className="confirm-reject-btn"
                      >
                        Confirm Rejection
                      </button>
                      <button
                        onClick={() => {
                          setRejectingId(null);
                          setRejectReason("");
                        }}
                        className="cancel-reject-btn"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setRejectingId(order.id)}
                    className="reject-btn"
                    title="Reject this order"
                  >
                    ❌ Reject Order
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
