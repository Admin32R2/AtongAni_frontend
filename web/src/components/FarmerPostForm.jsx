import { useState } from "react";
import { createPost, uploadPostImages } from "../api/posts";
import "./FarmerPostForm.css";

export default function FarmerPostForm({ onPostCreated }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("KG");
  const [images, setImages] = useState([]); // Array of image objects
  const [createdPostId, setCreatedPostId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleImagesChange(e) {
    const files = Array.from(e.target.files);
    
    // Check total will not exceed 15
    const totalImages = images.length + files.length;
    if (totalImages > 15) {
      setError(`Maximum 15 images allowed. You have ${images.length}, trying to add ${files.length}.`);
      return;
    }

    const newImages = [];
    
    for (const file of files) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError(`"${file.name}" is too large (max 5MB).`);
        continue;
      }
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError(`"${file.name}" has unsupported format. Allowed: JPEG, PNG, GIF, WebP.`);
        continue;
      }

      // Create image object with unique ID for removal
      const imageId = `${Date.now()}-${Math.random()}`;
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, {
          id: imageId,
          file: file,
          preview: reader.result,
          uploaded: false
        }]);
      };
      reader.readAsDataURL(file);
    }

    setError("");
  }

  function removeImage(imageId) {
    setImages(images.filter(img => img.id !== imageId));
  }

  async function uploadImages(postId) {
    if (images.length === 0) return;
    
    setUploading(true);
    try {
      const filesToUpload = images.filter(img => !img.uploaded).map(img => img.file);
      
      if (filesToUpload.length === 0) {
        return; // All already uploaded
      }

      await uploadPostImages(postId, filesToUpload);
      
      // Mark images as uploaded
      setImages(images.map(img => ({ ...img, uploaded: true })));
    } catch (err) {
      console.error("Image upload error:", err);
      throw err;
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!content.trim()) {
      setError("Description is required");
      return;
    }

    setLoading(true);

    try {
      // Step 1: Create the post without images
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('content', content.trim());

      if (price && !isNaN(price)) {
        formData.append('price', parseFloat(price));
      }

      if (quantity && !isNaN(quantity)) {
        formData.append('quantity', parseFloat(quantity));
      }

      formData.append('unit', unit);

      const postResponse = await createPost(formData);
      const postId = postResponse.data.id;
      setCreatedPostId(postId);

      // Step 2: Upload images if any
      if (images.length > 0) {
        setUploading(true);
        try {
          await uploadImages(postId);
        } catch (err) {
          console.error("Image upload error:", err);
          setError("Post created but image upload failed. You can try uploading images later.");
          throw err;
        } finally {
          setUploading(false);
        }
      }

      setSuccess("Post created successfully!");
      setTitle("");
      setContent("");
      setPrice("");
      setQuantity("");
      setUnit("KG");
      setImages([]);
      setCreatedPostId(null);

      setTimeout(() => {
        setSuccess("");
        if (onPostCreated) onPostCreated();
      }, 1500);
    } catch (err) {
      console.error("Post creation error:", err);
      console.error("Response status:", err?.response?.status);
      console.error("Response data:", err?.response?.data);
      console.error("Error message:", err?.message);
      
      let errorMsg = "Failed to create post";
      
      if (err?.response?.status === 500) {
        errorMsg = "Server error - please contact support or check backend logs";
      } else if (err?.response?.data?.detail) {
        errorMsg = err.response.data.detail;
      } else if (err?.response?.data?.non_field_errors?.[0]) {
        errorMsg = err.response.data.non_field_errors[0];
      } else if (err?.response?.data) {
        const errors = Object.entries(err.response.data)
          .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs[0] : msgs}`)
          .join(", ");
        errorMsg = errors || errorMsg;
      } else if (err?.message) {
        errorMsg = err.message;
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="farmer-post-form">
      <h3>Create a New Post</h3>

      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label htmlFor="title">Title *</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What are you selling?"
            maxLength={100}
            className="form-input"
          />
          <span className="char-count">{title.length}/100</span>
        </div>

        <div className="form-group">
          <label htmlFor="content">Description *</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Describe your product, quality, etc..."
            rows={4}
            maxLength={1000}
            className="form-textarea"
          />
          <span className="char-count">{content.length}/1000</span>
        </div>

        <div className="form-group">
          <label htmlFor="images">Product Images (max 15)</label>
          <div className="image-upload-section">
            <input
              id="images"
              type="file"
              multiple
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleImagesChange}
              className="form-input"
              disabled={images.length >= 15}
            />
            <p className="image-help-text">
              Supported formats: JPEG, PNG, GIF, WebP (max 5MB each)
              <br />
              {images.length}/15 images selected
            </p>
            
            {images.length > 0 && (
              <div className="image-preview-grid">
                {images.map((img) => (
                  <div key={img.id} className="image-preview-item">
                    <img src={img.preview} alt="Preview" className="image-preview" />
                    <button
                      type="button"
                      onClick={() => removeImage(img.id)}
                      className="remove-image-btn"
                      disabled={uploading}
                    >
                      ✕
                    </button>
                    {img.uploaded && <div className="uploaded-badge">✓</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="price">Price (₱ PHP)</label>
          <input
            id="price"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Enter price (optional)"
            step="0.01"
            min="0"
            className="form-input"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="quantity">Available Quantity</label>
            <input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
              step="0.01"
              min="0"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="unit">Unit of Measurement</label>
            <select
              id="unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="form-input"
            >
              <option value="KG">Kilogram (kg)</option>
              <option value="G">Gram (g)</option>
            </select>
          </div>
        </div>

        {error && <div className="form-error">{error}</div>}
        {success && <div className="form-success">{success}</div>}

        <button
          type="submit"
          disabled={loading || uploading}
          className="submit-btn"
        >
          {loading ? "Creating post..." : uploading ? "Uploading images..." : "Post"}
        </button>
      </form>
    </div>
  );
}
