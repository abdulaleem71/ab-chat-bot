import { Tenant, UserProfile } from '../types';

export const INITIAL_TENANT: Tenant = {
  id: 'tenant_acme',
  name: 'Acme SaaS Corp',
  ownerEmail: 'support@acme.io',
  plan: 'Pro',
  createdAt: '2026-01-15T08:00:00Z',
  websiteUrl: 'https://acmesaas.io',
  logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
};

export const INITIAL_USER: UserProfile = {
  uid: 'user_sarah',
  email: 'sarah.lin@acme.io',
  displayName: 'Sarah Lin',
  tenantId: 'tenant_acme',
  role: 'owner',
  avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
  createdAt: '2026-01-15T08:00:00Z',
};
