"use client";

import { useState, useEffect } from "react";

interface PresetSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (preset: string) => void;
}

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M3.81344 3.81246C4.0087 3.6172 4.32528 3.6172 4.52055 3.81246L10.0003 9.29224L15.4801 3.81246C15.6754 3.6172 15.992 3.6172 16.1872 3.81246C16.3825 4.00772 16.3825 4.32431 16.1872 4.51957L10.7074 9.99935L16.1872 15.4791C16.3825 15.6744 16.3825 15.991 16.1872 16.1862C15.992 16.3815 15.6754 16.3815 15.4801 16.1862L10.0003 10.7065L4.52055 16.1862C4.32528 16.3815 4.0087 16.3815 3.81344 16.1862C3.61818 15.991 3.61818 15.6744 3.81344 15.4791L9.29322 9.99935L3.81344 4.51957C3.61818 4.32431 3.61818 4.00772 3.81344 3.81246Z"
    />
  </svg>
);

const categories = [
  { id: "all", name: "All" },
  { id: "new", name: "New", hasIndicator: true },
  { id: "viral", name: "Viral" },
  { id: "effects", name: "Effects" },
  { id: "ugc", name: "UGC" },
];

// Preset colors for visual distinction
const presetColors: Record<string, { from: string; via: string; to: string }> = {
  "General": { from: "from-indigo-600", via: "via-purple-600", to: "to-pink-500" },
  "Animalization": { from: "from-amber-500", via: "via-orange-500", to: "to-red-500" },
  "Giant Grab": { from: "from-emerald-500", via: "via-teal-500", to: "to-cyan-500" },
  "Starship Troopers": { from: "from-slate-600", via: "via-zinc-500", to: "to-stone-400" },
  "Cyborg": { from: "from-cyan-500", via: "via-blue-500", to: "to-indigo-600" },
  "Northern Lights": { from: "from-green-400", via: "via-emerald-500", to: "to-teal-600" },
  "Fairies Around": { from: "from-pink-400", via: "via-rose-400", to: "to-fuchsia-500" },
  "Sakura Petals": { from: "from-pink-300", via: "via-rose-300", to: "to-pink-400" },
  "Saint Glow": { from: "from-amber-300", via: "via-yellow-400", to: "to-orange-400" },
  "Objects Around": { from: "from-violet-500", via: "via-purple-500", to: "to-fuchsia-500" },
  "Monstrosity": { from: "from-red-600", via: "via-rose-600", to: "to-pink-600" },
  "Ice Rose": { from: "from-sky-300", via: "via-blue-300", to: "to-indigo-400" },
  "Firework": { from: "from-red-500", via: "via-orange-500", to: "to-yellow-400" },
  "Air Element": { from: "from-sky-400", via: "via-cyan-400", to: "to-teal-400" },
  "I Can Fly": { from: "from-blue-400", via: "via-indigo-400", to: "to-violet-500" },
  "Visor X": { from: "from-zinc-700", via: "via-slate-600", to: "to-gray-500" },
  "Aquarium": { from: "from-blue-500", via: "via-cyan-500", to: "to-teal-400" },
  "Ballet": { from: "from-rose-300", via: "via-pink-300", to: "to-fuchsia-300" },
  "Multiverse": { from: "from-purple-600", via: "via-violet-600", to: "to-indigo-600" },
  "Plasma Explosion": { from: "from-orange-500", via: "via-red-500", to: "to-rose-600" },
};

const presets = [
  { id: 1, name: "General", category: "all" },
  { id: 2, name: "Animalization", category: "effects" },
  { id: 3, name: "Giant Grab", category: "effects" },
  { id: 4, name: "Starship Troopers", category: "viral" },
  { id: 5, name: "Cyborg", category: "effects" },
  { id: 6, name: "Northern Lights", category: "effects" },
  { id: 7, name: "Fairies Around", category: "effects" },
  { id: 8, name: "Sakura Petals", category: "effects" },
  { id: 9, name: "Saint Glow", category: "effects" },
  { id: 10, name: "Objects Around", category: "effects" },
  { id: 11, name: "Monstrosity", category: "viral" },
  { id: 12, name: "Ice Rose", category: "new" },
  { id: 13, name: "Firework", category: "effects" },
  { id: 14, name: "Air Element", category: "effects" },
  { id: 15, name: "I Can Fly", category: "viral" },
  { id: 16, name: "Visor X", category: "new" },
  { id: 17, name: "Aquarium", category: "effects" },
  { id: 18, name: "Ballet", category: "ugc" },
  { id: 19, name: "Multiverse", category: "new" },
  { id: 20, name: "Plasma Explosion", category: "new" },
];

export default function PresetSelector({
  isOpen,
  onClose,
  onSelectPreset,
}: PresetSelectorProps) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Trigger animation state changes asynchronously to avoid cascading renders
    const rafId = requestAnimationFrame(() => {
      setIsAnimating(isOpen);
    });
    return () => cancelAnimationFrame(rafId);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className={`rounded-2xl bg-zinc-900 p-6 pt-2 transition-all duration-500 ease-out ${
        isAnimating ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
    >
      {/* Category Filters with Search */}
      <div
        className={`mb-4 grid grid-cols-[1fr_auto] gap-4 transition-all delay-75 duration-500 ease-out ${
          isAnimating ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
      >
        <div className="flex flex-wrap items-center justify-start gap-2 overflow-hidden">
          {categories.map((category) => (
            <div key={category.id} className="relative p-[1px]">
              {category.hasIndicator && (
                <div className="absolute top-0 left-0 h-1.5 w-1.5 rounded-full bg-pink-400" />
              )}
              <button
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center justify-center rounded-xl border px-3 py-2.5 text-sm font-medium text-white transition-colors ${
                  activeCategory === category.id
                    ? "border-pink-400/20 bg-pink-400/10"
                    : "border-zinc-700 hover:border-zinc-600"
                }`}
              >
                {category.name}
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="relative grid items-center">
            <input
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-xl border border-transparent bg-zinc-800 px-4 text-sm font-medium text-gray-400 transition placeholder:text-gray-500 hover:border-zinc-700 focus:border-pink-400/50 focus:bg-zinc-800 focus:outline-none"
            />
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800 text-white transition-colors hover:bg-zinc-700"
          >
            <CloseIcon />
          </button>
        </div>
      </div>

      {/* Preset Grid - Masonry Layout */}
      <div
        className={`-mx-1 grid grid-cols-2 overflow-x-hidden pb-14 transition-all delay-100 duration-500 ease-out md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 ${
          isAnimating ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        {[0, 1, 2, 3, 4].map((columnIndex) => {
          // Filter presets by category and search
          const filteredPresets = presets.filter((preset) => {
            const matchesCategory = activeCategory === "all" || preset.category === activeCategory;
            const matchesSearch = !searchQuery || preset.name.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
          });

          return (
            <div key={columnIndex} className="p-1">
              {filteredPresets
                .filter((_, index) => index % 5 === columnIndex)
                .map((preset, itemIndex) => {
                  const colors = presetColors[preset.name] || { from: "from-zinc-700", via: "via-zinc-800", to: "to-zinc-900" };
                  return (
                    <figure
                      key={preset.id}
                      className={`group relative z-[1] mb-2 h-auto w-full cursor-pointer overflow-hidden rounded-2xl transition-all duration-500 ease-out ${
                        isAnimating
                          ? "translate-y-0 scale-100 opacity-100"
                          : "translate-y-4 scale-95 opacity-0"
                      }`}
                      style={{
                        aspectRatio: "0.75 / 1",
                        transitionDelay: `${150 + columnIndex * 40 + itemIndex * 25}ms`,
                      }}
                      onClick={() => {
                        onSelectPreset(preset.name);
                        onClose();
                      }}
                    >
                      <button
                        type="button"
                        className="absolute inset-0 z-10 flex h-full w-full items-end justify-start rounded-2xl bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.7)_80%)] px-3 pb-3 text-start font-bold uppercase ring-0 ring-pink-400 transition-all ring-inset hover:ring-2"
                      >
                        <div className="font-heading leading-[100%] text-white opacity-100 transition">
                          <h4 className="text-xs lg:text-sm">
                            {preset.name}
                          </h4>
                        </div>
                      </button>
                      {/* Colorful gradient background */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${colors.from} ${colors.via} ${colors.to}`} />
                    </figure>
                  );
                })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
