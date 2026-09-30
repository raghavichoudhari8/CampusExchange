export type UserRole = 'student' | 'moderator' | 'admin';
export type ListingCondition = 'brand_new' | 'like_new' | 'good' | 'fair';
export type ListingStatus = 'active' | 'reserved' | 'sold' | 'expired' | 'flagged';
export type ContactType = 'phone' | 'email' | 'whatsapp';
export type ContactRequestStatus = 'pending' | 'approved' | 'declined' | 'revoked';
export type WantedStatus = 'open' | 'fulfilled' | 'cancelled';

export interface UserProfile {
  id: string;
  email: string;
  domain: string;
  is_verified: boolean;
  display_name: string;
  campus_id?: string | null;
  campus_name?: string | null;
  hostel_building?: string | null;
  batch_year?: number | null;
  role: UserRole;
  is_banned: boolean;
  avg_response_time_minutes?: number | null;
  avatar_url?: string | null;
  badges: string[];
}

export interface AuthToken {
  access_token: string;
  token_type: string;
  user_id: string;
  email: string;
  is_verified: boolean;
  role: string;
}

export interface Campus {
  id: string;
  name: string;
  code: string;
  city: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id?: string | null;
  description?: string;
  icon?: string;
  sort_order: number;
}

export interface ListingImage {
  id: string;
  listing_id: string;
  image_url: string;
  sort_order: number;
}

export interface Listing {
  id: string;
  seller_id: string;
  seller_name?: string;
  seller_badges?: string[];
  campus_id: string;
  campus_name?: string;
  category_id: string;
  category_name?: string;
  title: string;
  description: string;
  price: number;
  is_free: boolean;
  condition: ListingCondition;
  location_note: string;
  status: ListingStatus;
  spam_score?: number;
  view_count: number;
  images: string[];
  expires_at: string;
  created_at: string;
  updated_at: string;
  has_pending_request?: boolean;
  approved_contact?: DecryptedContact | null;
}

export interface DecryptedContact {
  contact_type: ContactType;
  contact_value: string;
  preferred_note?: string;
}

export interface ContactRequest {
  id: string;
  listing_id: string;
  listing_title: string;
  buyer_id: string;
  buyer_name: string;
  buyer_email?: string;
  buyer_campus?: string;
  buyer_badges: string[];
  seller_id: string;
  seller_name?: string;
  message?: string;
  status: ContactRequestStatus;
  responded_at?: string | null;
  created_at: string;
  contact_details?: DecryptedContact | null;
}

export interface WantedPost {
  id: string;
  user_id: string;
  user_name: string;
  user_badges: string[];
  campus_id: string;
  campus_name: string;
  category_id: string;
  category_name: string;
  title: string;
  description: string;
  budget_max?: number | null;
  status: WantedStatus;
  created_at: string;
}

export interface DomainCheckResult {
  email: string;
  domain: string;
  is_allowed: boolean;
  college_name?: string | null;
  reason?: string | null;
}

export interface AuditLog {
  id: string;
  actor_id?: string;
  action: string;
  target_type: string;
  target_id?: string;
  details: Record<string, any>;
  ip_address?: string;
  created_at: string;
}
