import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import {
  MessageSquare, Sparkles, Loader2, Send,
  ChevronDown, ChevronUp, ArrowLeft, ClipboardList,
  AlertCircle, Printer,
  ShieldCheck, RefreshCw, Check
} from 'lucide-react';
import EvaluationReportModal from '../components/EvaluationReportModal';

export default function Interview() {
  const { jobId, candidateId } = useParams<{ jobId: string; candidateId: string }>();
  const [session, setSession] = useState<Record<string, unknown> | null>(null);
  const [candidate, setCandidate] = useState<Record<string, unknown> | null>(null);
  const [job, setJob] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatingFollowUps, setGeneratingFollowUps] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [notes, setNotes] = useState('');
  const [activeSection, setActiveSection] = useState<'questions' | 'notes' | 'evaluation'>('questions');
  const [expandedQ, setExpandedQ] = useState<string | null>(null);
  const [questionStatuses, setQuestionStatuses] = useState<Record<string, 'answered' | 'partial' | 'unanswered'>>({});
  const [isReportOpen, setIsReportOpen] = useState(false);

  useEffect(() => {
    if (!candidateId || !jobId) return;
    loadData();
  }, [candidateId, jobId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [c, j, sessions] = await Promise.all([
        api.getCandidate(candidateId!),
        api.getJob(jobId!),
        api.getCandidateInterviews(candidateId!),
      ]);
      setCandidate(c);
      setJob(j);

      if (Array.isArray(sessions) && sessions.length > 0) {
        const s = await api.getInterviewSession(sessions[0].id as string);
        setSession(s);
        if (s.interviewer_notes) setNotes(s.interviewer_notes as string);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async () => {
    try {
      const s = await api.createInterviewSession(candidateId!, jobId!);
      setSession(s);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateQuestions = async () => {
    if (!session) return;
    setGenerating(true);
    try {
      await api.generateQuestions(session.id as string);
      const updated = await api.getInterviewSession(session.id as string);
      setSession(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateFollowUps = async () => {
    if (!session) return;
    setGeneratingFollowUps(true);
    try {
      // Find unanswered requirements from evaluation or candidate evidence
      const ev = (session.evaluation as Record<string, unknown>)?.unanswered_areas as Array<{ requirement_text?: string }> || [];
      const focusAreas = ev.map(a => a.requirement_text).filter(Boolean) as string[];

      await api.generateQuestions(session.id as string, focusAreas.length > 0 ? focusAreas : ['unanswered technical requirements']);
      const updated = await api.getInterviewSession(session.id as string);
      setSession(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingFollowUps(false);
    }
  };

  const handleSubmitNotes = async () => {
    if (!session || !notes.trim()) return;
    try {
      await api.submitInterviewNotes(session.id as string, notes);
      const updated = await api.getInterviewSession(session.id as string);
      setSession(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAnalyze = async () => {
    if (!session) return;
    setAnalyzing(true);
    try {
      await api.analyzeInterview(session.id as string);
      await api.generateEvaluation(session.id as string);
      const updated = await api.getInterviewSession(session.id as string);
      setSession(updated);
      setActiveSection('evaluation');
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const toggleQuestionStatus = (qId: string, status: 'answered' | 'partial' | 'unanswered') => {
    setQuestionStatuses(prev => ({
      ...prev,
      [qId]: prev[qId] === status ? 'unanswered' : status,
    }));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-16 skeleton rounded-xl" />
        <div className="h-44 skeleton rounded-xl" />
        <div className="h-64 skeleton rounded-xl" />
      </div>
    );
  }

  const questions = (session?.questions as Record<string, unknown>[]) || [];
  const evaluation = session?.evaluation as Record<string, unknown> | null;

  const answeredCount = Object.values(questionStatuses).filter(s => s === 'answered').length;
  const partialCount = Object.values(questionStatuses).filter(s => s === 'partial').length;

  const unansweredRequirements = (evaluation?.unanswered_areas as Array<{
    requirement_text?: string;
    reason?: string;
    suggested_follow_up?: string;
  }>) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to={`/candidates/${candidateId}`} className="btn-ghost p-2" title="Back to Profile">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-800/40">
                Interview Copilot
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {job?.title as string || 'Role'}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight mt-0.5">
              Candidate Interview: {(candidate?.name as string) || 'Candidate'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {session && (
            <button
              onClick={() => setIsReportOpen(true)}
              className="btn-secondary text-xs flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-blue-400" /> Export Evaluation Report
            </button>
          )}
        </div>
      </div>

      {/* No Session State */}
      {!session ? (
        <div className="glass-card-static p-12 text-center border border-dashed border-slate-800 rounded-xl space-y-4">
          <MessageSquare className="w-12 h-12 mx-auto text-blue-400" />
          <div>
            <h2 className="text-lg font-bold text-white">Start Interview Session</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Create a structured interview workspace mapped to this candidate's resume evidence gaps and job requirements.
            </p>
          </div>
          <button onClick={handleCreateSession} className="btn-primary text-xs">
            Initialize Interview Session
          </button>
        </div>
      ) : (
        <>
          {/* Interview Progress & Coverage Banner */}
          <div className="glass-card-static p-5 border border-slate-800">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <p className="text-slate-400 font-medium">Session Status</p>
                <p className="text-sm font-bold text-blue-400 uppercase mt-0.5">
                  {(session.status as string || 'in_progress').replace('_', ' ')}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Target Questions</p>
                <p className="text-sm font-bold text-white mt-0.5">{questions.length} Prepared</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Answered in Session</p>
                <p className="text-sm font-bold text-emerald-400 mt-0.5">
                  {answeredCount} Answered {partialCount > 0 ? `(${partialCount} Partial)` : ''}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Requirement Coverage</p>
                <p className="text-sm font-bold text-amber-400 mt-0.5">
                  {evaluation ? `${(evaluation.requirement_coverage as unknown[])?.length || 0} Evaluated` : 'Pending Notes'}
                </p>
              </div>
            </div>
          </div>

          {/* Section Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            {[
              { id: 'questions', label: '1. Structured Questions', count: questions.length },
              { id: 'notes', label: '2. Live Interviewer Notes', count: notes.length > 0 ? '✓' : undefined },
              { id: 'evaluation', label: '3. AI Evaluation & Evidence', count: evaluation ? 'Ready' : undefined },
            ].map(sec => (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                  activeSection === sec.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <span>{sec.label}</span>
                {sec.count !== undefined && (
                  <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                    {sec.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* SECTION 1: QUESTIONS */}
          {activeSection === 'questions' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white">Targeted Interview Questions</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Questions dynamically grounded in resume evidence, project experience, and requirement gaps.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleGenerateQuestions}
                    disabled={generating}
                    className="btn-secondary text-xs"
                  >
                    {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 text-blue-400" />}
                    Regenerate All
                  </button>
                  <button
                    onClick={handleGenerateFollowUps}
                    disabled={generatingFollowUps}
                    className="btn-primary text-xs"
                  >
                    {generatingFollowUps ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    Generate Follow-ups
                  </button>
                </div>
              </div>

              {questions.length === 0 ? (
                <div className="glass-card-static p-12 text-center border border-dashed border-slate-800 rounded-xl">
                  <Sparkles className="w-10 h-10 mx-auto text-blue-400 mb-2" />
                  <p className="text-sm font-medium text-slate-200">No questions generated yet</p>
                  <button onClick={handleGenerateQuestions} className="btn-primary text-xs mt-3">
                    <Sparkles className="w-3.5 h-3.5" /> Generate Candidate-Specific Questions
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {questions.map((q, idx) => {
                    const qId = String(q.id || idx);
                    const status = questionStatuses[qId] || 'unanswered';
                    const isExpanded = expandedQ === qId;

                    return (
                      <div
                        key={qId}
                        className={`p-4 rounded-xl border transition ${
                          status === 'answered'
                            ? 'bg-slate-950/80 border-emerald-900/40'
                            : status === 'partial'
                            ? 'bg-slate-950/80 border-amber-900/40'
                            : 'bg-slate-900/80 border-slate-800'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1">
                            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-bold mt-0.5">
                              #{idx + 1}
                            </span>
                            <div className="space-y-1.5 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[11px] px-2 py-0.5 rounded font-medium bg-blue-950/60 text-blue-300 border border-blue-800/40 capitalize">
                                  {(q.category as string || 'technical').replace('_', ' ')}
                                </span>
                                {Boolean(q.requirement_text) && (
                                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3 text-emerald-400" /> Tests: <strong className="text-slate-300">{q.requirement_text as string}</strong>
                                  </span>
                                )}
                              </div>
                              <p className="text-sm font-semibold text-slate-100 leading-snug">{q.question as string}</p>

                              {isExpanded && Boolean(q.context) && (
                                <div className="mt-2.5 p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-xs text-slate-300">
                                  <span className="font-semibold text-blue-400">Context / Intent:</span> {q.context as string}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Quick Response Toggles */}
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              onClick={() => toggleQuestionStatus(qId, 'answered')}
                              className={`text-xs px-2.5 py-1 rounded-lg border transition flex items-center gap-1 ${
                                status === 'answered'
                                  ? 'bg-emerald-950 text-emerald-300 border-emerald-700 font-semibold'
                                  : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-white'
                              }`}
                              title="Mark question as fully answered"
                            >
                              <Check className="w-3 h-3" /> Answered
                            </button>
                            <button
                              onClick={() => toggleQuestionStatus(qId, 'partial')}
                              className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                                status === 'partial'
                                  ? 'bg-amber-950 text-amber-300 border-amber-700 font-semibold'
                                  : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-white'
                              }`}
                              title="Mark question as partially answered"
                            >
                              Partial
                            </button>
                            <button
                              onClick={() => setExpandedQ(isExpanded ? null : qId)}
                              className="p-1 rounded text-slate-500 hover:text-slate-300"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SECTION 2: LIVE NOTES */}
          {activeSection === 'notes' && (
            <div className="glass-card-static p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-white">Live Interviewer Notes</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Record answers, technical explanations, and observations. These notes feed directly into AI evidence verification.
                  </p>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  {notes.length} characters
                </div>
              </div>

              <textarea
                className="input-field text-sm font-sans"
                rows={16}
                placeholder="Type or paste candidate responses, answers to technical questions, and interview observations here..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800">
                <div className="text-xs text-slate-400">
                  Notes are stored securely and auditable in the system log.
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSubmitNotes} className="btn-secondary text-xs" disabled={!notes.trim()}>
                    <Send className="w-3.5 h-3.5" /> Save Notes
                  </button>
                  <button onClick={handleAnalyze} className="btn-primary text-xs" disabled={analyzing || !notes.trim()}>
                    {analyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    {analyzing ? 'Analyzing Notes...' : 'Analyze & Ground Evaluation'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: EVALUATION */}
          {activeSection === 'evaluation' && (
            <div className="space-y-5">
              {!evaluation ? (
                <div className="glass-card-static p-12 text-center border border-dashed border-slate-800 rounded-xl space-y-3">
                  <ClipboardList className="w-10 h-10 mx-auto text-slate-600" />
                  <p className="text-sm font-medium text-slate-300">No evaluation synthesized yet</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Record interview notes in Section 2, then click "Analyze & Ground Evaluation".
                  </p>
                </div>
              ) : (
                <>
                  {/* Synthesis Summary */}
                  <div className="glass-card-static p-6 space-y-2">
                    <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">Interview Evidence Synthesis</h3>
                    <p className="text-sm text-slate-200 leading-relaxed">{evaluation.summary as string}</p>
                  </div>

                  {/* Combined Requirement Coverage */}
                  {(evaluation.requirement_coverage as Record<string, unknown>[])?.length > 0 && (
                    <div className="glass-card-static p-6 space-y-4">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        Requirement Verification: Resume vs Interview
                      </h3>
                      <div className="space-y-3">
                        {(evaluation.requirement_coverage as Record<string, unknown>[]).map((cov, i) => (
                          <div key={i} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                            <p className="font-semibold text-slate-100 text-sm mb-2">{cov.requirement_text as string}</p>
                            <div className="flex flex-wrap items-center gap-4 text-xs">
                              <span className="flex items-center gap-1.5">
                                <span className="text-slate-400">📄 Resume:</span>
                                <span className={`badge badge-${(cov.resume_status as string)?.toLowerCase().replace('_', '-')}`}>
                                  {cov.resume_status as string}
                                </span>
                              </span>
                              <span className="flex items-center gap-1.5">
                                <span className="text-slate-400">🎤 Interview:</span>
                                <span className={`badge badge-${(cov.interview_status as string)?.toLowerCase().replace('_', '-')}`}>
                                  {cov.interview_status as string}
                                </span>
                              </span>
                            </div>
                            {Boolean(cov.combined_evidence) && (
                              <p className="mt-2.5 text-slate-300 bg-slate-950/80 p-2.5 rounded-lg border-l-2 border-emerald-500 italic">
                                "{cov.combined_evidence as string}"
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Unanswered Areas & Recommended Follow-ups */}
                  {unansweredRequirements.length > 0 && (
                    <div className="glass-card-static p-6 border-amber-900/40 bg-amber-950/10 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4" /> Unanswered Requirements & Recommended Follow-ups
                        </h3>
                        <button
                          onClick={handleGenerateFollowUps}
                          disabled={generatingFollowUps}
                          className="btn-primary text-xs"
                        >
                          {generatingFollowUps ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                          Generate Next-Round Questions
                        </button>
                      </div>

                      <div className="space-y-3">
                        {unansweredRequirements.map((area, i) => (
                          <div key={i} className="p-3.5 rounded-xl bg-slate-900/80 border border-amber-800/30 text-xs space-y-1.5">
                            <p className="font-semibold text-amber-200">{area.requirement_text}</p>
                            {Boolean(area.reason) && <p className="text-slate-400">{area.reason}</p>}
                            {Boolean(area.suggested_follow_up) && (
                              <p className="text-amber-100 italic bg-amber-950/30 p-2 rounded border border-amber-900/20">
                                💡 Suggested Question: "{area.suggested_follow_up}"
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* Evaluation Report Modal */}
      {candidate && job && (
        <EvaluationReportModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          candidate={candidate}
          job={job}
          interviewSession={session}
        />
      )}
    </div>
  );
}
