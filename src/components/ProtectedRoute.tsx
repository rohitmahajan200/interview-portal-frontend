// src/components/ProtectedRoute.tsx (Minimal Version)
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
  type: 'candidate' | 'org';
  onUserLoaded?: (user: any) => void;
}

export default function ProtectedRoute({ children, type, onUserLoaded }: ProtectedRouteProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        
        const endpoint = type === 'candidate' ? '/candidates/me' : '/org/me';
        const response = await api.get(endpoint);
        
        if (response.data?.user || response.data?.success) {
          setIsAuthenticated(true);
          if (onUserLoaded) {
            onUserLoaded(response.data.user);
          }
        } else {
          throw new Error('No user data');
        }
      } catch (error) {
                setIsAuthenticated(false);
        
        const redirectPath = type === 'candidate' ? '/login' : '/org/login';
        navigate(redirectPath, { replace: true });
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [type, navigate, onUserLoaded]);

  // Simple but guaranteed visible loader
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="flex flex-col items-center space-y-4 p-6">
          <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
          <div className="text-center">
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Loading...
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Verifying your access
            </p>
          </div>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : null;
}
