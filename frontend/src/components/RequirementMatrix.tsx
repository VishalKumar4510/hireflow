import { useState } from 'react';
import {
  CheckCircle, AlertCircle, XCircle, HelpCircle,
  Filter, Info
} from 'lucide-react';
import type { EvidenceData } from './EvidenceDrawer';

interface RequirementMatrixProps {
  requirements: Record<string, unknown>[];
  candidates: Record<string, unknown>[];
  onSelectEvidence: (evidence: EvidenceData) => void;
}

export default function RequirementMatrix({
  requirements,
  candidates,
  onSelectEvidence
}: RequirementMatrixProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', ...new Set(requirements.map(r => r.category as string).filter(Boolean))];

  const filteredRequirements = requirements.filter(r => {
    if (selectedCategory === 'all') return true;
    return r.category === selectedCategory;
  });

  const getEvidenceForCell = (requirementId: string, candidate: Record<string, unknown>) => {
    const mappings = (candidate.evidence_mappings as Record<string, unknown>[]) || [];
    return mappings.find(m => m.requirement_id === requirementId);
  };

  const renderStatusBadge = (evidence: Record<string, unknown> | undefined, requirement: Record<string, unknown>, candidate: Record<string, unknown>) => {
    const status = (evidence?.status as string) || 'NOT_FOUND';
    const confidence = evidence?.confidence as number | undefined;

    const handleClick = () => {
      onSelectEvidence({
        requirement_id: requirement.id as string,
        requirement_text: requirement.text as string,
        requirement_category: requirement.category as string,
        requirement_priority: requirement.priority as string,
        candidate_id: candidate.id as string,
        candidate_name: candidate.name as string,
        file_name: candidate.file_name as string,
        source_location: evidence?.source_location as string,
        evidence_text: evidence?.evidence_text as string,
        status,
        confidence,
        validation_question: evidence?.validation_question as string,
        ai_reasoning: evidence?.ai_reasoning as string,
      });
    };

    switch (status) {
      case 'SUPPORTED':
        return (
          <button
            onClick={handleClick}
            className="w-full group px-2 py-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/40 text-emerald-300 text-xs font-medium flex items-center justify-between transition"
            title="Click to view verified evidence"
          >
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span>Supported</span>
            </span>
            {confidence !== undefined && (
              <span className="text-[10px] text-emerald-400/80 font-mono">{(confidence * 100).toFixed(0)}%</span>
            )}
          </button>
        );
      case 'PARTIAL':
        return (
          <button
            onClick={handleClick}
            className="w-full group px-2 py-1.5 rounded-lg bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/40 text-amber-300 text-xs font-medium flex items-center justify-between transition"
            title="Click to inspect partial evidence & validation question"
          >
            <span className="flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span>Partial</span>
            </span>
            {confidence !== undefined && (
              <span className="text-[10px] text-amber-400/80 font-mono">{(confidence * 100).toFixed(0)}%</span>
            )}
          </button>
        );
      case 'UNCLEAR':
        return (
          <button
            onClick={handleClick}
            className="w-full group px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/60 text-slate-300 text-xs font-medium flex items-center justify-between transition"
            title="Mentioned without depth — click to view"
          >
            <span className="flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span>Unclear</span>
            </span>
            <span className="text-[10px] text-slate-400">Needs Q</span>
          </button>
        );
      case 'NOT_FOUND':
      default:
        return (
          <button
            onClick={handleClick}
            className="w-full group px-2 py-1.5 rounded-lg bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/30 text-rose-300/80 text-xs font-medium flex items-center justify-between transition"
            title="No explicit evidence found in resume"
          >
            <span className="flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5 text-rose-400/70 flex-shrink-0" />
              <span>Not Found</span>
            </span>
            <span className="text-[10px] text-rose-400/60">0%</span>
          </button>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Category Filter & Explainer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Category:</span>
          <div className="flex flex-wrap gap-1.5">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs px-2.5 py-1 rounded-md transition ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white font-medium shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                {cat === 'all' ? 'All Requirements' : cat.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1 text-emerald-400">
            <CheckCircle className="w-3 h-3" /> Supported
          </span>
          <span className="flex items-center gap-1 text-amber-400">
            <AlertCircle className="w-3 h-3" /> Partial
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <HelpCircle className="w-3 h-3" /> Unclear
          </span>
          <span className="flex items-center gap-1 text-rose-400">
            <XCircle className="w-3 h-3" /> Not Found
          </span>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60 shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/90 text-xs font-semibold text-slate-300 uppercase tracking-wider">
              <th className="p-3.5 min-w-[280px]">Job Requirement</th>
              <th className="p-3.5 w-24 text-center">Priority</th>
              {candidates.map(candidate => (
                <th key={candidate.id as string} className="p-3.5 min-w-[190px] text-center">
                  <div className="font-semibold text-slate-100">{candidate.name as string}</div>
                  <div className="text-[11px] font-normal text-slate-400 truncate max-w-[180px] mx-auto">
                    {candidate.email as string || 'Candidate'}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-sm">
            {filteredRequirements.map(req => (
              <tr key={req.id as string} className="hover:bg-slate-900/40 transition">
                <td className="p-3.5 align-top">
                  <div className="font-medium text-slate-200 leading-snug">{req.text as string}</div>
                  <div className="text-[11px] text-slate-400 mt-1 capitalize">
                    {(req.category as string || '').replace('_', ' ')}
                  </div>
                </td>
                <td className="p-3.5 text-center align-top">
                  <span className={`inline-block text-[11px] px-2 py-0.5 rounded capitalize font-medium ${
                    req.priority === 'required'
                      ? 'bg-rose-950/50 text-rose-300 border border-rose-900/40'
                      : req.priority === 'preferred'
                      ? 'bg-blue-950/50 text-blue-300 border border-blue-900/40'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {req.priority as string || 'required'}
                  </span>
                </td>
                {candidates.map(candidate => {
                  const ev = getEvidenceForCell(req.id as string, candidate);
                  return (
                    <td key={candidate.id as string} className="p-3.5 align-top text-center">
                      {renderStatusBadge(ev, req, candidate)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          {/* Summary Coverage Footer */}
          <tfoot>
            <tr className="border-t-2 border-slate-800 bg-slate-900/80 text-xs font-semibold text-slate-300">
              <td colSpan={2} className="p-3.5 font-bold uppercase tracking-wider text-slate-400">
                Evidence Coverage Breakdown
              </td>
              {candidates.map(candidate => {
                const coverage = (candidate.requirement_coverage as Record<string, number>) || {};
                return (
                  <td key={candidate.id as string} className="p-3.5 text-center">
                    <div className="space-y-1">
                      <div className="flex justify-center gap-1.5 text-[11px]">
                        <span className="text-emerald-400 font-semibold">{coverage.supported || 0} supported</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-amber-400 font-semibold">{coverage.partial || 0} partial</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {coverage.total ? `${Math.round(((coverage.supported || 0) + (coverage.partial || 0)) / coverage.total * 100)}% verified coverage` : 'No data'}
                      </div>
                    </div>
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-950/20 border border-blue-900/30 text-xs text-blue-300">
        <Info className="w-4 h-4 flex-shrink-0" />
        <span>Click any requirement pill above to open the exact resume citation and validation question in the Evidence Drawer.</span>
      </div>
    </div>
  );
}
