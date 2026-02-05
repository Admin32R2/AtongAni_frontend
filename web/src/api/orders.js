import { api } from "./client";

// Order endpoints
export function getOrders() {
  return api.get("/api/orders/my_orders/");
}

export function getPendingOrders() {
  return api.get("/api/orders/my_pending_orders/");
}

export function getOrderDetail(orderId) {
  return api.get(`/api/orders/${orderId}/`);
}

export function checkoutCart() {
  return api.post("/api/orders/checkout/");
}

export function approveOrder(orderId) {
  return api.post(`/api/orders/${orderId}/approve/`);
}

export function rejectOrder(orderId, reason = "") {
  return api.post(`/api/orders/${orderId}/reject/`, { reason });
}
