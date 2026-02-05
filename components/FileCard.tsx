
import React from 'react';
import { GameFile } from '../types';

interface FileCardProps {
  file: GameFile;
  onDelete: (id: string) => void;
  onTogglePublic?: (id: string) => void;
  showPublicControls?: boolean;
}

export const FileCard: React.FC<FileCardProps> = ({ file, onDelete, onTogglePublic, showPublicControls = true }) => {
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleViewPage = () => {
    if (!file.generatedHtml) return;
    const blob = new Blob([file.generatedHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const handleDownloadHtml = () => {
    if (!file.generatedHtml) return;
    const blob = new Blob([file.generatedHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file.aiMetadata?.title || 'game'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-all group relative flex flex-col h-full">
      {/* Cover Image */}
      <div className="aspect-video w-full bg-slate-900 relative overflow-hidden">
        {file.coverUrl ? (
          <img src={file.coverUrl} alt={file.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-700">
            {file.status === 'processing' ? (
              <div className="animate-pulse flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">Generating Cover...</span>
              </div>
            ) : (
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
          </div>
        )}
        
        {/* Delete Badge */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button 
            onClick={() => onDelete(file.id)}
            className="p-1.5 bg-red-500/80 backdrop-blur-sm hover:bg-red-500 text-white rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        {/* Public Badge */}
        {file.isPublic && (
          <div className="absolute top-2 left-2 bg-green-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1 shadow-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
            Public
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="mb-3">
          <h3 className="font-bold text-slate-100 truncate text-lg">
            {file.aiMetadata?.title || file.name}
          </h3>
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">
             By {file.authorName || 'Anonymous'} • {file.type} • {formatSize(file.size)}
          </p>
        </div>

        <div className="flex-1">
          {file.status === 'processing' ? (
            <div className="space-y-2">
              <div className="h-4 bg-slate-700/50 rounded animate-pulse w-full"></div>
              <div className="h-4 bg-slate-700/50 rounded animate-pulse w-2/3"></div>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                {file.aiMetadata?.description}
              </p>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {file.aiMetadata?.suggestedTags.slice(0, 3).map(tag => (
                  <span key={tag} className="px-1.5 py-0.5 bg-indigo-500/10 rounded text-[9px] text-indigo-300 border border-indigo-500/20 font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        {file.status === 'ready' && (
          <div className="space-y-2 mt-auto pt-4 border-t border-slate-700/50">
            <div className="flex gap-2">
              <button 
                onClick={handleViewPage}
                className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                Launch App
              </button>
              <button 
                onClick={handleDownloadHtml}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
                title="Export"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
            </div>
            
            {showPublicControls && onTogglePublic && (
              <button 
                onClick={() => onTogglePublic(file.id)}
                className={`w-full py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg border transition-all ${
                  file.isPublic 
                  ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20' 
                  : 'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20'
                }`}
              >
                {file.isPublic ? 'Remove from Discovery' : 'Publish to Discovery'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
