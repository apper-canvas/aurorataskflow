import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { getIcon } from '../utils/iconUtils';

export function NotFound() {
  const HomeIcon = getIcon('Home');
  const FrownIcon = getIcon('Frown');

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-lg"
      >
        <div className="flex justify-center mb-6">
          <motion.div>
            <Link to="/"
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.2
            }}

            className="relative"
          >
            <div className="w-24 h-24 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center">
              <FrownIcon className="w-12 h-12 text-surface-500 dark:text-surface-400" />
            </div>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="absolute -top-2 -right-2 w-8 h-8 bg-accent rounded-full flex items-center justify-center"
            >
              <span className="text-white font-bold">?</span>
            </motion.div>
          </motion.div>
        </div>
        
        <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-surface-800 dark:text-surface-100">
          404
        </h1>
        <h2 className="text-2xl sm:text-3xl font-semibold mb-4 text-surface-700 dark:text-surface-200">
          Page Not Found
        </h2>
        <p className="mb-8 text-surface-600 dark:text-surface-400">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>
        
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link 
            to="/" 
            className="inline-flex items-center px-6 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary-dark transition-colors shadow-md hover:shadow-lg"
          >
            <HomeIcon className="w-5 h-5 mr-2" />
            Back to Home
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}