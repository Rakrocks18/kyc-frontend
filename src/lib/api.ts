export interface BasicInformationRequest {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phoneExtension: string;
  phoneNumber: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  requestId?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: string[];
  };
}

const API_BASE_URL = 'http://localhost:8000/api/v1'; // Depending on backend port, 8000 is used in specs

export const submitBasicInfo = async (
  data: BasicInformationRequest
): Promise<ApiResponse> => {
  // In a real app we would get the bearer token from a global auth state/context
  const token = localStorage.getItem('auth_token');
  
  const response = await fetch(`${API_BASE_URL}/kyc/basic-info`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
        throw new Error('An unexpected server error occurred.');
    }
    throw new Error(errorData?.error?.message || 'Failed to submit basic info');
  }

  return response.json();
};
