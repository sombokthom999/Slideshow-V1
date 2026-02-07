
export type SlideStatus = 'active' | 'inactive';

export interface Slide {
  id: string;
  title: string;
  description: string;
  image: string;
  video?: string; // Optional video background URL
  playLink?: string;
  infoLink?: string;
  order: number;
  status: SlideStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Stats {
  total: number;
  active: number;
  inactive: number;
}
