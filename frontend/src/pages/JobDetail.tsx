import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import {
  Users, Upload, ArrowRight, MapPin, Building,
  HelpCircle, XCircle, Grid, ArrowLeftRight, Table,
  Sparkles, Loader2, CheckCircle2, ChevronRight
} from 'lucide-react';
import RequirementMatrix from '../components/RequirementMatrix';
import CandidateComparison from '../components/CandidateComparison';
import EvidenceDrawer, { type EvidenceData } from '../components/EvidenceDrawer';

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<Record<string, unknown> | null>(null);
  const [candidates, setCandidates] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'candidates' | 'matrix' | 'compare'>('candidates');
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceData | null>(null);
  const [analyzingJob, setAnalyzingJob] = useState(false);

  useEffect(() => {
    if (!id) return;
    loadJobData();
  }, [id]);

  const loadJobData = async () => {
    setLoading(true);
    try {
      const [jobData, candidateData] = await Promise.all([
        api.getJob(id!),
        api.getCandidatesForJob(id!),
      ]);
      setJob(jobData);
      setCandidates(candidateData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeJob = async () => {
    if (!id) return;
    setAnalyzingJob(true);
    try {
      await api.analyzeJob(id);
      await loadJobData();
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzingJob(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-40 skeleton rounded-xl" />
        <div className="h-12 w-96 skeleton rounded-lg" />
        <div className="h-64 skeleton rounded-xl" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-20 bg-slate-900/60 rounded-xl border border-slate-800">
        <p className="text-slate-300">Job position not found</p>
        <Link to="/" className="btn-secondary mt-4 inline-flex">Back to Dashboard</Link>
      </div>
    );
  }

  const requirements = (job.requirements as Record<string, unknown>[]) || [];

  const getInterviewBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      not_started: { label: 'Not Started', cls: 'badge-unclear' },
      questions_generated: { label: 'Questions Ready', cls: 'badge-partial' },
      in_progress: { label: 'In Progress', cls: 'badge-partial' },
      completed: { label: 'Completed', cls: 'badge-supported' },
      evaluated: { label: 'Evaluated', cls: 'badge-supported' },
    };
    const entry = map[status] || map.not_started;
    return <span className={`badge ${entry.cls}`}>{entry.label}</span>;
  };

  const filteredCandidates = candidates.filter(c => {
    if (filter === 'all') return true;
    const coverage = c.requirement_coverage as Record<string, number>;
    if (filter === 'supported' && coverage) return (coverage.supported || 0) > 0;
    if (filter === 'needs_validation' && coverage) return (coverage.unclear || 0) + (coverage.not_found || 0) > 0;
    if (filter === 'interviewed') return ['completed', 'evaluated'].includes(c.interview_status as string);
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Link to="/" className="hover:text-blue-400 transition">Dashboard</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
        <span className="text-slate-300 font-medium truncate max-w-sm">{job.title as string}</span>
      </div>

      {/* Job Header */}
      <div className="glass-card-static p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs uppercase font-semibold px-2 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-800/40">
                Active Requisition
              </span>
              {job.department ? (
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Building className="w-3.5 h-3.5" /> {job.department as string}
                </span>
              ) : null}
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">{job.title as string}</h1>
            <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
              {Boolean(job.location) && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" /> {job.location as string}
                </span>
              )}
              <span>Created {new Date(job.created_at as string).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 items-center">
            {requirements.length === 0 && (
              <button
                onClick={handleAnalyzeJob}
                disabled={analyzingJob}
                className="btn-secondary text-xs"
              >
                {analyzingJob ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-violet-400" />}
                Extract Requirements (AI)
              </button>
            )}
            <Link to={`/jobs/${id}/upload`} className="btn-primary text-xs">
              <Upload className="w-3.5 h-3.5" /> Upload Resumes
            </Link>
          </div>
        </div>

        {/* Descriptive Metrics */}
        <div className="grid grid-cols-3 gap-3.5 mt-6 pt-6 border-t border-slate-800">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <p className="text-xs text-slate-400 font-medium">Verified Requirements</p>
            <p className="text-2xl font-bold text-blue-400 mt-0.5">{requirements.length}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <p className="text-xs text-slate-400 font-medium">Candidates In Review</p>
            <p className="text-2xl font-bold text-emerald-400 mt-0.5">{candidates.length}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <p className="text-xs text-slate-400 font-medium">Interviews Conducted</p>
            <p className="text-2xl font-bold text-amber-400 mt-0.5">
              {candidates.filter(c => ['completed', 'evaluated'].includes(c.interview_status as string)).length}
            </p>
          </div>
        </div>
      </div>

      {/* Main Feature Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('candidates')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === 'candidates'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Table className="w-4 h-4" />
          <span>Candidate Pipeline ({candidates.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('matrix')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === 'matrix'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Grid className="w-4 h-4" />
          <span>Requirement Matrix</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-900 text-blue-200">Interactive</span>
        </button>

        <button
          onClick={() => setActiveTab('compare')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === 'compare'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>Side-by-Side Comparison</span>
        </button>
      </div>

      {/* Tab 1: Candidates Table */}
      {activeTab === 'candidates' && (
        <div className="glass-card-static p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="font-semibold text-base text-slate-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              Candidate Pool ({filteredCandidates.length})
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'all', label: 'All Candidates' },
                { id: 'supported', label: 'High Evidence' },
                { id: 'needs_validation', label: 'Needs Validation' },
                { id: 'interviewed', label: 'Interviewed' },
              ].map(f => (
                <button
                  key={f.id}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                    filter === f.id
                      ? 'bg-blue-950 text-blue-300 border-blue-700 font-semibold'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                  onClick={() => setFilter(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {filteredCandidates.length === 0 ? (
            <div className="text-center py-14 border border-dashed border-slate-800 rounded-xl">
              <Users className="w-12 h-12 mx-auto mb-3 text-slate-600" />
              <p className="text-slate-300 font-medium">No candidates in this view</p>
              <p className="text-xs text-slate-500 mt-1">Upload resumes or adjust your active filters above.</p>
              <Link to={`/jobs/${id}/upload`} className="btn-primary mt-4 inline-flex text-xs">
                <Upload className="w-3.5 h-3.5" /> Upload Resumes
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/40">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Extracted Skills</th>
                    <th>Evidence Coverage</th>
                    <th>Validation Flags</th>
                    <th>Interview Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCandidates.map(candidate => {
                    const coverage = (candidate.requirement_coverage as Record<string, number>) || {};
                    const skills = (candidate.skills as Record<string, string>[]) || [];
                    const candidateId = candidate.id as string;

                    return (
                      <tr
                        key={candidateId}
                        className="cursor-pointer hover:bg-slate-900/60 transition"
                        onClick={() => navigate(`/candidates/${candidateId}`)}
                      >
                        <td>
                          <div>
                            <p className="font-semibold text-slate-100">{candidate.name as string}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{candidate.email as string || 'No email'}</p>
                          </div>
                        </td>
                        <td>
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {skills.slice(0, 3).map((s, i) => (
                              <span key={i} className="text-xs px-2 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-800/40">
                                {s.skill}
                              </span>
                            ))}
                            {skills.length > 3 && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                                +{skills.length - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          {coverage.total ? (
                            <div className="flex items-center gap-2">
                              <div className="progress-bar w-20">
                                <div
                                  className="progress-bar-fill"
                                  style={{
                                    width: `${Math.round(((coverage.supported || 0) + (coverage.partial || 0)) / coverage.total * 100)}%`
                                  }}
                                />
                              </div>
                              <span className="text-xs font-mono text-slate-300">
                                {coverage.supported || 0}/{coverage.total}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500">—</span>
                          )}
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            {(coverage.unclear || 0) > 0 && (
                              <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/40">
                                <HelpCircle className="w-3 h-3" /> {coverage.unclear} unclear
                              </span>
                            )}
                            {(coverage.not_found || 0) > 0 && (
                              <span className="flex items-center gap-1 text-xs text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-900/40">
                                <XCircle className="w-3 h-3" /> {coverage.not_found} missing
                              </span>
                            )}
                            {!(coverage.unclear || coverage.not_found) && (
                              <span className="text-xs text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Complete
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          {getInterviewBadge((candidate.interview_status as string) || 'not_started')}
                        </td>
                        <td className="text-right">
                          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 inline" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Requirement Matrix */}
      {activeTab === 'matrix' && (
        <div className="glass-card-static p-6">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-white">Full Requirement vs Candidate Evidence Matrix</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Inspect verified evidence across all candidates. Click any cell to open the exact resume quote and validation notes.
            </p>
          </div>
          <RequirementMatrix
            requirements={requirements}
            candidates={candidates}
            onSelectEvidence={setSelectedEvidence}
          />
        </div>
      )}

      {/* Tab 3: Side-by-Side Comparison */}
      {activeTab === 'compare' && (
        <div className="glass-card-static p-6">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-white">Side-by-Side Candidate Comparison</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Direct factual comparison across qualifications, experience history, skills, and evidence citations.
            </p>
          </div>
          <CandidateComparison
            candidates={candidates}
            requirements={requirements}
            onSelectEvidence={setSelectedEvidence}
          />
        </div>
      )}

      {/* Evidence Viewer Slide-over Drawer */}
      <EvidenceDrawer
        evidence={selectedEvidence}
        onClose={() => setSelectedEvidence(null)}
      />
    </div>
  );
}
