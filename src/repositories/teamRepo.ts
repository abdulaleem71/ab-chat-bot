import { getDb } from '../db/index';
import { newId } from '../lib/ids';
import { TeamMember, TeamInvite } from '../types';
import { Role } from '../config/permissions';

export class TeamRepo {
  static async getTeamMembers(tenantId: string): Promise<TeamMember[]> {
    const db = getDb();
    const res = await db.execute({
      sql: `
        SELECT u.id, u.tenant_id, u.email, u.name, u.role, u.created_at, u.avatar_url, u.last_active_at,
               om.role as member_role
        FROM users u
        LEFT JOIN organization_members om ON u.id = om.user_id AND om.tenant_id = u.tenant_id
        WHERE u.tenant_id = ?
        ORDER BY u.created_at ASC;
      `,
      args: [tenantId],
    });

    return res.rows.map(r => {
      const rawRole = String(r.member_role || r.role || 'agent').toLowerCase();
      let role: Role = 'Agent';
      if (rawRole === 'owner') role = 'Owner';
      else if (rawRole === 'admin') role = 'Admin';
      else if (rawRole === 'viewer') role = 'Viewer';
      else role = 'Agent';

      return {
        id: `tm_${r.id}`,
        tenantId: String(r.tenant_id),
        userId: String(r.id),
        name: String(r.name || 'Teammate'),
        email: String(r.email),
        role,
        avatarUrl: r.avatar_url ? String(r.avatar_url) : undefined,
        createdAt: String(r.created_at),
        lastActiveAt: r.last_active_at ? String(r.last_active_at) : undefined,
      };
    });
  }

  static async getPendingInvites(tenantId: string): Promise<TeamInvite[]> {
    const db = getDb();
    const res = await db.execute({
      sql: `SELECT * FROM team_invitations WHERE tenant_id = ? AND status = 'pending' ORDER BY created_at DESC;`,
      args: [tenantId],
    });

    return res.rows.map(r => {
      const rawRole = String(r.role || 'Agent');
      let role: Role = 'Agent';
      if (rawRole.toLowerCase() === 'owner') role = 'Owner';
      else if (rawRole.toLowerCase() === 'admin') role = 'Admin';
      else if (rawRole.toLowerCase() === 'viewer') role = 'Viewer';
      else role = 'Agent';

      return {
        id: String(r.id),
        tenantId: String(r.tenant_id),
        email: String(r.email),
        role,
        invitedBy: String(r.invited_by || ''),
        invitedByName: r.invited_by_name ? String(r.invited_by_name) : undefined,
        status: 'pending',
        createdAt: String(r.created_at),
        expiresAt: String(r.expires_at),
      };
    });
  }

  static async inviteTeammate(
    tenantId: string,
    email: string,
    role: Role,
    invitedBy: string,
    invitedByName?: string
  ): Promise<TeamInvite> {
    const db = getDb();
    const cleanEmail = email.trim().toLowerCase();
    const id = newId('inv');
    const token = newId('tok');
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();

    // Remove any existing pending invite for same email in this tenant
    await db.execute({
      sql: `DELETE FROM team_invitations WHERE tenant_id = ? AND email = ? AND status = 'pending';`,
      args: [tenantId, cleanEmail],
    });

    await db.execute({
      sql: `
        INSERT INTO team_invitations (id, tenant_id, email, role, token, status, invited_by, invited_by_name, created_at, expires_at)
        VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?);
      `,
      args: [id, tenantId, cleanEmail, role, token, invitedBy, invitedByName || null, now, expiresAt],
    });

    return {
      id,
      tenantId,
      email: cleanEmail,
      role,
      invitedBy,
      invitedByName,
      status: 'pending',
      createdAt: now,
      expiresAt,
    };
  }

  static async cancelInvite(inviteId: string, tenantId: string): Promise<boolean> {
    const db = getDb();
    const res = await db.execute({
      sql: `DELETE FROM team_invitations WHERE id = ? AND tenant_id = ?;`,
      args: [inviteId, tenantId],
    });
    return (res.rowsAffected || 0) > 0;
  }

  static async updateMemberRole(userId: string, tenantId: string, role: 'Admin' | 'Agent' | 'Owner'): Promise<boolean> {
    const db = getDb();
    const lowerRole = role.toLowerCase();
    await db.execute({
      sql: `UPDATE users SET role = ? WHERE id = ? AND tenant_id = ?;`,
      args: [lowerRole, userId, tenantId],
    });
    await db.execute({
      sql: `UPDATE organization_members SET role = ? WHERE user_id = ? AND tenant_id = ?;`,
      args: [lowerRole, userId, tenantId],
    });
    return true;
  }

  static async removeMember(userId: string, tenantId: string): Promise<boolean> {
    const db = getDb();
    // Don't allow removing owner
    const userRes = await db.execute({
      sql: `SELECT role FROM users WHERE id = ? AND tenant_id = ?;`,
      args: [userId, tenantId],
    });
    if (userRes.rows.length === 0) return false;
    if (String(userRes.rows[0].role).toLowerCase() === 'owner') {
      throw new Error('Workspace Owner cannot be removed from the organization.');
    }

    await db.execute({
      sql: `DELETE FROM organization_members WHERE user_id = ? AND tenant_id = ?;`,
      args: [userId, tenantId],
    });
    await db.execute({
      sql: `DELETE FROM users WHERE id = ? AND tenant_id = ?;`,
      args: [userId, tenantId],
    });
    return true;
  }
}
