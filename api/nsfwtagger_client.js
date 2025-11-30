/**
 * NSFWTagger Container Client
 * 
 * Handles communication with the NSFWTagger Docker container for AI processing.
 * Provides retry logic, error handling, and progress tracking.
 */

class NSFWTaggerClient {
  constructor(host = 'localhost', port = 8000, timeout = 300) {
    this.host = host;
    this.port = port;
    this.timeout = timeout * 1000; // Convert to milliseconds
    this.baseURL = `http://${host}:${port}`;
    this.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  /**
   * Make an HTTP request with timeout and retry logic
   */
  async request(path, options = {}) {
    const url = `${this.baseURL}${path}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    const requestOptions = {
      ...options,
      headers: { ...this.headers, ...options.headers },
      signal: controller.signal
    };

    try {
      const response = await fetch(url, requestOptions);
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      let data;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      return {
        success: true,
        data: data,
        status: response.status
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.timeout/1000} seconds`);
      }
      
      throw error;
    }
  }

  /**
   * Health check for NSFWTagger container
   */
  async healthCheck() {
    try {
      const result = await this.request('/health');
      return {
        healthy: true,
        status: result.data,
        error: null
      };
    } catch (error) {
      return {
        healthy: false,
        status: null,
        error: error.message
      };
    }
  }

  /**
   * Process a single scene
   */
  async processScene(sceneId, options = {}) {
    const payload = {
      scene_id: sceneId,
      options: {
        frame_interval: options.frame_interval || 5,
        max_frames: options.max_frames || 50,
        shot_detection: options.shot_detection !== false,
        ...options
      }
    };

    try {
      const result = await this.request('/process/scene', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      return {
        success: true,
        result: result.data,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        result: null,
        error: error.message
      };
    }
  }

  /**
   * Process a single image
   */
  async processImage(imageId, options = {}) {
    const payload = {
      image_id: imageId,
      options: {
        quality: options.quality || 'high',
        ...options
      }
    };

    try {
      const result = await this.request('/process/image', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      return {
        success: true,
        result: result.data,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        result: null,
        error: error.message
      };
    }
  }

  /**
   * Process multiple items in batch
   */
  async processBatch(items, options = {}) {
    const payload = {
      items: items.map(item => ({
        id: item.id,
        type: item.type, // 'scene' or 'image'
        options: item.options || {}
      })),
      options: {
        concurrency: options.concurrency || 4,
        batch_size: options.batch_size || 10,
        ...options
      }
    };

    try {
      const result = await this.request('/process/batch', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      return {
        success: true,
        result: result.data,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        result: null,
        error: error.message
      };
    }
  }

  /**
   * Get processing status
   */
  async getStatus() {
    try {
      const result = await this.request('/status');
      return {
        success: true,
        status: result.data,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        status: null,
        error: error.message
      };
    }
  }

  /**
   * Cancel current processing
   */
  async cancelProcessing() {
    try {
      const result = await this.request('/cancel', {
        method: 'POST'
      });
      return {
        success: true,
        result: result.data,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        result: null,
        error: error.message
      };
    }
  }

  /**
   * Test LMStudio connection
   */
  async testLMStudioConnection() {
    try {
      const result = await this.request('/test/lmstudio');
      return {
        connected: true,
        status: result.data,
        error: null
      };
    } catch (error) {
      return {
        connected: false,
        status: null,
        error: error.message
      };
    }
  }

  /**
   * Get container configuration
   */
  async getConfig() {
    try {
      const result = await this.request('/config');
      return {
        success: true,
        config: result.data,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        config: null,
        error: error.message
      };
    }
  }

  /**
   * Update container configuration
   */
  async updateConfig(config) {
    try {
      const result = await this.request('/config', {
        method: 'POST',
        body: JSON.stringify(config)
      });
      return {
        success: true,
        config: result.data,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        config: null,
        error: error.message
      };
    }
  }

  /**
   * Get processing metrics
   */
  async getMetrics() {
    try {
      const result = await this.request('/metrics');
      return {
        success: true,
        metrics: result.data,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        metrics: null,
        error: error.message
      };
    }
  }

  /**
   * Get system information
   */
  async getSystemInfo() {
    try {
      const result = await this.request('/system');
      return {
        success: true,
        system: result.data,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        system: null,
        error: error.message
      };
    }
  }

  /**
   * Get logs
   */
  async getLogs(level = 'INFO', limit = 100) {
    try {
      const result = await this.request(`/logs?level=${level}&limit=${limit}`);
      return {
        success: true,
        logs: result.data,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        logs: null,
        error: error.message
      };
    }
  }

  /**
   * Retry logic for failed requests
   */
  async retryRequest(requestFn, maxRetries = 3, baseDelay = 1000) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;

        if (attempt === maxRetries) {
          throw error;
        }

        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
        console.warn(`Request failed (attempt ${attempt}/${maxRetries}): ${error.message}. Retrying in ${delay/1000}s...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * Process scene with retry logic
   */
  async processSceneWithRetry(sceneId, options = {}, maxRetries = 3) {
    return this.retryRequest(
      () => this.processScene(sceneId, options),
      maxRetries
    );
  }

  /**
   * Process image with retry logic
   */
  async processImageWithRetry(imageId, options = {}, maxRetries = 3) {
    return this.retryRequest(
      () => this.processImage(imageId, options),
      maxRetries
    );
  }

  /**
   * Process batch with retry logic
   */
  async processBatchWithRetry(items, options = {}, maxRetries = 3) {
    return this.retryRequest(
      () => this.processBatch(items, options),
      maxRetries
    );
  }

  /**
   * Validate container connection
   */
  async validateConnection() {
    const health = await this.healthCheck();
    
    if (!health.healthy) {
      return {
        valid: false,
        error: `Container not reachable: ${health.error}`
      };
    }

    const lmstudio = await this.testLMStudioConnection();
    
    if (!lmstudio.connected) {
      return {
        valid: false,
        error: `LMStudio not connected: ${lmstudio.error}`
      };
    }

    return {
      valid: true,
      health: health.status,
      lmstudio: lmstudio.status
    };
  }

  /**
   * Get container version
   */
  async getVersion() {
    try {
      const result = await this.request('/version');
      return {
        success: true,
        version: result.data,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        version: null,
        error: error.message
      };
    }
  }

  /**
   * Get supported models
   */
  async getSupportedModels() {
    try {
      const result = await this.request('/models');
      return {
        success: true,
        models: result.data,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        models: null,
        error: error.message
      };
    }
  }

  /**
   * Set active model
   */
  async setActiveModel(modelName) {
    try {
      const result = await this.request('/model', {
        method: 'POST',
        body: JSON.stringify({ model: modelName })
      });
      return {
        success: true,
        result: result.data,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        result: null,
        error: error.message
      };
    }
  }

  /**
   * Get current model
   */
  async getCurrentModel() {
    try {
      const result = await this.request('/model');
      return {
        success: true,
        model: result.data,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        model: null,
        error: error.message
      };
    }
  }

  /**
   * Clear cache
   */
  async clearCache() {
    try {
      const result = await this.request('/cache', {
        method: 'DELETE'
      });
      return {
        success: true,
        result: result.data,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        result: null,
        error: error.message
      };
    }
  }

  /**
   * Get cache status
   */
  async getCacheStatus() {
    try {
      const result = await this.request('/cache');
      return {
        success: true,
        cache: result.data,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        cache: null,
        error: error.message
      };
    }
  }

  /**
   * Update container settings
   */
  async updateSettings(settings) {
    try {
      const result = await this.request('/settings', {
        method: 'POST',
        body: JSON.stringify(settings)
      });
      return {
        success: true,
        settings: result.data,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        settings: null,
        error: error.message
      };
    }
  }

  /**
   * Get container settings
   */
  async getSettings() {
    try {
      const result = await this.request('/settings');
      return {
        success: true,
        settings: result.data,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        settings: null,
        error: error.message
      };
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NSFWTaggerClient;
} else if (typeof window !== 'undefined') {
  window.NSFWTaggerClient = NSFWTaggerClient;
}
