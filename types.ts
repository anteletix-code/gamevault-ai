
export interface GameFile {
  id: string;
  name: string;
  size: number;
  type: string;
  lastModified: number;
  aiMetadata?: GameFileMetadata;
  generatedHtml?: string;
  coverUrl?: string;
  authorName?: string;
  status: 'processing' | 'ready' | 'error';
  isPublic: boolean;
}

export interface GameFileMetadata {
  title: string;
  category: string;
  description: string;
  suggestedTags: string[];
  estimatedGenre: string;
  safetyRating: string;
}

export interface LibraryStats {
  name: string;
  value: number;
  fill: string;
}
