import { useEffect, useState } from "react";
import { getComments, createComment, deleteComment } from "../api/comments";
import ConfirmationModal from "./ConfirmationModal";
import "./CommentsSection.css";

export default function CommentsSection({ postId, user, onRefresh }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, commentId: null });

  useEffect(() => {
    loadComments();
  }, [postId]);

  async function loadComments() {
    try {
      const res = await getComments(postId);
      setComments(res.data || []);
      setError("");
    } catch (err) {
      setError("Failed to load comments");
      console.log(err);
    }
  }

  async function handleSubmitComment(e) {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    setError("");

    try {
      await createComment(postId, { content: newComment });
      setNewComment("");
      await loadComments();
      if (onRefresh) onRefresh();
    } catch (err) {
      setError("Failed to post comment");
      console.log(err);
    } finally {
      setLoading(false);
    }
  }

  function openDeleteModal(commentId) {
    setDeleteModal({ isOpen: true, commentId });
  }

  function closeDeleteModal() {
    setDeleteModal({ isOpen: false, commentId: null });
  }

  async function handleConfirmDelete() {
    try {
      await deleteComment(postId, deleteModal.commentId);
      await loadComments();
      if (onRefresh) onRefresh();
      closeDeleteModal();
    } catch (err) {
      setError("Failed to delete comment");
    }
  }

  return (
    <div className="comments-section">
      <div className="comments-header">
        <h4>Comments ({comments.length})</h4>
      </div>

      {/* Comment Form */}
      <form onSubmit={handleSubmitComment} className="comment-form">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          rows={2}
          className="comment-input"
          maxLength={500}
        />
        <button
          type="submit"
          disabled={loading || !newComment.trim()}
          className="comment-submit-btn"
        >
          {loading ? "Posting..." : "Post"}
        </button>
      </form>

      {error && <div className="comment-error">{error}</div>}

      <ConfirmationModal 
        isOpen={deleteModal.isOpen}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={closeDeleteModal}
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous={true}
      />

      {/* Comments List */}
      <div className="comments-list">
        {comments.length === 0 ? (
          <p className="no-comments">No comments yet. Be the first!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="comment-item">
              <div className="comment-header">
                <span className="comment-author">{comment.author?.username || "User"}</span>
                <span className="comment-date">
                  {new Date(comment.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="comment-text">{comment.content}</p>
              {user?.id === comment.author?.id && (
                <button
                  onClick={() => openDeleteModal(comment.id)}
                  className="comment-delete-btn"
                >
                  Delete
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
