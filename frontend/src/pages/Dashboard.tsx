import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import {
  Briefcase, Users, MessageSquare, AlertTriangle,
  Plus, ArrowRight, Clock, TrendingUp, Sparkles,
  FileCheck2, ShieldCheck, Search, LayoutDashboard,
  FileText, Table, ArrowLeftRight, Printer, ClipboardList
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDemoTour, setShowDemoTour] = useState(true);

  useEffect(() => {
    api.getDashboard().then(data => {
      setStats(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 skeleton rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-28 skeleton rounded-xl" />)}
        </div>
        <div className="h-32 skeleton rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 skeleton rounded-xl" />
          <div className="h-72 skeleton rounded-xl" />
        </div>
      </div>
    );
  }

  const activeJobs = (stats?.active_jobs as number) || 0;
  const totalCandidates = (stats?.total_candidates as number) || 0;
  const interviewsCompleted = (stats?.interviews_completed as number) || 0;
  const validationNeeded = (stats?.candidates_requiring_validation as number) || 0;
  const recentJobs = (stats?.recent_jobs as Record<string, unknown>[]) || [];
  const recentActivity = (stats?.recent_activity as Record<string, unknown>[]) || [];

  const firstJobId = recentJobs[0]?.id as string;

  const statCards = [
    {
      label: 'Active Requisitions',
      value: activeJobs,
      subtitle: 'Open positions in review',
      icon: Briefcase,
      color: 'text-blue-400',
      bg: 'bg-blue-950/40 border-blue-800/40',
    },
    {
      label: 'Candidates in Pool',
      value: totalCandidates,
      subtitle: 'Processed resumes',
      icon: Users,
      color: 'text-emerald-400',
      bg: 'bg-emerald-950/40 border-emerald-800/40',
    },
    {
      label: 'Interviews Completed',
      value: interviewsCompleted,
      subtitle: 'Notes & evidence logged',
      icon: MessageSquare,
      color: 'text-violet-400',
      bg: 'bg-violet-950/40 border-violet-800/40',
    },
    {
      label: 'Needs Validation',
      value: validationNeeded,
      subtitle: 'Unclear or partial items',
      icon: AlertTriangle,
      color: 'text-amber-400',
      bg: 'bg-amber-950/40 border-amber-800/40',
    },
    {
      label: 'Analyzed Documents',
      value: totalCandidates > 0 ? totalCandidates : 0,
      subtitle: 'Verified PDF / DOCX',
      icon: FileCheck2,
      color: 'text-cyan-400',
      bg: 'bg-cyan-950/40 border-cyan-800/40',
    },
  ];

  const demoSteps = [
    {
      num: '01',
      title: 'Dashboard Pipeline',
      desc: 'Pipeline overview & live recruitment intelligence metrics across all screening stages.',
      link: '/',
      icon: LayoutDashboard,
      color: 'text-blue-400',
      bg: 'bg-blue-950/60 border-blue-800/40',
    },
    {
      num: '02',
      title: 'Job Requisition',
      desc: 'Extract and structure explicit hiring requirements from any job description.',
      link: firstJobId ? `/jobs/${firstJobId}` : '/jobs/new',
      icon: FileText,
      color: 'text-violet-400',
      bg: 'bg-violet-950/60 border-violet-800/40',
    },
    {
      num: '03',
      title: 'Requirement Matrix',
      desc: 'Interactive cross-candidate grid highlighting verified, partial, and unclear qualifications.',
      link: firstJobId ? `/jobs/${firstJobId}` : '/',
      icon: Table,
      color: 'text-cyan-400',
      bg: 'bg-cyan-950/60 border-cyan-800/40',
    },
    {
      num: '04',
      title: 'Candidate Evidence',
      desc: 'Slide-over drawer inspecting verbatim resume quotes, citations, and AI grounding notes.',
      link: firstJobId ? `/jobs/${firstJobId}` : '/',
      icon: ShieldCheck,
      color: 'text-emerald-400',
      bg: 'bg-emerald-950/60 border-emerald-800/40',
    },
    {
      num: '05',
      title: 'Side-by-Side Compare',
      desc: 'Objective qualification comparisons across skills, experience, and evidence with zero ranking.',
      link: firstJobId ? `/jobs/${firstJobId}` : '/',
      icon: ArrowLeftRight,
      color: 'text-indigo-400',
      bg: 'bg-indigo-950/60 border-indigo-800/40',
    },
    {
      num: '06',
      title: 'Interview Copilot',
      desc: 'Structured interview sessions with requirement-linked questions and real-time response tracking.',
      link: firstJobId ? `/interviews/${firstJobId}/00000000-0000-4000-8000-000000000011` : '/',
      icon: MessageSquare,
      color: 'text-amber-400',
      bg: 'bg-amber-950/60 border-amber-800/40',
    },
    {
      num: '07',
      title: 'Evaluation Report',
      desc: 'Generate printable executive dossiers and PDF reports with evidence citations and interview notes.',
      link: firstJobId ? `/interviews/${firstJobId}/00000000-0000-4000-8000-000000000011` : '/',
      icon: Printer,
      color: 'text-rose-400',
      bg: 'bg-rose-950/60 border-rose-800/40',
    },
    {
      num: '08',
      title: 'Ask HireFlow Search',
      desc: 'Semantic natural language search across candidates, skills, and evidence citations.',
      link: '/search',
      icon: Search,
      color: 'text-sky-400',
      bg: 'bg-sky-950/60 border-sky-800/40',
    },
    {
      num: '09',
      title: 'Audit Trail',
      desc: 'Immutable provenance logs recording all model prompts, structured outputs, and timestamps.',
      link: '/audit',
      icon: ClipboardList,
      color: 'text-teal-400',
      bg: 'bg-teal-950/60 border-teal-800/40',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/40 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Human Recruiter Intelligence
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">Recruitment Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Evidence-grounded candidate evaluation and interview intelligence workspace.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link to="/search" className="btn-secondary text-xs flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-blue-400" /> Ask HireFlow
          </Link>
          <Link to="/jobs/new" className="btn-primary text-xs flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Create Requisition
          </Link>
        </div>
      </div>

      {/* Interactive Guided Demo Experience Flow */}
      {showDemoTour && (
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-950 border border-blue-900/50 shadow-xl relative">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                HireFlow Complete Product Workflow
              </h2>
            </div>
            <button
              onClick={() => setShowDemoTour(false)}
              className="text-xs text-slate-500 hover:text-slate-300 transition"
            >
              Dismiss Tour
            </button>
          </div>
          <p className="text-xs text-slate-400 mb-5 max-w-2xl">
            Follow the 9-step recruitment intelligence journey from job requisition creation to evidence mapping and exportable evaluation:
          </p>

          {/* Responsive Grid: Mobile 1-2 cols, Tablet 2-3 cols, Desktop 3-4 cols */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
            {demoSteps.map((step) => (
              <Link
                key={step.num}
                to={step.link}
                className="group p-4 rounded-xl bg-slate-950/80 border border-slate-800/90 hover:border-blue-500/50 hover:bg-slate-900 transition-all duration-200 flex flex-col justify-between shadow-sm hover:translate-y-[-1px]"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-mono font-bold text-blue-400 bg-blue-950/90 px-2 py-0.5 rounded border border-blue-900/40">
                      STEP {step.num}
                    </span>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${step.bg}`}>
                      <step.icon className={`w-4 h-4 ${step.color}`} />
                    </div>
                  </div>
                  <h3 className="font-semibold text-sm text-slate-100 group-hover:text-blue-300 transition-colors leading-snug">
                    {step.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
                <div className="mt-4 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 group-hover:text-blue-400 transition-colors">
                  <span>Explore step</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`p-4 rounded-xl border ${card.bg} transition hover:translate-y-[-1px] shadow-sm`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{card.label}</span>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
            <p className="text-2xl font-extrabold text-white tracking-tight">{card.value}</p>
            <p className="text-[11px] text-slate-500 mt-1">{card.subtitle}</p>
          </div>
        ))}
      </div>

      {/* Candidate Pipeline Visualization */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Candidate Pipeline Stages
          </h3>
          <span className="text-xs text-slate-400">{totalCandidates} Candidates Active</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <p className="text-slate-400">1. Sourced / Uploaded</p>
            <p className="text-base font-bold text-white mt-0.5">{totalCandidates}</p>
            <p className="text-[11px] text-slate-500 mt-1">Parsed & profile indexed</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <p className="text-slate-400">2. Evidence Grounded</p>
            <p className="text-base font-bold text-emerald-400 mt-0.5">{totalCandidates}</p>
            <p className="text-[11px] text-slate-500 mt-1">Mapped to requirements</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <p className="text-slate-400">3. Questions Prepared</p>
            <p className="text-base font-bold text-blue-400 mt-0.5">{totalCandidates}</p>
            <p className="text-[11px] text-slate-500 mt-1">Targeted interview plan</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <p className="text-slate-400">4. Interview Conducted</p>
            <p className="text-base font-bold text-violet-400 mt-0.5">{interviewsCompleted}</p>
            <p className="text-[11px] text-slate-500 mt-1">Notes & answers captured</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 sm:col-span-2 md:col-span-1">
            <p className="text-slate-400">5. Report Ready</p>
            <p className="text-base font-bold text-cyan-400 mt-0.5">{interviewsCompleted}</p>
            <p className="text-[11px] text-slate-500 mt-1">Printable audit export</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Jobs + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Jobs Column */}
        <div className="lg:col-span-2 glass-card-static p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-400" />
              Active Job Requisitions ({recentJobs.length})
            </h2>
            <Link to="/jobs/new" className="text-xs text-blue-400 hover:underline flex items-center gap-1">
              New Job <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentJobs.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl space-y-2">
              <Briefcase className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-slate-300">No job requisitions created yet</p>
              <Link to="/jobs/new" className="btn-primary text-xs inline-flex mt-2">
                <Plus className="w-3.5 h-3.5" /> Create First Job
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentJobs.map((job) => (
                <div
                  key={job.id as string}
                  className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/40 transition space-y-2.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <Link to={`/jobs/${job.id}`} className="font-bold text-base text-white hover:text-blue-400 transition">
                        {job.title as string}
                      </Link>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {job.department as string || 'General'} {job.location ? `• ${job.location as string}` : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-800/30">
                        {(job.candidate_count as number) || 0} Candidates
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-violet-950/60 text-violet-300 border border-violet-800/30">
                        {(job.interview_count as number) || 0} Interviews
                      </span>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
                    <span className="truncate max-w-sm sm:max-w-md">
                      {(job.description as string)?.substring(0, 90)}...
                    </span>
                    <Link
                      to={`/jobs/${job.id}`}
                      className="text-xs text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 font-medium flex-shrink-0"
                    >
                      Open Matrix & Candidates <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Audited Activity */}
        <div className="glass-card-static p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              Audited Activity
            </h2>
            <Link to="/audit" className="text-xs text-blue-400 hover:underline flex items-center gap-1">
              Full Log <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentActivity.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl">
              <Clock className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <p className="text-xs text-slate-400">No activity logged yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.slice(0, 6).map((activity, i) => (
                <div key={i} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200 capitalize">
                      {(activity.title as string)?.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(activity.timestamp as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] truncate">
                    {activity.description as string || 'AI operation recorded'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
