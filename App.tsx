
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { GameFile, LibraryStats } from './types';
import { analyzeAndConvertGameFile, generateCoverArt } from './services/geminiService';
import { Button } from './components/Button';
import { FileCard } from './components/FileCard';
import { StatsPanel } from './components/StatsPanel';

const App: React.FC = () => {
  const [files, setFiles] = useState<GameFile[]>(() => {
    const saved = localStorage.getItem('gamevault_files');
    return saved ? JSON.parse(saved) : [];
  });
  const [view, setView] = useState<'my-library' | 'discovery'>('discovery');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    localStorage.setItem('gamevault_files', JSON.stringify(files));
  }, [files]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedList = event.target.files;
    if (!uploadedList) return;

    setIsUploading(true);
    const newFilesBatch: GameFile[] = [];

    for (let i = 0; i < uploadedList.length; i++) {
      const file = uploadedList[i];
      const fileId = Math.random().toString(36).substr(2, 9);
      
      const newFile: GameFile = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type || file.name.split('.').pop() || 'unknown',
        lastModified: file.lastModified,
        status: 'processing',
        isPublic: false,
        authorName: 'User_' + Math.floor(Math.random() * 900)
      };
      
      newFilesBatch.push(newFile);
    }

    setFiles(prev => [...newFilesBatch, ...prev]);
    setView('my-library');

    // Process each file
    for (const file of newFilesBatch) {
      try {
        const result = await analyzeAndConvertGameFile(file.name, file.type);
        
        // Generate Cover Art based on AI analysis
        const coverUrl = await generateCoverArt(
          result.metadata.title, 
          result.metadata.estimatedGenre, 
          result.metadata.description
        );

        setFiles(prev => prev.map(f => 
          f.id === file.id ? { 
            ...f, 
            aiMetadata: result.metadata, 
            generatedHtml: result.htmlPage,
            coverUrl: coverUrl,
            status: 'ready' 
          } : f
        ));
      } catch (error) {
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'error' } : f
        ));
      }
    }

    setIsUploading(false);
    event.target.value = '';
  }, []);

  const deleteFile = (id: string) => {
    if (confirm("Are you sure you want to delete this game file?")) {
      setFiles(prev => prev.filter(f => f.id !== id));
    }
  };

  const togglePublic = (id: string) => {
    setFiles(prev => prev.map(f => 
      f.id === id ? { ...f, isPublic: !f.isPublic } : f
    ));
  };

  const libraryStats = useMemo((): LibraryStats[] => {
    const categories: Record<string, number> = {};
    files.forEach(f => {
      const cat = f.aiMetadata?.category || 'Analyzing';
      categories[cat] = (categories[cat] || 0) + 1;
    });

    const colors = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4'];
    
    return Object.entries(categories).map(([name, value], idx) => ({
      name,
      value,
      fill: colors[idx % colors.length]
    }));
  }, [files]);

  const publicFiles = useMemo(() => files.filter(f => f.isPublic), [files]);

  return (
    <div className="min-h-screen pb-20 bg-slate-950">
      {/* Header */}
      <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('discovery')}>
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <span className="text-xl font-bold tracking-tight text-white hidden sm:block">GameVault<span className="text-indigo-500">AI</span></span>
            </div>

            <div className="flex bg-slate-900 rounded-lg p-1 text-xs font-bold uppercase tracking-widest">
              <button 
                onClick={() => setView('discovery')}
                className={`px-4 py-1.5 rounded-md transition-all ${view === 'discovery' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Discovery
              </button>
              <button 
                onClick={() => setView('my-library')}
                className={`px-4 py-1.5 rounded-md transition-all ${view === 'my-library' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                My Assets
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <label className="cursor-pointer">
              <input 
                type="file" 
                multiple 
                className="hidden" 
                onChange={handleFileUpload}
                disabled={isUploading}
              />
              <Button isLoading={isUploading} variant="primary" className="!rounded-full px-6 shadow-xl">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Publish New Game
              </Button>
            </label>
          </div>
        </div>
      </nav>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        {view === 'discovery' ? (
          <div className="space-y-12">
            <header className="max-w-2xl">
              <h1 className="text-5xl font-black text-white mb-4 tracking-tight">Public <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Discovery</span></h1>
              <p className="text-slate-400 text-lg leading-relaxed">
                Explore a community of games and assets converted into standalone HTML experiences. Fully free, forever public.
              </p>
            </header>

            {publicFiles.length === 0 ? (
              <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-20 text-center flex flex-col items-center">
                <div className="w-24 h-24 bg-slate-800 rounded-3xl rotate-12 flex items-center justify-center mb-8 border border-slate-700 shadow-2xl">
                   <svg className="w-12 h-12 text-slate-600 -rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-slate-100 mb-2">The Vault is empty</h3>
                <p className="text-slate-500 max-w-sm mb-10">
                  Be the first to upload a game and publish it to the world. Everything is transformed into a portable HTML page.
                </p>
                <label className="cursor-pointer">
                  <input type="file" multiple className="hidden" onChange={handleFileUpload} />
                  <Button variant="primary" className="px-10 h-14 !rounded-2xl text-lg font-bold">Start Publishing</Button>
                </label>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {publicFiles.map(file => (
                  <FileCard 
                    key={file.id} 
                    file={file} 
                    onDelete={deleteFile} 
                    onTogglePublic={togglePublic}
                    showPublicControls={true}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* My Workspace */}
            <div className="lg:col-span-2 space-y-8">
              <header className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-black text-white">My Workspace</h2>
                  <p className="text-slate-500 text-sm mt-1">Manage and publish your private conversions.</p>
                </div>
                <div className="px-4 py-1.5 bg-indigo-500/10 rounded-full border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest">
                  {files.length} Total Assets
                </div>
              </header>

              {files.length === 0 ? (
                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-16 text-center">
                  <svg className="w-16 h-16 text-slate-700 mx-auto mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                  </svg>
                  <p className="text-slate-400 font-medium">No files uploaded yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {files.map(file => (
                    <FileCard 
                      key={file.id} 
                      file={file} 
                      onDelete={deleteFile} 
                      onTogglePublic={togglePublic}
                      showPublicControls={true}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar Stats */}
            <aside className="space-y-8">
              <StatsPanel stats={libraryStats} />
              
              <div className="bg-indigo-600 rounded-3xl p-8 relative overflow-hidden shadow-2xl shadow-indigo-500/20">
                 <div className="relative z-10 text-white">
                    <h3 className="text-2xl font-black mb-4">Portability First</h3>
                    <p className="text-indigo-100 text-sm leading-relaxed mb-6">
                      Every game is published as a single, self-contained HTML file. No dependencies, no server needed for the game logic.
                    </p>
                    <div className="flex -space-x-3 overflow-hidden">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-indigo-600 bg-slate-800 flex items-center justify-center text-[10px] font-bold">
                          {String.fromCharCode(64 + i)}
                        </div>
                      ))}
                      <div className="inline-block h-8 w-8 rounded-full ring-2 ring-indigo-600 bg-indigo-400 flex items-center justify-center text-[10px] font-bold">
                        +84
                      </div>
                    </div>
                    <p className="text-[10px] text-indigo-200 mt-4 uppercase font-black tracking-widest">Growing Community</p>
                 </div>
                 <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                <h3 className="text-lg font-bold text-slate-200 mb-6">Cloud Activity</h3>
                <div className="space-y-6">
                   <div className="flex gap-4">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 shrink-0"></div>
                      <div>
                        <p className="text-sm text-slate-100 font-medium">Conversion Engine</p>
                        <p className="text-xs text-slate-500">Optimized for Gemini 3 Flash</p>
                      </div>
                   </div>
                   <div className="flex gap-4">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                      <div>
                        <p className="text-sm text-slate-100 font-medium">Image Generation</p>
                        <p className="text-xs text-slate-500">Live 2.5 Flash Rendering</p>
                      </div>
                   </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>

      <footer className="max-w-7xl mx-auto px-4 text-center mt-32 text-slate-700 text-[10px] font-bold uppercase tracking-[0.2em] border-t border-slate-900 pt-12 pb-20">
        <p>GameVault AI / Global Public Archive / v1.4.2</p>
        <p className="mt-2 text-slate-800">Powered by the Google Gemini Intelligence Suite</p>
      </footer>
    </div>
  );
};

export default App;
