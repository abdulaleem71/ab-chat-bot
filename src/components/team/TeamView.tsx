import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  UserPlus,
  Shield,
  UserCheck,
  Mail,
  MoreVertical,
  Trash2,
  Edit2,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Lock,
  ArrowUpRight,
  Sparkles,
  Info
} from 'lucide-react';
import { TeamMember, TeamInvite, TeamRole } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface TeamViewProps {
  onNavigateToBilling?: () => void;
  onNavigateToInbox?: () => void;
}

export const TeamView: React.FC<TeamViewProps> = ({
  onNavigateToBilling,
  onNavigateToInbox,
}) => {
  const { user, token } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<TeamRole>('Agent');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals state
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);
  const [inviteToCancel, setInviteToCancel] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<TeamRole>('Agent');

  const currentUserRole = (user?.role || 'Admin').toLowerCase();
  const isAdminOrOwner = currentUserRole === 'admin' || currentUserRole === 'owner';

  const getAuthHeaders = () => {
    const currentToken = localStorage.getItem('auth_token') || token;
    return {
      'Content-Type': 'application/json',
      ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
    };
  };

  const fetchTeamData = async () => {
    setLoading(true);
    try {
      const [membersRes, invitesRes] = await Promise.all([
        fetch('/api/team/members', { headers: getAuthHeaders() }),
        fetch('/api/team/invites', { headers: getAuthHeaders() }),
      ]);

      const [membersData, invitesData] = await Promise.all([
        membersRes.json(),
        invitesRes.json(),
      ]);

      if (membersData.success && Array.isArray(membersData.members)) {
        setMembers(membersData.members);
      }
      if (invitesData.success && Array.isArray(invitesData.invites)) {
        setInvites(invitesData.invites);
      }
    } catch (err) {
      console.error('Error fetching team data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamData();
  }, [token]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      setFeedback({ type: 'error', message: 'Please enter a valid email address.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/team/invites', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: data.message || 'Invitation sent!' });
        setInviteEmail('');
        setIsInviteModalOpen(false);
        await fetchTeamData();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to send invite.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Network error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmCancelInvite = async () => {
    if (!inviteToCancel) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/team/invites/${inviteToCancel}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setInviteToCancel(null);
        await fetchTeamData();
        setFeedback({ type: 'success', message: 'Invitation revoked successfully.' });
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to cancel invitation.' });
      }
    } catch (err) {
      console.error('Error canceling invite:', err);
      setFeedback({ type: 'error', message: 'Error canceling invite.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!editingMember) return;
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/team/members/${editingMember.id}/role`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingMember(null);
        await fetchTeamData();
        setFeedback({ type: 'success', message: 'Role updated successfully.' });
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to update role.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'Error updating role: ' + err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmRemoveMember = async () => {
    if (!memberToDelete) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/team/members/${memberToDelete.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setMemberToDelete(null);
        await fetchTeamData();
        setFeedback({ type: 'success', message: 'Team member removed from workspace.' });
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to remove member.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'Error removing member: ' + err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white border border-zinc-200/90 rounded-3xl p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-zinc-950 text-white flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-extrabold text-zinc-950 font-heading">Team & Role Management</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">
              {members.length} {members.length === 1 ? 'Member' : 'Members'}
            </span>
          </div>
          <p className="text-xs text-zinc-500 font-medium">
            Manage teammates, configure Admin vs Agent clearance, and assign live customer conversations.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-stretch md:self-auto">
          <button
            onClick={fetchTeamData}
            className="p-2 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 rounded-xl transition border border-zinc-200 cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {isAdminOrOwner ? (
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="flex-1 md:flex-none px-4 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-extrabold rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Invite Teammate</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 bg-zinc-50 border border-zinc-200 px-3 py-2 rounded-xl">
              <Lock className="w-3.5 h-3.5 text-zinc-400" />
              <span>Admin clearance required to invite</span>
            </div>
          )}
        </div>
      </div>

      {/* Role Permission Matrix Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-zinc-50 border border-zinc-200/90 rounded-2xl p-4.5">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-zinc-950" />
            <h3 className="text-xs font-extrabold text-zinc-950 font-heading">Admin Clearance</h3>
            <span className="text-[10px] font-bold uppercase bg-zinc-950 text-white px-2 py-0.5 rounded-md">
              Full Control
            </span>
          </div>
          <p className="text-[11px] text-zinc-600 leading-relaxed mb-3">
            Full workspace administration access. Can manage billing & subscriptions, invite and remove teammates, configure integrations, and delete bots.
          </p>
          <div className="flex flex-wrap gap-1.5 text-[10px] font-semibold text-zinc-700">
            <span className="bg-white px-2 py-0.5 rounded-md border border-zinc-200">Billing & BYOK</span>
            <span className="bg-white px-2 py-0.5 rounded-md border border-zinc-200">Team Invites</span>
            <span className="bg-white px-2 py-0.5 rounded-md border border-zinc-200">Integration Config</span>
            <span className="bg-white px-2 py-0.5 rounded-md border border-zinc-200">Bot Creation</span>
          </div>
        </div>

        <div className="bg-zinc-50 border border-zinc-200/90 rounded-2xl p-4.5">
          <div className="flex items-center gap-2 mb-2">
            <UserCheck className="w-4 h-4 text-zinc-700" />
            <h3 className="text-xs font-extrabold text-zinc-950 font-heading">Agent Clearance</h3>
            <span className="text-[10px] font-bold uppercase bg-zinc-200 text-zinc-800 px-2 py-0.5 rounded-md">
              Support Specialist
            </span>
          </div>
          <p className="text-[11px] text-zinc-600 leading-relaxed mb-3">
            Dedicated customer support role. Can answer live chats, execute human takeovers, assign conversations to teammates, and view knowledge bases.
          </p>
          <div className="flex flex-wrap gap-1.5 text-[10px] font-semibold text-zinc-700">
            <span className="bg-white px-2 py-0.5 rounded-md border border-zinc-200">Inbox & Live Chat</span>
            <span className="bg-white px-2 py-0.5 rounded-md border border-zinc-200">Human Takeover</span>
            <span className="bg-white px-2 py-0.5 rounded-md border border-zinc-200">Conversation Assignment</span>
            <span className="bg-white px-2 py-0.5 rounded-md border border-zinc-200">View RAG Documents</span>
          </div>
        </div>
      </div>

      {/* Team Members Table */}
      <div className="bg-white border border-zinc-200/90 rounded-3xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-zinc-950 font-heading">Active Workspace Members</h2>
          <span className="text-xs text-zinc-500 font-medium">{members.length} active</span>
        </div>

        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 bg-zinc-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {members.map(member => {
              const isCurrentUser = member.email === user?.email;
              return (
                <div
                  key={member.id}
                  className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-zinc-50/70 transition"
                >
                  {/* Left: Avatar + Info */}
                  <div className="flex items-center gap-3.5">
                    {member.avatarUrl ? (
                      <img
                        src={member.avatarUrl}
                        alt={member.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full border border-zinc-200 object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-zinc-900 text-white font-extrabold text-xs flex items-center justify-center font-heading">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-950 font-heading">{member.name}</span>
                        {isCurrentUser && (
                          <span className="text-[10px] font-semibold text-zinc-500 bg-zinc-100 border border-zinc-200 px-1.5 py-0.2 rounded">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 font-medium">{member.email}</p>
                    </div>
                  </div>

                  {/* Right: Role Badge + Joined Date + Actions */}
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        member.role === 'Admin'
                          ? 'bg-zinc-950 text-white border-zinc-950'
                          : 'bg-zinc-100 text-zinc-800 border-zinc-200'
                      }`}
                    >
                      {member.role}
                    </span>

                    <span className="hidden sm:inline text-xs text-zinc-400 font-medium">
                      Joined {new Date(member.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>

                    {isAdminOrOwner && !isCurrentUser && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingMember(member);
                            setNewRole(member.role);
                          }}
                          title="Change Role"
                          className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setMemberToDelete(member)}
                          title="Remove Member"
                          className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pending Invitations Section */}
      <div className="bg-white border border-zinc-200/90 rounded-3xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-zinc-500" />
            <h2 className="text-sm font-extrabold text-zinc-950 font-heading">Pending Invitations</h2>
          </div>
          <span className="text-xs text-zinc-500 font-medium">{invites.length} pending</span>
        </div>

        {invites.length === 0 ? (
          <div className="p-8 text-center">
            <Mail className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-zinc-600 mb-0.5">No pending invitations</p>
            <p className="text-xs text-zinc-400">Invite new team members using the button above.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {invites.map(invite => (
              <div
                key={invite.id}
                className="px-6 py-3.5 flex items-center justify-between gap-4 hover:bg-zinc-50/70 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-600 flex items-center justify-center font-bold text-xs">
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-zinc-900">{invite.email}</span>
                    <p className="text-[11px] text-zinc-400">
                      Invited as {invite.role} by {invite.invitedByName || 'Admin'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                    Pending
                  </span>

                  {isAdminOrOwner && (
                    <button
                      onClick={() => setInviteToCancel(invite.id)}
                      className="text-xs font-bold text-zinc-500 hover:text-red-600 hover:bg-red-50 px-2.5 py-1 rounded-lg transition cursor-pointer"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite Teammate Modal */}
      <AnimatePresence>
        {isInviteModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-200"
            >
              <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-zinc-950 text-white flex items-center justify-center">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-zinc-950 font-heading">Invite Teammate</h2>
                    <p className="text-xs text-zinc-500">Send an invitation to join your workspace</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsInviteModalOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSendInvite} className="pt-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1 font-heading">
                    Teammate Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="teammate@company.com"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-zinc-300 rounded-xl text-xs text-zinc-900 placeholder-zinc-400 focus:outline-hidden focus:border-zinc-950 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1 font-heading">
                    Workspace Role
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setInviteRole('Agent')}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        inviteRole === 'Agent'
                          ? 'border-zinc-950 bg-zinc-50 ring-1 ring-zinc-950'
                          : 'border-zinc-200 bg-white hover:bg-zinc-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-zinc-950">Agent</span>
                        {inviteRole === 'Agent' && <CheckCircle2 className="w-3.5 h-3.5 text-zinc-950" />}
                      </div>
                      <p className="text-[10px] text-zinc-500 leading-tight">Live chat and customer support access.</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setInviteRole('Admin')}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        inviteRole === 'Admin'
                          ? 'border-zinc-950 bg-zinc-50 ring-1 ring-zinc-950'
                          : 'border-zinc-200 bg-white hover:bg-zinc-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-zinc-950">Admin</span>
                        {inviteRole === 'Admin' && <CheckCircle2 className="w-3.5 h-3.5 text-zinc-950" />}
                      </div>
                      <p className="text-[10px] text-zinc-500 leading-tight">Full access to billing, team & bots.</p>
                    </button>
                  </div>
                </div>

                {feedback && (
                  <div className={`p-3 rounded-xl text-xs font-medium border ${
                    feedback.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}>
                    {feedback.message}
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsInviteModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-100 rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 text-xs font-extrabold text-white bg-zinc-950 hover:bg-zinc-800 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <span>Send Invitation</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Role Modal */}
      <AnimatePresence>
        {editingMember && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-zinc-200"
            >
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <h3 className="text-sm font-extrabold text-zinc-950 font-heading">Edit Member Role</h3>
                <button
                  onClick={() => setEditingMember(null)}
                  className="p-1 text-zinc-400 hover:text-zinc-700 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-4 space-y-3">
                <p className="text-xs text-zinc-600">
                  Select new role permissions for <strong className="text-zinc-950">{editingMember.name}</strong>:
                </p>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setNewRole('Agent')}
                    className={`w-full p-3 rounded-xl border text-left transition cursor-pointer ${
                      newRole === 'Agent'
                        ? 'border-zinc-950 bg-zinc-50 ring-1 ring-zinc-950'
                        : 'border-zinc-200 bg-white hover:bg-zinc-50'
                    }`}
                  >
                    <span className="text-xs font-bold text-zinc-950 block">Agent</span>
                    <span className="text-[11px] text-zinc-500">Live chat, inbox takeover, and customer conversation assignment.</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewRole('Admin')}
                    className={`w-full p-3 rounded-xl border text-left transition cursor-pointer ${
                      newRole === 'Admin'
                        ? 'border-zinc-950 bg-zinc-50 ring-1 ring-zinc-950'
                        : 'border-zinc-200 bg-white hover:bg-zinc-50'
                    }`}
                  >
                    <span className="text-xs font-bold text-zinc-950 block">Admin</span>
                    <span className="text-[11px] text-zinc-500">Full workspace access including billing and team management.</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-3.5 py-1.5 text-xs font-bold text-zinc-600 hover:bg-zinc-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdateRole}
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-xs font-extrabold text-white bg-zinc-950 hover:bg-zinc-800 rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  Save Role
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Teammate Confirmation Modal */}
      <AnimatePresence>
        {memberToDelete && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-zinc-200"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-zinc-950 font-heading">Remove Teammate?</h3>
                  <p className="text-xs text-zinc-500 font-medium">Revoke access immediately</p>
                </div>
              </div>

              <p className="text-xs text-zinc-600 leading-relaxed mb-5">
                Are you sure you want to remove <strong className="text-zinc-950 font-bold">{memberToDelete.name}</strong> ({memberToDelete.email}) from this workspace? They will lose access to all chatbots and live chats.
              </p>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setMemberToDelete(null)}
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 text-xs font-bold text-zinc-600 hover:bg-zinc-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRemoveMember}
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-xs font-extrabold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Removing...</span>
                    </>
                  ) : (
                    <span>Remove Member</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Revoke Invite Confirmation Modal */}
      <AnimatePresence>
        {inviteToCancel && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-zinc-200"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-zinc-950 font-heading">Revoke Invitation?</h3>
                  <p className="text-xs text-zinc-500 font-medium">Cancel pending invite</p>
                </div>
              </div>

              <p className="text-xs text-zinc-600 leading-relaxed mb-5">
                The invitation link will become invalid immediately and the recipient will not be able to join using it.
              </p>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setInviteToCancel(null)}
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 text-xs font-bold text-zinc-600 hover:bg-zinc-100 rounded-xl cursor-pointer"
                >
                  Keep Invite
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancelInvite}
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-xs font-extrabold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Revoking...</span>
                    </>
                  ) : (
                    <span>Revoke Invite</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
