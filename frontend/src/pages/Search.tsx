import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import {
  Search as SearchIcon, User, Briefcase, Loader2, Sparkles,
  ArrowRight, Quote, ExternalLink, HelpCircle
} from 'lucide-react';
import EvidenceDrawer, { type EvidenceData } from '../components/EvidenceDrawer';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Record<string, unknown>[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDrawerEvidence, setSelectedDrawerEvidence] = useState<EvidenceData | null>(null);

  const exampleQueries = [
    'Show candidates with Node.js experience',
    'Find candidates with C++ and backend experience',
    'Which candidates mention AWS but need validation?',
    'Candidates with React and TypeScript leadership',
    'Backend engineers with PostgreSQL database query optimization',
  ];

  const handleSearchWithQuery = async (searchQuery: string) => {
    setQuery(searchQuery);
    setLoading(true);
    try {
      const data = await api.searchCandidates(searchQuery);
      setResults(data);
    } catch (err) {
      console.error(err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    handleSearchWithQuery(query);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-950/80 text-blue-400 border border-blue-800/40 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Natural Language Intelligence
          </span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
          Ask HireFlow
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Perform semantic & keyword search across all parsed candidate resumes, experience histories, and evidence mappings.
        </p>
      </div>

      {/* Prominent Search Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-blue-900/40 shadow-2xl space-y-4">
        <form onSubmit={handleSubmit} className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
          <input
            type="text"
            className="w-full pl-12 pr-32 py-4 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-base shadow-inner transition"
            placeholder="Ask anything... e.g. 'Show candidates with Node.js experience'"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="btn-primary absolute right-2.5 top-1/2 -translate-y-1/2 text-xs py-2 px-4 shadow-md"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>Search</span>
          </button>
        </form>

        {/* Quick Suggestion Pills */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Try Recommended Queries:
          </p>
          <div className="flex flex-wrap gap-2">
            {exampleQueries.map((qText, i) => (
              <button
                key={i}
                onClick={() => handleSearchWithQuery(qText)}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 text-slate-300 hover:text-white transition flex items-center gap-1.5 shadow-sm"
              >
                <Sparkles className="w-3 h-3 text-blue-400" />
                <span>{qText}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Section */}
      {results !== null && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>
              Found <strong className="text-white">{results.length}</strong> matching candidate{results.length !== 1 ? 's' : ''}
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              Vector & Keyword Hybrid Search
            </span>
          </div>

          {results.length === 0 ? (
            <div className="glass-card-static p-12 text-center border border-dashed border-slate-800 rounded-xl space-y-2">
              <HelpCircle className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-slate-300">No candidate matches found</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try querying broader skill keywords, job titles, or experience requirements.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {results.map((result, i) => {
                const chunks = (result.matched_chunks as Record<string, unknown>[]) || [];
                const candidateId = result.candidate_id as string;
                const score = (result.relevance_score as number) || 0;

                return (
                  <div
                    key={i}
                    className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/40 transition space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md flex-shrink-0">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <Link
                            to={`/candidates/${candidateId}`}
                            className="font-bold text-base text-white hover:text-blue-400 transition"
                          >
                            {result.candidate_name as string}
                          </Link>
                          <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <Briefcase className="w-3 h-3 text-slate-500" /> {result.job_title as string}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                          {(score * 100).toFixed(0)}% Relevance Match
                        </span>
                        <Link
                          to={`/candidates/${candidateId}`}
                          className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
                        >
                          Profile <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>

                    {/* Matched Source Evidence Snippet */}
                    {chunks.length > 0 && (
                      <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs space-y-1.5">
                        <div className="flex items-center justify-between text-slate-400">
                          <span className="font-semibold text-blue-400 flex items-center gap-1">
                            <Quote className="w-3 h-3" /> Cited Document Evidence:
                          </span>
                          <button
                            onClick={() => setSelectedDrawerEvidence({
                              candidate_id: candidateId,
                              candidate_name: result.candidate_name as string,
                              evidence_text: String(chunks[0].text || ''),
                              status: 'SUPPORTED',
                              confidence: score,
                              source_location: 'Resume text match',
                            })}
                            className="text-[11px] text-blue-400 hover:underline flex items-center gap-1"
                          >
                            Inspect Citation <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-slate-200 italic leading-relaxed">
                          "{String(chunks[0].text || '').substring(0, 240)}..."
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Slide-over Evidence Drawer */}
      <EvidenceDrawer
        evidence={selectedDrawerEvidence}
        onClose={() => setSelectedDrawerEvidence(null)}
      />
    </div>
  );
}
