export interface Episode {
  id: string;
  title: string;
  sourceUrl: string;
  duration: number;
  waveformUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEpisodeInput {
  title: string;
  sourceUrl: string;
  duration: number;
}
