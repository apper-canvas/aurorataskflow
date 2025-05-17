import { useState, useEffect, createContext } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { setUser, clearUser } from './store/userSlice';
import { motion } from 'framer-motion';
import { getIcon } from './utils/iconUtils';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Callback from './pages/Callback';
import ErrorPage from './pages/ErrorPage';
import Home from './pages/Home';
import { NotFound } from './pages/NotFound';

// Create auth context
export const AuthContext = createContext(null);

function App() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [darkMode, setDarkMode] = useState(() => {
    // Check for saved preference or use system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  
  // Get authentication status with proper error handling
  const userState = useSelector((state) => state.user);
  const isAuthenticated = userState?.isAuthenticated || false;

  // Initialize ApperUI once when the app loads
  useEffect(() => {
    const { ApperClient, ApperUI } = window.ApperSDK;
    const client = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    });

    // Initialize but don't show login yet
    ApperUI.setup(client, {
      target: '#authentication',
      clientId: import.meta.env.VITE_APPER_PROJECT_ID,
      view: 'both',
      onSuccess: function (user) {
        setIsInitialized(true);
        setIsLoading(false);
        // CRITICAL: This exact currentPath logic must be preserved in all implementations
        // DO NOT simplify or modify this pattern as it ensures proper redirection flow
        let currentPath = window.location.pathname + window.location.search;
        let redirectPath = new URLSearchParams(window.location.search).get('redirect');
        const isAuthPage = currentPath.includes('/login') || currentPath.includes('/signup') || currentPath.includes(
            '/callback') || currentPath.includes('/error');
        if (user) {
            // User is authenticated
            if (redirectPath) {
                navigate(redirectPath);
            } else if (!isAuthPage) {
                if (!currentPath.includes('/login') && !currentPath.includes('/signup')) {
                    navigate(currentPath);
                } else {
                    navigate('/');
                }
            } else {
                navigate('/');
            }
            // Store user information in Redux
            dispatch(setUser(JSON.parse(JSON.stringify(user))));
        } else {
            // User is not authenticated
            if (!isAuthPage) {
                navigate(
                    currentPath.includes('/signup')
                    ? `/signup?redirect=${currentPath}`
                    : currentPath.includes('/login')
                    ? `/login?redirect=${currentPath}`
                    : '/login');
            } else if (redirectPath) {
                if (
                    ![
                        'error',
                        'signup',
                        'login',
                        'callback'
                    ].some((path) => currentPath.includes(path)))
                    navigate(`/login?redirect=${redirectPath}`);
                else {
                    navigate(currentPath);
                }
            } else if (isAuthPage) {
                navigate(currentPath);
            } else {
                navigate('/login');
            }
            dispatch(clearUser());
        }
      },
      onError: function(error) {
        console.error("Authentication failed:", error);
        setIsLoading(false);
        toast.error("Authentication failed: " + (error.message || "Unknown error"));
      }
    });
  }, [dispatch, navigate]);

  // Authentication methods to share via context
  const authMethods = {
    isInitialized,
    isAuthenticated,
    logout: async () => {
      try {
        const { ApperUI } = window.ApperSDK;
        await ApperUI.logout();
        dispatch(clearUser());
        navigate('/login');
      } catch (error) {
        console.error("Logout failed:", error);
      }
    }
  };

  useEffect(() => {
    // Apply dark mode class to document
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Save preference
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading application...</div>;
  }

  const MoonIcon = getIcon('Moon');
  const SunIcon = getIcon('Sun');

  return (
    <>
      <div className="min-h-screen flex flex-col bg-surface-50 dark:bg-surface-900 transition-colors duration-300">
        <header className="py-4 px-4 sm:px-6 border-b border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-800 shadow-sm">
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-primary flex items-center justify-center">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="text-white font-bold text-2xl"
                >
                  T
                </motion.div>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                TaskFlow
              </h1>
            </div>
            
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={toggleDarkMode}
              className="p-2 rounded-full bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors"
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? (
                <SunIcon className="w-5 h-5 text-yellow-400" />
              ) : (
                <MoonIcon className="w-5 h-5 text-surface-700" />
              )}
            </motion.button>
          </div>
        </header>
  
        <main className="flex-grow">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/callback" element={<Callback />} />
            <Route path="/error" element={<ErrorPage />} />
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="*" element={<ProtectedRoute><NotFound /></ProtectedRoute>} />
            <Route path="/not-found" element={<NotFound />} />
          </Routes>
        </main>
  
        <footer className="py-4 text-center text-sm text-surface-500 dark:text-surface-400 border-t border-surface-200 dark:border-surface-800">
          <div className="container mx-auto px-4">
            <p>© {new Date().getFullYear()} TaskFlow. All rights reserved.</p>
          </div>
        </footer>
      </div>
  
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={darkMode ? "dark" : "light"}
        toastStyle={{
          borderRadius: '0.75rem',
          boxShadow: darkMode ? 
            '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.2)' : 
            '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.06)'
        }}
      />
    </>
  );
}

export default App;