import { useEffect, useState } from 'react';
import { api } from '../api/client';
import './AdminDashboard.css';

export default function AdminDashboard({ user }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [suspendModal, setSuspendModal] = useState({ isOpen: false, userId: null, username: '' });
  const [reactivateModal, setReactivateModal] = useState({ isOpen: false, userId: null, username: '' });
  const [suspensionReason, setSuspensionReason] = useState('');
  const [actionFeedback, setActionFeedback] = useState({ type: '', message: '' });

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      setError('You do not have permission to access this page');
      setLoading(false);
      return;
    }

    fetchDashboardData();
  }, [user]);

  async function fetchDashboardData() {
    try {
      const [dashboardRes, usersRes] = await Promise.all([
        api.get('/api/auth/admin/dashboard/'),
        api.get('/api/auth/admin/users-management/')
      ]);
      setDashboardData(dashboardRes.data);
      setAllUsers(usersRes.data);
      setError('');
    } catch (err) {
      setError('Failed to load admin dashboard');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSuspendUser() {
    try {
      const reason = suspensionReason || 'No reason provided';
      await api.post(`/api/auth/admin/users/${suspendModal.userId}/suspend/`, { reason });
      setSuspendModal({ isOpen: false, userId: null, username: '' });
      setSuspensionReason('');
      setActionFeedback({ 
        type: 'success', 
        message: `✓ User ${suspendModal.username} has been suspended` 
      });
      await fetchDashboardData();
      setTimeout(() => setActionFeedback({ type: '', message: '' }), 3000);
    } catch (err) {
      setActionFeedback({ 
        type: 'error', 
        message: 'Error suspending user: ' + (err.response?.data?.error || 'Unknown error') 
      });
    }
  }

  async function handleReactivateUser() {
    try {
      await api.post(`/api/auth/admin/users/${reactivateModal.userId}/reactivate/`);
      setReactivateModal({ isOpen: false, userId: null, username: '' });
      setActionFeedback({ 
        type: 'success', 
        message: `✓ User ${reactivateModal.username} has been reactivated` 
      });
      await fetchDashboardData();
      setTimeout(() => setActionFeedback({ type: '', message: '' }), 3000);
    } catch (err) {
      setActionFeedback({ 
        type: 'error', 
        message: 'Error reactivating user: ' + (err.response?.data?.error || 'Unknown error') 
      });
    }
  }

  function openSuspendModal(userId, username) {
    setSuspendModal({ isOpen: true, userId, username });
    setSuspensionReason('');
  }

  function closeSuspendModal() {
    setSuspendModal({ isOpen: false, userId: null, username: '' });
    setSuspensionReason('');
  }

  function openReactivateModal(userId, username) {
    setReactivateModal({ isOpen: true, userId, username });
  }

  function closeReactivateModal() {
    setReactivateModal({ isOpen: false, userId: null, username: '' });
  }

  if (loading) {
    return <div className="admin-loading">Loading admin dashboard...</div>;
  }

  if (error) {
    return <div className="admin-error">{error}</div>;
  }

  if (!dashboardData) {
    return <div className="admin-error">No dashboard data available</div>;
  }

  const { statistics, recent_activity } = dashboardData;

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p>Oversee all platform activity</p>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <StatCard 
          title="Total Users" 
          value={statistics.total_users}
          icon="👥"
          color="#667eea"
        />
        <StatCard 
          title="Farmers" 
          value={statistics.total_farmers}
          icon="👨‍🌾"
          color="#48bb78"
        />
        <StatCard 
          title="Customers" 
          value={statistics.total_customers}
          icon="👤"
          color="#ed8936"
        />
        <StatCard 
          title="Posts" 
          value={statistics.total_posts}
          icon="📝"
          color="#9f7aea"
        />
        <StatCard 
          title="Comments" 
          value={statistics.total_comments}
          icon="💬"
          color="#f6ad55"
        />
        <StatCard 
          title="Orders" 
          value={statistics.total_orders}
          icon="🛒"
          color="#fc8181"
        />
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          User Management
        </button>
        <button 
          className={`tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          Recent Posts
        </button>
        <button 
          className={`tab-btn ${activeTab === 'comments' ? 'active' : ''}`}
          onClick={() => setActiveTab('comments')}
        >
          Recent Comments
        </button>
        <button 
          className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          Recent Orders
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <h2>Platform Overview</h2>
            <p>Total Users: {statistics.total_users}</p>
            <p>Total Posts: {statistics.total_posts}</p>
            <p>Total Comments: {statistics.total_comments}</p>
            <p>Total Orders: {statistics.total_orders}</p>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="user-management-section">
            <h2>User Management</h2>
            <p className="section-subtitle">View all users and manage their account status</p>
            {actionFeedback.message && (
              <div className={`action-feedback ${actionFeedback.type}`}>
                {actionFeedback.message}
              </div>
            )}
            <UserManagementTable 
              users={allUsers}
              onSuspend={openSuspendModal}
              onReactivate={openReactivateModal}
            />
          </div>
        )}

        {activeTab === 'posts' && (
          <ActivityTable 
            title="Recent Posts" 
            columns={['Title', 'Author', 'Created']}
            data={recent_activity.posts.map(p => [
              p.title,
              p.author,
              new Date(p.created_at).toLocaleDateString()
            ])}
          />
        )}

        {activeTab === 'comments' && (
          <ActivityTable 
            title="Recent Comments" 
            columns={['Content', 'Author', 'Post', 'Created']}
            data={recent_activity.comments.map(c => [
              c.content,
              c.author,
              c.post,
              new Date(c.created_at).toLocaleDateString()
            ])}
          />
        )}

        {activeTab === 'orders' && (
          <ActivityTable 
            title="Recent Orders" 
            columns={['Order ID', 'User', 'Status', 'Total', 'Created']}
            data={recent_activity.orders.map(o => [
              `#${o.id}`,
              o.user,
              o.status,
              `$${o.total_price}`,
              new Date(o.created_at).toLocaleDateString()
            ])}
          />
        )}
      </div>

      {/* Suspension Modal */}
      <SuspensionModal
        isOpen={suspendModal.isOpen}
        username={suspendModal.username}
        reason={suspensionReason}
        onReasonChange={setSuspensionReason}
        onConfirm={handleSuspendUser}
        onCancel={closeSuspendModal}
      />

      {/* Reactivation Modal */}
      <ReactivateModal
        isOpen={reactivateModal.isOpen}
        username={reactivateModal.username}
        onConfirm={handleReactivateUser}
        onCancel={closeReactivateModal}
      />
    </div>
  );
}

function UserManagementTable({ users, onSuspend, onReactivate }) {
  return (
    <table className="user-management-table">
      <thead>
        <tr>
          <th>Username</th>
          <th>Email</th>
          <th>Role</th>
          <th>Status</th>
          <th>Joined</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.id} className={user.is_suspended ? 'suspended-user' : ''}>
            <td className="username-cell">{user.username}</td>
            <td>{user.email}</td>
            <td><span className={`role-badge role-${user.role.toLowerCase()}`}>{user.role}</span></td>
            <td>
              {user.is_suspended ? (
                <span className="status-badge suspended">🚫 Suspended</span>
              ) : (
                <span className="status-badge active">✓ Active</span>
              )}
            </td>
            <td>{new Date(user.date_joined).toLocaleDateString()}</td>
            <td className="actions-cell">
              {user.is_suspended ? (
                <button 
                  className="btn-reactivate"
                  onClick={() => onReactivate(user.id, user.username)}
                  title={`Reason: ${user.suspension_reason}`}
                >
                  Reactivate
                </button>
              ) : (
                <button 
                  className="btn-suspend"
                  onClick={() => onSuspend(user.id, user.username)}
                >
                  Suspend
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SuspensionModal({ isOpen, username, reason, onReasonChange, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content suspension-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon">🚫</div>
        <h3 className="modal-title">Suspend User</h3>
        <p className="modal-message">
          Are you sure you want to suspend user <strong>{username}</strong>?
        </p>
        <div className="modal-form">
          <label>Suspension Reason (optional):</label>
          <textarea
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder="Enter reason for suspension..."
            rows={3}
            className="modal-textarea"
          />
        </div>
        <div className="modal-actions">
          <button 
            onClick={onCancel}
            className="modal-btn modal-btn-cancel"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="modal-btn modal-btn-danger"
          >
            Suspend User
          </button>
        </div>
      </div>
    </div>
  );
}

function ReactivateModal({ isOpen, username, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content reactivate-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon">✓</div>
        <h3 className="modal-title">Reactivate User</h3>
        <p className="modal-message">
          Are you sure you want to reactivate user <strong>{username}</strong>?
        </p>
        <p className="modal-subtitle">
          This will restore their account access and allow them to use the platform.
        </p>
        <div className="modal-actions">
          <button 
            onClick={onCancel}
            className="modal-btn modal-btn-cancel"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="modal-btn modal-btn-confirm"
          >
            Reactivate User
          </button>
        </div>
      </div>
    </div>
  );
}
function StatCard({ title, value, icon, color }) {
  return (
    <div className="stat-card" style={{ borderTopColor: color }}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-info">
        <div className="stat-title">{title}</div>
        <div className="stat-value">{value}</div>
      </div>
    </div>
  );
}

function ActivityTable({ title, columns, data }) {
  return (
    <div className="activity-section">
      <h2>{title}</h2>
      <table className="activity-table">
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th key={i}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}