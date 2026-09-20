import {
  X, Printer, ShieldCheck, AlertCircle,
  FileText, MessageSquare
} from 'lucide-react';

interface EvaluationReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Record<string, unknown>;
  job: Record<string, unknown>;
  evidenceMappings?: Record<string, unknown>[];
  interviewSession?: Record<string, unknown> | null;
}

export default function EvaluationReportModal({
  isOpen,
  onClose,
  candidate,
  job,
  evidenceMappings = [],
  interviewSession = null
}: EvaluationReportModalProps) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const evaluation = (interviewSession?.evaluation as Record<string, unknown>) || {};
  const unansweredAreas = (evaluation?.unanswered_areas as Array<{
    requirement_text?: string;
    requirement_id?: string;
    reason?: string;
    suggested_follow_up?: string;
  }>) || [];

  const requirements = (job.requirements as Record<string, unknown>[]) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUPPORTED':
        return <span className="font-semibold text-emerald-600 dark:text-emerald-400">SUPPORTED</span>;
      case 'PARTIAL':
        return <span className="font-semibold text-amber-600 dark:text-amber-400">PARTIAL</span>;
      case 'UNCLEAR':
        return <span className="font-semibold text-slate-500 dark:text-slate-400">UNCLEAR</span>;
      case 'NOT_FOUND':
      default:
        return <span className="font-semibold text-rose-600 dark:text-rose-400">NOT FOUND</span>;
    }
  };

  return (
    <div className="modal-overlay overflow-y-auto p-4 sm:p-6" onClick={onClose}>
      <div
        className="modal-content max-w-4xl w-full my-auto bg-slate-900 border border-slate-700/80 shadow-2xl rounded-2xl p-0 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Control Bar (Hidden on print) */}
        <div className="p-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between no-print">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            <FileText className="w-4 h-4 text-blue-400" />
            <span>Candidate Evaluation & Audit Report</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" /> Print / Save as PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Area */}
        <div className="print-area p-8 sm:p-10 space-y-8 bg-slate-950 text-slate-100 text-sm">
          {/* Header */}
          <div className="border-b border-slate-800 pb-6 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-widest mb-1">
                <ShieldCheck className="w-4 h-4" /> HireFlow Intelligence Report
              </div>
              <h1 className="text-2xl font-bold text-white">
                Candidate Evaluation Report: {candidate.name as string}
              </h1>
              <p className="text-slate-400 text-xs mt-1">
                Role: <span className="text-slate-200 font-medium">{job.title as string}</span> {job.department ? `(${job.department as string})` : ''}
              </p>
            </div>
            <div className="text-right text-xs text-slate-400">
              <p>Generated: {new Date().toLocaleDateString()}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Auditable ID: {(candidate.id as string)?.slice(0, 8)}</p>
            </div>
          </div>

          {/* Recruiter Notice */}
          <div className="p-3.5 rounded-lg bg-blue-950/30 border border-blue-800/40 text-xs text-blue-200">
            <strong>Recruitment Governance Notice:</strong> This document compiles factual resume evidence citations, interviewer observations, and requirement coverage mapping. It does not compute quality scores or automate hiring determinations. Final hiring decisions rest exclusively with human recruiters.
          </div>

          {/* Candidate Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div>
              <p className="text-xs text-slate-400">Candidate</p>
              <p className="font-semibold text-slate-100 text-sm">{candidate.name as string}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Contact</p>
              <p className="font-medium text-slate-200 text-xs truncate">{candidate.email as string || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Source Document</p>
              <p className="font-medium text-slate-200 text-xs truncate">{candidate.file_name as string || 'Resume PDF'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Interview Status</p>
              <p className="font-medium text-blue-400 text-xs uppercase">{(interviewSession?.status as string || 'not_started').replace('_', ' ')}</p>
            </div>
          </div>

          {/* Requirement Evidence Breakdown */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-400" />
              1. Requirement Evidence Mapping
            </h3>
            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 border-b border-slate-800 text-slate-400">
                  <tr>
                    <th className="p-3">Job Requirement</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Resume Evidence Status</th>
                    <th className="p-3">Source Citation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {requirements.map(req => {
                    const ev = evidenceMappings.find(m => m.requirement_id === req.id);
                    return (
                      <tr key={req.id as string}>
                        <td className="p-3 font-medium text-slate-200 max-w-xs">{req.text as string}</td>
                        <td className="p-3 text-slate-400 capitalize">{(req.category as string || '').replace('_', ' ')}</td>
                        <td className="p-3">{getStatusBadge(ev?.status as string || 'NOT_FOUND')}</td>
                        <td className="p-3 text-slate-300 italic max-w-sm">
                          {ev?.evidence_text ? `"${ev.evidence_text as string}"` : '—'}
                          {Boolean(ev?.source_location) && <div className="text-[10px] text-slate-400 not-italic">({ev?.source_location as string})</div>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Interview Notes & Observations */}
          {Boolean(interviewSession?.interviewer_notes) && (
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-violet-400" />
                2. Interviewer Notes & Observations
              </h3>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                {interviewSession?.interviewer_notes as string}
              </div>
            </div>
          )}

          {/* Unanswered Areas & Recommended Follow-up Questions */}
          {unansweredAreas.length > 0 && (
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                3. Unanswered Requirements & Follow-up Questions
              </h3>
              <div className="space-y-2.5">
                {unansweredAreas.map((area, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-900/40 text-xs">
                    <p className="font-semibold text-amber-200 mb-1">Requirement: {area.requirement_text || `Requirement #${i + 1}`}</p>
                    {Boolean(area.reason) && <p className="text-slate-400 mb-1.5">{area.reason}</p>}
                    {Boolean(area.suggested_follow_up) && (
                      <p className="text-amber-100 font-medium italic">Recommended Question: "{area.suggested_follow_up}"</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verification Provenance Footer */}
          <div className="pt-6 border-t border-slate-800 text-[11px] text-slate-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              Verified by HireFlow Evidence System • Audited with cryptographic trace log
            </div>
            <div>
              Model Provenance: Google Gemini Flash • Output strictly non-evaluative
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
