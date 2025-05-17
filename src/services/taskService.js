/**
 * Task Service - Handles all task-related data operations
 * Uses ApperClient to connect to the Apper backend service
 */

// Fetch all tasks from the database
export const fetchTasks = async () => {
  try {
    const { ApperClient } = window.ApperSDK;
    
    // Initialize ApperClient with environment variables
    const apperClient = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    });
    
    // Define the fields to retrieve
    const tableFields = [
      'Id', 'Name', 'Tags', 'Owner', 'CreatedOn', 'CreatedBy',
      'ModifiedOn', 'ModifiedBy', 'title', 'description',
      'dueDate', 'priority', 'status', 'isCompleted', 'completedAt'
    ];
    
    // Set up parameters for the fetch operation
    const params = {
      fields: tableFields,
      orderBy: [
        {
          field: "CreatedOn",
          direction: "desc"
        }
      ],
      where: [
        {
          fieldName: "IsDeleted",
          Operator: "ExactMatch",
          values: [false]
        }
      ],
      pagingInfo: {
        limit: 100,
        offset: 0
      }
    };
    
    // Fetch records from the database
    const response = await apperClient.fetchRecords('task2', params);
    
    // Process and return the data
    if (response && response.data && Array.isArray(response.data)) {
      return response.data;
    } else {
      console.warn("Unexpected response format from fetchRecords:", response);
      return [];
    }
  } catch (error) {
    console.error("Error fetching tasks:", error);
    throw error;
  }
};

// Create a new task in the database
export const createTask = async (taskData) => {
  try {
    const { ApperClient } = window.ApperSDK;
    
    // Initialize ApperClient with environment variables
    const apperClient = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    });
    
    // Create record in the database
    const params = {
      records: [{
        // Only include fields with visibility: "Updateable"
        title: taskData.title,
        description: taskData.description,
        dueDate: taskData.dueDate,
        priority: taskData.priority,
        status: taskData.status,
        isCompleted: taskData.isCompleted,
        completedAt: taskData.completedAt,
        Owner: taskData.Owner,
        Tags: taskData.Tags
      }]
    };
    
    const response = await apperClient.createRecord('task2', params);
    
    // Process and return the created task
    if (response && response.success && response.results && response.results.length > 0) {
      const successfulRecord = response.results.find(result => result.success);
      if (successfulRecord && successfulRecord.data) {
        return successfulRecord.data;
      }
    }
    
    throw new Error("Failed to create task: " + JSON.stringify(response));
  } catch (error) {
    console.error("Error creating task:", error);
    throw error;
  }
};

// Update an existing task in the database
export const updateTask = async (taskData) => {
  try {
    const { ApperClient } = window.ApperSDK;
    
    // Initialize ApperClient with environment variables
    const apperClient = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    });
    
    // Make sure we have the ID
    if (!taskData.Id) {
      throw new Error("Task ID is required for update");
    }
    
    // Update record in the database
    const params = {
      records: [{
        // Include ID and only fields with visibility: "Updateable"
        Id: taskData.Id,
        title: taskData.title,
        description: taskData.description,
        dueDate: taskData.dueDate,
        priority: taskData.priority,
        status: taskData.status,
        isCompleted: taskData.isCompleted,
        completedAt: taskData.completedAt,
        Tags: taskData.Tags
      }]
    };
    
    const response = await apperClient.updateRecord('task2', params);
    
    // Process and return the updated task
    if (response && response.success && response.results && response.results.length > 0) {
      const successfulRecord = response.results.find(result => result.success);
      if (successfulRecord && successfulRecord.data) {
        return successfulRecord.data;
      }
    }
    
    throw new Error("Failed to update task: " + JSON.stringify(response));
  } catch (error) {
    console.error("Error updating task:", error);
    throw error;
  }
};

// Delete a task from the database
export const deleteTask = async (taskId) => {
  try {
    const { ApperClient } = window.ApperSDK;
    
    // Initialize ApperClient with environment variables
    const apperClient = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    });
    
    // Delete record from the database
    const response = await apperClient.deleteRecord('task2', { RecordIds: [taskId] });
    return response;
  } catch (error) {
    console.error("Error deleting task:", error);
    throw error;
  }
};