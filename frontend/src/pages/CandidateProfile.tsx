import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import {
  User, Mail, Phone, Briefcase, GraduationCap, Code,
  FolderOpen, CheckCircle, AlertCircle, XCircle, HelpCircle,
  MessageSquare, Sparkles, Loader2, ClipboardList, FileText,
  Printer, ArrowRight, ChevronRight
} from 'lucide-react';
import EvidenceDrawer, { type EvidenceData } from '../components/EvidenceDrawer';
import EvaluationReportModal from '../components/EvaluationReportModal';

export default function CandidateProfile() {
  const { id } = useParams<{ id: string }>();
  const [candidate, setCandidate] = useState<Record<string, unknown> | null>(null);
  const [job, setJob] = useState<Record<string, unknown> | null>(null);
  const [interviewSession, setInterviewSession] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [selectedDrawerEvidence, setSelectedDrawerEvidence] = useState<EvidenceData | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    loadCandidateData();
  }, [id]);

  const loadCandidateData = async () => {
    setLoading(true);
    try {
      const data = await api.getCandidate(id!);
      setCandidate(data);

      if (data?.job_id) {
        const j = await api.getJob(data.job_id as string);
        setJob(j);

        const sessions = await api.getCandidateInterviews(id!);
        if (Array.isArray(sessions) && sessions.length > 0) {
          const s = await api.getInterviewSession(sessions[0].id as string);
          setInterviewSession(s);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!candidate) return;
    setLoadingSummary(true);
    try {
      const s = await api.getCandidateSummary(id!, candidate.job_id as string);
      setSummary(s);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleMapEvidence = async () => {
    if (!candidate) return;
    setLoading(true);
    try {
      await api.mapEvidence(id!, candidate.job_id as string);
      await loadCandidateData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !candidate) {
    return (
      <div className="space-y-4">
        <div className="h-44 skeleton rounded-xl" />
        <div className="h-12 w-80 skeleton rounded-lg" />
        <div className="h-64 skeleton rounded-xl" />
      </div>
    );
  }

  const skills = (candidate.skills as Record<string, string>[]) || [];
  const experience = (candidate.experience as Record<string, string>[]) || [];
  const education = (candidate.education as Record<string, string>[]) || [];
  const projects = (candidate.projects as Record<string, unknown>[]) || [];
  const evidence = (candidate.evidence_mappings as Record<string, unknown>[]) || [];
  const groups = (candidate.groups as Record<string, string>[]) || [];
  const coverage = candidate.requirement_coverage as Record<string, number>;

  const statusBadge = (status: string) => {
    const cls = `badge-${status.toLowerCase().replace('_', '-')}`;
    return <span className={`badge ${cls}`}>{status.replace('_', ' ')}</span>;
  };

  const tabs = [
    { id: 'overview', label: 'Overview & Profile', icon: User },
    { id: 'evidence', label: 'Evidence Map', count: evidence.length, icon: ClipboardList },
    { id: 'summary', label: 'AI Summary', icon: FileText },
    { id: 'interview', label: 'Interview Copilot', icon: MessageSquare },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Link to="/" className="hover:text-blue-400 transition">Dashboard</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
        {job ? (
          <>
            <Link to={`/jobs/${job.id}`} className="hover:text-blue-400 transition truncate max-w-xs">{job.title as string}</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          </>
        ) : null}
        <span className="text-slate-300 font-medium">{candidate.name as string}</span>
      </div>

      {/* Candidate Header */}
      <div className="glass-card-static p-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-lg flex-shrink-0">
              <User className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-white tracking-tight">{candidate.name as string}</h1>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-800/40">
                  {candidate.file_name ? String(candidate.file_name) : 'Resume Extracted'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-1">
                {Boolean(candidate.email) && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-slate-500" /> {candidate.email as string}</span>}
                {Boolean(candidate.phone) && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-slate-500" /> {candidate.phone as string}</span>}
                {job && <span>Applying for: <strong className="text-slate-200">{job.title as string}</strong></span>}
              </div>
              {groups.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {groups.map((g, i) => (
                    <span key={i} className="text-xs px-2.5 py-0.5 rounded bg-violet-950/60 text-violet-300 border border-violet-800/40">
                      {g.group_name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setIsReportOpen(true)}
              className="btn-secondary text-xs flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-blue-400" /> Export Evaluation Report
            </button>
            <Link
              to={`/interviews/${candidate.job_id}/${id}`}
              className="btn-primary text-xs flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5" /> Interview Copilot
            </Link>
          </div>
        </div>

        {/* Coverage Status Bar */}
        {coverage && (
          <div className="mt-6 pt-5 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-800/30 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-slate-400">Supported Evidence</p>
                <p className="font-bold text-emerald-300 text-sm">{coverage.supported || 0} Requirements</p>
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-800/30 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <div>
                <p className="text-slate-400">Partial Evidence</p>
                <p className="font-bold text-amber-300 text-sm">{coverage.partial || 0} Requirements</p>
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-800/30 flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <div>
                <p className="text-slate-400">Not Mentioned</p>
                <p className="font-bold text-rose-300 text-sm">{coverage.not_found || 0} Requirements</p>
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <div>
                <p className="text-slate-400">Needs Validation</p>
                <p className="font-bold text-slate-200 text-sm">{coverage.unclear || 0} Items</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === t.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <t.icon className="w-4 h-4" />
            <span>{t.label}</span>
            {t.count !== undefined && (
              <span className="text-xs px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Skills */}
          <div className="glass-card-static p-6">
            <h3 className="font-semibold text-base text-white flex items-center gap-2 mb-4">
              <Code className="w-4 h-4 text-blue-400" /> Extracted Skills ({skills.length})
            </h3>
            {skills.length === 0 ? (
              <p className="text-xs text-slate-500">No skills parsed from document.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {skills.map((s, i) => (
                  <span
                    key={i}
                    className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 flex items-center gap-1.5"
                  >
                    <span className="font-medium">{s.skill}</span>
                    {s.proficiency && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950/80 text-blue-300">
                        {s.proficiency}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Education */}
          <div className="glass-card-static p-6">
            <h3 className="font-semibold text-base text-white flex items-center gap-2 mb-4">
              <GraduationCap className="w-4 h-4 text-amber-400" /> Education
            </h3>
            <div className="space-y-3">
              {education.map((edu, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                  <p className="font-bold text-slate-100 text-sm">{edu.degree}</p>
                  <p className="text-slate-400 mt-0.5">{edu.institution} {edu.year ? `• Class of ${edu.year}` : ''}</p>
                  {edu.field && <p className="text-slate-500 mt-1">Field of Study: {edu.field}</p>}
                </div>
              ))}
              {education.length === 0 && <p className="text-xs text-slate-500">No education extracted.</p>}
            </div>
          </div>

          {/* Experience */}
          <div className="lg:col-span-2 glass-card-static p-6">
            <h3 className="font-semibold text-base text-white flex items-center gap-2 mb-4">
              <Briefcase className="w-4 h-4 text-cyan-400" /> Work Experience
            </h3>
            <div className="space-y-3.5">
              {experience.map((exp, i) => (
                <div key={i} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-sm text-slate-100">{exp.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{exp.company} • {exp.duration}</p>
                    </div>
                  </div>
                  {exp.description && (
                    <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">{exp.description}</p>
                  )}
                </div>
              ))}
              {experience.length === 0 && <p className="text-xs text-slate-500">No work history extracted.</p>}
            </div>
          </div>

          {/* Projects */}
          {projects.length > 0 && (
            <div className="lg:col-span-2 glass-card-static p-6">
              <h3 className="font-semibold text-base text-white flex items-center gap-2 mb-4">
                <FolderOpen className="w-4 h-4 text-violet-400" /> Featured Projects
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {projects.map((proj, i) => (
                  <div key={i} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                    <p className="font-bold text-slate-100 text-sm">{proj.name as string}</p>
                    <p className="text-slate-300 mt-1 leading-relaxed">{proj.description as string}</p>
                    {(proj.technologies as string[])?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2.5">
                        {(proj.technologies as string[]).map((t, j) => (
                          <span key={j} className="text-[11px] px-2 py-0.5 rounded bg-violet-950/60 text-violet-300 border border-violet-800/40">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Evidence Map */}
      {tab === 'evidence' && (
        <div className="glass-card-static p-6 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-semibold text-base text-white">Requirement → Resume Evidence Citations</h3>
              <p className="text-xs text-slate-400 mt-0.5">Click any evidence card to open the slide-over inspector.</p>
            </div>
            {evidence.length === 0 && (
              <button onClick={handleMapEvidence} className="btn-primary text-xs">
                <Sparkles className="w-3.5 h-3.5" /> Map Evidence
              </button>
            )}
          </div>

          {evidence.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl">
              <ClipboardList className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p className="text-slate-300 font-medium text-sm">No evidence mappings generated yet</p>
              <button onClick={handleMapEvidence} className="btn-primary text-xs mt-3">
                <Sparkles className="w-3.5 h-3.5" /> Run AI Evidence Grounding
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {evidence.map((ev, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-blue-500/40 cursor-pointer transition"
                  onClick={() => setSelectedDrawerEvidence({
                    requirement_id: ev.requirement_id as string,
                    requirement_text: ev.requirement_text as string,
                    requirement_category: ev.requirement_category as string,
                    candidate_id: candidate.id as string,
                    candidate_name: candidate.name as string,
                    source_location: ev.source_location as string,
                    evidence_text: ev.evidence_text as string,
                    status: (ev.status as string) || 'NOT_FOUND',
                    confidence: ev.confidence as number,
                    validation_question: ev.validation_question as string,
                    ai_reasoning: ev.ai_reasoning as string,
                  })}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        {statusBadge(ev.status as string)}
                        <span className="text-xs text-slate-400 capitalize">{(ev.requirement_category as string || '').replace('_', ' ')}</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-100">{ev.requirement_text as string}</p>
                      {Boolean(ev.evidence_text) && (
                        <p className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border-l-2 border-blue-500 italic">
                          "{ev.evidence_text as string}"
                        </p>
                      )}
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 flex-shrink-0 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Summary */}
      {tab === 'summary' && (
        <div className="glass-card-static p-6 space-y-4">
          {!summary && !loadingSummary && (
            <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl">
              <FileText className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p className="text-slate-300 font-medium text-sm">Generate structured candidate summary</p>
              <button onClick={handleGenerateSummary} className="btn-primary text-xs mt-3">
                <Sparkles className="w-3.5 h-3.5" /> Generate AI Summary
              </button>
            </div>
          )}

          {loadingSummary && (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 mx-auto text-blue-400 animate-spin mb-2" />
              <p className="text-sm text-slate-300">Synthesizing evidence & experience profile...</p>
            </div>
          )}

          {summary && (
            <div className="space-y-5 text-sm">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">Executive Summary</h4>
                <p className="text-slate-200 leading-relaxed">{summary.overview as string}</p>
              </div>

              {(summary.relevant_experience as string[])?.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Relevant Track Record</h4>
                  <ul className="list-disc list-inside space-y-1 text-xs text-slate-300">
                    {(summary.relevant_experience as string[]).map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
              )}

              {(summary.items_requiring_validation as string[])?.length > 0 && (
                <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">Items Recommended for Interview Validation</h4>
                  <ul className="list-disc list-inside space-y-1 text-xs text-amber-200">
                    {(summary.items_requiring_validation as string[]).map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Interview Copilot Link */}
      {tab === 'interview' && (
        <div className="glass-card-static p-8 text-center border border-slate-800 space-y-3">
          <MessageSquare className="w-12 h-12 mx-auto text-blue-400" />
          <h3 className="text-base font-bold text-white">Interview Copilot & Evidence Verification</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Review interview questions mapped to specific requirements, log live notes, and generate targeted follow-ups.
          </p>
          <Link
            to={`/interviews/${candidate.job_id}/${id}`}
            className="btn-primary text-xs inline-flex items-center gap-1.5 mt-2"
          >
            Launch Interview Session <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Evidence Inspector Drawer */}
      <EvidenceDrawer
        evidence={selectedDrawerEvidence}
        onClose={() => setSelectedDrawerEvidence(null)}
      />

      {/* Evaluation Report Modal */}
      {job && (
        <EvaluationReportModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          candidate={candidate}
          job={job}
          evidenceMappings={evidence}
          interviewSession={interviewSession}
        />
      )}
    </div>
  );
}
