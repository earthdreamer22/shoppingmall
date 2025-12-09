import { Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from '../context/AuthContext.jsx';

function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">로딩 중...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  requireAdmin: PropTypes.bool,
};

export default ProtectedRoute;
