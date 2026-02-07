
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
      <div className="w-full h-[60vh] bg-zinc-900 flex flex-col items-center justify-center text-zinc-500 rounded-lg">
        <Play size={64} className="mb-4 opacity-20" />
        <h3 className="text-xl font-medium">No Active Slides</h3>
        <p>Add and activate slides in the admin panel to see the preview.</p>
      </div>
    );
  }

  return (
    <div 
      className="relative w-full aspect-[21/9] md:aspect-[21/9] sm:aspect-video bg-black overflow-hidden group select-none shadow-2xl"
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
            {/* Background Media */}
            {ytId ? (
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <iframe
                  src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&modestbranding=1&rel=0&iv_load_policy=3&enablejsapi=1`}
                  title={slide.title}
                  className="w-full h-full scale-125 origin-center"
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
            
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent flex items-center px-8 md:px-16 z-10">
              <div className={`max-w-2xl transform transition-all duration-700 delay-300 ${
                idx === currentIndex ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
              }`}>
                <h2 className="text-4xl md:text-6xl font-extrabold mb-4 drop-shadow-lg tracking-tight">
                  {slide.title}
                </h2>
                <p className="text-lg md:text-xl text-zinc-200 mb-8 line-clamp-3 drop-shadow-md font-medium leading-relaxed">
                  {slide.description}
                </p>
                
                <div className="flex flex-wrap gap-4">
                  {slide.playLink && (
                    <a
                      href={slide.playLink}
                      className="flex items-center gap-2 bg-white text-black px-6 md:px-8 py-3 rounded-md font-bold text-lg hover:bg-zinc-200 transition-transform hover:scale-105"
                    >
                      <Play fill="currentColor" size={24} />
                      Play
                    </a>
                  )}
                  {slide.infoLink && (
                    <a
                      href={slide.infoLink}
                      className="flex items-center gap-2 bg-zinc-600/70 text-white px-6 md:px-8 py-3 rounded-md font-bold text-lg hover:bg-zinc-600/50 transition-transform hover:scale-105 backdrop-blur-sm"
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
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/20 hover:bg-black/50 text-white rounded-full transition-all opacity-0 group-hover:opacity-100"
          >
            <ChevronLeft size={48} />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/20 hover:bg-black/50 text-white rounded-full transition-all opacity-0 group-hover:opacity-100"
          >
            <ChevronRight size={48} />
          </button>
        </>
      )}

      {/* Indicators */}
      <div className="absolute bottom-10 right-16 z-20 flex gap-2">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-1 transition-all duration-300 ${
              idx === currentIndex ? 'w-10 bg-white' : 'w-4 bg-zinc-500/50'
            } rounded-full`}
          />
        ))}
      </div>
    </div>
  );
};

export default NetflixSlideshow;
