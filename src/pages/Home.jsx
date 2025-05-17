import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import MainFeature from '../components/MainFeature';

function Home() {
  // Get user from Redux store
  const { user } = useSelector(state => state.user);
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
    }
  };

  return (
    <motion.div 
      className="container mx-auto px-4 py-6 sm:py-8 md:py-12"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div variants={itemVariants} className="mb-6 sm:mb-8 md:mb-10">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-surface-800 dark:text-surface-100 flex items-center gap-2">
          {user?.firstName ? `${user.firstName}'s` : 'My'} Tasks
        </h2>
        <p className="text-surface-600 dark:text-surface-400 mt-2 max-w-3xl">
          {user?.firstName && (
            <>Welcome, {user.firstName}! </>
          Organize your day and boost your productivity with TaskFlow's intuitive task management system.
        </p>
      </motion.div>
      
      <motion.div variants={itemVariants}>
        <MainFeature />
      </motion.div>
    </motion.div>
  );
}

export default Home;