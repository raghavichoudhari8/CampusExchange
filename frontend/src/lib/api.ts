import {
  UserProfile,
  AuthToken,
  Campus,
  Category,
  Listing,
  ContactRequest,
  WantedPost,
  DomainCheckResult,
} from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function getAuthHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('campusswap_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = 'An unexpected error occurred';
    try {
      const err = await response.json();
      errorDetail = err.detail || err.message || errorDetail;
    } catch (_) {
      errorDetail = await response.text();
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  // Auth & Verification
  async checkDomain(email: string): Promise<DomainCheckResult> {
    return request<DomainCheckResult>('/api/v1/auth/check-domain', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async loginDemo(userIdOrEmail: string): Promise<AuthToken> {
    const res = await request<AuthToken>('/api/v1/auth/login-demo', {
      method: 'POST',
      body: JSON.stringify({ user_id_or_email: userIdOrEmail }),
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem('campusswap_token', res.access_token);
    }
    return res;
  },

  async getMe(): Promise<UserProfile> {
    return request<UserProfile>('/api/v1/auth/me');
  },

  async updateOnboarding(data: {
    display_name: string;
    campus_id: string;
    hostel_building?: string;
    batch_year: number;
  }): Promise<UserProfile> {
    return request<UserProfile>('/api/v1/auth/onboarding', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getCampuses(): Promise<Campus[]> {
    return request<Campus[]>('/api/v1/auth/campuses');
  },

  async getAllowedDomains(): Promise<any[]> {
    return request<any[]>('/api/v1/auth/allowed-domains');
  },

  // Listings
  async getCategories(): Promise<Category[]> {
    return request<Category[]>('/api/v1/listings/categories');
  },

  async getListings(params: Record<string, any> = {}): Promise<Listing[]> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, String(value));
      }
    });
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<Listing[]>(`/api/v1/listings${qs}`);
  },

  async getListing(id: string): Promise<Listing> {
    return request<Listing>(`/api/v1/listings/${id}`);
  },

  async createListing(data: any): Promise<Listing> {
    return request<Listing>('/api/v1/listings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateListingStatus(id: string, status: string): Promise<Listing> {
    return request<Listing>(`/api/v1/listings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async renewListing(id: string): Promise<Listing> {
    return request<Listing>(`/api/v1/listings/${id}/renew`, {
      method: 'POST',
    });
  },

  // Contact Requests & Privacy
  async requestContact(listingId: string, message?: string): Promise<ContactRequest> {
    return request<ContactRequest>('/api/v1/contacts/request', {
      method: 'POST',
      body: JSON.stringify({ listing_id: listingId, message }),
    });
  },

  async getMyRequests(): Promise<ContactRequest[]> {
    return request<ContactRequest[]>('/api/v1/contacts/my-requests');
  },

  async getSellerRequests(): Promise<ContactRequest[]> {
    return request<ContactRequest[]>('/api/v1/contacts/seller-requests');
  },

  async respondToContactRequest(requestId: string, action: 'approve' | 'decline' | 'revoke'): Promise<ContactRequest> {
    return request<ContactRequest>(`/api/v1/contacts/request/${requestId}/respond`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
  },

  // Wanted Board
  async getWantedPosts(params: Record<string, any> = {}): Promise<WantedPost[]> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.append(k, String(v));
    });
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<WantedPost[]>(`/api/v1/wanted${qs}`);
  },

  async createWantedPost(data: any): Promise<WantedPost> {
    return request<WantedPost>('/api/v1/wanted', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // ML suggestions
  async predictCategory(title: string, description: string): Promise<{ category_id: string; category_name: string; confidence: number }> {
    return request('/api/v1/ml/categorize', {
      method: 'POST',
      body: JSON.stringify({ title, description }),
    });
  },

  // Admin
  async getAdminStats(): Promise<any> {
    return request<any>('/api/v1/admin/stats');
  },

  async getFlaggedListings(): Promise<Listing[]> {
    return request<Listing[]>('/api/v1/admin/flagged-listings');
  },

  async moderateListing(id: string, action: 'approve' | 'delete'): Promise<any> {
    return request(`/api/v1/admin/listings/${id}/moderate`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
  },

  async toggleUserBan(userId: string, isBanned: boolean): Promise<any> {
    return request(`/api/v1/admin/users/${userId}/ban`, {
      method: 'POST',
      body: JSON.stringify({ is_banned: isBanned }),
    });
  },

  async getAuditLogs(): Promise<any[]> {
    return request<any[]>('/api/v1/admin/audit-logs');
  },
};
