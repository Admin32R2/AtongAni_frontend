
import { api } from "./client";

export function login({ username, password }) {
  return api.post("/api/auth/login/", { username, password });
}

export function me() {
  return api.get("/api/auth/me/");
}

export function registerCustomer(data) {
  return api.post("/api/auth/register/customer/", data);
}

export function registerFarmer(data) {
  return api.post("/api/auth/register/farmer/", data);
}
