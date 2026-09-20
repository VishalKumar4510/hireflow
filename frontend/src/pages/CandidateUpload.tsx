import { useState, useCallback, type DragEvent, type ChangeEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Upload, CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';

export default function CandidateUpload() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<Record<string, unknown> | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter(f =>
      f.name.match(/\.(pdf|docx|doc|txt)$/i)
    );
    setFiles(prev => [...prev, ...droppedFiles]);
  }, []);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (idx: number) => {
    setFiles(files.filter((_, i) => i !== idx));
  };

  const handleUpload = async () => {
    if (!jobId || files.length === 0) return;
    setUploading(true);
    setError('');
    setProgress(0);

    try {
      const result = await api.uploadResumes(jobId, files, pct => setProgress(pct));
      setResults(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (name: string) => {
    if (name.endsWith('.pdf')) return '📄';
    if (name.endsWith('.docx') || name.endsWith('.doc')) return '📝';
    return '📎';
  };

  if (results) {
    const candidates = (results.candidates as Record<string, unknown>[]) || [];
    const errors = (results.errors as Record<string, string>[]) || [];

    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div className="text-center mb-8">
          <CheckCircle className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--color-accent-emerald)' }} />
          <h1 className="text-2xl font-bold">Upload Complete</h1>
          <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
            {candidates.length} candidate{candidates.length !== 1 ? 's' : ''} processed successfully
            {errors.length > 0 && `, ${errors.length} error${errors.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {candidates.map((c, i) => (
          <div key={i} className="glass-card p-4 flex items-center justify-between cursor-pointer" onClick={() => navigate(`/candidates/${c.id}`)}>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="font-medium">{c.name as string}</p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{c.file_name as string}</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
          </div>
        ))}

        {errors.map((e, i) => (
          <div key={i} className="glass-card-static p-4 flex items-center gap-3" style={{ borderColor: 'rgba(244,63,94,0.3)' }}>
            <XCircle className="w-5 h-5 text-rose-400" />
            <div>
              <p className="font-medium text-rose-400">{e.file_name}</p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{e.error}</p>
            </div>
          </div>
        ))}

        <div className="flex justify-center gap-3">
          <button onClick={() => { setFiles([]); setResults(null); }} className="btn-secondary">
            Upload More
          </button>
          <button onClick={() => navigate(`/jobs/${jobId}`)} className="btn-primary">
            View Candidates <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Upload Resumes</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          Upload candidate resumes for AI analysis (PDF, DOCX, TXT)
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl text-sm" style={{
          background: 'rgba(244, 63, 94, 0.1)',
          border: '1px solid rgba(244, 63, 94, 0.2)',
          color: '#fb7185',
        }}>{error}</div>
      )}

      {/* Drop Zone */}
      <div
        className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <Upload className="w-12 h-12 mx-auto mb-4" style={{ color: dragOver ? 'var(--color-accent-blue)' : 'var(--color-text-muted)' }} />
        <p className="font-medium mb-1">Drag & drop resumes here</p>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>or click to browse • PDF, DOCX, TXT</p>
        <input
          id="file-input"
          type="file"
          multiple
          accept=".pdf,.docx,.doc,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">{files.length} file{files.length !== 1 ? 's' : ''} selected</p>
          {files.map((file, i) => (
            <div key={i} className="glass-card-static p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-lg">{getFileIcon(file.name)}</span>
                <div>
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <button onClick={() => removeFile(i)} className="btn-ghost p-1">
                <XCircle className="w-4 h-4 text-rose-400" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="glass-card-static p-6 text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin" style={{ color: 'var(--color-accent-blue)' }} />
          <p className="text-sm mb-3">Processing resumes with AI...</p>
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>{progress}%</p>
        </div>
      )}

      {/* Upload Button */}
      {files.length > 0 && !uploading && (
        <div className="flex justify-end">
          <button onClick={handleUpload} className="btn-primary">
            <Upload className="w-4 h-4" /> Upload & Analyze ({files.length})
          </button>
        </div>
      )}
    </div>
  );
}
