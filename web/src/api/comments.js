import { api } from "./client";

// Comments endpoints
export function getComments(postId, params = {}) {
  return api.get(`/api/posts/${postId}/comments/`, { params });
}

export function createComment(postId, data) {
  return api.post(`/api/posts/${postId}/comments/`, data);
}

export function updateComment(postId, commentId, data) {
  return api.patch(`/api/posts/${postId}/comments/${commentId}/`, data);
}

export function deleteComment(postId, commentId) {
  return api.delete(`/api/posts/${postId}/comments/${commentId}/`);
}
