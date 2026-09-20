import { useState } from 'react';
import {
  Users, GraduationCap, Briefcase, Code,
  CheckCircle, AlertCircle, XCircle, HelpCircle,
  ShieldCheck
} from 'lucide-react';
import type { EvidenceData } from './EvidenceDrawer';

interface CandidateComparisonProps {
  candidates: Record<string, unknown>[];
  requirements: Record<string, unknown>[];
  onSelectEvidence?: (evidence: EvidenceData) => void;
}

export default function CandidateComparison({
  candidates,
  requirements,
  onSelectEvidence
}: CandidateComparisonProps) {
  const [candidateAId, setCandidateAId] = useState<string>(candidates[0]?.id as string || '');
  const [candidateBId, setCandidateBId] = useState<string>(candidates[1]?.id as string || (candidates[0]?.id as string || ''));

  const candidateA = candidates.find(c => c.id === candidateAId) || candidates[0];
  const candidateB = candidates.find(c => c.id === candidateBId) || candidates[1] || candidates[0];

  if (!candidateA || candidates.length === 0) {
    return (
      <div className="p-8 text-center rounded-xl bg-slate-900 border border-slate-800">
        <Users className="w-10 h-10 mx-auto text-slate-500 mb-2" />
        <p className="text-slate-300 font-medium">At least one candidate is needed to view comparison details.</p>
      </div>
    );
  }

  const getSkills = (c: Record<string, unknown>) => {
    return (c.skills as Record<string, string>[]) || [];
  };

  const getExperience = (c: Record<string, unknown>) => {
    return (c.experience as Record<string, string>[]) || [];
  };

  const getEducation = (c: Record<string, unknown>) => {
    return (c.education as Record<string, string>[]) || [];
  };

  const getEvidence = (c: Record<string, unknown>, reqId: string) => {
    const mappings = (c.evidence_mappings as Record<string, unknown>[]) || [];
    return mappings.find(m => m.requirement_id === reqId);
  };

  const renderStatus = (status: string | undefined, confidence?: number) => {
    switch (status) {
      case 'SUPPORTED':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
            <CheckCircle className="w-3.5 h-3.5" /> Supported {confidence ? `(${(confidence * 100).toFixed(0)}%)` : ''}
          </span>
        );
      case 'PARTIAL':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400">
            <AlertCircle className="w-3.5 h-3.5" /> Partial {confidence ? `(${(confidence * 100).toFixed(0)}%)` : ''}
          </span>
        );
      case 'UNCLEAR':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400">
            <HelpCircle className="w-3.5 h-3.5" /> Unclear
          </span>
        );
      case 'NOT_FOUND':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-400">
            <XCircle className="w-3.5 h-3.5" /> Not Found
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Objective Disclaimer Banner */}
      <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-800/40 flex items-center justify-between text-xs text-blue-200">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <span>
            <strong>Objective Factual Comparison:</strong> HireFlow displays verified qualifications side-by-side. It does not calculate arbitrary scores, rank candidates, or declare a winner. Hiring decisions remain 100% human.
          </span>
        </div>
      </div>

      {/* Candidate Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Candidate A Card */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Candidate A</span>
            <select
              value={candidateAId}
              onChange={e => setCandidateAId(e.target.value)}
              className="bg-slate-800 text-slate-200 text-xs px-3 py-1.5 rounded-lg border border-slate-700 outline-none"
            >
              {candidates.map(c => (
                <option key={c.id as string} value={c.id as string}>
                  {c.name as string}
                </option>
              ))}
            </select>
          </div>
          <h3 className="text-lg font-bold text-white">{candidateA.name as string}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{candidateA.email as string || 'No email provided'}</p>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-800/40">
              Interview: {(candidateA.interview_status as string || 'not_started').replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Candidate B Card */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">Candidate B</span>
            <select
              value={candidateBId}
              onChange={e => setCandidateBId(e.target.value)}
              className="bg-slate-800 text-slate-200 text-xs px-3 py-1.5 rounded-lg border border-slate-700 outline-none"
            >
              {candidates.map(c => (
                <option key={c.id as string} value={c.id as string}>
                  {c.name as string}
                </option>
              ))}
            </select>
          </div>
          <h3 className="text-lg font-bold text-white">{candidateB.name as string}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{candidateB.email as string || 'No email provided'}</p>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded bg-violet-950/60 text-violet-300 border border-violet-800/40">
              Interview: {(candidateB.interview_status as string || 'not_started').replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Comparison Sections */}
      <div className="space-y-4">
        {/* 1. Requirement Evidence Comparison */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
          <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Requirement Evidence Side-by-Side
            </h4>
          </div>
          <div className="divide-y divide-slate-800/60">
            {requirements.map(req => {
              const evA = getEvidence(candidateA, req.id as string);
              const evB = getEvidence(candidateB, req.id as string);

              return (
                <div key={req.id as string} className="p-4 hover:bg-slate-900/30 transition">
                  <div className="mb-2.5">
                    <span className="text-xs font-semibold text-slate-200">{req.text as string}</span>
                    <span className="ml-2 text-[11px] text-slate-400 capitalize">
                      ({req.priority as string || 'required'})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Candidate A Evidence */}
                    <div
                      className="p-3 rounded-lg bg-slate-900/70 border border-slate-800/80 cursor-pointer hover:border-blue-500/40 transition"
                      onClick={() => onSelectEvidence && onSelectEvidence({
                        requirement_id: req.id as string,
                        requirement_text: req.text as string,
                        requirement_category: req.category as string,
                        candidate_id: candidateA.id as string,
                        candidate_name: candidateA.name as string,
                        source_location: evA?.source_location as string,
                        evidence_text: evA?.evidence_text as string,
                        status: (evA?.status as string) || 'NOT_FOUND',
                        confidence: evA?.confidence as number,
                        validation_question: evA?.validation_question as string,
                      })}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-blue-300">{candidateA.name as string}</span>
                        {renderStatus(evA?.status as string, evA?.confidence as number)}
                      </div>
                      <p className="text-slate-300 italic line-clamp-2">
                        {evA?.evidence_text ? `"${evA.evidence_text}"` : 'No explicit resume evidence cited.'}
                      </p>
                    </div>

                    {/* Candidate B Evidence */}
                    <div
                      className="p-3 rounded-lg bg-slate-900/70 border border-slate-800/80 cursor-pointer hover:border-violet-500/40 transition"
                      onClick={() => onSelectEvidence && onSelectEvidence({
                        requirement_id: req.id as string,
                        requirement_text: req.text as string,
                        requirement_category: req.category as string,
                        candidate_id: candidateB.id as string,
                        candidate_name: candidateB.name as string,
                        source_location: evB?.source_location as string,
                        evidence_text: evB?.evidence_text as string,
                        status: (evB?.status as string) || 'NOT_FOUND',
                        confidence: evB?.confidence as number,
                        validation_question: evB?.validation_question as string,
                      })}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-violet-300">{candidateB.name as string}</span>
                        {renderStatus(evB?.status as string, evB?.confidence as number)}
                      </div>
                      <p className="text-slate-300 italic line-clamp-2">
                        {evB?.evidence_text ? `"${evB.evidence_text}"` : 'No explicit resume evidence cited.'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Skills Comparison */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
          <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center gap-2">
            <Code className="w-4 h-4 text-blue-400" />
            <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Skills Breakdown
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800 p-4 gap-4">
            <div>
              <p className="text-xs font-semibold text-blue-300 mb-2">{candidateA.name as string} Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {getSkills(candidateA).map((s, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-200 border border-slate-700">
                    {s.skill} {s.proficiency ? `• ${s.proficiency}` : ''}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-violet-300 mb-2">{candidateB.name as string} Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {getSkills(candidateB).map((s, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-200 border border-slate-700">
                    {s.skill} {s.proficiency ? `• ${s.proficiency}` : ''}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Work Experience Comparison */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
          <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-cyan-400" />
            <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Relevant Work History
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800 p-4 gap-4">
            <div className="space-y-3">
              <p className="text-xs font-semibold text-blue-300 mb-2">{candidateA.name as string}</p>
              {getExperience(candidateA).length === 0 ? (
                <p className="text-xs text-slate-500">No experience listed.</p>
              ) : (
                getExperience(candidateA).map((exp, i) => (
                  <div key={i} className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                    <p className="font-semibold text-xs text-slate-100">{exp.title}</p>
                    <p className="text-[11px] text-slate-400">{exp.company} • {exp.duration}</p>
                    {exp.description && <p className="text-xs text-slate-300 mt-1 line-clamp-2">{exp.description}</p>}
                  </div>
                ))
              )}
            </div>
            <div className="space-y-3">
              <p className="text-xs font-semibold text-violet-300 mb-2">{candidateB.name as string}</p>
              {getExperience(candidateB).length === 0 ? (
                <p className="text-xs text-slate-500">No experience listed.</p>
              ) : (
                getExperience(candidateB).map((exp, i) => (
                  <div key={i} className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                    <p className="font-semibold text-xs text-slate-100">{exp.title}</p>
                    <p className="text-[11px] text-slate-400">{exp.company} • {exp.duration}</p>
                    {exp.description && <p className="text-xs text-slate-300 mt-1 line-clamp-2">{exp.description}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 4. Education Comparison */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
          <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Education & Academic Background
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800 p-4 gap-4">
            <div>
              <p className="text-xs font-semibold text-blue-300 mb-2">{candidateA.name as string}</p>
              {getEducation(candidateA).map((edu, i) => (
                <div key={i} className="text-xs mb-2">
                  <p className="font-medium text-slate-200">{edu.degree}</p>
                  <p className="text-[11px] text-slate-400">{edu.institution} {edu.year ? `(${edu.year})` : ''}</p>
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs font-semibold text-violet-300 mb-2">{candidateB.name as string}</p>
              {getEducation(candidateB).map((edu, i) => (
                <div key={i} className="text-xs mb-2">
                  <p className="font-medium text-slate-200">{edu.degree}</p>
                  <p className="text-[11px] text-slate-400">{edu.institution} {edu.year ? `(${edu.year})` : ''}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
