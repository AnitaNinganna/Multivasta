// API error handler with standardized responses
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const status = error.response.status;
    const message = error.response.data?.message || 'An error occurred';

    switch (status) {
      case 400:
        return { message: `Bad Request: ${message}`, type: 'error' };
      case 401:
        return { message: 'Session expired. Please login again.', type: 'error', shouldRedirect: '/login' };
      case 403:
        return { message: 'You do not have permission to perform this action.', type: 'error' };
      case 404:
        return { message: 'Resource not found.', type: 'error' };
      case 409:
        return { message: `Conflict: ${message}`, type: 'error' };
      case 500:
        return { message: 'Server error. Please try again later.', type: 'error' };
      default:
        return { message, type: 'error' };
    }
  } else if (error.request) {
    return { message: 'No response from server. Check your connection.', type: 'error' };
  } else {
    return { message: error.message || 'An unexpected error occurred', type: 'error' };
  }
};

// Validation error handler
export const getValidationError = (field) => {
  const errors = {
    email: 'Please enter a valid email address',
    password: 'Password must be at least 6 characters',
    name: 'Name is required',
    phone: 'Please enter a valid phone number',
    address: 'Address is required',
    zipCode: 'Please enter a valid ZIP code',
    quantity: 'Quantity must be at least 1',
    price: 'Price must be greater than 0',
  };
  return errors[field] || 'Invalid input';
};

// Optimistic update error recovery
export const recoverOptimisticUpdate = (original, updated) => {
  console.warn('Optimistic update failed, reverting to original state');
  return original;
};
