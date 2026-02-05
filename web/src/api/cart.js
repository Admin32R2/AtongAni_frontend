import { api } from "./client";

// Cart endpoints
export function getCart() {
  return api.get("/api/cart/");
}

export function addToCart(postId, quantity = 1) {
  return api.post("/api/cart/", { post: postId, quantity });
}

export function updateCartItem(cartItemId, quantity) {
  return api.patch(`/api/cart/${cartItemId}/`, { quantity });
}

export function removeFromCart(cartItemId) {
  return api.delete(`/api/cart/${cartItemId}/`);
}

export function checkoutCart() {
  return api.post("/api/cart/checkout/");
}
