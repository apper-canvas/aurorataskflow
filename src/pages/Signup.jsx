import { useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useSelector } from 'react-redux';

function Signup() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect');
  const { isAuthenticated } = useSelector(state => state.user);

  // If user is already authenticated, redirect to home or redirectPath
  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectPath || '/', { replace: true });
    }
  }, [isAuthenticated, navigate, redirectPath]);

  useEffect(() => {
    // Show signup UI in this component
    const { ApperUI } = window.ApperSDK;
    ApperUI.showSignup("#authentication");
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-50 dark:bg-surface-900">
      <div className="w-full max-w-md space-y-8 p-6 bg-white dark:bg-surface-800 rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-surface-800 dark:text-surface-100">Create Account</h1>
          <p className="mt-2 text-surface-600 dark:text-surface-400">Sign up for your TaskFlow account</p>
        </div>
        <div id="authentication" className="min-h-[400px]" />
        <div className="text-center mt-4">
          <p className="text-sm text-surface-600 dark:text-surface-400">
            Already have an account?{' '}
            <Link to={redirectPath ? `/login?redirect=${redirectPath}` : "/login"} className="font-medium text-primary hover:text-primary-dark">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;