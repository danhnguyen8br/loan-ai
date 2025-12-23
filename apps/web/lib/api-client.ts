import type {
  User,
  UserCreate,
  UserLogin,
  Token,
  Application,
  ApplicationCreate,
  ApplicationMetrics,
  LoanProduct,
  ProductCreate,
  ProductUpdate,
  RecommendationResponse,
  Bank,
  BankCreate,
  BankUpdate,
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token && !endpoint.includes('/auth/')) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new APIError(
      errorData.detail || errorData.message || 'An error occurred',
      response.status,
      errorData
    );
  }

  return response.json();
}

// Auth API
export const authAPI = {
  register: (data: UserCreate) =>
    fetchAPI<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: async (data: UserLogin): Promise<Token> => {
    const response = await fetchAPI<Token>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', response.access_token);
    }
    return response;
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  },

  getCurrentUser: () => fetchAPI<User>('/auth/me'),
};

// Products API
export const productsAPI = {
  list: (purpose?: string) => {
    const queryParams = purpose ? `?purpose=${purpose}` : '';
    return fetchAPI<LoanProduct[]>(`/products${queryParams}`);
  },

  getById: (id: string) => fetchAPI<LoanProduct>(`/products/${id}`),
  
  listBanks: () => fetchAPI<Bank[]>('/products/banks'),

  // Admin CRUD operations
  create: (data: ProductCreate) =>
    fetchAPI<LoanProduct>('/products/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: ProductUpdate) =>
    fetchAPI<LoanProduct>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  setStatus: (id: string, isActive: boolean) =>
    fetchAPI<{ message: string; product_id: string; is_active: boolean }>(`/products/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: isActive }),
    }),

  delete: (id: string) =>
    fetchAPI<{ message: string }>(`/products/${id}`, {
      method: 'DELETE',
    }),
};

// Banks API
export const banksAPI = {
  list: () => fetchAPI<Bank[]>('/products/banks'),

  getById: (id: string) => fetchAPI<Bank>(`/products/banks/${id}`),

  create: (data: BankCreate) =>
    fetchAPI<Bank>('/products/banks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: BankUpdate) =>
    fetchAPI<Bank>(`/products/banks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  setStatus: (id: string, isActive: boolean) =>
    fetchAPI<{ message: string; bank_id: string; is_active: boolean; products_deactivated: number }>(
      `/products/banks/${id}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ is_active: isActive }),
      }
    ),

  delete: (id: string) =>
    fetchAPI<{ message: string }>(`/products/banks/${id}`, {
      method: 'DELETE',
    }),
};

// Applications API
export const applicationsAPI = {
  create: (data: ApplicationCreate) =>
    fetchAPI<Application>('/applications/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getById: (id: string) => fetchAPI<Application>(`/applications/${id}`),

  update: (id: string, data: Partial<ApplicationCreate>) =>
    fetchAPI<Application>(`/applications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  computeMetrics: (id: string) =>
    fetchAPI<ApplicationMetrics>(`/applications/${id}/compute`, {
      method: 'POST',
    }),
};

// Recommendations API
export const recommendationsAPI = {
  generate: (applicationId: string) =>
    fetchAPI<RecommendationResponse>(`/recommendations/${applicationId}/recommend`, {
      method: 'POST',
    }),

  getById: (id: string) => fetchAPI<RecommendationResponse>(`/recommendations/${id}`),
};

export { APIError };
