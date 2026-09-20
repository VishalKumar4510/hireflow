import { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  ClipboardList, Clock, ChevronDown, ChevronUp, Sparkles,
  ShieldCheck, CheckCircle2, Terminal, FileText
} from 'lucide-react';

export default function AuditTrail() {
  const [logs, setLogs] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.getRecentAuditLogs(100).then(data => {
      setLogs(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const actionBadges: Record<string, { label: string; color: string; bg: string }> = {
    analyze_requirements: { label: 'Analyze Job Requirements', color: 'text-violet-400', bg: 'bg-violet-950/60 border-violet-800/40' },
    parse_resume: { label: 'Parse Candidate Resume', color: 'text-blue-400', bg: 'bg-blue-950/60 border-blue-800/40' },
    map_evidence: { label: 'Map Evidence to Requirements', color: 'text-cyan-400', bg: 'bg-cyan-950/60 border-cyan-800/40' },
    generate_summary: { label: 'Generate Candidate Summary', color: 'text-emerald-400', bg: 'bg-emerald-950/60 border-emerald-800/40' },
    generate_questions: { label: 'Generate Interview Questions', color: 'text-amber-400', bg: 'bg-amber-950/60 border-amber-800/40' },
    analyze_interview: { label: 'Analyze Interview Notes', color: 'text-rose-400', bg: 'bg-rose-950/60 border-rose-800/40' },
    generate_evaluation: { label: 'Generate Final Evaluation', color: 'text-emerald-400', bg: 'bg-emerald-950/60 border-emerald-800/40' },
  };

  const filteredLogs = filter === 'all' ? logs : logs.filter(l => l.action === filter);
  const uniqueActions = [...new Set(logs.map(l => l.action as string))];

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-10 w-48 skeleton rounded-lg" />
        <div className="h-12 w-full skeleton rounded-xl" />
        {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-20 skeleton rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/40 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Algorithmic Transparency
          </span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">System Audit Trail</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Cryptographic trace of all AI inputs, prompts, outputs, model versions, and cited document sections.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
        <button
          className={`text-xs px-3 py-1.5 rounded-lg border transition ${
            filter === 'all'
              ? 'bg-blue-600 text-white border-blue-500 font-semibold'
              : 'bg-slate-800/80 text-slate-400 border-slate-700/60 hover:text-white'
          }`}
          onClick={() => setFilter('all')}
        >
          All Activity ({logs.length})
        </button>
        {uniqueActions.map(action => {
          const badge = actionBadges[action] || { label: action.replace(/_/g, ' ') };
          return (
            <button
              key={action}
              className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                filter === action
                  ? 'bg-blue-600 text-white border-blue-500 font-semibold'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700/60 hover:text-white'
              }`}
              onClick={() => setFilter(action)}
            >
              {badge.label} ({logs.filter(l => l.action === action).length})
            </button>
          );
        })}
      </div>

      {/* Timeline List */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="glass-card-static p-12 text-center border border-dashed border-slate-800 rounded-xl space-y-2">
            <ClipboardList className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-slate-300">No audit events recorded for this category</p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isExp = expanded === (log.id as string);
            const badge = actionBadges[log.action as string] || {
              label: (log.action as string).replace(/_/g, ' '),
              color: 'text-slate-300',
              bg: 'bg-slate-800 border-slate-700'
            };

            return (
              <div
                key={log.id as string}
                className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/30 transition cursor-pointer space-y-2.5 shadow-sm"
                onClick={() => setExpanded(isExp ? null : (log.id as string))}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2.5 py-1 rounded-lg border font-semibold ${badge.bg} ${badge.color}`}>
                      {badge.label}
                    </span>
                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      <span>Entity: <strong className="text-slate-200 uppercase">{log.entity_type as string}</strong></span>
                      <span>•</span>
                      <span>Model: <strong className="text-slate-200">{log.ai_model as string || 'Gemini Flash'}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      {new Date(log.created_at as string).toLocaleString()}
                    </span>
                    {isExp ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExp && (
                  <div
                    className="mt-4 pt-4 border-t border-slate-800 space-y-4 text-xs"
                    onClick={e => e.stopPropagation()}
                  >
                    {Boolean(log.ai_prompt_summary) && (
                      <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800">
                        <p className="font-bold text-violet-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" /> AI Intent Summary
                        </p>
                        <p className="text-slate-200 leading-relaxed">{log.ai_prompt_summary as string}</p>
                      </div>
                    )}

                    {Boolean(log.input_data) && Object.keys(log.input_data as object).length > 0 && (
                      <div>
                        <p className="font-bold text-blue-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                          <Terminal className="w-3.5 h-3.5" /> Structured Input Parameters
                        </p>
                        <pre className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto">
                          {JSON.stringify(log.input_data, null, 2)}
                        </pre>
                      </div>
                    )}

                    {Boolean(log.output_data) && Object.keys(log.output_data as object).length > 0 && (
                      <div>
                        <p className="font-bold text-emerald-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Structured Model Output
                        </p>
                        <pre className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-72">
                          {JSON.stringify(log.output_data, null, 2)}
                        </pre>
                      </div>
                    )}

                    {Boolean((log.source_references as unknown[])?.length) && (
                      <div>
                        <p className="font-bold text-amber-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" /> Grounded Source Citations
                        </p>
                        <div className="space-y-1.5">
                          {(log.source_references as Record<string, unknown>[]).map((ref, idx) => (
                            <div key={idx} className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-900/30 text-amber-200">
                              <span className="font-bold">{ref.type as string}</span> — {ref.location as string}
                              {Boolean(ref.snippet) && (
                                <p className="mt-1 italic text-slate-300">"{String(ref.snippet).substring(0, 160)}..."</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
