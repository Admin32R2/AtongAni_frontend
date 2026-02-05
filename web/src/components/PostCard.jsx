import { useState } from "react";
import { deletePost } from "../api/posts";
import CommentsSection from "./CommentsSection";
import "./PostCard.css";

export default function PostCard({ post, user, onRefresh }) {
  const [showComments, setShowComments] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartError, setCartError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showQuantitySelector, setShowQuantitySelector] = useState(false);
  const [selectedQuantity, setSelectedQuantity] = useState("");
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Get images array or fallback to legacy single image
  const images = post?.images && post.images.length > 0 
    ? post.images 
    : post?.image_url ? [{ id: 'legacy', image_url: post.image_url }] : [];
  
  const currentImage = images[currentImageIndex];

  const isOwner = user?.id === post?.author_id;
  const canAddToCart = post?.price && !isOwner;

  const handleAddToCart = async () => {
    if (!post?.id) return;
    
    if (!selectedQuantity || selectedQuantity <= 0) {
      setCartError("Please enter a valid quantity");
      return;
    }

    if (parseFloat(selectedQuantity) > parseFloat(post.quantity)) {
      setCartError(`Maximum available: ${post.quantity} ${post.unit === 'KG' ? 'kg' : 'g'}`);
      return;
    }
    
    setCartLoading(true);
    setCartError("");
    
    try {
      const { addToCart } = await import("../api/cart");
      await addToCart(post.id, parseFloat(selectedQuantity));
      setCartError("✓ Added to cart");
      setShowQuantitySelector(false);
      setSelectedQuantity("");
      setTimeout(() => setCartError(""), 2000);
    } catch (err) {
      setCartError(err?.response?.data?.error || "Failed to add to cart");
    } finally {
      setCartLoading(false);
    }
  };

  const handleDeletePost = async () => {
    if (!post?.id) return;

    setDeleteLoading(true);
    try {
      console.log(`Attempting to delete post ${post.id}`);
      await deletePost(post.id);
      console.log("Post deleted successfully");
      setShowDeleteConfirm(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Delete error:", err);
      console.error("Status:", err?.response?.status);
      console.error("Response:", err?.response?.data);
      const errorMsg = err?.response?.data?.detail || err?.message || "Failed to delete post";
      setCartError(errorMsg);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="post-card">
      {/* Header */}
      <div className="post-header">
        <div className="post-author-info">
          <div className="post-avatar">{post?.author_name?.charAt(0) || "F"}</div>
          <div className="post-author-details">
            <div className="post-author-name">{post?.author_name || "Farmer"}</div>
            <div className="post-timestamp">{new Date(post?.created_at).toLocaleDateString()}</div>
          </div>
        </div>
        {post?.price && (
          <div className="post-price">₱{post.price}</div>
        )}
      </div>

      {/* Title */}
      <h3 className="post-title">{post?.title}</h3>

      {/* Content */}
      <p className="post-content">{post?.content}</p>

      {/* Quantity Info */}
      {post?.quantity && (
        <div className="post-quantity-info">
          Available: {post.quantity} {post.unit === 'KG' ? 'kg' : 'g'}
        </div>
      )}

      {/* Images with click to expand */}
      {images.length > 0 && (
        <>
          {/* Image Gallery Grid (if multiple images) */}
          {images.length > 1 && (
            <div className="post-image-gallery">
              {images.map((img, idx) => (
                <div 
                  key={img.id || idx}
                  className={`gallery-thumbnail ${idx === currentImageIndex ? 'active' : ''}`}
                  onClick={() => setCurrentImageIndex(idx)}
                >
                  <img 
                    src={img.image_url} 
                    alt={`${post.title} - ${idx + 1}`}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Main Image Display */}
          <div className="post-image-container">
            <img 
              src={currentImage.image_url} 
              alt={post.title} 
              className="post-image"
              onClick={() => setShowImageModal(true)}
              title="Click to view full size"
            />
            <div className="image-zoom-hint">Click to view</div>
            {images.length > 1 && (
              <div className="image-counter">
                {currentImageIndex + 1}/{images.length}
              </div>
            )}
          </div>
        </>
      )}

      {/* Footer Actions */}
      <div className="post-footer">
        <div className="post-actions">
          <button
            className="action-btn comment-btn"
            onClick={() => setShowComments(!showComments)}
          >
            💬 Comment
          </button>
          {canAddToCart && (
            <>
              {!showQuantitySelector ? (
                <button
                  className="action-btn cart-btn"
                  onClick={() => setShowQuantitySelector(true)}
                  disabled={cartLoading}
                >
                  🛒 Add to Cart
                </button>
              ) : (
                <div className="quantity-selector">
                  <input
                    type="number"
                    value={selectedQuantity}
                    onChange={(e) => setSelectedQuantity(e.target.value)}
                    placeholder={`Enter amount (${post.unit === 'KG' ? 'kg' : 'g'})`}
                    step="0.01"
                    min="0"
                    max={post.quantity}
                    className="quantity-input"
                  />
                  <button
                    className="action-btn add-btn"
                    onClick={handleAddToCart}
                    disabled={cartLoading}
                  >
                    {cartLoading ? "Adding..." : "Add"}
                  </button>
                  <button
                    className="action-btn cancel-btn"
                    onClick={() => {
                      setShowQuantitySelector(false);
                      setSelectedQuantity("");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </>
          )}
          {isOwner && (
            <button
              className="action-btn delete-btn"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleteLoading}
              title="Delete this post"
            >
              🗑️ Delete
            </button>
          )}
        </div>
        {cartError && (
          <div className={`cart-message ${cartError.includes("✓") ? "success" : "error"}`}>
            {cartError}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="delete-confirmation">
          <div className="confirmation-content">
            <p>Are you sure you want to delete this post?</p>
            <div className="confirmation-actions">
              <button
                className="confirm-btn delete"
                onClick={handleDeletePost}
                disabled={deleteLoading}
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
              <button
                className="confirm-btn cancel"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal for Zoomed View */}
      {showImageModal && images.length > 0 && (
        <div className="image-modal-overlay" onClick={() => setShowImageModal(false)}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="image-modal-close"
              onClick={() => setShowImageModal(false)}
              title="Close (or press Escape)"
            >
              ✕
            </button>
            
            {/* Image Navigation */}
            {images.length > 1 && (
              <>
                <button 
                  className="image-nav-btn prev"
                  onClick={() => setCurrentImageIndex((prev) => prev === 0 ? images.length - 1 : prev - 1)}
                  title="Previous image"
                >
                  ❮
                </button>
                <button 
                  className="image-nav-btn next"
                  onClick={() => setCurrentImageIndex((prev) => prev === images.length - 1 ? 0 : prev + 1)}
                  title="Next image"
                >
                  ❯
                </button>
              </>
            )}

            <img 
              src={currentImage.image_url} 
              alt={`${post.title} - ${currentImageIndex + 1}`}
              className="image-modal-img"
            />
            <div className="image-modal-info">
              <h3>{post.title}</h3>
              <p>{post.content}</p>
              {post?.price && <p className="modal-price">₱{post.price}</p>}
              {post?.quantity && (
                <p className="modal-quantity">
                  Available: {post.quantity} {post.unit === 'KG' ? 'kg' : 'g'}
                </p>
              )}
              {images.length > 1 && (
                <p className="modal-image-counter">
                  Image {currentImageIndex + 1} of {images.length}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Comments Section */}
      {showComments && (
        <CommentsSection postId={post?.id} user={user} onRefresh={onRefresh} />
      )}
    </div>
  );
}
