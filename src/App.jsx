import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import { Home } from './pages/Home';
import { NotFound } from './pages/NotFound';
import { motion } from 'framer-motion';
import { getIcon } from './utils/iconUtils';

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    // Check for saved preference or use system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

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
            <Route path="/" element={<Home />} />
            <Route path="*" element={<NotFound />} />
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