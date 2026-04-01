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
  'http://localhost:8000/api';

const DEV_PASSWORD = 'KycLocalDev#1';

const STORAGE_EMAIL = 'kyc_dev_email';
const STORAGE_FORM_ID = 'kyc_form_id';
const STORAGE_APP_ID = 'kyc_application_id';

async function parseApiError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return (
      body?.error?.message ||
      body?.error?.message?.[0] ||
      `Request failed (${res.status})`
    );
  } catch {
    return `Request failed (${res.status})`;
  }
}

/**
 * Ensures a Bearer token exists: registers a stable local-dev user on first run, then logs in.
 */
export async function ensureAuth(): Promise<void> {
  if (localStorage.getItem('auth_token')) {
    return;
  }

  let email = localStorage.getItem(STORAGE_EMAIL);
  if (!email) {
    email = `kyc-${crypto.randomUUID()}@local.dev`;
    localStorage.setItem(STORAGE_EMAIL, email);
  }

  const registerRes = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: DEV_PASSWORD }),
  });

  if (registerRes.ok) {
    const json = await registerRes.json();
    localStorage.setItem('auth_token', json.data.token);
    return;
  }

  const loginRes = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: DEV_PASSWORD }),
  });

  if (!loginRes.ok) {
    throw new Error(await parseApiError(loginRes));
  }

  const loginJson = await loginRes.json();
  localStorage.setItem('auth_token', loginJson.data.token);
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

    formId = createJson.data?.formId;
    const applicationId = createJson.data?.applicationId;

    if (!formId) {
      throw new Error('Missing formId from create application response');
    }

    localStorage.setItem(STORAGE_FORM_ID, formId);
    if (applicationId) {
      localStorage.setItem(STORAGE_APP_ID, applicationId);
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
