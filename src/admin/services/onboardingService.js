// src/admin/services/onboardingService.js
import apiClient from '../../utils/apiClient';

const BASE_PATH = '/admin';

/**
 * Standard error handler — mirrors projectService pattern.
 */
const handleError = (error, defaultMessage) => {
  console.error('[OnboardingService] API Error:', error);
  if (error.response && error.response.data) {
    const data = error.response.data;
    if (data.errors) {
      return {
        message: data.message || defaultMessage,
        errors: data.errors,
        status: error.response.status,
      };
    }
    return {
      message: data.message || defaultMessage,
      status: error.response.status,
    };
  }
  return { message: error.message || defaultMessage };
};

class OnboardingService {
  // ─────────────────────────────────────────────────────────────────────────────
  // ONBOARDING WIZARD STEPS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Get salary packages for a specific employee/user
   * GET api/admin/employees/salary-packages/{userId}
   * The userId here is the employee's user ID (the user being onboarded)
   */
  async getSalaryPackages(userId) {
    try {
      console.log('[OnboardingService] Fetching salary packages for userId:', userId);
      const response = await apiClient.get(`${BASE_PATH}/employees/salary-packages/${userId}`);
      console.log('[OnboardingService] Salary packages response:', response.data);
      return response.data;
    } catch (error) {
      console.error('[OnboardingService] getSalaryPackages error:', error);
      throw error.response?.data || error;
    }
  }

  /**
   * Step 1 – Save employee personal & professional details.
   * POST api/admin/employees/onboard/details
   */
  async saveDetails(payload) {
    try {
      console.log('[Onboarding] POST /employees/onboard/details | Payload:', payload);
      const response = await apiClient.post(`${BASE_PATH}/employees/onboard/details`, payload);
      console.log('[Onboarding] save-details response:', response.data);
      return response.data;
    } catch (error) {
      throw handleError(error, 'Failed to save employee details');
    }
  }

  /**
   * Step 2 – Save salary structure (components + payment cycle).
   * POST api/admin/employees/onboard/salary
   */
  async saveSalary(payload) {
    try {
      console.log('[Onboarding] POST /employees/onboard/salary | Payload:', JSON.stringify(payload, null, 2));
      const response = await apiClient.post(`${BASE_PATH}/employees/onboard/salary`, payload);
      console.log('[Onboarding] save-salary response:', response.data);
      return response.data;
    } catch (error) {
      console.error('[Onboarding] saveSalary error:', error);
      throw handleError(error, 'Failed to save salary structure');
    }
  }

  /**
   * Step 3 – Save bank account details.
   * POST api/admin/employees/onboard/banks
   */
  async saveBanks(payload) {
    try {
      console.log('[Onboarding] POST /employees/onboard/banks | Payload:', payload);
      const response = await apiClient.post(`${BASE_PATH}/employees/onboard/banks`, payload);
      console.log('[Onboarding] save-banks response:', response.data);
      return response.data;
    } catch (error) {
      throw handleError(error, 'Failed to save bank details');
    }
  }

  /**
   * Step 4 – Complete / finalise the onboarding process.
   * POST api/admin/employees/onboard/complete
   */
  async completeOnboarding(payload) {
    try {
      console.log('[Onboarding] POST /employees/onboard/complete | Payload:', payload);
      const response = await apiClient.post(`${BASE_PATH}/employees/onboard/complete`, payload);
      console.log('[Onboarding] complete response:', response.data);
      return response.data;
    } catch (error) {
      throw handleError(error, 'Failed to complete onboarding');
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // BANK DETAILS CRUD
  // ─────────────────────────────────────────────────────────────────────────────

  async updateBankDetail(id, payload) {
    try {
      console.log(`[Onboarding] PUT /bank-details/${id} | Payload:`, payload);
      const response = await apiClient.put(`${BASE_PATH}/bank-details/${id}`, payload);
      console.log(`[Onboarding] updateBankDetail response:`, response.data);
      return response.data;
    } catch (error) {
      throw handleError(error, 'Failed to update bank detail');
    }
  }

  async deleteBankDetail(id) {
    try {
      console.log(`[Onboarding] DELETE /bank-details/${id}`);
      const response = await apiClient.delete(`${BASE_PATH}/bank-details/${id}`);
      console.log(`[Onboarding] deleteBankDetail response:`, response.data);
      return response.data;
    } catch (error) {
      throw handleError(error, 'Failed to delete bank detail');
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SALARY COMPONENTS CRUD
  // ─────────────────────────────────────────────────────────────────────────────

  async updateSalaryComponent(id, payload) {
    try {
      console.log(`[Onboarding] PUT /salary-components/${id} | Payload:`, payload);
      const response = await apiClient.put(`${BASE_PATH}/salary-components/${id}`, payload);
      console.log(`[Onboarding] updateSalaryComponent response:`, response.data);
      return response.data;
    } catch (error) {
      throw handleError(error, 'Failed to update salary component');
    }
  }

  async deleteSalaryComponent(id) {
    try {
      console.log(`[Onboarding] DELETE /salary-components/${id}`);
      const response = await apiClient.delete(`${BASE_PATH}/salary-components/${id}`);
      console.log(`[Onboarding] deleteSalaryComponent response:`, response.data);
      return response.data;
    } catch (error) {
      throw handleError(error, 'Failed to delete salary component');
    }
  }
}

export default new OnboardingService();