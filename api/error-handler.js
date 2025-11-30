/**
 * Error Handler for NSFWTagger Stash Plugin
 * 
 * Provides comprehensive error handling, retry logic, and user-friendly error messages.
 */

class ErrorHandler {
  constructor() {
    this.retryAttempts = new Map();
    this.maxRetries = 3;
    this.baseDelay = 1000; // 1 second
  }

  /**
   * Handle API errors with appropriate responses
   */
  handleAPIError(error, context = '') {
    console.error(`API Error (${context}):`, error);

    const errorResponse = {
      success: false,
      error: {
        message: this.getErrorMessage(error),
        code: this.getErrorCode(error),
        details: this.getErrorDetails(error),
        timestamp: new Date().toISOString(),
        context: context
      }
    };

    // Log error for debugging
    this.logError(errorResponse);

    return errorResponse;
  }

  /**
   * Handle Stash API errors
   */
  handleStashError(error, operation = '') {
    console.error(`Stash Error (${operation}):`, error);

    const errorResponse = {
      success: false,
      error: {
        source: 'stash',
        operation: operation,
        message: this.getStashErrorMessage(error),
        code: this.getStashErrorCode(error),
        details: this.getStashErrorDetails(error),
        timestamp: new Date().toISOString()
      }
    };

    this.logError(errorResponse);
    return errorResponse;
  }

  /**
   * Handle NSFWTagger container errors
   */
  handleContainerError(error, operation = '') {
    console.error(`Container Error (${operation}):`, error);

    const errorResponse = {
      success: false,
      error: {
        source: 'container',
        operation: operation,
        message: this.getContainerErrorMessage(error),
        code: this.getContainerErrorCode(error),
        details: this.getContainerErrorDetails(error),
        timestamp: new Date().toISOString()
      }
    };

    this.logError(errorResponse);
    return errorResponse;
  }

  /**
   * Handle processing errors
   */
  handleProcessingError(error, item = null) {
    console.error('Processing Error:', error);

    const errorResponse = {
      success: false,
      error: {
        source: 'processing',
        item: item ? { id: item.id, type: item.type } : null,
        message: this.getProcessingErrorMessage(error),
        code: this.getProcessingErrorCode(error),
        details: this.getProcessingErrorDetails(error),
        timestamp: new Date().toISOString()
      }
    };

    this.logError(errorResponse);
    return errorResponse;
  }

  /**
   * Handle validation errors
   */
  handleValidationError(errors, context = '') {
    console.error(`Validation Error (${context}):`, errors);

    const errorResponse = {
      success: false,
      error: {
        source: 'validation',
        context: context,
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: {
          fields: errors,
          count: errors.length
        },
        timestamp: new Date().toISOString()
      }
    };

    this.logError(errorResponse);
    return errorResponse;
  }

  /**
   * Handle network errors
   */
  handleNetworkError(error, service = '') {
    console.error(`Network Error (${service}):`, error);

    const errorResponse = {
      success: false,
      error: {
        source: 'network',
        service: service,
        message: this.getNetworkErrorMessage(error),
        code: this.getNetworkErrorCode(error),
        details: this.getNetworkErrorDetails(error),
        timestamp: new Date().toISOString()
      }
    };

    this.logError(errorResponse);
    return errorResponse;
  }

  /**
   * Retry operation with exponential backoff
   */
  async retryOperation(operation, maxRetries = this.maxRetries, baseDelay = this.baseDelay) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (attempt === maxRetries) {
          throw error;
        }

        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
        console.warn(`Operation failed (attempt ${attempt}/${maxRetries}): ${error.message}. Retrying in ${delay/1000}s...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * Check if error is retryable
   */
  isRetryableError(error) {
    const retryableCodes = [
      'NETWORK_ERROR',
      'TIMEOUT',
      'CONNECTION_REFUSED',
      'ECONNRESET',
      'ENETUNREACH',
      'ECONNABORTED',
      '500',
      '502',
      '503',
      '504'
    ];

    const errorCode = this.getErrorCode(error);
    return retryableCodes.includes(errorCode) || 
           error.message.includes('timeout') ||
           error.message.includes('network');
  }

  /**
   * Get user-friendly error message
   */
  getErrorMessage(error) {
    if (!error) return 'Unknown error occurred';

    // Network errors
    if (error.code === 'NETWORK_ERROR') {
      return 'Network connection failed. Please check your internet connection and try again.';
    }

    if (error.code === 'TIMEOUT') {
      return 'Request timed out. The server may be busy or unreachable.';
    }

    if (error.code === 'CONNECTION_REFUSED') {
      return 'Connection refused. Please check if the service is running.';
    }

    // HTTP errors
    if (error.status >= 500) {
      return 'Server error. Please try again later.';
    }

    if (error.status === 404) {
      return 'Resource not found. Please check the URL and try again.';
    }

    if (error.status === 401) {
      return 'Authentication failed. Please check your credentials.';
    }

    if (error.status === 403) {
      return 'Access forbidden. You do not have permission to access this resource.';
    }

    if (error.status === 429) {
      return 'Too many requests. Please wait and try again later.';
    }

    // Default
    return error.message || 'An unexpected error occurred';
  }

  /**
   * Get error code
   */
  getErrorCode(error) {
    if (!error) return 'UNKNOWN_ERROR';

    if (error.code) return error.code;
    if (error.status) return error.status.toString();
    if (error.name) return error.name;
    
    return 'UNKNOWN_ERROR';
  }

  /**
   * Get detailed error information
   */
  getErrorDetails(error) {
    const details = {
      name: error.name,
      stack: error.stack,
      timestamp: new Date().toISOString()
    };

    if (error.response) {
      details.response = {
        status: error.response.status,
        statusText: error.response.statusText,
        headers: error.response.headers
      };
    }

    if (error.request) {
      details.request = {
        method: error.request.method,
        url: error.request.url
      };
    }

    return details;
  }

  /**
   * Get Stash-specific error message
   */
  getStashErrorMessage(error) {
    if (error.message.includes('GraphQL')) {
      return 'GraphQL query failed. Please check your Stash connection and try again.';
    }

    if (error.message.includes('401')) {
      return 'Stash authentication failed. Please check your API key and try again.';
    }

    if (error.message.includes('403')) {
      return 'Stash access forbidden. Please check your permissions.';
    }

    if (error.message.includes('404')) {
      return 'Stash resource not found. Please check your Stash URL and try again.';
    }

    return `Stash error: ${error.message}`;
  }

  /**
   * Get Stash error code
   */
  getStashErrorCode(error) {
    if (error.status) return `STASH_${error.status}`;
    if (error.code) return `STASH_${error.code}`;
    return 'STASH_ERROR';
  }

  /**
   * Get Stash error details
   */
  getStashErrorDetails(error) {
    return {
      status: error.status,
      message: error.message,
      graphql: error.graphql || null
    };
  }

  /**
   * Get container-specific error message
   */
  getContainerErrorMessage(error) {
    if (error.message.includes('health')) {
      return 'NSFWTagger container health check failed. Please ensure the container is running.';
    }

    if (error.message.includes('connection')) {
      return 'Cannot connect to NSFWTagger container. Please check if Docker is running and the container is accessible.';
    }

    if (error.message.includes('timeout')) {
      return 'NSFWTagger container request timed out. The container may be busy or overloaded.';
    }

    if (error.message.includes('404')) {
      return 'NSFWTagger container endpoint not found. Please check the container version and configuration.';
    }

    return `NSFWTagger container error: ${error.message}`;
  }

  /**
   * Get container error code
   */
  getContainerErrorCode(error) {
    if (error.status) return `CONTAINER_${error.status}`;
    if (error.code) return `CONTAINER_${error.code}`;
    return 'CONTAINER_ERROR';
  }

  /**
   * Get container error details
   */
  getContainerErrorDetails(error) {
    return {
      status: error.status,
      message: error.message,
      host: error.host,
      port: error.port
    };
  }

  /**
   * Get processing-specific error message
   */
  getProcessingErrorMessage(error) {
    if (error.message.includes('frame')) {
      return 'Frame extraction failed. Please check the media file and try again.';
    }

    if (error.message.includes('AI')) {
      return 'AI processing failed. Please check your LMStudio connection and model.';
    }

    if (error.message.includes('tag')) {
      return 'Tag creation failed. Please check your Stash connection and permissions.';
    }

    if (error.message.includes('marker')) {
      return 'Scene marker creation failed. Please check your Stash connection and permissions.';
    }

    return `Processing error: ${error.message}`;
  }

  /**
   * Get processing error code
   */
  getProcessingErrorCode(error) {
    if (error.code) return `PROCESSING_${error.code}`;
    return 'PROCESSING_ERROR';
  }

  /**
   * Get processing error details
   */
  getProcessingErrorDetails(error) {
    return {
      code: error.code,
      message: error.message,
      item: error.item,
      step: error.step
    };
  }

  /**
   * Get network-specific error message
   */
  getNetworkErrorMessage(error) {
    if (error.code === 'ENETUNREACH') {
      return 'Network unreachable. Please check your network connection.';
    }

    if (error.code === 'ECONNRESET') {
      return 'Connection reset by peer. Please try again.';
    }

    if (error.code === 'ECONNABORTED') {
      return 'Connection aborted. Please check your network and try again.';
    }

    if (error.code === 'ETIMEDOUT') {
      return 'Connection timed out. Please check your network and try again.';
    }

    return `Network error: ${error.message}`;
  }

  /**
   * Get network error code
   */
  getNetworkErrorCode(error) {
    if (error.code) return `NETWORK_${error.code}`;
    if (error.status) return `NETWORK_${error.status}`;
    return 'NETWORK_ERROR';
  }

  /**
   * Get network error details
   */
  getNetworkErrorDetails(error) {
    return {
      code: error.code,
      errno: error.errno,
      syscall: error.syscall,
      address: error.address,
      port: error.port
    };
  }

  /**
   * Log error for debugging
   */
  logError(errorResponse) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message: errorResponse.error.message,
      code: errorResponse.error.code,
      source: errorResponse.error.source || 'unknown',
      context: errorResponse.error.context || errorResponse.error.operation || 'unknown',
      details: errorResponse.error.details
    };

    // Log to console
    console.error('Error logged:', logEntry);

    // In a real implementation, you might want to:
    // 1. Send to a logging service
    // 2. Store in a local log file
    // 3. Send to an error tracking service (Sentry, etc.)
  }

  /**
   * Create a standardized error response
   */
  createErrorResponse(message, code = 'ERROR', details = null, context = '') {
    return {
      success: false,
      error: {
        message: message,
        code: code,
        details: details,
        context: context,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Handle and format error for user display
   */
  formatUserError(error, context = '') {
    const errorResponse = this.handleAPIError(error, context);
    
    return {
      message: errorResponse.error.message,
      code: errorResponse.error.code,
      details: errorResponse.error.details,
      timestamp: errorResponse.error.timestamp,
      userFriendly: true
    };
  }

  /**
   * Check if error should trigger a retry
   */
  shouldRetry(error, operation = '') {
    // Don't retry on certain errors
    const nonRetryableCodes = [
      'VALIDATION_ERROR',
      'AUTHENTICATION_ERROR',
      'PERMISSION_DENIED',
      'NOT_FOUND',
      '400',
      '401',
      '403',
      '404'
    ];

    const errorCode = this.getErrorCode(error);
    
    if (nonRetryableCodes.includes(errorCode)) {
      return false;
    }

    // Retry on network errors and server errors
    return this.isRetryableError(error);
  }

  /**
   * Get retry delay for exponential backoff
   */
  getRetryDelay(attempt, baseDelay = 1000, maxDelay = 30000) {
    const delay = Math.min(maxDelay, baseDelay * Math.pow(2, attempt - 1));
    const jitter = Math.random() * 1000;
    return Math.floor(delay + jitter);
  }

  /**
   * Handle timeout errors
   */
  handleTimeoutError(operation = '') {
    return this.createErrorResponse(
      `Operation '${operation}' timed out. Please try again.`,
      'TIMEOUT_ERROR',
      { operation: operation },
      'timeout'
    );
  }

  /**
   * Handle permission errors
   */
  handlePermissionError(operation = '') {
    return this.createErrorResponse(
      `Access denied for operation '${operation}'. Please check your permissions.`,
      'PERMISSION_DENIED',
      { operation: operation },
      'permission'
    );
  }

  /**
   * Handle not found errors
   */
  handleNotFoundError(resource = '', id = '') {
    return this.createErrorResponse(
      `${resource} with ID '${id}' not found.`,
      'NOT_FOUND',
      { resource: resource, id: id },
      'not_found'
    );
  }

  /**
   * Handle validation errors
   */
  handleValidationError(errors, context = '') {
    const errorResponse = this.handleValidationError(errors, context);
    
    const message = `Validation failed: ${errors.map(e => e.message).join(', ')}`;
    
    return this.createErrorResponse(
      message,
      'VALIDATION_ERROR',
      { errors: errors },
      context
    );
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ErrorHandler;
} else if (typeof window !== 'undefined') {
  window.ErrorHandler = ErrorHandler;
}
