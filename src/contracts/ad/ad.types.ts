export interface Ad {
  id: string;
  title: string;
  companyName?: string | null;
  videoUrl: string;
  duration: number;
  createdAt: Date;
}

export interface CreateAdInput {
  title: string;
  companyName?: string;
  videoUrl: string;
  duration: number;
}

export interface MarkerAd {
  id: string;
  markerId: string;
  adId: string;
  playCount: number;
  ad: Ad;
}
