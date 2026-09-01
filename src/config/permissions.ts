export type Role = 'Owner' | 'Admin' | 'Agent' | 'Viewer' | 'SuperAdmin';

export type Action =
  | 'manage_billing'
  | 'manage_team'
  | 'edit_chatbot'
  | 'delete_chatbot'
  | 'manage_knowledge_base'
  | 'view_inbox'
  | 'take_over_conversation'
  | 'issue_discount_code'
  | 'manage_integrations'
  | 'manage_settings';

export const PERMISSION_MATRIX: Record<Role, Action[]> = {
  Owner: [
    'manage_billing',
    'manage_team',
    'edit_chatbot',
    'delete_chatbot',
    'manage_knowledge_base',
    'view_inbox',
    'take_over_conversation',
    'issue_discount_code',
    'manage_integrations',
    'manage_settings',
  ],
  Admin: [
    'manage_billing',
    'manage_team',
    'edit_chatbot',
    'delete_chatbot',
    'manage_knowledge_base',
    'view_inbox',
    'take_over_conversation',
    'issue_discount_code',
    'manage_integrations',
    'manage_settings',
  ],
  Agent: [
    'edit_chatbot',
    'manage_knowledge_base',
    'view_inbox',
    'take_over_conversation',
    'manage_integrations',
  ],
  Viewer: [
    'view_inbox',
  ],
  SuperAdmin: [
    'manage_billing',
    'manage_team',
    'edit_chatbot',
    'delete_chatbot',
    'manage_knowledge_base',
    'view_inbox',
    'take_over_conversation',
    'issue_discount_code',
    'manage_integrations',
    'manage_settings',
  ],
};

export function hasPermission(role: string, action: Action): boolean {
  if (!role) return false;
  // Normalize role casing (e.g., 'owner' -> 'Owner', 'ADMIN' -> 'Admin')
  const normalized = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  const allowed = PERMISSION_MATRIX[normalized as Role];
  if (!allowed) return false;
  return allowed.includes(action);
}
