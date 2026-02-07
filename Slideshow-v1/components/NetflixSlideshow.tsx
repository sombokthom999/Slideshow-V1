
import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Play, Info } from 'lucide-react';
import { Slide } from '../types';

interface NetflixSlideshowProps {
  slides: Slide[];
  autoPlayInterval?: number;
}

const NetflixSlideshow: React.FC<NetflixSlideshowProps> = ({ 
  slides, 
  autoPlayInterval = 6000 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const extractYouTubeId = (url: string) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  };

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (isPaused || slides.length <= 1) return;
    const timer = setInterval(nextSlide, autoPlayInterval);
    return () => clearInterval(timer);
  }, [nextSlide, isPaused, slides.length, autoPlayInterval]);

  if (slides.length === 0) {
    return (
      <div className="w-full h-[60vh] bg-[#0A0A0F] flex flex-col items-center justify-center text-zinc-600 rounded-2xl border-2 border-dashed border-zinc-800">
        <Play size={48} className="mb-4 opacity-20" />
        <h3 className="text-xl font-bold text-zinc-400">Your Cinema is Empty</h3>
        <p className="text-sm">Add some slides in the manage tab to get started.</p>
      </div>
    );
  }

  return (
    <div 
      className="relative w-full aspect-[21/9] md:aspect-[21/9] sm:aspect-video bg-black overflow-hidden group select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {slides.map((slide, idx) => {
        const ytId = slide.video ? extractYouTubeId(slide.video) : null;
        
        return (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              idx === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            {/* Background Media Container */}
            <div className="absolute inset-0 z-0">
              {ytId ? (
                <div className="relative w-full h-full pointer-events-none overflow-hidden scale-[1.3] origin-center">
                  <iframe
                    src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&modestbranding=1&rel=0&iv_load_policy=3&enablejsapi=1`}
                    title={slide.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    frameBorder="0"
                    allow="autoplay; encrypted-media"
                  />
                </div>
              ) : slide.video ? (
                <video
                  src={slide.video}
                  poster={slide.image}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent flex items-center px-8 md:px-16 z-10">
              <div className={`max-w-2xl transform transition-all duration-700 delay-200 ${
                idx === currentIndex ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
              }`}>
                <h2 className="text-4xl md:text-6xl font-extrabold mb-4 drop-shadow-2xl tracking-tighter">
                  {slide.title}
                </h2>
                <p className="text-lg md:text-xl text-zinc-100 mb-8 line-clamp-3 drop-shadow-md font-medium leading-tight max-w-xl">
                  {slide.description}
                </p>
                
                <div className="flex flex-wrap gap-4">
                  {slide.playLink && (
                    <a
                      href={slide.playLink}
                      className="flex items-center gap-2 bg-white text-black px-6 md:px-10 py-3 rounded-md font-bold text-lg hover:bg-zinc-200 transition-transform hover:scale-105 active:scale-95 shadow-xl"
                    >
                      <Play fill="currentColor" size={24} />
                      Play
                    </a>
                  )}
                  {slide.infoLink && (
                    <a
                      href={slide.infoLink}
                      className="flex items-center gap-2 bg-zinc-600/60 text-white px-6 md:px-10 py-3 rounded-md font-bold text-lg hover:bg-zinc-600/40 transition-transform hover:scale-105 active:scale-95 backdrop-blur-md shadow-xl"
                    >
                      <Info size={24} />
                      More Info
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-0 top-0 bottom-0 z-20 w-[6%] bg-gradient-to-r from-black/50 to-transparent hover:from-black/80 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
          >
            <ChevronLeft size={48} className="drop-shadow-lg" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-0 top-0 bottom-0 z-20 w-[6%] bg-gradient-to-l from-black/50 to-transparent hover:from-black/80 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
          >
            <ChevronRight size={48} className="drop-shadow-lg" />
          </button>
        </>
      )}

      {/* Indicators */}
      <div className="absolute bottom-10 right-10 z-20 flex gap-2">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-1.5 transition-all duration-400 ${
              idx === currentIndex ? 'w-10 bg-red-600' : 'w-4 bg-zinc-600/50'
            } rounded-full`}
          />
        ))}
      </div>
    </div>
  );
};

export default NetflixSlideshow;
