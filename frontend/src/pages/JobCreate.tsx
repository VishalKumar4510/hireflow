import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import {
  Briefcase, MapPin, Building, FileText, Sparkles,
  Loader2, Plus, Trash2, Edit3, Check, X
} from 'lucide-react';

interface Requirement {
  [key: string]: unknown;
  category: string;
  text: string;
  priority: string;
  is_required: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  technical_skill: '💻 Technical Skills',
  soft_skill: '🤝 Soft Skills',
  experience: '📋 Experience',
  education: '🎓 Education',
  certification: '📜 Certifications',
  domain_knowledge: '🧠 Domain Knowledge',
  responsibility: '📌 Responsibilities',
  other: '📎 Other',
};

export default function JobCreate() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'input' | 'analyzing' | 'review'>('input');
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [jobId, setJobId] = useState('');
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [error, setError] = useState('');
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editText, setEditText] = useState('');

  const handleAnalyze = async () => {
    if (!title || !description) {
      setError('Title and description are required');
      return;
    }
    setError('');
    setStep('analyzing');

    try {
      const job = await api.createJob({ title, department, location, description });
      const id = job.id as string;
      setJobId(id);

      const result = await api.analyzeJob(id);
      const reqs = (result.requirements as Requirement[]) || [];
      setRequirements(reqs);
      setStep('review');
    } catch (err) {
      setError((err as Error).message);
      setStep('input');
    }
  };

  const handleSaveRequirements = async () => {
    try {
      await api.updateRequirements(jobId, requirements);
      navigate(`/jobs/${jobId}`);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const addRequirement = () => {
    setRequirements([...requirements, { category: 'technical_skill', text: '', priority: 'required', is_required: true }]);
    setEditingIdx(requirements.length);
    setEditText('');
  };

  const removeRequirement = (idx: number) => {
    setRequirements(requirements.filter((_, i) => i !== idx));
  };

  const startEdit = (idx: number) => {
    setEditingIdx(idx);
    setEditText(requirements[idx].text);
  };

  const saveEdit = () => {
    if (editingIdx !== null && editText.trim()) {
      const updated = [...requirements];
      updated[editingIdx] = { ...updated[editingIdx], text: editText.trim() };
      setRequirements(updated);
    }
    setEditingIdx(null);
    setEditText('');
  };

  // Group requirements by category
  const grouped = requirements.reduce<Record<string, { req: Requirement; idx: number }[]>>((acc, req, idx) => {
    if (!acc[req.category]) acc[req.category] = [];
    acc[req.category].push({ req, idx });
    return acc;
  }, {});

  if (step === 'analyzing') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center glass-card-static p-12 max-w-md animate-pulse-glow">
          <Sparkles className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--color-accent-violet)' }} />
          <h2 className="text-xl font-semibold mb-2">Analyzing Job Description</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
            Extracting requirements, skills, and qualifications...
          </p>
          <Loader2 className="w-6 h-6 mx-auto animate-spin" style={{ color: 'var(--color-accent-blue)' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">
          {step === 'input' ? 'Create New Job' : 'Review Requirements'}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          {step === 'input'
            ? 'Enter job details and let AI extract requirements'
            : 'Review, edit, or add requirements before proceeding'
          }
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl text-sm" style={{
          background: 'rgba(244, 63, 94, 0.1)',
          border: '1px solid rgba(244, 63, 94, 0.2)',
          color: '#fb7185',
        }}>
          {error}
        </div>
      )}

      {step === 'input' && (
        <div className="glass-card-static p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                <Briefcase className="w-4 h-4 inline mr-1" /> Job Title *
              </label>
              <input className="input-field" placeholder="Senior Full-Stack Engineer" value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                <Building className="w-4 h-4 inline mr-1" /> Department
              </label>
              <input className="input-field" placeholder="Engineering" value={department} onChange={e => setDepartment(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                <MapPin className="w-4 h-4 inline mr-1" /> Location
              </label>
              <input className="input-field" placeholder="Remote / San Francisco" value={location} onChange={e => setLocation(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              <FileText className="w-4 h-4 inline mr-1" /> Job Description *
            </label>
            <textarea
              className="input-field"
              rows={12}
              placeholder="Paste the full job description here..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <button onClick={handleAnalyze} className="btn-primary" disabled={!title || !description}>
              <Sparkles className="w-4 h-4" /> Analyze Job
            </button>
          </div>
        </div>
      )}

      {step === 'review' && (
        <>
          <div className="glass-card-static p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{title}</h3>
              <span className="badge badge-supported">{requirements.length} requirements</span>
            </div>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {department} {location ? `• ${location}` : ''}
            </p>
          </div>

          <div className="space-y-4">
            {Object.entries(grouped).map(([category, items]) => (
              <div key={category} className="glass-card-static p-5">
                <h3 className="font-semibold text-sm mb-3">{CATEGORY_LABELS[category] || category}</h3>
                <div className="space-y-2">
                  {items.map(({ req, idx }) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
                      {editingIdx === idx ? (
                        <div className="flex-1 flex items-center gap-2">
                          <input className="input-field flex-1" value={editText} onChange={e => setEditText(e.target.value)} autoFocus />
                          <button onClick={saveEdit} className="btn-ghost"><Check className="w-4 h-4 text-green-400" /></button>
                          <button onClick={() => setEditingIdx(null)} className="btn-ghost"><X className="w-4 h-4 text-red-400" /></button>
                        </div>
                      ) : (
                        <>
                          <span className="flex-1 text-sm">{req.text}</span>
                          <span className={`badge ${req.is_required ? 'badge-supported' : 'badge-partial'}`}>
                            {req.priority}
                          </span>
                          <button onClick={() => startEdit(idx)} className="btn-ghost p-1"><Edit3 className="w-3 h-3" /></button>
                          <button onClick={() => removeRequirement(idx)} className="btn-ghost p-1"><Trash2 className="w-3 h-3 text-red-400" /></button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <button onClick={addRequirement} className="btn-secondary">
              <Plus className="w-4 h-4" /> Add Requirement
            </button>
            <div className="flex gap-3">
              <button onClick={() => setStep('input')} className="btn-secondary">Back</button>
              <button onClick={handleSaveRequirements} className="btn-primary">
                <Check className="w-4 h-4" /> Save & Continue
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
