import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

function ProtectedRoute({ children }) {
  const location = useLocation();
  const { isAuthenticated } = useSelector(state => state.user);

  if (!isAuthenticated) {
    // Redirect to login with a return path
    return <Navigate to={`/login?redirect=${location.pathname}`} replace />;
  }

  return children;
}

export default ProtectedRoute;