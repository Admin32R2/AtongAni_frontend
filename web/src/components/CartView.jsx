import { useEffect, useState } from "react";
import { getCart, removeFromCart, updateCartItem } from "../api/cart";
import { checkoutCart } from "../api/orders";
import "./CartView.css";

export default function CartView() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checkingOut, setCheckingOut] = useState(false);
  const [orderCreated, setOrderCreated] = useState(null);

  useEffect(() => {
    loadCart();
  }, []);

  async function loadCart() {
    try {
      const res = await getCart();
      setCartItems(res.data || []);
      setError("");
    } catch (err) {
      setError("Failed to load cart");
      console.log(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveItem(cartItemId) {
    try {
      await removeFromCart(cartItemId);
      await loadCart();
    } catch (err) {
      setError("Failed to remove item");
    }
  }

  async function handleUpdateQuantity(cartItemId, quantity) {
    if (quantity < 1) {
      handleRemoveItem(cartItemId);
      return;
    }

    try {
      await updateCartItem(cartItemId, quantity);
      await loadCart();
    } catch (err) {
      setError("Failed to update quantity");
    }
  }

  async function handleCheckout() {
    if (cartItems.length === 0) {
      setError("Cart is empty");
      return;
    }

    setCheckingOut(true);
    setError("");

    try {
      const response = await checkoutCart();
      setOrderCreated(response.data.order);
      setCartItems([]);
      // Show order creation success
      alert("Order created! Waiting for farmer approval...");
    } catch (err) {
      setError(err?.response?.data?.error || "Checkout failed");
    } finally {
      setCheckingOut(false);
    }
  }

  if (loading) {
    return <div className="cart-view"><div className="loading">Loading cart...</div></div>;
  }

  const total = cartItems.reduce((sum, item) => sum + (item.post.price * item.quantity || 0), 0);

  // Show order status if order was just created
  if (orderCreated) {
    return (
      <div className="cart-view">
        <h3>Order Confirmation</h3>
        <div className="order-status-card">
          <h4>Order #{orderCreated.id}</h4>
          <div className={`order-status-badge status-${orderCreated.status.toLowerCase()}`}>
            {orderCreated.status === 'IN_PROGRESS' ? '⏳ In Progress' : orderCreated.status}
          </div>
          <p className="order-message">
            {orderCreated.status === 'IN_PROGRESS' 
              ? '📋 Your order is awaiting farmer approval. You will be notified once the farmer responds.'
              : 'Your order status will appear here.'}
          </p>
          <div className="order-items-list">
            <h5>Order Items:</h5>
            {orderCreated.items.map((item) => (
              <div key={item.id} className="order-item-summary">
                <span>{item.post.title}</span>
                <span>{parseFloat(item.quantity) || 0} {item.unit}</span>
                <span>₱{(parseFloat(item.total_price) || 0).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="order-total">
            <strong>Total: ₱{(parseFloat(orderCreated.total_amount) || 0).toFixed(2)}</strong>
          </div>
          <button onClick={() => setOrderCreated(null)} className="back-btn">
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-view">
      <h3>Shopping Cart</h3>

      {error && <div className="cart-error">{error}</div>}

      {cartItems.length === 0 ? (
        <div className="empty-cart">
          <p>Your cart is empty</p>
          <p className="empty-cart-hint">Add items from farmer posts to get started</p>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {cartItems.map((item) => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-info">
                  <h4 className="cart-item-title">{item.post.title}</h4>
                  <p className="cart-item-farmer">from {item.post.author_name || "Farmer"}</p>
                  <p className="cart-item-price">₱{item.post.price}</p>
                </div>

                <div className="cart-item-quantity">
                  <button
                    onClick={() => handleUpdateQuantity(item.id, item.quantity - 0.1)}
                    className="qty-btn"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleUpdateQuantity(item.id, parseFloat(e.target.value))}
                    className="qty-input"
                    step="0.01"
                    min="0"
                  />
                  <span className="qty-unit">{item.unit === 'KG' ? 'kg' : 'g'}</span>
                  <button
                    onClick={() => handleUpdateQuantity(item.id, item.quantity + 0.1)}
                    className="qty-btn"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                <div className="cart-item-subtotal">
                  <p>₱{(item.post.price * item.quantity).toFixed(2)}</p>
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="remove-btn"
                    aria-label="Remove item"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <div className="summary-row">
              <span>Subtotal:</span>
              <span>₱{total.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Shipping:</span>
              <span>Calculated at checkout</span>
            </div>
            <div className="summary-row total-row">
              <span>Total:</span>
              <span>₱{total.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={checkingOut || cartItems.length === 0}
            className="checkout-btn"
          >
            {checkingOut ? "Processing..." : "Proceed to Checkout"}
          </button>
        </>
      )}
    </div>
  );
}
