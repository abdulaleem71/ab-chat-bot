import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Download,
  RefreshCw,
  Globe,
  Monitor,
  Smartphone,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  Award,
  AlertTriangle,
  Mail,
  Building,
  CheckCircle2,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { VisitorCohort, GeolocationMetric, DeviceMetric, VisitorProfile, IntelligenceOverviewData } from '../repositories/adminIntelligenceRepo';
import { useAdminAuth } from '../context/AdminAuthContext';

export const UserIntelligenceView: React.FC = () => {
  const { adminToken } = useAdminAuth();
  const [data, setData] = useState<IntelligenceOverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [range, setRange] = useState<'24h' | '7d' | '30d' | '90d' | 'all'>('30d');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCohort, setSelectedCohort] = useState<string>('all');
  const [selectedVisitor, setSelectedVisitor] = useState<VisitorProfile | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const getEffectiveToken = () => {
    return adminToken || localStorage.getItem('nomads_admin_token') || localStorage.getItem('nomadschat_admin_token') || '';
  };

  const fetchIntelligenceData = async () => {
    setIsLoading(true);
    try {
      const token = getEffectiveToken();
      const params = new URLSearchParams({
        range,
        ...(selectedCohort !== 'all' ? { cohort: selectedCohort } : {}),
      });

      const res = await fetch(`/api/admin/intelligence?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const json = await res.json();
          if (json.success) {
            setData(json);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch intelligence data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIntelligenceData();
  }, [range, selectedCohort]);

  const handleExport = async (format: 'csv' | 'json') => {
    setIsExporting(true);
    try {
      const token = localStorage.getItem('nomads_admin_token') || 'local-admin-token';
      const params = new URLSearchParams({
        range,
        format,
      });

      const res = await fetch(`/api/admin/intelligence/export?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (format === 'csv') {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `visitor-intelligence-${range}-${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        const json = await res.json();
        const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `visitor-intelligence-${range}-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setIsExporting(false);
    }
  };

  const filteredVisitors = data?.topVisitors.filter((v) => {
    if (selectedCohort !== 'all' && v.cohort !== selectedCohort) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      v.visitorId.toLowerCase().includes(q) ||
      v.visitorLocation.toLowerCase().includes(q) ||
      (v.leadName && v.leadName.toLowerCase().includes(q)) ||
      (v.leadEmail && v.leadEmail.toLowerCase().includes(q)) ||
      (v.leadCompany && v.leadCompany.toLowerCase().includes(q)) ||
      v.primaryChatbotName.toLowerCase().includes(q)
    );
  }) || [];

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-800/50 flex items-center justify-center text-purple-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              User & Visitor Intelligence
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-950 text-purple-400 border border-purple-800 font-mono">
                Cohorts & Insights
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Visitor segmentation, engagement scoring, geographic distribution, and cross-session visitor tracking.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Time Range Selector */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-1 flex items-center text-xs">
            {(['24h', '7d', '30d', '90d', 'all'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setRange(t)}
                className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                  range === t ? 'bg-purple-600 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={() => handleExport('csv')}
            disabled={isExporting}
            className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl border border-zinc-700 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-zinc-400" />
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </button>

          <button
            onClick={fetchIntelligenceData}
            disabled={isLoading}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl border border-zinc-700 transition cursor-pointer"
            title="Refresh Intelligence Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-zinc-900/90 border border-zinc-800/80 p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span>Unique Visitors</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-white">
            {isLoading ? '...' : (data?.summary.totalUniqueVisitors || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Cross-session tracking</div>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800/80 p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span>Repeat Visitor %</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400">
            {isLoading ? '...' : `${data?.summary.repeatVisitorRate || 0}%`}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Returning traffic</div>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800/80 p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span>Avg Session</span>
            <ShieldCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-bold text-white">
            {isLoading ? '...' : `${data?.summary.avgSessionDurationSec || 0}s`}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Time on widget</div>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800/80 p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span>Msgs / Visitor</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-white">
            {isLoading ? '...' : data?.summary.avgMessagesPerVisitor || 0}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Dialogue depth</div>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800/80 p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span>High-Value Accounts</span>
            <Award className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="text-xl font-bold text-yellow-400">
            {isLoading ? '...' : data?.summary.highValueVisitorsCount || 0}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Enterprise intent</div>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800/80 p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span>Attention Needed</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl font-bold text-rose-400">
            {isLoading ? '...' : data?.summary.atRiskVisitorsCount || 0}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Low CSAT or drops</div>
        </div>
      </div>

      {/* Cohorts Matrix */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Visitor Behavioral Cohorts
            </h3>
            <p className="text-xs text-zinc-400">
              Rule-based segmentation classifying visitors based on session depth, lead conversion, and sentiment.
            </p>
          </div>
          {selectedCohort !== 'all' && (
            <button
              onClick={() => setSelectedCohort('all')}
              className="text-xs text-purple-400 hover:text-purple-300 transition cursor-pointer"
            >
              Clear filter ({selectedCohort})
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {data?.cohorts.map((cohort) => {
            const isSelected = selectedCohort === cohort.name;
            return (
              <div
                key={cohort.id}
                onClick={() => setSelectedCohort(isSelected ? 'all' : cohort.name)}
                className={`p-4 rounded-xl border transition cursor-pointer ${
                  isSelected
                    ? 'bg-purple-950/40 border-purple-500 ring-1 ring-purple-500'
                    : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-medium">
                    {cohort.badge}
                  </span>
                  <span className="text-xs font-mono font-bold text-white">
                    {cohort.visitorCount} visitors
                  </span>
                </div>
                <div className="text-sm font-bold text-white mb-1">{cohort.name}</div>
                <p className="text-[11px] text-zinc-400 line-clamp-2 mb-3 min-h-[32px]">
                  {cohort.description}
                </p>

                <div className="space-y-1.5 pt-2 border-t border-zinc-800/80 text-[11px]">
                  <div className="flex justify-between text-zinc-400">
                    <span>Avg Messages:</span>
                    <span className="text-zinc-200 font-medium">{cohort.avgMessages} msgs</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Lead Conversion:</span>
                    <span className="text-emerald-400 font-medium">{cohort.conversionRate}%</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Sentiment Index:</span>
                    <span className="text-purple-400 font-medium">{cohort.sentimentScore}/100</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Geolocation and Device Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Geolocation Distribution */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-400" />
              Geographic Distribution
            </h3>
            <span className="text-xs text-zinc-400 font-mono">Top Traffic Origins</span>
          </div>

          <div className="space-y-3">
            {data?.geoBreakdown.map((geo, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-200 font-medium flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-zinc-800 flex items-center justify-center text-[10px] font-mono text-zinc-400">
                      {geo.countryCode}
                    </span>
                    {geo.country}
                  </span>
                  <div className="flex items-center gap-3 text-zinc-400 font-mono">
                    <span>{geo.visitorCount} visitors</span>
                    <span className="text-purple-400 font-bold">{geo.percentage}%</span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${Math.max(geo.percentage, 4)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Device & Platform Breakdown */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Monitor className="w-4 h-4 text-emerald-400" />
              Browsers & Device Environments
            </h3>
            <span className="text-xs text-zinc-400 font-mono">Client Tech Stack</span>
          </div>

          <div className="space-y-3">
            {data?.deviceBreakdown.map((dev, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-200 font-medium flex items-center gap-2">
                    {dev.category === 'Mobile' ? (
                      <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <Monitor className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    {dev.browser}
                  </span>
                  <div className="flex items-center gap-3 text-zinc-400 font-mono">
                    <span>{dev.count} sessions</span>
                    <span className="text-emerald-400 font-bold">{dev.percentage}%</span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${Math.max(dev.percentage, 4)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Visitor Profiles & Activity Explorer */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-white">Active Visitor Intelligence Directory</h3>
            <p className="text-xs text-zinc-400">
              Inspecting {filteredVisitors.length} tracked visitors with engagement profiles and query logs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search visitor ID, email, company, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 w-64"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950 text-zinc-400 font-semibold border-b border-zinc-800">
              <tr>
                <th className="py-3 px-4">Visitor / Identity</th>
                <th className="py-3 px-4">Cohort</th>
                <th className="py-3 px-4">Engagement Score</th>
                <th className="py-3 px-4">Conversations & Msgs</th>
                <th className="py-3 px-4">Origin / Browser</th>
                <th className="py-3 px-4">Primary Chatbot</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {filteredVisitors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-500">
                    No visitor profiles match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredVisitors.map((v) => (
                  <tr key={v.visitorId} className="hover:bg-zinc-800/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-zinc-200 font-semibold">{v.visitorId}</div>
                      {v.leadCaptured && (
                        <div className="flex items-center gap-1 text-[11px] text-emerald-400 mt-0.5">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{v.leadName || v.leadEmail || 'Lead Captured'}</span>
                          {v.leadCompany && <span className="text-zinc-400">({v.leadCompany})</span>}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        v.cohort === 'Enterprise Buyer'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : v.cohort === 'Qualified Inquirer'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : v.cohort === 'At-Risk / Dissatisfied'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'bg-zinc-800 text-zinc-300'
                      }`}>
                        {v.cohort}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-zinc-950 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              v.engagementScore >= 75
                                ? 'bg-emerald-500'
                                : v.engagementScore >= 50
                                ? 'bg-purple-500'
                                : 'bg-zinc-500'
                            }`}
                            style={{ width: `${v.engagementScore}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-white">{v.engagementScore}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-white">{v.conversationCount} convs</div>
                      <div className="text-[11px] text-zinc-500">{v.messageCount} messages</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-zinc-200">{v.visitorLocation}</div>
                      <div className="text-[11px] text-zinc-500 truncate max-w-[140px]">{v.visitorBrowser}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-zinc-200">{v.primaryChatbotName}</div>
                      <div className="text-[11px] text-zinc-500">{v.primaryTenantName}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedVisitor(v)}
                        className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs transition cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visitor Profile Inspector Modal */}
      {selectedVisitor && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Visitor Intelligence Dossier
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-950 text-purple-400 font-mono">
                    {selectedVisitor.cohort}
                  </span>
                </h3>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">{selectedVisitor.visitorId}</p>
              </div>
              <button
                onClick={() => setSelectedVisitor(null)}
                className="text-zinc-400 hover:text-white text-xs px-2.5 py-1 bg-zinc-800 rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
                <div className="text-zinc-500">Engagement Score</div>
                <div className="text-lg font-bold text-white mt-0.5">{selectedVisitor.engagementScore}/100</div>
              </div>
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
                <div className="text-zinc-500">Total Dialogues</div>
                <div className="text-lg font-bold text-purple-400 mt-0.5">{selectedVisitor.conversationCount}</div>
              </div>
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
                <div className="text-zinc-500">Total Messages</div>
                <div className="text-lg font-bold text-white mt-0.5">{selectedVisitor.messageCount}</div>
              </div>
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
                <div className="text-zinc-500">CSAT Feedback</div>
                <div className="text-lg font-bold text-amber-400 mt-0.5">
                  {selectedVisitor.avgCsatRating ? `${selectedVisitor.avgCsatRating} / 5` : 'N/A'}
                </div>
              </div>
            </div>

            {selectedVisitor.leadCaptured && (
              <div className="bg-emerald-950/30 border border-emerald-800/50 p-4 rounded-xl space-y-2 text-xs">
                <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Associated Contact Record
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-zinc-300">
                  <div>
                    <span className="text-zinc-500 block">Name:</span>
                    <span className="font-semibold">{selectedVisitor.leadName || 'Anonymous'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Email:</span>
                    <span className="font-semibold font-mono">{selectedVisitor.leadEmail || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Organization:</span>
                    <span className="font-semibold">{selectedVisitor.leadCompany || 'N/A'}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/80 space-y-3 text-xs">
              <div className="font-bold text-zinc-200">Recent User Inquiries & Questions</div>
              {selectedVisitor.recentQuestions.length === 0 ? (
                <div className="text-zinc-500">No recent user messages recorded.</div>
              ) : (
                <div className="space-y-2">
                  {selectedVisitor.recentQuestions.map((q, idx) => (
                    <div key={idx} className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-300 font-mono">
                      "{q}"
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedVisitor(null)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
