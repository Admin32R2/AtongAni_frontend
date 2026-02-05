import { api } from "./client";

// Posts endpoints
export function getPosts(params = {}) {
  return api.get("/api/posts/", { params });
}

export function createPost(data) {
  console.log("Creating post with data:", data);
  
  // If data contains an image file, use FormData for multipart/form-data
  if (data instanceof FormData) {
    return api.post("/api/posts/", data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
  
  return api.post("/api/posts/", data);
}

export function updatePost(id, data) {
  // If data contains an image file, use FormData
  if (data instanceof FormData) {
    return api.patch(`/api/posts/${id}/`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
  
  return api.patch(`/api/posts/${id}/`, data);
}

export function uploadPostImages(postId, files) {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('images', file);
  });
  
  return api.post(`/api/posts/${postId}/upload_images/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

export function deletePostImage(postId, imageId) {
  return api.delete(`/api/posts/${postId}/delete_image/`, {
    data: { image_id: imageId }
  });
}

export function deletePost(id) {
  return api.delete(`/api/posts/${id}/`);
}

export function getPost(id) {
  return api.get(`/api/posts/${id}/`);
}


