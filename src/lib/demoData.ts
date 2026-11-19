import { Tenant, UserProfile } from '../types';

export const EMPTY_TENANT: Tenant = {
  id: '',
  name: '',
  ownerEmail: '',
  plan: 'Free',
  createdAt: '',
  subscriptionStatus: 'trialing',
  trialStartedAt: null,
  trialEndsAt: null,
  hasPaymentMethod: false,
  websiteUrl: '',
  logoUrl: '',
};

export const EMPTY_USER: UserProfile = {
  uid: '',
  id: '',
  email: '',
  displayName: '',
  tenantId: '',
  role: 'Viewer',
  avatarUrl: '',
  createdAt: '',
};

export const INITIAL_TENANT = EMPTY_TENANT;
export const INITIAL_USER = EMPTY_USER;
