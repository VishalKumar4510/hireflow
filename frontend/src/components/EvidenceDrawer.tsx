import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  X, CheckCircle, AlertCircle, XCircle, HelpCircle,
  FileText, Quote, Sparkles, MessageSquare, ArrowRight,
  ShieldCheck, MapPin
} from 'lucide-react';

export interface EvidenceData {
  id?: string;
  requirement_id?: string;
  requirement_text?: string;
  requirement_category?: string;
  requirement_priority?: string;
  candidate_id?: string;
  candidate_name?: string;
  source_document?: string;
  file_name?: string;
  source_type?: string;
  source_location?: string;
  evidence_text?: string;
  status: 'SUPPORTED' | 'PARTIAL' | 'NOT_FOUND' | 'UNCLEAR' | string;
  confidence?: number;
  validation_question?: string;
  ai_reasoning?: string;
  job_id?: string;
}

interface EvidenceDrawerProps {
  evidence: EvidenceData | null;
  onClose: () => void;
}

export default function EvidenceDrawer({ evidence, onClose }: EvidenceDrawerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!evidence) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUPPORTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-700/50">
            <CheckCircle className="w-3.5 h-3.5" /> SUPPORTED
          </span>
        );
      case 'PARTIAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-700/50">
            <AlertCircle className="w-3.5 h-3.5" /> PARTIAL EVIDENCE
          </span>
        );
      case 'NOT_FOUND':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-950/80 text-rose-300 border border-rose-700/50">
            <XCircle className="w-3.5 h-3.5" /> NOT FOUND
          </span>
        );
      case 'UNCLEAR':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-900 text-slate-300 border border-slate-700">
            <HelpCircle className="w-3.5 h-3.5" /> UNCLEAR / MENTION ONLY
          </span>
        );
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="drawer-overlay" onClick={onClose} />

      {/* Drawer */}
      <aside
        className="drawer-content p-6 flex flex-col justify-between"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        <div>
          {/* Header */}
          <div className="flex items-start justify-between pb-5 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs uppercase tracking-wider text-blue-400 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Evidence Inspector
                </span>
                {getStatusBadge(evidence.status)}
              </div>
              <h2 id="drawer-title" className="text-lg font-bold text-slate-100">
                {evidence.candidate_name ? `Candidate Evidence: ${evidence.candidate_name}` : 'Requirement Evidence'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-5 space-y-5">
            {/* Target Requirement */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Target Requirement
                </span>
                <div className="flex items-center gap-1.5">
                  {evidence.requirement_category && (
                    <span className="text-[11px] px-2 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-800/40">
                      {evidence.requirement_category.replace('_', ' ')}
                    </span>
                  )}
                  {evidence.requirement_priority && (
                    <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {evidence.requirement_priority}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm font-semibold text-slate-200">
                {evidence.requirement_text || 'Requirement details'}
              </p>
            </div>

            {/* Source Document & Location */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <p className="text-xs text-slate-400 flex items-center gap-1 mb-1">
                  <FileText className="w-3.5 h-3.5 text-slate-400" /> Source Document
                </p>
                <p className="text-sm font-medium text-slate-200 truncate">
                  {evidence.source_document || evidence.file_name || 'Resume Document (PDF)'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <p className="text-xs text-slate-400 flex items-center gap-1 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> Section Location
                </p>
                <p className="text-sm font-medium text-slate-200 truncate">
                  {evidence.source_location || 'Work Experience / Skills'}
                </p>
              </div>
            </div>

            {/* Exact Source Snippet Highlight */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-blue-900/40 relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-blue-400 flex items-center gap-1.5">
                  <Quote className="w-3.5 h-3.5" /> Exact Document Citation
                </span>
                {evidence.confidence !== undefined && (
                  <span className="text-xs text-slate-400 font-mono">
                    Confidence: {(evidence.confidence * 100).toFixed(0)}%
                  </span>
                )}
              </div>
              <div className="p-3.5 rounded-lg bg-slate-900 border-l-4 border-blue-500 text-slate-100 text-sm leading-relaxed font-sans shadow-inner">
                {evidence.evidence_text ? (
                  <span className="bg-blue-500/15 text-blue-100 px-1 py-0.5 rounded font-medium">
                    "{evidence.evidence_text}"
                  </span>
                ) : (
                  <span className="text-slate-400 italic">No explicit evidence text found in candidate resume.</span>
                )}
              </div>
            </div>

            {/* AI Reasoning / Audit Note */}
            {evidence.ai_reasoning && (
              <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 text-xs text-slate-300 space-y-1">
                <div className="flex items-center gap-1.5 font-medium text-slate-200">
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" /> AI Grounding Rationale
                </div>
                <p className="text-slate-400 leading-relaxed">
                  {evidence.ai_reasoning}
                </p>
              </div>
            )}

            {/* Validation Question For Recruiter */}
            {evidence.validation_question && (
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300 mb-1.5">
                  <MessageSquare className="w-3.5 h-3.5" /> Suggested Interview Validation Question
                </div>
                <p className="text-sm text-amber-100 leading-snug">
                  "{evidence.validation_question}"
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-5 mt-6 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Factual evidence cited directly from verified candidate source.
          </div>
          <div className="flex gap-2">
            {evidence.candidate_id && (
              <Link
                to={`/candidates/${evidence.candidate_id}`}
                className="btn-secondary text-xs py-2 px-3"
                onClick={onClose}
              >
                View Profile <ArrowRight className="w-3 h-3" />
              </Link>
            )}
            <button onClick={onClose} className="btn-primary text-xs py-2 px-4">
              Done
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
