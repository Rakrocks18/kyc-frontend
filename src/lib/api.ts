export interface BasicInformationRequest {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phoneExtension: string;
  phoneNumber: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  requestId?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: string[];
  };
}

/** Override with `API_BASE_URL` in Bun when running the dev server if needed. */
const API_BASE_URL =
  (typeof process !== 'undefined' && process.env?.API_BASE_URL) ||
  'http://localhost:8080/api';

const DEV_PASSWORD = 'KycLocalDev#1';

export const STORAGE_EMAIL = 'kyc_dev_email';
export const STORAGE_FORM_ID = 'kyc_form_id';
export const STORAGE_APP_ID = 'kyc_application_id';

async function parseApiError(res: Response): Promise<string> {
  const url = res.url;
  
  // Clear stale tokens if the backend rejects them
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem('auth_token');
  }

  try {
    const body = await res.json();
    const msg = body?.error?.message || (Array.isArray(body?.error?.details) ? body.error.details[0] : null);
    
    return msg 
      ? `${msg} (${res.status}) at ${url}`
      : `Request failed (${res.status}) at ${url}`;
  } catch {
    return `Request failed (${res.status}) at ${url}`;
  }
}


/**
 * Check if the user is authenticated (token exists). 
 * Can be run before any API call that requires auth.
 */
export async function ensureAuth(): Promise<void> {
  if (!localStorage.getItem('auth_token')) {
    throw new Error('Not authenticated. Please log in.');
  }
}

export async function login(email: string, password: string): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(await parseApiError(res));
  const json = await res.json();
  localStorage.setItem('auth_token', json.data.token);
  // Store user role if available, or just email
  if (json.data.user) {
    localStorage.setItem('user_role', json.data.user.role);
    localStorage.setItem('user_email', json.data.user.email);
  }
  return json;
}

export async function register(email: string, password: string): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(await parseApiError(res));
  const json = await res.json();
  localStorage.setItem('auth_token', json.data.token);
  if (json.data.user) {
    localStorage.setItem('user_role', json.data.user.role);
    localStorage.setItem('user_email', json.data.user.email);
  }
  return json;
}

export function logout(): void {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_role');
  localStorage.removeItem('user_email');
  localStorage.removeItem(STORAGE_EMAIL);
  localStorage.removeItem(STORAGE_FORM_ID);
  localStorage.removeItem(STORAGE_APP_ID);
}

function mapGender(gender: string): string {
  const map: Record<string, string> = {
    male: 'M',
    female: 'F',
    'non-binary': 'O',
    'prefer-not-to-say': 'O',
  };
  return map[gender] ?? gender;
}

/**
 * Creates a KYC application (once per browser) and saves basic info via PUT /kyc/form/:formId.
 */
export const submitBasicInfo = async (
  data: BasicInformationRequest
): Promise<ApiResponse> => {
  await ensureAuth();
  const token = localStorage.getItem('auth_token');
  if (!token) {
    throw new Error('Not authenticated');
  }

  let formId = localStorage.getItem(STORAGE_FORM_ID);

  if (!formId) {
    const createRes = await fetch(`${API_BASE_URL}/kyc/application`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });

    if (!createRes.ok) {
      throw new Error(await parseApiError(createRes));
    }

    const createJson = (await createRes.json()) as ApiResponse<{
      applicationId: string;
      formId: string;
    }>;

    formId = createJson.data!.formId;
    const applicationId = createJson.data!.applicationId;

    if (!formId) {
      throw new Error('Missing formId from create application response');
    }

    localStorage.setItem(STORAGE_FORM_ID, formId!);
    if (applicationId) {
      localStorage.setItem(STORAGE_APP_ID, applicationId!);
    }
  }

  const body = {
    firstName: data.firstName,
    lastName: data.lastName,
    dateOfBirth: data.dateOfBirth,
    gender: mapGender(data.gender),
    phone: `${data.phoneExtension} ${data.phoneNumber}`.trim(),
  };

  const response = await fetch(`${API_BASE_URL}/kyc/form/${formId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json();
};

/**
 * Uploads a document for a specific KYC form.
 */
export const uploadKYCDocument = async (
  formId: string,
  file: File,
  documentType: string
): Promise<ApiResponse> => {
  await ensureAuth();
  const token = localStorage.getItem('auth_token');
  if (!token) {
    throw new Error('Not authenticated');
  }

  const formData = new FormData();
  formData.append('document', file);
  formData.append('documentType', documentType);

  const response = await fetch(`${API_BASE_URL}/kyc/form/${formId}/document`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json();
};
/**
 * Uploads a biometric selfie for verification.
 */
export async function uploadBiometric(
  formId: string,
  selfie: Blob
): Promise<ApiResponse> {
  await ensureAuth();
  
  const formData = new FormData();
  formData.append('selfie', selfie, 'selfie.jpg');

  const response = await fetch(`${API_BASE_URL}/kyc/form/${formId}/biometric`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await parseApiError(response);
    throw new Error(error);
  }

  return response.json();
}

/**
 * Fetches the user's active/latest KYC application.
 */
export async function getActiveKyc(): Promise<ApiResponse> {
  await ensureAuth();
  
  const response = await fetch(`${API_BASE_URL}/kyc/active`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
    },
  });

  if (!response.ok) {
    const error = await parseApiError(response);
    throw new Error(error);
  }

  return response.json();
}

/**
 * Fetches all KYC applications for the current user.
 */
export async function getMyApplications(): Promise<ApiResponse> {
  await ensureAuth();
  
  const response = await fetch(`${API_BASE_URL}/kyc/my-applications`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
    },
  });

  if (!response.ok) {
    const error = await parseApiError(response);
    throw new Error(error);
  }

  return response.json();
}

/**
 * Submits the KYC application for final verification.
 * This triggers the backend ML pipeline.
 */
export async function submitKyc(applicationId: string, documentIds: string[]): Promise<ApiResponse> {
  await ensureAuth();
  
  const response = await fetch(`${API_BASE_URL}/kyc/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
    },
    body: JSON.stringify({ applicationId, documentIds }),
  });

  if (!response.ok) {
    const error = await parseApiError(response);
    throw new Error(error);
  }

  return response.json();
}

/**
 * [ADMIN] Fetches all KYC applications across the system.
 */
export async function getAllKycApplications(): Promise<ApiResponse> {
  await ensureAuth();
  
  const response = await fetch(`${API_BASE_URL}/kyc/all?limit=100`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
    },
  });

  if (!response.ok) {
    const error = await parseApiError(response);
    throw new Error(error);
  }

  return response.json();
}

export async function getApplicationDetails(applicationId: string): Promise<ApiResponse> {
  await ensureAuth();
  const response = await fetch(`${API_BASE_URL}/kyc/application/${applicationId}`, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
  });
  if (!response.ok) throw new Error(await parseApiError(response));
  return response.json();
}

export async function updateApplicationStatus(applicationId: string, status: string, remarks?: string): Promise<ApiResponse> {
  await ensureAuth();
  const response = await fetch(`${API_BASE_URL}/kyc/application/${applicationId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
    body: JSON.stringify({ status, remarks }),
  });
  if (!response.ok) throw new Error(await parseApiError(response));
  return response.json();
}

/**
 * [ADMIN] Fetches audit logs/decision history for a specific application.
 */
export async function getApplicationAudit(applicationId: string): Promise<ApiResponse> {
  await ensureAuth();
  const response = await fetch(`${API_BASE_URL}/kyc/application/${applicationId}/audit`, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
  });
  if (!response.ok) throw new Error(await parseApiError(response));
  return response.json();
}
