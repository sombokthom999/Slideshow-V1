
import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Edit2, Trash2, Power, 
  ChevronUp, ChevronDown, Save, X, Layout, 
  Monitor, Code, Image as ImageIcon, CheckCircle, 
  PauseCircle, Settings, Film, Play, Info, Copy, Video, Youtube, ExternalLink
} from 'lucide-react';
import { Slide, SlideStatus } from '../types';
import { getSlides, saveSlides } from '../services/storageService';
import NetflixSlideshow from './NetflixSlideshow';

const AdminPanel: React.FC = () => {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [view, setView] = useState<'manage' | 'preview' | 'code'>('manage');
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  
  // Form State
  const [editingSlide, setEditingSlide] = useState<Partial<Slide> | null>(null);

  useEffect(() => {
    setSlides(getSlides());
  }, []);

  const stats = {
    total: slides.length,
    active: slides.filter(s => s.status === 'active').length,
    inactive: slides.filter(s => s.status === 'inactive').length,
  };

  const extractYouTubeId = (url: string) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  };

  const isYouTube = (url: string) => {
    return !!extractYouTubeId(url);
  };

  const handleSaveSlide = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlide?.title || !editingSlide?.image) return;

    let updatedSlides: Slide[];
    const now = new Date().toISOString();

    if (editingSlide.id) {
      updatedSlides = slides.map(s => 
        s.id === editingSlide.id 
          ? { ...s, ...editingSlide, updatedAt: now } as Slide 
          : s
      );
    } else {
      const newSlide: Slide = {
        ...editingSlide,
        id: crypto.randomUUID(),
        order: slides.length + 1,
        status: editingSlide.status || 'active',
        createdAt: now,
        updatedAt: now,
      } as Slide;
      updatedSlides = [...slides, newSlide];
    }

    setSlides(updatedSlides);
    saveSlides(updatedSlides);
    setIsModalOpen(false);
    setEditingSlide(null);
    
    // Automatic feedback after save
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 5000);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this slide?')) {
      const updated = slides.filter(s => s.id !== id);
      setSlides(updated);
      saveSlides(updated);
    }
  };

  const toggleStatus = (id: string) => {
    const updated = slides.map(s => 
      s.id === id ? { ...s, status: (s.status === 'active' ? 'inactive' : 'active') as SlideStatus } : s
    );
    setSlides(updated);
    saveSlides(updated);
  };

  const moveSlide = (id: string, direction: 'up' | 'down') => {
    const index = slides.findIndex(s => s.id === id);
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= slides.length) return;

    const newSlides = [...slides];
    [newSlides[index], newSlides[newIndex]] = [newSlides[newIndex], newSlides[index]];
    
    const ordered = newSlides.map((s, i) => ({ ...s, order: i + 1 }));
    setSlides(ordered);
    saveSlides(ordered);
  };

  const activeSlidesForPreview = slides
    .filter(s => s.status === 'active')
    .sort((a, b) => a.order - b.order);

  const generateBloggerCode = () => {
    const jsonSlides = JSON.stringify(activeSlidesForPreview);
    return `<!-- KHCinemaa Netflix Slideshow Widget -->
<div id="nx-slider-root" class="nx-slider-container">
  <div id="nx-slider-track" class="nx-slider-track"></div>
  <button id="nx-prev" class="nx-nav-btn nx-prev">❮</button>
  <button id="nx-next" class="nx-nav-btn nx-next">❯</button>
  <div id="nx-dots" class="nx-dots"></div>
</div>

<style>
  .nx-slider-container {
    position: relative; width: 100%; aspect-ratio: 16/9;
    background: #000; overflow: hidden;
    font-family: 'Inter', -apple-system, sans-serif; color: #fff;
  }
  .nx-slider-track { width: 100%; height: 100%; position: relative; }
  .nx-slide {
    position: absolute; inset: 0; opacity: 0;
    transition: opacity 0.8s ease-in-out; display: flex; align-items: center;
  }
  .nx-slide.active { opacity: 1; z-index: 10; }
  .nx-slide-bg { width: 100%; height: 100%; object-fit: cover; position: absolute; inset: 0; }
  
  .nx-video-wrapper {
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    pointer-events: none; z-index: 0; overflow: hidden;
  }
  .nx-video-wrapper iframe {
    width: 150%; height: 150%; position: absolute;
    top: 50%; left: 50%; transform: translate(-50%, -50%);
  }

  .nx-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(90deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 60%, transparent 100%);
    display: flex; align-items: center; padding: 0 8%; z-index: 5;
  }
  .nx-content { max-width: 550px; transform: translateY(20px); opacity: 0; transition: 0.6s cubic-bezier(0.33, 1, 0.68, 1) 0.3s; }
  .nx-slide.active .nx-content { transform: translateY(0); opacity: 1; }
  .nx-title { font-size: clamp(28px, 6vw, 56px); font-weight: 800; margin-bottom: 12px; line-height: 1.1; letter-spacing: -1px; }
  .nx-desc { font-size: clamp(14px, 2vw, 18px); color: #e5e5e5; margin-bottom: 24px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
  
  .nx-btn-group { display: flex; gap: 12px; }
  .nx-btn { padding: 12px 28px; border-radius: 4px; font-weight: 700; text-decoration: none; transition: 0.2s; display: inline-flex; align-items: center; gap: 8px; font-size: 16px; }
  .nx-btn-play { background: #fff; color: #000; }
  .nx-btn-play:hover { background: rgba(255,255,255,0.75); }
  .nx-btn-info { background: rgba(109, 109, 110, 0.7); color: #fff; backdrop-filter: blur(10px); }
  .nx-btn-info:hover { background: rgba(109, 109, 110, 0.4); }

  .nx-nav-btn {
    position: absolute; top: 50%; transform: translateY(-50%); z-index: 20;
    background: rgba(0,0,0,0.1); border: none; color: #fff; font-size: 2.5rem; cursor: pointer;
    padding: 20px; opacity: 0; transition: 0.3s; height: 100%;
  }
  .nx-slider-container:hover .nx-nav-btn { opacity: 0.6; }
  .nx-nav-btn:hover { opacity: 1 !important; background: rgba(0,0,0,0.3); }
  .nx-prev { left: 0; } .nx-next { right: 0; }
  
  .nx-dots { position: absolute; bottom: 30px; right: 5%; z-index: 20; display: flex; gap: 6px; }
  .nx-dot { width: 14px; height: 3px; background: rgba(255,255,255,0.3); border-radius: 1px; cursor: pointer; transition: 0.4s; }
  .nx-dot.active { width: 35px; background: #e50914; }

  @media (max-width: 640px) {
    .nx-slider-container { aspect-ratio: 16/9; }
    .nx-overlay { padding: 0 5%; }
    .nx-btn { padding: 8px 16px; font-size: 13px; }
    .nx-title { margin-bottom: 6px; }
    .nx-desc { -webkit-line-clamp: 2; margin-bottom: 16px; }
  }
</style>

<script>
(function() {
  const slides = ${jsonSlides};
  if (!slides || slides.length === 0) return;
  
  let currentIdx = 0;
  const track = document.getElementById('nx-slider-track');
  const dotsContainer = document.getElementById('nx-dots');

  function getYTId(url) {
    const regExp = /^.*((youtu.be\\/)|(v\\/)|(\\/u\\/\\w\\/)|(embed\\/)|(watch\\?))\\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  }
  
  function render() {
    track.innerHTML = '';
    dotsContainer.innerHTML = '';
    slides.forEach((s, i) => {
      const slideEl = document.createElement('div');
      slideEl.className = 'nx-slide' + (i === 0 ? ' active' : '');
      
      let bgHtml = '';
      if (s.video) {
        const yt = getYTId(s.video);
        if (yt) {
          bgHtml = '<div class="nx-video-wrapper"><iframe src="https://www.youtube.com/embed/' + yt + '?autoplay=1&mute=1&loop=1&playlist=' + yt + '&controls=0&modestbranding=1&rel=0&iv_load_policy=3" frameborder="0" allow="autoplay; encrypted-media"></iframe></div>';
        } else {
          bgHtml = '<video src="' + s.video + '" poster="' + s.image + '" autoplay muted loop playsinline class="nx-slide-bg"></video>';
        }
      } else {
        bgHtml = '<img src="' + s.image + '" class="nx-slide-bg" />';
      }

      slideEl.innerHTML = bgHtml + '<div class="nx-overlay"><div class="nx-content">' +
        '<h2 class="nx-title">' + s.title + '</h2>' +
        '<p class="nx-desc">' + s.description + '</p>' +
        '<div class="nx-btn-group">' +
          (s.playLink ? '<a href="' + s.playLink + '" class="nx-btn nx-btn-play">▶ Play</a>' : '') +
          (s.infoLink ? '<a href="' + s.infoLink + '" class="nx-btn nx-btn-info">ⓘ More Info</a>' : '') +
        '</div></div></div>';
      track.appendChild(slideEl);
      
      const dot = document.createElement('div');
      dot.className = 'nx-dot' + (i === 0 ? ' active' : '');
      dot.onclick = () => goTo(i);
      dotsContainer.appendChild(dot);
    });
  }

  function goTo(idx) {
    const items = document.querySelectorAll('.nx-slide');
    const dots = document.querySelectorAll('.nx-dot');
    if (!items.length) return;
    
    items[currentIdx].classList.remove('active');
    dots[currentIdx].classList.remove('active');
    currentIdx = (idx + slides.length) % slides.length;
    items[currentIdx].classList.add('active');
    dots[currentIdx].classList.add('active');
  }

  document.getElementById('nx-next').onclick = () => goTo(currentIdx + 1);
  document.getElementById('nx-prev').onclick = () => goTo(currentIdx - 1);
  
  setInterval(() => goTo(currentIdx + 1), 6000);
  render();
})();
</script>`.trim();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white p-4 md:p-8">
      {/* Toast Notification */}
      {showSaveToast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] bg-green-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-top duration-300">
          <CheckCircle size={24} />
          <div>
            <div className="font-bold">Slide Saved Successfully!</div>
            <div className="text-xs opacity-90">Blogger code has been auto-updated.</div>
          </div>
          <button 
            onClick={() => {
              copyToClipboard(generateBloggerCode());
              setShowSaveToast(false);
            }}
            className="ml-4 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-sm font-bold transition-all"
          >
            Copy Code Now
          </button>
          <button onClick={() => setShowSaveToast(false)} className="ml-2 opacity-50 hover:opacity-100">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Navigation Header */}
      <div className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3 text-red-600">
            <Film className="w-8 h-8" />
            KHCinemaa Admin
          </h1>
          <p className="text-zinc-500 mt-1">Netflix-style Slideshow CMS & Dynamic Code Generator</p>
        </div>
        
        <div className="flex bg-[#16161D] p-1 rounded-xl border border-zinc-800 shadow-lg">
          <button 
            onClick={() => setView('manage')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${view === 'manage' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-zinc-400 hover:text-white'}`}
          >
            <Settings size={18} /> Manage
          </button>
          <button 
            onClick={() => setView('preview')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${view === 'preview' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-zinc-400 hover:text-white'}`}
          >
            <Monitor size={18} /> Preview
          </button>
          <button 
            onClick={() => setView('code')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${view === 'code' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-zinc-400 hover:text-white'}`}
          >
            <Code size={18} /> Blogger Widget
          </button>
        </div>
      </div>

      {view === 'manage' && (
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            <div className="bg-[#16161D] p-6 rounded-2xl border border-zinc-800 flex items-center gap-5">
              <div className="w-12 h-12 rounded-xl bg-red-600/10 flex items-center justify-center text-red-600">
                <Layout size={24} />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-zinc-500 text-xs uppercase font-bold tracking-wider">Total</div>
              </div>
            </div>
            <div className="bg-[#16161D] p-6 rounded-2xl border border-zinc-800 flex items-center gap-5">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
                <CheckCircle size={24} />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.active}</div>
                <div className="text-zinc-500 text-xs uppercase font-bold tracking-wider">Active</div>
              </div>
            </div>
            <div className="bg-[#16161D] p-6 rounded-2xl border border-zinc-800 flex items-center gap-5">
              <div className="w-12 h-12 rounded-xl bg-zinc-500/10 flex items-center justify-center text-zinc-400">
                <PauseCircle size={24} />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.inactive}</div>
                <div className="text-zinc-500 text-xs uppercase font-bold tracking-wider">Drafts</div>
              </div>
            </div>
            <button 
              onClick={() => setView('code')}
              className="bg-red-600/5 p-6 rounded-2xl border border-red-600/20 flex items-center gap-5 hover:bg-red-600/10 transition-colors group"
            >
              <div className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                <ExternalLink size={24} />
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-red-600">Quick Export</div>
                <div className="text-zinc-500 text-xs">Get Blogger Code</div>
              </div>
            </button>
          </div>

          {/* Table Header Controls */}
          <div className="bg-[#16161D] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-4 bg-[#1A1A24]">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input 
                  type="text" 
                  placeholder="Search your library..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#0A0A0F] border border-zinc-800 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-red-600 transition-colors"
                />
              </div>
              <button 
                onClick={() => {
                  setEditingSlide({ status: 'active', order: slides.length + 1 });
                  setIsModalOpen(true);
                }}
                className="w-full md:w-auto px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-lg shadow-red-600/20"
              >
                <Plus size={20} /> New Masterpiece
              </button>
            </div>

            {/* Main Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#0A0A0F] text-zinc-500 text-[10px] uppercase font-bold tracking-[0.1em]">
                  <tr>
                    <th className="px-6 py-4">Sort</th>
                    <th className="px-6 py-4">Preview</th>
                    <th className="px-6 py-4">Slide Content</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {slides.filter(s => s.title.toLowerCase().includes(searchTerm.toLowerCase())).map((slide, idx) => (
                    <tr key={slide.id} className="hover:bg-zinc-900/40 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => moveSlide(slide.id, 'up')} className="p-1 hover:text-red-500 disabled:opacity-30" disabled={idx === 0}><ChevronUp size={16} /></button>
                          <button onClick={() => moveSlide(slide.id, 'down')} className="p-1 hover:text-red-500 disabled:opacity-30" disabled={idx === slides.length - 1}><ChevronDown size={16} /></button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative w-28 h-16 overflow-hidden rounded-lg border border-zinc-800">
                          <img src={slide.image} alt="" className="w-full h-full object-cover" />
                          {slide.video && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              {isYouTube(slide.video) ? <Youtube size={16} className="text-white" /> : <Video size={16} className="text-white" />}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-bold text-lg mb-1">{slide.title}</div>
                          <div className="text-zinc-500 text-xs line-clamp-1 max-w-sm">{slide.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => toggleStatus(slide.id)}
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${slide.status === 'active' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-zinc-800 text-zinc-500'}`}
                        >
                          {slide.status}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => { setEditingSlide(slide); setIsModalOpen(true); }} className="p-2 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white"><Edit2 size={18} /></button>
                          <button onClick={() => handleDelete(slide.id)} className="p-2 hover:bg-red-600/10 rounded-lg text-zinc-400 hover:text-red-500"><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {view === 'preview' && (
        <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold">Interactive Preview</h2>
            <div className="text-sm text-zinc-500">How it looks on your blog</div>
          </div>
          <div className="rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl shadow-black">
             <NetflixSlideshow slides={activeSlidesForPreview} />
          </div>
        </div>
      )}

      {view === 'code' && (
        <div className="max-w-7xl mx-auto animate-in zoom-in duration-300">
           <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold">Blogger Widget Deployment</h2>
              <p className="text-zinc-500 text-sm mt-1">Self-contained HTML/CSS/JS code ready for your sidebar or header.</p>
            </div>
            <button 
              onClick={() => copyToClipboard(generateBloggerCode())}
              className={`px-6 py-3 rounded-xl flex items-center gap-2 transition-all font-bold ${copyFeedback ? 'bg-green-500 text-white' : 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20'}`}
            >
              {copyFeedback ? <CheckCircle size={20} /> : <Copy size={20} />}
              {copyFeedback ? 'Code Copied!' : 'Copy Blogger Code'}
            </button>
          </div>
          <div className="bg-[#16161D] p-8 rounded-3xl border border-zinc-800 font-mono text-red-400 overflow-auto max-h-[60vh] text-sm custom-scrollbar shadow-inner">
            <pre className="whitespace-pre-wrap">{generateBloggerCode()}</pre>
          </div>
          
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#16161D] p-6 rounded-2xl border border-zinc-800 border-l-4 border-l-red-600">
              <h3 className="font-bold mb-2">Step 1</h3>
              <p className="text-sm text-zinc-500">Open your Blogger Dashboard > Layout.</p>
            </div>
            <div className="bg-[#16161D] p-6 rounded-2xl border border-zinc-800 border-l-4 border-l-red-600">
              <h3 className="font-bold mb-2">Step 2</h3>
              <p className="text-sm text-zinc-500">Add an "HTML/JavaScript" gadget.</p>
            </div>
            <div className="bg-[#16161D] p-6 rounded-2xl border border-zinc-800 border-l-4 border-l-red-600">
              <h3 className="font-bold mb-2">Step 3</h3>
              <p className="text-sm text-zinc-500">Paste the code and save. Refresh your blog!</p>
            </div>
          </div>
        </div>
      )}

      {/* Slide Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-[#16161D] w-full max-w-2xl rounded-3xl border border-zinc-800 shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8 flex justify-between items-center border-b border-zinc-800 bg-[#1C1C28]">
              <h2 className="text-2xl font-bold">{editingSlide?.id ? 'Edit Masterpiece' : 'New Creation'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSaveSlide} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Display Title *</label>
                  <input required type="text" value={editingSlide?.title || ''} onChange={(e) => setEditingSlide(prev => ({ ...prev!, title: e.target.value }))} className="w-full bg-[#0A0A0F] border border-zinc-800 rounded-xl py-3 px-4 focus:outline-none focus:border-red-600 transition-colors" placeholder="E.g. Stranger Things" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Visibility</label>
                  <select value={editingSlide?.status || 'active'} onChange={(e) => setEditingSlide(prev => ({ ...prev!, status: e.target.value as SlideStatus }))} className="w-full bg-[#0A0A0F] border border-zinc-800 rounded-xl py-3 px-4 focus:outline-none focus:border-red-600 transition-colors">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive (Draft)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Short Blurb *</label>
                <textarea required rows={3} value={editingSlide?.description || ''} onChange={(e) => setEditingSlide(prev => ({ ...prev!, description: e.target.value }))} className="w-full bg-[#0A0A0F] border border-zinc-800 rounded-xl py-3 px-4 focus:outline-none focus:border-red-600 transition-colors resize-none" placeholder="Catchy summary for the audience..." />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Poster Image URL *</label>
                  <input required type="url" value={editingSlide?.image || ''} onChange={(e) => setEditingSlide(prev => ({ ...prev!, image: e.target.value }))} className="w-full bg-[#0A0A0F] border border-zinc-800 rounded-xl py-3 px-4 focus:outline-none focus:border-red-600 transition-colors" placeholder="Cover image link" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Video URL / YouTube Link</label>
                  <input type="text" value={editingSlide?.video || ''} onChange={(e) => setEditingSlide(prev => ({ ...prev!, video: e.target.value }))} className="w-full bg-[#0A0A0F] border border-zinc-800 rounded-xl py-3 px-4 focus:outline-none focus:border-red-600 transition-colors" placeholder="YouTube or direct MP4" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Play Button URL</label>
                  <input type="url" value={editingSlide?.playLink || ''} onChange={(e) => setEditingSlide(prev => ({ ...prev!, playLink: e.target.value }))} className="w-full bg-[#0A0A0F] border border-zinc-800 rounded-xl py-3 px-4 focus:outline-none focus:border-red-600 transition-colors" placeholder="Link to watch" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">More Info URL</label>
                  <input type="url" value={editingSlide?.infoLink || ''} onChange={(e) => setEditingSlide(prev => ({ ...prev!, infoLink: e.target.value }))} className="w-full bg-[#0A0A0F] border border-zinc-800 rounded-xl py-3 px-4 focus:outline-none focus:border-red-600 transition-colors" placeholder="Link for details" />
                </div>
              </div>

              <div className="pt-6 flex gap-4">
                <button type="submit" className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl shadow-red-600/20">
                  <Save size={20} /> Finalize & Sync
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold transition-all">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
