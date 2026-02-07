
import { Slide } from '../types';

const DB_KEY = 'netflix_slides_v2';

export const getSlides = (): Slide[] => {
  const data = localStorage.getItem(DB_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveSlides = (slides: Slide[]): void => {
  localStorage.setItem(DB_KEY, JSON.stringify(slides));
};

export const getActiveSlides = (): Slide[] => {
  return getSlides()
    .filter(s => s.status === 'active')
    .sort((a, b) => a.order - b.order);
};
