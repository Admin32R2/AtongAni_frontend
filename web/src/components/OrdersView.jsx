import { useEffect, useState } from "react";
import { getOrders } from "../api/orders";
import "./OrdersView.css";

export default function OrdersView() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    loadOrders();
    // Poll for order updates every 5 seconds
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  async function loadOrders() {
    try {
      const res = await getOrders();
      setOrders(res.data || []);
      setError("");
    } catch (err) {
      setError("Failed to load orders");
      console.log(err);
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "IN_PROGRESS":
        return "status-in-progress";
      case "APPROVED":
        return "status-approved";
      case "REJECTED":
        return "status-rejected";
      case "COMPLETED":
        return "status-completed";
      default:
        return "status-pending";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "IN_PROGRESS":
        return "⏳";
      case "APPROVED":
        return "✅";
      case "REJECTED":
        return "❌";
      case "COMPLETED":
        return "🎉";
      default:
        return "📋";
    }
  };

  if (loading) {
    return <div className="orders-view"><div className="loading">Loading orders...</div></div>;
  }

  return (
    <div className="orders-view">
      <h3>My Orders</h3>

      {error && <div className="orders-error">{error}</div>}

      {orders.length === 0 ? (
        <div className="empty-orders">
          <p>No orders yet</p>
          <p className="empty-orders-hint">Start shopping to place your first order!</p>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div
              key={order.id}
              className={`order-card ${getStatusColor(order.status)}`}
              onClick={() =>
                setExpandedOrder(expandedOrder === order.id ? null : order.id)
              }
            >
              <div className="order-header">
                <div className="order-info">
                  <h4>Order #{order.id}</h4>
                  <p className="order-date">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="order-status">
                  <span className={`status-badge ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)} {order.status}
                  </span>
                  <p className="order-total">₱{(parseFloat(order.total_amount) || 0).toFixed(2)}</p>
                </div>
              </div>

              {expandedOrder === order.id && (
                <div className="order-details">
                  <div className="order-items">
                    <h5>Items:</h5>
                    {order.items.map((item) => (
                      <div key={item.id} className="order-item">
                        <div className="item-info">
                          <p className="item-title">{item.post.title}</p>
                          <p className="item-farmer">
                            From: {item.farmer_name}
                          </p>
                        </div>
                        <div className="item-details">
                          <span>
                            {parseFloat(item.quantity) || 0} {item.unit}
                          </span>
                          <span>₱{(parseFloat(item.total_price) || 0).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {order.status === "REJECTED" && order.rejection_reason && (
                    <div className="rejection-note">
                      <p>
                        <strong>Rejection Reason:</strong> {order.rejection_reason}
                      </p>
                      <p className="rejection-hint">
                        Items have been returned to your cart. You can modify quantities
                        and try again.
                      </p>
                    </div>
                  )}

                  {order.status === "IN_PROGRESS" && (
                    <div className="in-progress-note">
                      <p>
                        ⏳ This order is awaiting farmer approval. You will be notified once
                        the farmer responds.
                      </p>
                    </div>
                  )}

                  {order.status === "APPROVED" && (
                    <div className="approved-note">
                      <p>✅ Your order has been approved by the farmer!</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
