export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  aspectRatio: string;
  createdAt: string;
  generator?: string;
  generatorModel?: string;
}
