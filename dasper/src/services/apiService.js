// services/apiService.js - Enhanced API Service
import axios from 'axios';
import ENV from '../../config/env';
import NetworkUtils from '../../config/networkUtils';

class ApiService {
  constructor() {
    this.baseURL = ENV.API_BASE_URL;
    this.timeout = ENV.API_TIMEOUT || 60000; // Increased for area estimation
    this.dynamicURL = null;
    
    // Create axios instance
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    // Add request interceptor
    this.api.interceptors.request.use(
      (config) => {
        if (ENV.DEBUG_MODE) {
          console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        }
        return config;
      },
      (error) => {
        console.error('❌ API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor
    this.api.interceptors.response.use(
      (response) => {
        if (ENV.DEBUG_MODE) {
          console.log(`✅ API Response: ${response.config.url} - ${response.status}`);
        }
        return response;
      },
      (error) => {
        console.error('❌ API Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Initialize with dynamic URL detection
   */
  async initializeWithDynamicURL() {
    try {
      this.dynamicURL = await NetworkUtils.getCachedBackendURL();
      
      // Update axios instance with new URL
      this.api.defaults.baseURL = this.dynamicURL;
      
      console.log(`🌐 API Service initialized with: ${this.dynamicURL}`);
      return true;
    } catch (error) {
      console.error('Failed to initialize with dynamic URL:', error);
      return false;
    }
  }

  /**
   * Check API health status
   */
  async checkHealth() {
    try {
      // Try dynamic URL detection if not already done
      if (!this.dynamicURL) {
        await this.initializeWithDynamicURL();
      }
      
      const response = await this.api.get('/api/health');
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      // If dynamic URL fails, try re-detection
      if (this.dynamicURL) {
        console.log('🔄 Primary URL failed, re-detecting...');
        await this.initializeWithDynamicURL();
        
        try {
          const retryResponse = await this.api.get('/api/health');
          return {
            success: true,
            data: retryResponse.data,
          };
        } catch (retryError) {
          return {
            success: false,
            error: retryError.response?.data?.error || retryError.message,
          };
        }
      }
      
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  /**
   * Get available regions with cost indices
   */
  async getRegions() {
    try {
      const response = await this.api.get('/api/regions');
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        data: { regions: [] } // Return empty array on error
      };
    }
  }

  /**
   * Assess building damage with automatic area estimation
   * @param {Object} assessmentData - Assessment data (NO area field needed)
   */
  async assessDamage(assessmentData) {
    try {
      const formData = new FormData();
      
      // Add image
      if (assessmentData.image) {
        const filename = assessmentData.image.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        formData.append('image', {
          uri: assessmentData.image,
          name: filename,
          type,
        });

        if (ENV.DEBUG_MODE) {
          console.log(`📸 Uploading image for area estimation: ${filename}`);
        }
      }

      // Add building information (NO area field)
      formData.append('building_name', assessmentData.buildingName || '');
      formData.append('building_type', assessmentData.buildingType || 'residential');
      formData.append('pin_location', assessmentData.pinLocation || '');
      // NO building_area field - backend will estimate it
      
      // Add damage types if provided
      if (assessmentData.damageTypes) {
        formData.append('damage_types', assessmentData.damageTypes);
      }

      // Send request with progress tracking
      const response = await this.api.post('/api/assess', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (ENV.DEBUG_MODE) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(`📤 Upload Progress: ${percentCompleted}%`);
          }
        },
      });

      if (ENV.DEBUG_MODE) {
        console.log('✅ Assessment completed with area estimation');
        console.log(`📏 Estimated area: ${response.data.building_info?.estimated_area_sqm} m²`);
        console.log(`💰 Local cost: ${response.data.cost_estimation?.formatted_cost}`);
      }

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        return {
          success: false,
          error: 'Request timeout. Please check your connection and try again.',
        };
      }
      
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        details: error.response?.data,
      };
    }
  }

  /**
   * Submit user feedback
   * @param {Object} feedbackData - User feedback data
   */
  async submitFeedback(feedbackData) {
    try {
      const response = await this.api.post('/api/feedback', {
        assessment_id: feedbackData.assessmentId,
        user_severity_score: feedbackData.userSeverity,
        user_damage_types: feedbackData.userDamageTypes || [],
        user_comments: feedbackData.userComments || '',
        user_estimated_cost: feedbackData.userEstimatedCost,
        user_area_estimate: feedbackData.userAreaEstimate, // New field
        repair_urgency: feedbackData.repairUrgency || 'medium',
        additional_notes: feedbackData.additionalNotes || '',
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  /**
   * Get cost breakdown for an assessment
   * @param {string} assessmentId - Assessment ID
   */
  async getCostBreakdown(assessmentId) {
    try {
      const response = await this.api.get(`/api/cost-breakdown/${assessmentId}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  /**
   * Get assessments list
   * @param {Object} params - Query parameters
   */
  async getAssessments(params = {}) {
    try {
      const response = await this.api.get('/api/assessments', { params });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  /**
   * Get assessment details by ID
   * @param {string} assessmentId - Assessment ID
   */
  async getAssessmentDetail(assessmentId) {
    try {
      const response = await this.api.get(`/api/assessments/${assessmentId}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  /**
   * Get statistics
   */
  async getStats() {
    try {
      const response = await this.api.get('/api/stats');
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }
}

export default new ApiService();