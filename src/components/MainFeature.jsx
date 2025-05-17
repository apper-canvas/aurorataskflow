import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getIcon } from '../utils/iconUtils';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { fetchTasks, createTask, updateTask, deleteTask } from '../services/taskService';

function MainFeature() {
  // Get the authenticated user
  const { user } = useSelector(state => state.user);
  
  // Define state for tasks, loading and error handling
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Define state for the new task form
  const [newTask, setNewTask] = useState({
    title: '',
    owner: user?.emailAddress || '',
    tags: '',
    isCompleted: false,
    completedAt: null,
    description: '',
    dueDate: '',
    priority: 'medium',
    status: 'pending'
  });
  
  // Define state for the edit task form
  const [editingTask, setEditingTask] = useState(null);
  
  // Define state for filter and sort options
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  
  // Define state for form visibility
  const [isFormVisible, setIsFormVisible] = useState(false);
  
  // Load tasks from the database on component mount
  useEffect(() => {
    loadTasks();
  }, []);
  
  // Function to load tasks from the database
  const loadTasks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetchTasks();
      if (response && Array.isArray(response)) {
        setTasks(response);
      } else {
        setTasks([]);
        console.warn("Received unexpected response format from task service:", response);
      }
    } catch (err) {
      console.error("Error loading tasks:", err);
      setError("Failed to load tasks. Please try again later.");
      toast.error("Failed to load tasks: " + (err.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle input changes for the new task form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTask(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle input changes for the edit task form
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditingTask(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle form submission for creating a new task
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!newTask.title.trim()) {
      toast.error('Task title is required');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Prepare task data for API
      const taskData = {
        title: newTask.title,
        Owner: user?.emailAddress || '',
        Tags: newTask.tags ? newTask.tags.split(',').map(tag => tag.trim()) : [],
        description: newTask.description,
        dueDate: newTask.dueDate || null,
        priority: newTask.priority,
        status: newTask.status,
        isCompleted: newTask.status === 'completed',
        completedAt: newTask.status === 'completed' ? new Date().toISOString() : null
      };
      
      // Create task in database
      const createdTask = await createTask(taskData);
      
      // Add the new task to the state
      setTasks(prev => [createdTask, ...prev]);
      
      // Reset form
      setNewTask({
        title: '',
        owner: user?.emailAddress || '',
        tags: '',
        isCompleted: false,
        completedAt: null,
        description: '',
        dueDate: '',
        priority: 'medium',
        status: 'pending'
      });
      
      setIsFormVisible(false);
      toast.success('Task created successfully');
    } catch (err) {
      console.error("Error creating task:", err);
      toast.error("Failed to create task: " + (err.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  // Parse tags from the database format to string for editing
  const formatTagsForEditing = (tagArray) => {
    return Array.isArray(tagArray) ? tagArray.join(', ') : '';
  };

  // Prepare a task for editing by ensuring all fields are properly formatted
  const prepareTaskForEditing = (task) => {
    return {
      ...task,
      tags: formatTagsForEditing(task.Tags),
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
    };
  };
  
  // Handle task editing
  const handleEditTask = (task) => {
    setEditingTask(prepareTaskForEditing(task));
  };
  
  // Handle canceling task edit
  const handleCancelEdit = () => {
    setEditingTask(null);
  };
  
  // Handle form submission for editing a task
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!editingTask.title.trim()) {
      toast.error('Task title is required');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Prepare task data for API
      const taskData = {
        Id: editingTask.Id, // Required for update
        title: editingTask.title,
        Tags: editingTask.tags ? editingTask.tags.split(',').map(tag => tag.trim()) : [],
        description: editingTask.description,
        dueDate: editingTask.dueDate || null,
        priority: editingTask.priority,
        status: editingTask.status,
        isCompleted: editingTask.status === 'completed',
        completedAt: editingTask.status === 'completed' ? new Date().toISOString() : null
      };
      
      // Update task in database
      const updatedTask = await updateTask(taskData);
      
      // Update the task in state
      setTasks(prev => prev.map(task => 
        task.Id === updatedTask.Id ? updatedTask : task
      ));
      
      setEditingTask(null);
      toast.success('Task updated successfully');
    } catch (err) {
      console.error("Error updating task:", err);
      toast.error("Failed to update task: " + (err.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle task completion toggle
  const handleTaskCompletion = async (id, isCompleted) => {
    try {
      setIsLoading(true);
      
      // Find the task to update
      const taskToUpdate = tasks.find(task => task.Id === id);
      if (!taskToUpdate) {
        throw new Error("Task not found");
      }
      
      // Prepare updated task data
      const updatedTaskData = {
        ...taskToUpdate,
        isCompleted: !isCompleted,
        status: !isCompleted ? 'completed' : 'pending',
        completedAt: !isCompleted ? new Date().toISOString() : null,
      };
      
      // Update task in database
      const updatedTask = await updateTask(updatedTaskData);
      
      // Update the task in state
      setTasks(prev => prev.map(task => 
        task.Id === updatedTask.Id ? updatedTask : task
      ));
      
      if (!isCompleted) {
        toast.success('Task marked as completed');
      } else {
        toast.info('Task marked as pending');
      }
    } catch (err) {
      console.error("Error updating task completion:", err);
      toast.error("Failed to update task: " + (err.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle task deletion
  const handleDeleteTask = async (id) => {
    try {
      setIsLoading(true);
      
      // Delete task from database
      await deleteTask(id);
      
      // Remove the task from state
      setTasks(prev => prev.filter(task => task.Id !== id));
      
      toast.success('Task deleted successfully');
    } catch (err) {
      console.error("Error deleting task:", err);
      toast.error("Failed to delete task: " + (err.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Filter and sort tasks
  const filteredAndSortedTasks = tasks
    .filter(task => {
      // Apply status filter
      if (filterStatus === 'all') return true;
      if (filterStatus === 'completed') return task.isCompleted;
      if (filterStatus === 'active') return !task.isCompleted;
      return task.status === filterStatus;
    })
    .filter(task => {
      // Apply priority filter
      if (filterPriority === 'all') return true;
      return task.priority === filterPriority;
    })
    .sort((a, b) => {
      // Apply sort order
      if (sortOrder === 'newest') {
        return new Date(b.CreatedOn || b.createdAt) - new Date(a.CreatedOn || a.createdAt);
      }
      if (sortOrder === 'oldest') {
        return new Date(a.CreatedOn || a.createdAt) - new Date(b.CreatedOn || b.createdAt);
      }
      if (sortOrder === 'dueDate') {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      if (sortOrder === 'priority') {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return 0;
    });

  // Get icon components
  const PlusIcon = getIcon('Plus');
  const CalendarIcon = getIcon('Calendar');
  const CircleCheckIcon = getIcon('CheckCircle2');
  const EditIcon = getIcon('Edit');
  const TrashIcon = getIcon('Trash2');
  const XCircleIcon = getIcon('XCircle');
  const CheckIcon = getIcon('Check');
  const ChevronDownIcon = getIcon('ChevronDown');
  const FilterIcon = getIcon('Filter');
  const SortIcon = getIcon('ArrowDownUp');
  const ChevronUpIcon = getIcon('ChevronUp');
  const ClipboardCheckIcon = getIcon('ClipboardCheck');
  const ClockIcon = getIcon('Clock');
  const FlagIcon = getIcon('Flag');
  const LoadingIcon = getIcon('Loader');
  
  // Get task counts
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.isCompleted).length;
  const pendingTasks = totalTasks - completedTasks;
  
  // Get priority color
  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return 'text-red-500 dark:text-red-400';
      case 'medium': return 'text-amber-500 dark:text-amber-400';
      case 'low': return 'text-green-500 dark:text-green-400';
      default: return 'text-surface-500';
    }
  };
  
  // Get status color
  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'text-green-500 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'in-progress': return 'text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
      case 'pending': return 'text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20';
      default: return 'text-surface-500 bg-surface-100 dark:bg-surface-800';
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'MMM d, yyyy');
  };
  
  return (
    <div className="mb-10">
      {/* Task Statistics */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6"
      >
        <div className="card-neu p-5 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-primary/10 text-primary dark:text-primary-light">
            <ClipboardCheckIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-surface-500 dark:text-surface-400 text-sm">Total Tasks</p>
            <p className="text-2xl font-bold">{totalTasks}</p>
          </div>
        </div>
        
        <div className="card-neu p-5 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-green-500/10 text-green-500 dark:text-green-400">
            <CheckIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-surface-500 dark:text-surface-400 text-sm">Completed</p>
            <p className="text-2xl font-bold">{completedTasks}</p>
          </div>
        </div>
        
        <div className="card-neu p-5 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-amber-500/10 text-amber-500 dark:text-amber-400">
            <ClockIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-surface-500 dark:text-surface-400 text-sm">Pending</p>
            <p className="text-2xl font-bold">{pendingTasks}</p>
          </div>
        </div>
      </motion.div>
      
      {/* Task Actions and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 sm:justify-between mb-6">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setIsFormVisible(true)}
          className="btn btn-primary flex items-center justify-center sm:justify-start"
          disabled={isLoading}
        >
          {isLoading ? <LoadingIcon className="w-5 h-5 mr-2 animate-spin" /> : <PlusIcon className="w-5 h-5 mr-2" />}
          Add New Task
        </motion.button>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FilterIcon className="w-4 h-4 text-surface-400" />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field pl-9 pr-8 py-2 appearance-none cursor-pointer"
              disabled={isLoading}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="active">Active</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ChevronDownIcon className="w-4 h-4 text-surface-400" />
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FlagIcon className="w-4 h-4 text-surface-400" />
            </div>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="input-field pl-9 pr-8 py-2 appearance-none cursor-pointer"
              disabled={isLoading}
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ChevronDownIcon className="w-4 h-4 text-surface-400" />
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SortIcon className="w-4 h-4 text-surface-400" />
            </div>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="input-field pl-9 pr-8 py-2 appearance-none cursor-pointer"
              disabled={isLoading}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="dueDate">Due Date</option>
              <option value="priority">Priority</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ChevronDownIcon className="w-4 h-4 text-surface-400" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Loading Indicator */}
      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <LoadingIcon className="w-10 h-10 animate-spin text-primary" />
          <span className="ml-3 text-surface-600 dark:text-surface-400">Loading tasks...</span>
        </div>
      )}
      
      {/* Error Message */}
      {error && !isLoading && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
          <div className="flex items-center">
            <XCircleIcon className="w-5 h-5 text-red-500 dark:text-red-400 mr-3" />
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
          <button 
            onClick={loadTasks} 
            className="mt-2 text-sm text-primary hover:text-primary-dark dark:hover:text-primary-light"
          >
            Try again
          </button>
        </div>
      )}
      
      {/* New Task Form */}
      <AnimatePresence>
        {isFormVisible && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden mb-6"
          >
            <form onSubmit={handleSubmit} className="bg-white dark:bg-surface-800 rounded-xl p-6 shadow-card dark:shadow-none border border-surface-200 dark:border-surface-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Create New Task</h3>
                <button
                  type="button"
                  onClick={() => setIsFormVisible(false)}
                  className="text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
                  disabled={isLoading}
                >
                  <XCircleIcon className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={newTask.title}
                    onChange={handleInputChange}
                    placeholder="Enter task title"
                    className="input-field"
                    required
                    disabled={isLoading}
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={newTask.description}
                    onChange={handleInputChange}
                    placeholder="Enter task description"
                    className="input-field min-h-[100px]"
                    rows="3"
                    disabled={isLoading}
                  ></textarea>
                </div>

                <div>
                  <label htmlFor="tags" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    id="tags"
                    name="tags"
                    value={newTask.tags}
                    onChange={handleInputChange}
                    placeholder="work, personal, urgent"
                    className="input-field"
                    disabled={isLoading}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="dueDate" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      id="dueDate"
                      name="dueDate"
                      value={newTask.dueDate}
                      onChange={handleInputChange}
                      className="input-field"
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                      Priority
                    </label>
                    <select
                      id="priority"
                      name="priority"
                      value={newTask.priority}
                      onChange={handleInputChange}
                      className="input-field"
                      disabled={isLoading}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                      Status
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={newTask.status}
                      onChange={handleInputChange}
                      className="input-field"
                      disabled={isLoading}
                    >
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsFormVisible(false)}
                    className="btn btn-outline"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <LoadingIcon className="w-5 h-5 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : 'Create Task'}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Edit Task Form */}
      <AnimatePresence>
        {editingTask && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden mb-6"
          >
            <form onSubmit={handleEditSubmit} className="bg-white dark:bg-surface-800 rounded-xl p-6 shadow-card dark:shadow-none border border-surface-200 dark:border-surface-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Edit Task</h3>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
                  disabled={isLoading}
                >
                  <XCircleIcon className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="edit-title" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="edit-title"
                    name="title"
                    value={editingTask.title}
                    onChange={handleEditInputChange}
                    placeholder="Enter task title"
                    className="input-field"
                    required
                    disabled={isLoading}
                  />
                </div>
                
                <div>
                  <label htmlFor="edit-description" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                    Description
                  </label>
                  <textarea
                    id="edit-description"
                    name="description"
                    value={editingTask.description}
                    onChange={handleEditInputChange}
                    placeholder="Enter task description"
                    className="input-field min-h-[100px]"
                    rows="3"
                    disabled={isLoading}
                  ></textarea>
                </div>

                <div>
                  <label htmlFor="edit-tags" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    id="edit-tags"
                    name="tags"
                    value={editingTask.tags}
                    onChange={handleEditInputChange}
                    placeholder="work, personal, urgent"
                    className="input-field"
                    disabled={isLoading}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="edit-dueDate" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      id="edit-dueDate"
                      name="dueDate"
                      value={editingTask.dueDate}
                      onChange={handleEditInputChange}
                      className="input-field"
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="edit-priority" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                      Priority
                    </label>
                    <select
                      id="edit-priority"
                      name="priority"
                      value={editingTask.priority}
                      onChange={handleEditInputChange}
                      className="input-field"
                      disabled={isLoading}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="edit-status" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                      Status
                    </label>
                    <select
                      id="edit-status"
                      name="status"
                      value={editingTask.status}
                      onChange={handleEditInputChange}
                      className="input-field"
                      disabled={isLoading}
                    >
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="btn btn-outline"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <LoadingIcon className="w-5 h-5 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : 'Update Task'}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Task List */}
      <div className="space-y-4">
        {!isLoading && !error && filteredAndSortedTasks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-white dark:bg-surface-800 rounded-xl p-10 text-center shadow-card dark:shadow-none border border-surface-200 dark:border-surface-700"
          >
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-surface-100 dark:bg-surface-700 rounded-full flex items-center justify-center">
                <ClipboardCheckIcon className="w-8 h-8 text-surface-400 dark:text-surface-500" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2">No Tasks Found</h3>
            <p className="text-surface-500 dark:text-surface-400 mb-6 max-w-md mx-auto">
              {tasks.length === 0 
                ? "You don't have any tasks yet. Click 'Add New Task' to create your first task." 
                : "No tasks match your current filters. Try changing your filter criteria."}
            </p>
            {tasks.length === 0 && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setIsFormVisible(true)}
                className="btn btn-primary inline-flex items-center"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Add New Task
              </motion.button>
            )}
          </motion.div>
        ) : !isLoading && !error ? (
          <AnimatePresence>
            {filteredAndSortedTasks.map((task, index) => (
              <motion.div
                key={task.Id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ 
                  duration: 0.3,
                  delay: index * 0.05 
                }}
                className={`task-card p-5 ${task.isCompleted ? 'opacity-75' : ''}`}
              >
                <div className="flex items-start gap-4">
                  <button 
                    onClick={() => handleTaskCompletion(task.Id, task.isCompleted)}
                    className={`mt-1 ${task.isCompleted 
                      ? 'text-green-500 hover:text-green-600 dark:text-green-400 dark:hover:text-green-300' 
                      : 'text-surface-400 hover:text-surface-600 dark:text-surface-500 dark:hover:text-surface-300'}`}
                    aria-label={task.isCompleted ? "Mark as incomplete" : "Mark as complete"}
                    disabled={isLoading}
                  >
                    <CircleCheckIcon className="w-6 h-6" />
                  </button>
                  
                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                      <h3 className={`font-semibold text-lg ${task.isCompleted ? 'line-through text-surface-500 dark:text-surface-400' : ''}`}>
                        {task.title}
                      </h3>
                      
                      <div className="flex flex-wrap gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(task.status)}`}>
                          {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                        </span>
                        
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPriorityColor(task.priority)} bg-surface-100 dark:bg-surface-800`}>
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                        </span>
                        
                        {task.Tags && task.Tags.length > 0 && task.Tags.map((tag, idx) => (
                          <span key={idx} className="text-xs px-2 py-1 rounded-full font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {task.description && (
                      <p className="text-surface-600 dark:text-surface-400 mb-3">
                        {task.description}
                      </p>
                    )}
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-4">
                        {task.dueDate && (
                          <div className="flex items-center text-sm text-surface-500 dark:text-surface-400">
                            <CalendarIcon className="w-4 h-4 mr-1" />
                            Due: {formatDate(task.dueDate)}
                          </div>
                        )}
                        
                        {task.isCompleted && task.completedAt && (
                          <div className="flex items-center text-sm text-green-500 dark:text-green-400">
                            <CheckIcon className="w-4 h-4 mr-1" />
                            Completed on {formatDate(task.completedAt)}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex space-x-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleEditTask(task)}
                          className="p-2 rounded-lg bg-surface-100 hover:bg-surface-200 dark:bg-surface-800 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-400"
                          aria-label="Edit task"
                          disabled={isLoading}
                        >
                          <EditIcon className="w-4 h-4" />
                        </motion.button>
                        
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDeleteTask(task.Id)}
                          className="p-2 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400"
                          aria-label="Delete task"
                          disabled={isLoading}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : null}
      </div>
    </div>
  );
}

export default MainFeature;
      ...newTask,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isCompleted: false,
      completedAt: null
    };
    
    setTasks(prev => [task, ...prev]);
    setNewTask({
      title: '',
      description: '',
      dueDate: '',
      priority: 'medium',
      status: 'pending'
    });
    
    setIsFormVisible(false);
    toast.success('Task created successfully');
  };
  
  // Handle form submission for editing a task
  const handleEditSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    if (!editingTask.title.trim()) {
      toast.error('Task title is required');
      return;
    }
    
    setTasks(prev => prev.map(task => 
      task.id === editingTask.id 
        ? { ...editingTask, updatedAt: new Date().toISOString() } 
        : task
    ));
    
    setEditingTask(null);
    toast.success('Task updated successfully');
  };
  
  // Handle task completion toggle
  const handleTaskCompletion = (id, isCompleted) => {
    setTasks(prev => prev.map(task => 
      task.id === id 
        ? { 
            ...task, 
            isCompleted: !isCompleted, 
            status: !isCompleted ? 'completed' : 'pending',
            completedAt: !isCompleted ? new Date().toISOString() : null,
            updatedAt: new Date().toISOString()
          } 
        : task
    ));
    
    if (!isCompleted) {
      toast.success('Task marked as completed');
    }
  };
  
  // Handle task deletion
  const handleDeleteTask = (id) => {
    setTasks(prev => prev.filter(task => task.id !== id));
    toast.success('Task deleted successfully');
  };
  
  // Handle task editing
  const handleEditTask = (task) => {
    setEditingTask(task);
  };
  
  // Handle canceling task edit
  const handleCancelEdit = () => {
    setEditingTask(null);
  };
  
  // Filter and sort tasks
  const filteredAndSortedTasks = tasks
    .filter(task => {
      // Apply status filter
      if (filterStatus === 'all') return true;
      if (filterStatus === 'completed') return task.isCompleted;
      if (filterStatus === 'active') return !task.isCompleted;
      return task.status === filterStatus;
    })
    .filter(task => {
      // Apply priority filter
      if (filterPriority === 'all') return true;
      return task.priority === filterPriority;
    })
    .sort((a, b) => {
      // Apply sort order
      if (sortOrder === 'newest') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (sortOrder === 'oldest') {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      if (sortOrder === 'dueDate') {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      if (sortOrder === 'priority') {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return 0;
    });
  
  // Get icon components
  const PlusIcon = getIcon('Plus');
  const CalendarIcon = getIcon('Calendar');
  const CircleCheckIcon = getIcon('CheckCircle2');
  const EditIcon = getIcon('Edit');
  const TrashIcon = getIcon('Trash2');
  const XCircleIcon = getIcon('XCircle');
  const CheckIcon = getIcon('Check');
  const ChevronDownIcon = getIcon('ChevronDown');
  const FilterIcon = getIcon('Filter');
  const SortIcon = getIcon('ArrowDownUp');
  const ChevronUpIcon = getIcon('ChevronUp');
  const ClipboardCheckIcon = getIcon('ClipboardCheck');
  const ClockIcon = getIcon('Clock');
  const FlagIcon = getIcon('Flag');
  
  // Get task counts
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.isCompleted).length;
  const pendingTasks = totalTasks - completedTasks;
  
  // Get priority color
  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return 'text-red-500 dark:text-red-400';
      case 'medium': return 'text-amber-500 dark:text-amber-400';
      case 'low': return 'text-green-500 dark:text-green-400';
      default: return 'text-surface-500';
    }
  };
  
  // Get status color
  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'text-green-500 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'in-progress': return 'text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
      case 'pending': return 'text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20';
      default: return 'text-surface-500 bg-surface-100 dark:bg-surface-800';
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'MMM d, yyyy');
  };
  
  return (
    <div className="mb-10">
      {/* Task Statistics */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6"
      >
        <div className="card-neu p-5 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-primary/10 text-primary dark:text-primary-light">
            <ClipboardCheckIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-surface-500 dark:text-surface-400 text-sm">Total Tasks</p>
            <p className="text-2xl font-bold">{totalTasks}</p>
          </div>
        </div>
        
        <div className="card-neu p-5 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-green-500/10 text-green-500 dark:text-green-400">
            <CheckIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-surface-500 dark:text-surface-400 text-sm">Completed</p>
            <p className="text-2xl font-bold">{completedTasks}</p>
          </div>
        </div>
        
        <div className="card-neu p-5 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-amber-500/10 text-amber-500 dark:text-amber-400">
            <ClockIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-surface-500 dark:text-surface-400 text-sm">Pending</p>
            <p className="text-2xl font-bold">{pendingTasks}</p>
          </div>
        </div>
      </motion.div>
      
      {/* Task Actions and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 sm:justify-between mb-6">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setIsFormVisible(true)}
          className="btn btn-primary flex items-center justify-center sm:justify-start"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add New Task
        </motion.button>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FilterIcon className="w-4 h-4 text-surface-400" />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field pl-9 pr-8 py-2 appearance-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="active">Active</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ChevronDownIcon className="w-4 h-4 text-surface-400" />
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FlagIcon className="w-4 h-4 text-surface-400" />
            </div>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="input-field pl-9 pr-8 py-2 appearance-none cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ChevronDownIcon className="w-4 h-4 text-surface-400" />
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SortIcon className="w-4 h-4 text-surface-400" />
            </div>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="input-field pl-9 pr-8 py-2 appearance-none cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="dueDate">Due Date</option>
              <option value="priority">Priority</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ChevronDownIcon className="w-4 h-4 text-surface-400" />
            </div>
          </div>
        </div>
      </div>
      
      {/* New Task Form */}
      <AnimatePresence>
        {isFormVisible && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden mb-6"
          >
            <form onSubmit={handleSubmit} className="bg-white dark:bg-surface-800 rounded-xl p-6 shadow-card dark:shadow-none border border-surface-200 dark:border-surface-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Create New Task</h3>
                <button
                  type="button"
                  onClick={() => setIsFormVisible(false)}
                  className="text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
                >
                  <XCircleIcon className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={newTask.title}
                    onChange={handleInputChange}
                    placeholder="Enter task title"
                    className="input-field"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={newTask.description}
                    onChange={handleInputChange}
                    placeholder="Enter task description"
                    className="input-field min-h-[100px]"
                    rows="3"
                  ></textarea>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="dueDate" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      id="dueDate"
                      name="dueDate"
                      value={newTask.dueDate}
                      onChange={handleInputChange}
                      className="input-field"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                      Priority
                    </label>
                    <select
                      id="priority"
                      name="priority"
                      value={newTask.priority}
                      onChange={handleInputChange}
                      className="input-field"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                      Status
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={newTask.status}
                      onChange={handleInputChange}
                      className="input-field"
                    >
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsFormVisible(false)}
                    className="btn btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    Create Task
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Edit Task Form */}
      <AnimatePresence>
        {editingTask && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden mb-6"
          >
            <form onSubmit={handleEditSubmit} className="bg-white dark:bg-surface-800 rounded-xl p-6 shadow-card dark:shadow-none border border-surface-200 dark:border-surface-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Edit Task</h3>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
                >
                  <XCircleIcon className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="edit-title" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="edit-title"
                    name="title"
                    value={editingTask.title}
                    onChange={handleEditInputChange}
                    placeholder="Enter task title"
                    className="input-field"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="edit-description" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                    Description
                  </label>
                  <textarea
                    id="edit-description"
                    name="description"
                    value={editingTask.description}
                    onChange={handleEditInputChange}
                    placeholder="Enter task description"
                    className="input-field min-h-[100px]"
                    rows="3"
                  ></textarea>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="edit-dueDate" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      id="edit-dueDate"
                      name="dueDate"
                      value={editingTask.dueDate}
                      onChange={handleEditInputChange}
                      className="input-field"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="edit-priority" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                      Priority
                    </label>
                    <select
                      id="edit-priority"
                      name="priority"
                      value={editingTask.priority}
                      onChange={handleEditInputChange}
                      className="input-field"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="edit-status" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                      Status
                    </label>
                    <select
                      id="edit-status"
                      name="status"
                      value={editingTask.status}
                      onChange={handleEditInputChange}
                      className="input-field"
                    >
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="btn btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    Update Task
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Task List */}
      <div className="space-y-4">
        {filteredAndSortedTasks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-white dark:bg-surface-800 rounded-xl p-10 text-center shadow-card dark:shadow-none border border-surface-200 dark:border-surface-700"
          >
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-surface-100 dark:bg-surface-700 rounded-full flex items-center justify-center">
                <ClipboardCheckIcon className="w-8 h-8 text-surface-400 dark:text-surface-500" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2">No Tasks Found</h3>
            <p className="text-surface-500 dark:text-surface-400 mb-6 max-w-md mx-auto">
              {tasks.length === 0 
                ? "You don't have any tasks yet. Click 'Add New Task' to create your first task." 
                : "No tasks match your current filters. Try changing your filter criteria."}
            </p>
            {tasks.length === 0 && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setIsFormVisible(true)}
                className="btn btn-primary inline-flex items-center"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Add New Task
              </motion.button>
            )}
          </motion.div>
        ) : (
          <AnimatePresence>
            {filteredAndSortedTasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ 
                  duration: 0.3,
                  delay: index * 0.05 
                }}
                className={`task-card p-5 ${task.isCompleted ? 'opacity-75' : ''}`}
              >
                <div className="flex items-start gap-4">
                  <button 
                    onClick={() => handleTaskCompletion(task.id, task.isCompleted)}
                    className={`mt-1 ${task.isCompleted 
                      ? 'text-green-500 hover:text-green-600 dark:text-green-400 dark:hover:text-green-300' 
                      : 'text-surface-400 hover:text-surface-600 dark:text-surface-500 dark:hover:text-surface-300'}`}
                    aria-label={task.isCompleted ? "Mark as incomplete" : "Mark as complete"}
                  >
                    <CircleCheckIcon className="w-6 h-6" />
                  </button>
                  
                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                      <h3 className={`font-semibold text-lg ${task.isCompleted ? 'line-through text-surface-500 dark:text-surface-400' : ''}`}>
                        {task.title}
                      </h3>
                      
                      <div className="flex flex-wrap gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(task.status)}`}>
                          {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                        </span>
                        
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPriorityColor(task.priority)} bg-surface-100 dark:bg-surface-800`}>
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                        </span>
                      </div>
                    </div>
                    
                    {task.description && (
                      <p className="text-surface-600 dark:text-surface-400 mb-3">
                        {task.description}
                      </p>
                    )}
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-4">
                        {task.dueDate && (
                          <div className="flex items-center text-sm text-surface-500 dark:text-surface-400">
                            <CalendarIcon className="w-4 h-4 mr-1" />
                            Due: {formatDate(task.dueDate)}
                          </div>
                        )}
                        
                        {task.isCompleted && task.completedAt && (
                          <div className="flex items-center text-sm text-green-500 dark:text-green-400">
                            <CheckIcon className="w-4 h-4 mr-1" />
                            Completed on {formatDate(task.completedAt)}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex space-x-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleEditTask(task)}
                          className="p-2 rounded-lg bg-surface-100 hover:bg-surface-200 dark:bg-surface-800 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-400"
                          aria-label="Edit task"
                        >
                          <EditIcon className="w-4 h-4" />
                        </motion.button>
                        
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-2 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400"
                          aria-label="Delete task"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

export default MainFeature;