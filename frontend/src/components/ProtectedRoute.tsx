import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: JSX.Element;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = localStorage.getItem('access_token');
  
  if (!token) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}
