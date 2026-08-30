export interface ImportedCameraPreset {
  readonly id: string;
  readonly name: string;
  readonly prompt: string;
  readonly source: string;
  readonly imported: true;
}

export const importedCameraPresets: readonly ImportedCameraPreset[] = [
  {
    id: "modular-8k-digital",
    name: "Modular 8K Digital",
    prompt: "modular 8K digital cinema camera",
    source: "KingAI cinema presets",
    imported: true,
  },
  {
    id: "full-frame-cine-digital",
    name: "Full-Frame Cine Digital",
    prompt: "full-frame digital cinema camera",
    source: "KingAI cinema presets",
    imported: true,
  },
  {
    id: "grand-format-70mm-film",
    name: "Grand Format 70mm Film",
    prompt: "grand format 70mm film camera",
    source: "KingAI cinema presets",
    imported: true,
  },
  {
    id: "studio-digital-s35",
    name: "Studio Digital S35",
    prompt: "Super 35 studio digital camera",
    source: "KingAI cinema presets",
    imported: true,
  },
  {
    id: "classic-16mm-film",
    name: "Classic 16mm Film",
    prompt: "classic 16mm film camera",
    source: "KingAI cinema presets",
    imported: true,
  },
  {
    id: "premium-large-format-digital",
    name: "Premium Large Format Digital",
    prompt: "premium large-format digital cinema camera",
    source: "KingAI cinema presets",
    imported: true,
  },
  {
    id: "imax-15-70-film",
    name: "IMAX 15/70 Film",
    prompt: "IMAX 15/70 film camera, immense negative area, monumental clarity",
    source: "KingAI cinema presets",
    imported: true,
  },
  {
    id: "high-speed-digital-cinema",
    name: "High-Speed Digital Cinema",
    prompt: "high-speed digital cinema camera, crisp action capture",
    source: "KingAI cinema presets",
    imported: true,
  },
  {
    id: "vintage-ccd-digital",
    name: "Vintage CCD Digital",
    prompt: "vintage CCD digital cinema camera, early-digital color response",
    source: "KingAI cinema presets",
    imported: true,
  },
];
