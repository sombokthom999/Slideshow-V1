
import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Edit2, Trash2, Power, 
  ChevronUp, ChevronDown, Save, X, Layout, 
  Monitor, Code, Image as ImageIcon, CheckCircle, 
  PauseCircle, Settings, Film, Play, Info, Copy, Video, Youtube
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
    
    // Update display orders
    const ordered = newSlides.map((s, i) => ({ ...s, order: i + 1 }));
    setSlides(ordered);
    saveSlides(ordered);
  };

  const filteredSlides = slides.filter(s => 
    s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeSlidesForPreview = slides
    .filter(s => s.status === 'active')
    .sort((a, b) => a.order - b.order);

  // Blogger Widget Code Generation
  const generateBloggerCode = () => {
    const jsonSlides = JSON.stringify(activeSlidesForPreview);
    return `<!-- Netflix Dynamic Slideshow Widget for Blogger -->
<div id="nx-slider-root" class="nx-slider-container">
  <div id="nx-slider-track" class="nx-slider-track"></div>
  <button id="nx-prev" class="nx-nav-btn nx-prev">❮</button>
  <button id="nx-next" class="nx-nav-btn nx-next">❯</button>
  <div id="nx-dots" class="nx-dots"></div>
</div>

<style>
  .nx-slider-container {
    position: relative;
    width: 100%;
    aspect-ratio: 16/9;
    background: #000;
    overflow: hidden;
    font-family: 'Inter', sans-serif;
    color: #fff;
  }
  @media (max-width: 768px) { .nx-slider-container { aspect-ratio: 16/9; } }
  .nx-slider-track { width: 100%; height: 100%; position: relative; }
  .nx-slide {
    position: absolute;
    inset: 0;
    opacity: 0;
    transition: opacity 0.8s ease-in-out;
    display: flex;
    align-items: center;
  }
  .nx-slide.active { opacity: 1; z-index: 10; }
  .nx-slide-bg { width: 100%; height: 100%; object-fit: cover; }
  
  .nx-video-wrapper {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    pointer-events: none;
    z-index: 0;
  }
  .nx-video-wrapper iframe {
    width: 110%; height: 110%;
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    object-fit: cover;
  }

  .nx-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 50%, transparent 100%);
    display: flex;
    align-items: center;
    padding: 0 10%;
    z-index: 5;
  }
  .nx-content { max-width: 600px; transform: translateY(20px); opacity: 0; transition: 0.6s 0.3s; }
  .nx-slide.active .nx-content { transform: translateY(0); opacity: 1; }
  .nx-title { font-size: clamp(24px, 5vw, 40px); font-weight: 800; margin-bottom: 0.5rem; line-height: 1.1; }
  .nx-desc { font-size: 16px;line-height: normal; color: #ccc; margin-bottom: 2rem; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
  .nx-btn-group { display: flex; gap: 1rem; }
  .nx-btn { padding: 0.8rem 2rem; border-radius: 4px; font-weight: 700; text-decoration: none; transition: 0.2s; display: inline-flex; align-items: center; gap: 8px; }
  .nx-btn-play { background: #fff; color: #000; }
  .nx-btn-play:hover { background: #e6e6e6; }
  .nx-btn-info { background: rgba(109, 109, 110, 0.7); color: #fff; backdrop-filter: blur(4px); }
  .nx-btn-info:hover { background: rgba(109, 109, 110, 0.4); }
  .nx-nav-btn {
    position: absolute; top: 50%; transform: translateY(-50%); z-index: 20;
    background: transparent; border: none; color: #fff; font-size: 2.5rem; cursor: pointer;
    padding: 20px; opacity: 0; transition: 0.3s;
  }
  .nx-slider-container:hover .nx-nav-btn { opacity: 0.7; }
  .nx-nav-btn:hover { opacity: 1 !important; }
  .nx-prev { left: 0; } .nx-next { right: 0; }
  .nx-dots { position: absolute; bottom: 20px; right: 40px; z-index: 20; display: flex; gap: 8px; }
  .nx-dot { width: 12px; height: 3px; background: rgba(255,255,255,0.3); border-radius: 2px; cursor: pointer; transition: 0.3s; }
  .nx-dot.active { width: 30px; background: #fff; }
  @media (max-width: 480px) {
    .nx-btn { padding: 0.6rem 1rem; font-size: 13px; gap: 6px; }
  }
</style>

<script>
(function() {
  const slides = ${jsonSlides};
  let currentIdx = 0;
  const track = document.getElementById('nx-slider-track');
  const dotsContainer = document.getElementById('nx-dots');

  function extractYouTubeId(url) {
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
      
      let backgroundHtml = '';
      if (s.video) {
        const ytId = extractYouTubeId(s.video);
        if (ytId) {
          backgroundHtml = '<div class="nx-video-wrapper"><iframe src="https://www.youtube.com/embed/' + ytId + '?autoplay=1&mute=1&loop=1&playlist=' + ytId + '&controls=0&modestbranding=1&rel=0&iv_load_policy=3" frameborder="0" allow="autoplay; encrypted-media"></iframe></div>';
        } else {
          backgroundHtml = '<video src="' + s.video + '" poster="' + s.image + '" autoplay muted loop playsinline class="nx-slide-bg"></video>';
        }
      } else {
        backgroundHtml = '<img src="' + s.image + '" class="nx-slide-bg" />';
      }

      slideEl.innerHTML = backgroundHtml + '<div class="nx-overlay"><div class="nx-content">' +
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

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white p-4 md:p-8">
      {/* Navigation Header */}
      <div className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3 text-cyan-500">
            <Film className="w-8 h-8" />
            KHCinemaa Slideshow 
          </h1>
          <p className="text-zinc-500 mt-1">Manage your homepage hero section dynamically</p>
        </div>
        
        <div className="flex bg-[#16161D] p-1 rounded-xl border border-zinc-800">
          <button 
            onClick={() => setView('manage')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${view === 'manage' ? 'bg-cyan-500 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}
          >
            <Settings size={18} /> Manage
          </button>
          <button 
            onClick={() => setView('preview')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${view === 'preview' ? 'bg-cyan-500 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}
          >
            <Monitor size={18} /> Preview
          </button>
          <button 
            onClick={() => setView('code')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${view === 'code' ? 'bg-cyan-500 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}
          >
            <Code size={18} /> Blogger Widget
          </button>
        </div>
      </div>

      {view === 'manage' && (
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-[#16161D] p-6 rounded-2xl border border-zinc-800 flex items-center gap-5">
              <div className="w-14 h-14 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500">
                <Layout size={32} />
              </div>
              <div>
                <div className="text-3xl font-bold">{stats.total}</div>
                <div className="text-zinc-500 text-sm">Total Slides</div>
              </div>
            </div>
            <div className="bg-[#16161D] p-6 rounded-2xl border border-zinc-800 flex items-center gap-5">
              <div className="w-14 h-14 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
                <CheckCircle size={32} />
              </div>
              <div>
                <div className="text-3xl font-bold">{stats.active}</div>
                <div className="text-zinc-500 text-sm">Active Now</div>
              </div>
            </div>
            <div className="bg-[#16161D] p-6 rounded-2xl border border-zinc-800 flex items-center gap-5">
              <div className="w-14 h-14 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
                <PauseCircle size={32} />
              </div>
              <div>
                <div className="text-3xl font-bold">{stats.inactive}</div>
                <div className="text-zinc-500 text-sm">Inactive</div>
              </div>
            </div>
          </div>

          {/* Table Header Controls */}
          <div className="bg-[#16161D] border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input 
                  type="text" 
                  placeholder="Search slides..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#0A0A0F] border border-zinc-800 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
              <button 
                onClick={() => {
                  setEditingSlide({ status: 'active', order: slides.length + 1 });
                  setIsModalOpen(true);
                }}
                className="w-full md:w-auto px-6 py-3 bg-cyan-500 hover:bg-cyan-600 rounded-xl flex items-center justify-center gap-2 font-semibold transition-all shadow-lg hover:shadow-cyan-500/20"
              >
                <Plus size={20} /> Add New Slide
              </button>
            </div>

            {/* Main Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#0A0A0F] text-zinc-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Order</th>
                    <th className="px-6 py-4 font-semibold">Visual</th>
                    <th className="px-6 py-4 font-semibold">Content</th>
                    <th className="px-6 py-4 font-semibold">Links</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {filteredSlides.map((slide, idx) => (
                    <tr key={slide.id} className="hover:bg-zinc-900/40 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            disabled={idx === 0}
                            onClick={() => moveSlide(slide.id, 'up')}
                            className="p-1 hover:text-cyan-500 disabled:opacity-30"
                          >
                            <ChevronUp size={16} />
                          </button>
                          <button 
                            disabled={idx === filteredSlides.length - 1}
                            onClick={() => moveSlide(slide.id, 'down')}
                            className="p-1 hover:text-cyan-500 disabled:opacity-30"
                          >
                            <ChevronDown size={16} />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative group/visual">
                          <img 
                            src={slide.image} 
                            alt="" 
                            className="w-24 h-14 object-cover rounded-lg border border-zinc-800"
                          />
                          {slide.video && (
                            <div className="absolute top-1 right-1 bg-cyan-500 rounded p-0.5 shadow-lg flex items-center justify-center">
                              {isYouTube(slide.video) ? <Youtube size={10} className="text-white" /> : <Video size={10} className="text-white" />}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <div className="font-bold text-lg leading-tight truncate">{slide.title}</div>
                          <div className="text-zinc-500 text-sm line-clamp-1">{slide.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-zinc-500">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1">
                            <Play size={10} className="text-cyan-500" /> {slide.playLink ? 'Set' : 'N/A'}
                          </div>
                          <div className="flex items-center gap-1">
                            <Info size={10} className="text-zinc-400" /> {slide.infoLink ? 'Set' : 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => toggleStatus(slide.id)}
                          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-tighter flex items-center gap-1.5 transition-all ${
                            slide.status === 'active' 
                              ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                              : 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${slide.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-zinc-500'}`}></span>
                          {slide.status}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => {
                              setEditingSlide(slide);
                              setIsModalOpen(true);
                            }}
                            className="p-2 hover:bg-cyan-500/10 text-cyan-500 rounded-lg transition-colors"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(slide.id)}
                            className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredSlides.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center text-zinc-500">
                        <div className="flex flex-col items-center gap-4">
                          <ImageIcon size={64} className="opacity-20" />
                          <div>No slides found. Start by adding a new one!</div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {view === 'preview' && (
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold">Live Preview</h2>
            <div className="text-sm text-zinc-500">Actual appearance on your website</div>
          </div>
          <div className="rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl bg-zinc-900">
             <NetflixSlideshow slides={activeSlidesForPreview} />
          </div>
        </div>
      )}

      {view === 'code' && (
        <div className="max-w-7xl mx-auto">
           <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold">Blogger Widget Code</h2>
              <p className="text-zinc-500 text-sm mt-1">Copy this code into an "HTML/JavaScript" gadget in your Blogger layout. YouTube & Direct MP4 are supported!</p>
            </div>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(generateBloggerCode());
                setCopyFeedback(true);
                setTimeout(() => setCopyFeedback(false), 2000);
              }}
              className={`px-6 py-3 rounded-xl flex items-center gap-2 transition-all font-bold ${copyFeedback ? 'bg-green-500 text-white' : 'bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg shadow-cyan-500/20'}`}
            >
              {copyFeedback ? <CheckCircle size={20} /> : <Copy size={20} />}
              {copyFeedback ? 'Copied!' : 'Copy Code'}
            </button>
          </div>
          <div className="mt-6 bg-[#0A0A0F] border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="bg-[#16161D] px-6 py-3 border-b border-zinc-800 text-xs text-zinc-500 font-mono uppercase tracking-widest">
              Generated Widget Snippet
            </div>
            <div className="p-8 font-mono text-cyan-400 overflow-auto max-h-[60vh] text-sm leading-relaxed custom-scrollbar">
              <pre className="whitespace-pre-wrap">{generateBloggerCode()}</pre>
            </div>
          </div>
          
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#16161D] p-6 rounded-2xl border border-zinc-800">
              <h3 className="font-bold mb-2 flex items-center gap-2 text-cyan-500">
                <span className="w-6 h-6 bg-cyan-500/10 rounded-full flex items-center justify-center text-xs">1</span>
                Login to Blogger
              </h3>
              <p className="text-sm text-zinc-500">Go to your blog dashboard and click on "Layout" in the left sidebar.</p>
            </div>
            <div className="bg-[#16161D] p-6 rounded-2xl border border-zinc-800">
              <h3 className="font-bold mb-2 flex items-center gap-2 text-cyan-500">
                <span className="w-6 h-6 bg-cyan-500/10 rounded-full flex items-center justify-center text-xs">2</span>
                Add Gadget
              </h3>
              <p className="text-sm text-zinc-500">Click "Add a Gadget" in the desired section and select "HTML/JavaScript".</p>
            </div>
            <div className="bg-[#16161D] p-6 rounded-2xl border border-zinc-800">
              <h3 className="font-bold mb-2 flex items-center gap-2 text-cyan-500">
                <span className="w-6 h-6 bg-cyan-500/10 rounded-full flex items-center justify-center text-xs">3</span>
                Paste & Save
              </h3>
              <p className="text-sm text-zinc-500">Paste the copied code into the Content box and click "Save". You're done!</p>
            </div>
          </div>
        </div>
      )}

      {/* Slide Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#16161D] w-full max-w-2xl rounded-3xl border border-zinc-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 flex justify-between items-center border-b border-zinc-800 bg-[#1A1A24]">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                {editingSlide?.id ? <Edit2 className="text-cyan-500" /> : <Plus className="text-cyan-500" />}
                {editingSlide?.id ? 'Edit Slide' : 'Create New Slide'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSaveSlide} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Title *</label>
                  <input 
                    required
                    type="text" 
                    value={editingSlide?.title || ''}
                    onChange={(e) => setEditingSlide(prev => ({ ...prev!, title: e.target.value }))}
                    className="w-full bg-[#0A0A0F] border border-zinc-800 rounded-xl py-3 px-4 focus:outline-none focus:border-cyan-500 transition-colors"
                    placeholder="E.g. Stranger Things"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Status</label>
                  <select 
                    value={editingSlide?.status || 'active'}
                    onChange={(e) => setEditingSlide(prev => ({ ...prev!, status: e.target.value as SlideStatus }))}
                    className="w-full bg-[#0A0A0F] border border-zinc-800 rounded-xl py-3 px-4 focus:outline-none focus:border-cyan-500 transition-colors"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Description *</label>
                <textarea 
                  required
                  rows={3}
                  value={editingSlide?.description || ''}
                  onChange={(e) => setEditingSlide(prev => ({ ...prev!, description: e.target.value }))}
                  className="w-full bg-[#0A0A0F] border border-zinc-800 rounded-xl py-3 px-4 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
                  placeholder="Tell a bit about this content..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Background Image URL *</label>
                  <input 
                    required
                    type="url" 
                    value={editingSlide?.image || ''}
                    onChange={(e) => setEditingSlide(prev => ({ ...prev!, image: e.target.value }))}
                    className="w-full bg-[#0A0A0F] border border-zinc-800 rounded-xl py-3 px-4 focus:outline-none focus:border-cyan-500 transition-colors"
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Background Video URL / YouTube ID</label>
                  <input 
                    type="text" 
                    value={editingSlide?.video || ''}
                    onChange={(e) => setEditingSlide(prev => ({ ...prev!, video: e.target.value }))}
                    className="w-full bg-[#0A0A0F] border border-zinc-800 rounded-xl py-3 px-4 focus:outline-none focus:border-cyan-500 transition-colors"
                    placeholder="YouTube link or MP4 URL"
                  />
                </div>
              </div>

              {(editingSlide?.image || editingSlide?.video) && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Background Preview</label>
                  <div className="rounded-xl overflow-hidden border border-zinc-800 aspect-video bg-black flex items-center justify-center relative">
                    {editingSlide?.video ? (
                      isYouTube(editingSlide.video) ? (
                        <iframe 
                          src={`https://www.youtube.com/embed/${extractYouTubeId(editingSlide.video)}?autoplay=1&mute=1&loop=1&playlist=${extractYouTubeId(editingSlide.video)}&controls=0&modestbranding=1`}
                          className="w-full h-full pointer-events-none scale-110"
                          frameBorder="0"
                          allow="autoplay; encrypted-media"
                        />
                      ) : (
                        <video 
                          src={editingSlide.video} 
                          poster={editingSlide.image}
                          className="w-full h-full object-cover" 
                          autoPlay 
                          muted 
                          loop
                        />
                      )
                    ) : editingSlide?.image ? (
                      <img 
                        src={editingSlide.image} 
                        alt="Preview" 
                        className="w-full h-full object-cover" 
                        onError={(e) => (e.currentTarget.src = 'https://picsum.photos/800/400?grayscale')} 
                      />
                    ) : null}
                    <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-md z-10">
                      {editingSlide?.video ? (isYouTube(editingSlide.video) ? 'YouTube Background' : 'Video Active') : 'Image Only'}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Play Link (Optional)</label>
                  <input 
                    type="url" 
                    value={editingSlide?.playLink || ''}
                    onChange={(e) => setEditingSlide(prev => ({ ...prev!, playLink: e.target.value }))}
                    className="w-full bg-[#0A0A0F] border border-zinc-800 rounded-xl py-3 px-4 focus:outline-none focus:border-cyan-500 transition-colors"
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">More Info Link (Optional)</label>
                  <input 
                    type="url" 
                    value={editingSlide?.infoLink || ''}
                    onChange={(e) => setEditingSlide(prev => ({ ...prev!, infoLink: e.target.value }))}
                    className="w-full bg-[#0A0A0F] border border-zinc-800 rounded-xl py-3 px-4 focus:outline-none focus:border-cyan-500 transition-colors"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="pt-6 flex gap-4">
                <button 
                  type="submit" 
                  className="flex-1 py-4 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-cyan-500/20"
                >
                  <Save size={20} /> Save Changes
                </button>
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-8 py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
