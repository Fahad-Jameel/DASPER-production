import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthService from './AuthService';
import ENV from '../../config/env';

class DashboardService {
  // Get user dashboard statistics
  async getUserStats() {
    try {
      const data = await AuthService.makeAuthenticatedRequest('/dashboard/stats');
      return data;
    } catch (error) {
      console.error('Get user stats error:', error);
      throw error;
    }
  }

  // Get global dashboard statistics
  async getGlobalStats() {
    try {
      const data = await AuthService.makeAuthenticatedRequest('/dashboard/global-stats');
      return data;
    } catch (error) {
      console.error('Get global stats error:', error);
      throw error;
    }
  }

  // Get recent disaster alerts
  async getRecentAlerts() {
    try {
      const data = await AuthService.makeAuthenticatedRequest('/disaster-alerts');
      return data.alerts || [];
    } catch (error) {
      console.error('Get recent alerts error:', error);
      return [];
    }
  }

  // Get user assessments
  async getUserAssessments(page = 1, limit = 10) {
    try {
      const data = await AuthService.makeAuthenticatedRequest(
        `/assessments?page=${page}&limit=${limit}`
      );
      return data;
    } catch (error) {
      console.error('Get user assessments error:', error);
      throw error;
    }
  }

  // Get public assessments
  async getPublicAssessments(page = 1, limit = 10) {
    try {
      const data = await AuthService.makeAuthenticatedRequest(
        `/assessments/public?page=${page}&limit=${limit}`
      );
      return data;
    } catch (error) {
      console.error('Get public assessments error:', error);
      throw error;
    }
  }

  // Submit assessment
  async submitAssessment(formData) {
    try {
      const token = AuthService.token || await AsyncStorage.getItem('userToken');
      
      console.log('=== DASHBOARD SERVICE DEBUG START ===');
      console.log('Attempting to submit assessment to:', ENV.API_BASE_URL);
      console.log('Token available:', !!token);
      console.log('Token preview:', token ? `${token.substring(0, 20)}...` : 'No token');
      
      // Use the same approach as AuthService - try main URL first, then backup
      let response;
      let error1 = null;
      
      // Try main URL first
      try {
        console.log(`Trying main URL: ${ENV.API_BASE_URL}/api/assess`);
                  response = await fetch(`${ENV.API_BASE_URL}/api/assess`, {
            method: 'POST',
            headers: {
              'Authorization': token ? `Bearer ${token}` : '',
              // Don't set Content-Type for FormData - let browser set it with boundary
            },
            body: formData,
          });
        console.log('Main URL response status:', response.status);
      } catch (err) {
        error1 = err;
        console.error('Main URL failed:', err.message);
      }
      
      // If main URL fails, try backup URL
      if (!response && ENV.API_BACKUP_URL) {
        console.log(`Trying backup URL: ${ENV.API_BACKUP_URL}/api/assess`);
        try {
          response = await fetch(`${ENV.API_BACKUP_URL}/api/assess`, {
            method: 'POST',
            headers: {
              'Authorization': token ? `Bearer ${token}` : '',
              // Don't set Content-Type for FormData - let browser set it with boundary
            },
            body: formData,
          });
          console.log('Backup URL response status:', response.status);
        } catch (err) {
          console.error('Backup URL also failed:', err.message);
          // If both URLs fail, throw the first error
          throw error1 || err;
        }
      }
      
      // If main and backup fail, try localhost
      if (!response && ENV.API_LOCALHOST_URL) {
        console.log(`Trying localhost URL: ${ENV.API_LOCALHOST_URL}/api/assess`);
        try {
          response = await fetch(`${ENV.API_LOCALHOST_URL}/api/assess`, {
            method: 'POST',
            headers: {
              'Authorization': token ? `Bearer ${token}` : '',
              // Don't set Content-Type for FormData - let browser set it with boundary
            },
            body: formData,
          });
          console.log('Localhost URL response status:', response.status);
        } catch (err) {
          console.error('Localhost URL also failed:', err.message);
          // If all URLs fail, throw the first error
          throw error1 || err;
        }
      }

      if (!response) {
        throw new Error('No response from server. Check backend service.');
      }

      const data = await response.json().catch(error => {
        console.error('Failed to parse response:', error);
        throw new Error('Received invalid response from server');
      });

      if (!response.ok) {
        throw new Error(data.error || `Assessment failed with status ${response.status}`);
      }
      
      console.log('Assessment submission successful:', data);
      console.log('=== DASHBOARD SERVICE DEBUG END ===');

      return data;
    } catch (error) {
      console.error('=== DASHBOARD SERVICE ERROR DEBUG ===');
      console.error('Submit assessment error:', error);
      console.error('Error type:', typeof error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('=== DASHBOARD SERVICE ERROR DEBUG END ===');
      
      // Provide more specific error messages
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. The server took too long to respond. Please try again.');
      } else if (error.message.includes('Network request failed')) {
        throw new Error('Network connection failed. Please check your internet connection and ensure the backend server is running.');
      } else if (error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check if the backend is running and accessible.');
      } else if (error.message.includes('401')) {
        throw new Error('Authentication failed. Please log in again.');
      } else if (error.message.includes('400')) {
        throw new Error('Invalid request data. Please check your input and try again.');
      } else if (error.message.includes('500')) {
        throw new Error('Server error occurred. Please try again later.');
      } else {
        throw error;
      }
    }
  }

  // Submit feedback
  async submitFeedback(feedbackData) {
    try {
      const data = await AuthService.makeAuthenticatedRequest('/feedback', {
        method: 'POST',
        body: JSON.stringify(feedbackData),
      });
      return data;
    } catch (error) {
      console.error('Submit feedback error:', error);
      throw error;
    }
  }

  // Analyze feedback sentiment
  async analyzeFeedbackSentiment(feedbackText) {
    try {
      const data = await AuthService.makeAuthenticatedRequest('/feedback/sentiment', {
        method: 'POST',
        body: JSON.stringify({ feedback_text: feedbackText }),
      });
      return data;
    } catch (error) {
      console.error('Analyze feedback sentiment error:', error);
      throw error;
    }
  }

  // Generate PDF report
  async generateReport(assessmentId) {
    try {
      const data = await AuthService.makeAuthenticatedRequest('/reports/generate', {
        method: 'POST',
        body: JSON.stringify({ assessment_id: assessmentId }),
      });
      return data;
    } catch (error) {
      console.error('Generate report error:', error);
      throw error;
    }
  }

  // Download report
  async downloadReport(reportId) {
    try {
      const token = AuthService.token || await AsyncStorage.getItem('userToken');
      
      const response = await fetch(`${ENV.API_BASE_URL}/api/reports/download/${reportId}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download report');
      }

      return response.blob();
    } catch (error) {
      console.error('Download report error:', error);
      throw error;
    }
  }

  // Get cost breakdown
  async getCostBreakdown(assessmentId) {
    try {
      const data = await AuthService.makeAuthenticatedRequest(`/cost-breakdown/${assessmentId}`);
      return data;
    } catch (error) {
      console.error('Get cost breakdown error:', error);
      throw error;
    }
  }

  // Export user data
  async exportUserData() {
    try {
      const data = await AuthService.makeAuthenticatedRequest('/export/data');
      return data;
    } catch (error) {
      console.error('Export user data error:', error);
      throw error;
    }
  }

  // Get notifications
  async getNotifications() {
    try {
      const data = await AuthService.makeAuthenticatedRequest('/notifications');
      return data;
    } catch (error) {
      console.error('Get notifications error:', error);
      throw error;
    }
  }

  // Send notification
  async sendNotification(notificationData) {
    try {
      const data = await AuthService.makeAuthenticatedRequest('/notifications/send', {
        method: 'POST',
        body: JSON.stringify(notificationData),
      });
      return data;
    } catch (error) {
      console.error('Send notification error:', error);
      throw error;
    }
  }

  // Get available regions
  async getAvailableRegions() {
    try {
      const data = await AuthService.makeAuthenticatedRequest('/regions');
      return data.regions || [];
    } catch (error) {
      console.error('Get available regions error:', error);
      return [];
    }
  }

  // Health check
  async healthCheck() {
    try {
      const response = await fetch(`${ENV.API_BASE_URL}/api/health`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Health check error:', error);
      throw error;
    }
  }

  // Test backend connectivity
  async testBackendConnectivity() {
    console.log('=== TESTING BACKEND CONNECTIVITY ===');
    
    const urlsToTest = [
      ENV.API_BASE_URL,
      ENV.API_BACKUP_URL,
      ENV.API_LOCALHOST_URL
    ].filter(Boolean);
    
    for (const baseUrl of urlsToTest) {
      try {
        console.log(`Testing connectivity to: ${baseUrl}`);
        const response = await fetch(`${baseUrl}/api/health`, {
          method: 'GET',
        });
        
        if (response.ok) {
          console.log(`✅ ${baseUrl} is accessible`);
          return { success: true, url: baseUrl };
        } else {
          console.log(`❌ ${baseUrl} returned status: ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ ${baseUrl} failed: ${error.message}`);
      }
    }
    
    console.log('❌ No backend URLs are accessible');
    return { success: false, error: 'No backend URLs are accessible' };
  }

  // Test basic network connectivity
  async testNetworkConnectivity() {
    console.log('=== TESTING BASIC NETWORK CONNECTIVITY ===');
    
    try {
      // Test with a simple public API
      const response = await fetch('https://httpbin.org/get', {
        method: 'GET',
      });
      
      if (response.ok) {
        console.log('✅ Basic network connectivity is working');
        return { success: true };
      } else {
        console.log('❌ Basic network test failed with status:', response.status);
        return { success: false, error: 'Network test failed' };
      }
    } catch (error) {
      console.log('❌ Basic network test failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Get assessment detail by ID
  async getAssessmentDetail(assessmentId) {
    try {
      const data = await AuthService.makeAuthenticatedRequest(`/assessments/${assessmentId}`);
      return data;
    } catch (error) {
      console.error('Get assessment detail error:', error);
      throw error;
    }
  }

  // External API Management Methods

  // Manually trigger live alerts fetch from external APIs
  async fetchLiveAlerts() {
    try {
      const data = await AuthService.makeAuthenticatedRequest('/alerts/fetch-live', {
        method: 'POST'
      });
      return data;
    } catch (error) {
      console.error('Fetch live alerts error:', error);
      throw error;
    }
  }

  // Clean up old/inactive alerts
  async cleanupOldAlerts() {
    try {
      const data = await AuthService.makeAuthenticatedRequest('/alerts/cleanup', {
        method: 'POST'
      });
      return data;
    } catch (error) {
      console.error('Cleanup alerts error:', error);
      throw error;
    }
  }

  // Get alerts system status and external API statistics
  async getAlertsStatus() {
    try {
      const data = await AuthService.makeAuthenticatedRequest('/alerts/status');
      return data;
    } catch (error) {
      console.error('Get alerts status error:', error);
      throw error;
    }
  }
}

export default new DashboardService();