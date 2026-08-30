import { importedCameraPresets } from "@/lib/imported-presets/cameras";

export type PresetCategoryId =
  | "cameras"
  | "lenses"
  | "shots"
  | "lighting"
  | "styles"
  | "enhancements";

export interface ImportedPreset {
  readonly id: string;
  readonly name: string;
  readonly prompt: string;
  readonly source: string;
  readonly imported: true;
}

export interface ImportedPresetCategory {
  readonly id: PresetCategoryId;
  readonly name: string;
  readonly description: string;
  readonly presets: readonly ImportedPreset[];
}

const lensPresets: readonly ImportedPreset[] = [
  [
    "creative-tilt-lens",
    "Creative Tilt Lens",
    "creative tilt lens, selective focus plane, miniature-like edge blur",
  ],
  [
    "compact-anamorphic",
    "Compact Anamorphic",
    "compact anamorphic lens, wider cinematic squeeze, oval bokeh, horizontal flares",
  ],
  [
    "extreme-macro",
    "Extreme Macro",
    "extreme macro lens, close-focus magnification, very shallow focus falloff",
  ],
  [
    "70s-cinema-prime",
    "70s Cinema Prime",
    "1970s cinema prime lens, warm lower-contrast glass, vintage flare response",
  ],
  [
    "classic-anamorphic",
    "Classic Anamorphic",
    "classic anamorphic lens, widescreen compression, oval bokeh, blue streak flares",
  ],
  [
    "premium-modern-prime",
    "Premium Modern Prime",
    "premium modern prime lens, clean contrast, controlled focus, polished rendering",
  ],
  [
    "warm-cinema-prime",
    "Warm Cinema Prime",
    "warm-toned cinema prime lens, flattering skin tones, gentle highlight bloom",
  ],
  [
    "swirl-bokeh-portrait",
    "Swirl Bokeh Portrait",
    "swirl bokeh portrait lens, curved field edges, circular background motion",
  ],
  [
    "vintage-prime",
    "Vintage Prime",
    "vintage prime lens, soft contrast, imperfect glass texture, organic focus rolloff",
  ],
  [
    "halation-diffusion",
    "Halation Diffusion",
    "halation diffusion filter, glowing highlights, softened microcontrast",
  ],
  [
    "clinical-sharp-prime",
    "Clinical Sharp Prime",
    "ultra-sharp clinical prime lens, crisp microcontrast, precise edges, minimal aberration",
  ],
].map(([id, name, prompt]) => ({
  id,
  name,
  prompt,
  source: "KingAI cinema presets",
  imported: true,
}));

const shotPresets: readonly ImportedPreset[] = [
  ["hero-packshot", "Hero Packshot", "Hero packshot"],
  ["lifestyle-in-use", "Lifestyle In-Use", "Lifestyle in-use"],
  ["macro-detail", "Macro Detail", "Macro detail"],
  ["ugc-product", "UGC Product Shot", "UGC product shot"],
].map(([id, name, prompt]) => ({
  id,
  name,
  prompt,
  source: "KingAI product-shot presets",
  imported: true,
}));

const lightingPresets: readonly ImportedPreset[] = [
  "cinematic lighting",
  "golden hour",
  "dramatic studio lighting",
  "soft diffused light",
  "neon glow",
  "volumetric rays",
].map((prompt) => ({
  id: prompt.replaceAll(" ", "-"),
  name: prompt.replace(/\b\w/g, (letter) => letter.toUpperCase()),
  prompt,
  source: "research-hub enhancement tags",
  imported: true,
}));

const stylePresets: readonly ImportedPreset[] = [
  [
    "ugc-vibe",
    "UGC Vibe",
    'Natural handheld-style social ad for mobile-first audiences. Show authentic lifestyle context and a clear benefit. If adding copy, keep it short and quote it like "Try it tonight".',
  ],
  [
    "clean-studio",
    "Clean Studio",
    'Minimal studio setup with premium lighting and clean surfaces. Emphasize product texture, readability, and trust. Optional headline in quotes only, e.g. "Pure daily support".',
  ],
  [
    "bold-promo",
    "Bold Promo",
    'High-contrast promotional creative with strong visual hierarchy and clear focal point. Include offer messaging only if quoted exactly, e.g. "20% OFF Today".',
  ],
  [
    "mannequin-reveal",
    "Mannequin Reveal",
    'Static mannequin product reveal setup with clean background and fixed camera. Emphasize consistent framing and product fidelity. If adding copy, keep it short and quote it, e.g. "New drop".',
  ],
  [
    "editorial-lifestyle",
    "Editorial Lifestyle",
    'Premium editorial lifestyle ad with natural environment storytelling, intentional composition, and polished fashion-magazine tone. Keep brand feel elevated and aspirational. Optional copy must be short and quoted, e.g. "Everyday luxury".',
  ],
  [
    "expert-talk",
    "Expert Talk-to-Cam",
    'Creator-style expert explanation with a trustworthy human presence and clear product demo. Keep the framing social-native, benefit-led, and conversion-oriented. If adding text overlays, quote them exactly, e.g. "Clinically inspired routine".',
  ],
  [
    "problem-solution",
    "Problem to Solution",
    'Before-and-after narrative: clearly show the pain point first, then the product-led improvement. Keep transitions readable and claim-safe. Optional headline must be quoted, e.g. "From chaos to clarity".',
  ],
  [
    "macro-proof",
    "Macro Proof Demo",
    'Close-up product proof creative emphasizing texture, ingredients, and mechanism details. Use clean light and controlled highlights for high trust and premium quality. Keep any copy short and quoted, e.g. "See the texture".',
  ],
  [
    "benefit-stack",
    "Benefit Stack",
    "Carousel-friendly benefit stack style: one clear benefit per panel with strong hierarchy and legible spacing. Keep language concise, specific, and direct-response ready. Optional benefit lines must be quoted.",
  ],
  [
    "offer-first-retail",
    "Offer-First Retail",
    'Retail performance ad with offer-forward messaging, urgency cues, and prominent CTA placement while maintaining product clarity. If using discount text, quote it exactly, e.g. "Save 20% today".',
  ],
  [
    "testimonial-proof",
    "Testimonial Proof",
    "Social proof creative featuring review-style overlays and authentic customer sentiment while keeping the product as focal point. Keep quote text concise and clearly framed in quotes.",
  ],
  [
    "comparison-angle",
    "Comparison Angle",
    'Side-by-side comparison layout that communicates product differentiation quickly and clearly. Keep claims measured and visual evidence strong. Optional headline must be quoted, e.g. "Why users switch".',
  ],
  [
    "seasonal-moment",
    "Seasonal Moment",
    "Seasonal campaign style tailored to a timely moment (holiday, summer, back-to-school) while preserving core product identity. Use thematic props sparingly and keep CTA copy short and quoted.",
  ],
  [
    "cinematic-hero",
    "Cinematic Hero",
    'Cinematic brand hero creative with dramatic lighting, refined composition, and premium storytelling tone. Keep the product unmistakably clear in-frame and any headline short and quoted, e.g. "Crafted to stand out".',
  ],
].map(([id, name, prompt]) => ({
  id,
  name,
  prompt,
  source: "KingAI ad-style presets",
  imported: true,
}));

const enhancementPresets: readonly ImportedPreset[] = [
  "professional photography",
  "ultra-detailed",
  "8K resolution",
  "high dynamic range",
  "award-winning",
].map((prompt) => ({
  id: prompt.replaceAll(" ", "-"),
  name: prompt.replace(/\b\w/g, (letter) => letter.toUpperCase()),
  prompt,
  source: "research-hub enhancement tags",
  imported: true,
}));

export const importedPresetCategories: readonly ImportedPresetCategory[] = [
  {
    id: "cameras",
    name: "Cameras",
    description: "Camera bodies and capture character.",
    presets: importedCameraPresets,
  },
  {
    id: "lenses",
    name: "Lenses",
    description: "Optics, focus behavior, bokeh, and flare response.",
    presets: lensPresets,
  },
  {
    id: "shots",
    name: "Shots",
    description: "Product framing and presentation patterns.",
    presets: shotPresets,
  },
  {
    id: "lighting",
    name: "Lighting",
    description: "Lighting direction, atmosphere, and highlight behavior.",
    presets: lightingPresets,
  },
  {
    id: "styles",
    name: "Styles",
    description: "Creative direction for campaigns and product imagery.",
    presets: stylePresets,
  },
  {
    id: "enhancements",
    name: "Enhancements",
    description: "Quality modifiers appended to generation prompts.",
    presets: enhancementPresets,
  },
];
