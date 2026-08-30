"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Star } from "lucide-react";
import Header from "@/components/Header";
import {
  importedPresetCategories,
  type PresetCategoryId,
} from "@/lib/imported-presets/catalog";

const totalPresetCount = importedPresetCategories.reduce(
  (total, category) => total + category.presets.length,
  0
);

export default function PresetsPage() {
  const [selectedCategoryId, setSelectedCategoryId] =
    useState<PresetCategoryId>("cameras");
  const [query, setQuery] = useState("");
  const selectedCategory =
    importedPresetCategories.find(
      (category) => category.id === selectedCategoryId
    ) ?? importedPresetCategories[0];
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visiblePresets =
    selectedCategory?.presets.filter(
      (preset) =>
        normalizedQuery.length === 0 ||
        preset.name.toLocaleLowerCase().includes(normalizedQuery) ||
        preset.prompt.toLocaleLowerCase().includes(normalizedQuery)
    ) ?? [];

  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-8 px-6 pt-12 pb-8 md:px-10 md:pt-14">
          <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <h1 className="font-heading text-2xl font-bold tracking-tight text-white uppercase">
                Imported <span className="text-pink-400">Presets</span>
              </h1>
              <p className="text-sm leading-6 text-zinc-300">
                Browse {totalPresetCount} camera, lens, shot, lighting, style,
                and enhancement presets. A star marks everything imported from
                the archive.
              </p>
            </div>

            <label className="relative block w-full lg:max-w-sm">
              <span className="sr-only">Search selected preset category</span>
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-500"
              />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={`Search ${selectedCategory?.name.toLocaleLowerCase() ?? "presets"}`}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 py-2.5 pr-4 pl-10 text-sm text-white placeholder:text-zinc-500 focus:border-pink-400 focus:outline-none"
              />
            </label>
          </header>

          <nav aria-label="Preset categories" className="overflow-x-auto pb-1">
            <div className="flex min-w-max gap-2">
              {importedPresetCategories.map((category) => {
                const selected = category.id === selectedCategoryId;
                return (
                  <button
                    key={category.name}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      setSelectedCategoryId(category.id);
                      setQuery("");
                    }}
                    className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-400 ${
                      selected
                        ? "border-white bg-white text-black"
                        : "border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-600 hover:text-white"
                    }`}
                  >
                    {category.name} {category.presets.length}
                  </button>
                );
              })}
            </div>
          </nav>

          <section
            aria-labelledby="preset-category-heading"
            className="space-y-4"
          >
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2
                  id="preset-category-heading"
                  className="font-heading text-lg text-white uppercase"
                >
                  {selectedCategory?.name}
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                  {selectedCategory?.description}
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-300">
                <Star
                  aria-hidden="true"
                  className="size-4 fill-pink-400 text-pink-400"
                />
                Imported from archive
              </div>
            </div>

            <p aria-live="polite" className="sr-only">
              {visiblePresets.length} presets shown
            </p>

            {visiblePresets.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {visiblePresets.map((preset) => (
                  <article
                    key={preset.name}
                    className="flex min-h-56 flex-col rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5"
                  >
                    <div className="mb-5 flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-pink-300 uppercase">
                        <Star
                          aria-hidden="true"
                          className="size-4 fill-pink-400 text-pink-400"
                        />
                        Imported
                      </div>
                      <span className="text-xs text-zinc-500">
                        {selectedCategory?.name}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-white">
                      {preset.name}
                    </h3>
                    <p className="mt-2 flex-1 text-sm leading-6 text-zinc-300">
                      {preset.prompt}
                    </p>
                    <div className="mt-5 flex items-center justify-between gap-4 border-t border-white/10 pt-4">
                      <span className="text-xs text-zinc-500">
                        {preset.source}
                      </span>
                      <Link
                        href={`/image?prompt=${encodeURIComponent(preset.prompt)}`}
                        className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-black transition-colors duration-150 hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-400"
                      >
                        Use in Image
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 px-6 py-12 text-center">
                <p className="text-sm font-semibold text-white">
                  No presets found
                </p>
                <p className="mt-2 text-sm text-zinc-400">
                  Try a shorter search in this category.
                </p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
