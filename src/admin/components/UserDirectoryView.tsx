import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { AdminUserListItem } from '../repositories/adminUserRepo';
import { useAdminAuth } from '../context/AdminAuthContext';
import { UserDetailModal } from './UserDetailModal';
import {
  Users,
  Search,
  Filter,
  Shield,
  Bot,
  MessageSquare,
  Sparkles,
  Layers,
  ChevronRight,
  RefreshCw,
  Eye,
  Calendar,
  Key,
} from 'lucide-react';
import { MotionButton } from '../../components/common/MotionButton';

export const UserDirectoryView: React.FC = () => {
  const { adminToken } = useAdminAuth();
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [planFilter, setPlanFilter] = useState<string>('ALL');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!adminToken) return;
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (roleFilter !== 'ALL') params.set('role', roleFilter);
      if (planFilter !== 'ALL') params.set('plan', planFilter);

      const res = await fetch(`/api/admin/users?${params.toString()}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const json = await res.json();
      if (json.success) {
        setUsers(json.users || []);
        setTotal(json.total || 0);
      }
    } catch (err) {
      console.error('[Admin] Error querying users list:', err);
    } finally {
      setIsLoading(false);
    }
  }, [adminToken, searchQuery, roleFilter, planFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-zinc-200/90 rounded-2xl md:rounded-3xl p-6 shadow-2xs"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-extrabold text-zinc-950 flex items-center gap-2 font-heading">
              <Users className="w-5 h-5 text-zinc-950" />
              <span>User Directory & Deep Inspection</span>
            </h2>
            <p className="text-xs text-zinc-500 mt-1 font-body">
              Live directory of all registered accounts, workspace associations, chatbot instances, and privilege tiers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <MotionButton
              variant="secondary"
              size="sm"
              onClick={fetchUsers}
              disabled={isLoading}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-zinc-500' : ''}`} />}
            >
              Refresh
            </MotionButton>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="mt-6 pt-5 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search user name, email, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-hidden focus:border-zinc-900 focus:bg-white font-mono transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1.5 text-xs text-zinc-800 focus:outline-hidden focus:border-zinc-900 font-mono cursor-pointer"
            >
              <option value="ALL">All Roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="member">Member</option>
            </select>

            {/* Plan Filter */}
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1.5 text-xs text-zinc-800 focus:outline-hidden focus:border-zinc-900 font-mono cursor-pointer"
            >
              <option value="ALL">All Tiers</option>
              <option value="Enterprise">Enterprise</option>
              <option value="Pro">Pro</option>
              <option value="Standard">Standard</option>
            </select>

            <span className="text-[11px] font-mono text-zinc-500 whitespace-nowrap pl-2">
              {total} total users
            </span>
          </div>
        </div>
      </motion.div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="bg-white border border-zinc-200/90 rounded-2xl md:rounded-3xl overflow-hidden shadow-2xs"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/80 text-zinc-500 font-mono uppercase text-[10px] border-b border-zinc-200">
              <tr>
                <th className="p-4">User Account</th>
                <th className="p-4">Role</th>
                <th className="p-4">Workspace & Tier</th>
                <th className="p-4 text-center">Chatbots</th>
                <th className="p-4 text-center">Conversations</th>
                <th className="p-4 text-center">Leads</th>
                <th className="p-4">Joined Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {isLoading && users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-zinc-500 font-mono">
                    <div className="w-6 h-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading accounts from database...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-zinc-500 font-mono">
                    No users matching current filters.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-zinc-50/80 transition cursor-pointer group"
                    onClick={() => setSelectedUserId(u.id)}
                  >
                    {/* User Identity */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center font-bold text-xs text-white uppercase shrink-0">
                          {u.name ? u.name.charAt(0) : u.email.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-zinc-950 group-hover:text-black transition font-heading">
                            {u.name}
                          </div>
                          <div className="text-[11px] font-mono text-zinc-500">{u.email}</div>
                          <div className="text-[9px] font-mono text-zinc-400">ID: {u.id}</div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="p-4">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold uppercase ${
                          u.role === 'admin'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : u.role === 'member'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-zinc-100 text-zinc-800 border border-zinc-200'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>

                    {/* Tenant & Tier */}
                    <td className="p-4">
                      <div className="font-semibold text-zinc-900 font-heading">{u.tenantName}</div>
                      <span
                        className={`text-[10px] font-mono font-bold mt-0.5 inline-block px-1.5 py-0.2 rounded-md ${
                          u.tenantPlan === 'Enterprise'
                            ? 'text-purple-700 bg-purple-50 border border-purple-200'
                            : u.tenantPlan === 'Pro'
                            ? 'text-zinc-900 bg-zinc-100 border border-zinc-300'
                            : 'text-zinc-600 bg-zinc-100'
                        }`}
                      >
                        {u.tenantPlan}
                      </span>
                    </td>

                    {/* Chatbots Count */}
                    <td className="p-4 text-center">
                      <span className="font-mono font-bold text-zinc-950 text-xs bg-zinc-100 border border-zinc-200 px-2 py-1 rounded-lg">
                        {u.chatbotsCount}
                      </span>
                    </td>

                    {/* Conversations */}
                    <td className="p-4 text-center">
                      <span className="font-mono font-medium text-zinc-700 text-xs">
                        {u.conversationsCount}
                      </span>
                    </td>

                    {/* Leads */}
                    <td className="p-4 text-center">
                      <span className="font-mono font-bold text-emerald-600 text-xs">
                        {u.leadsCount}
                      </span>
                    </td>

                    {/* Joined Date */}
                    <td className="p-4 font-mono text-[11px] text-zinc-500 whitespace-nowrap">
                      {new Date(u.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Action button */}
                    <td className="p-4 text-right">
                      <MotionButton
                        variant="secondary"
                        size="xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedUserId(u.id);
                        }}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                      >
                        Inspect
                      </MotionButton>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Deep User Inspection Modal */}
      {selectedUserId && (
        <UserDetailModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onUserUpdated={fetchUsers}
        />
      )}
    </div>
  );
};
