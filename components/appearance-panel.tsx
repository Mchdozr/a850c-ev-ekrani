"use client";

import { useState } from "react";
import Link from "next/link";

import { DesignEditor } from "@/components/design-editor";
import {
  FONT_IDS,
  LABEL_IDS,
  LOGO_COLOR_IDS,
  PANEL_LAYOUT_IDS,
  TILE_IDS,
  WALLPAPER_NAMES,
  WALLPAPER_PRESET_IDS,
  LIMITS,
  cycleChoice,
  fontLabel,
  labelModeLabel,
  logoColorLabel,
  moveListItem,
  newId,
  panelLayoutLabel,
  tileLabel,
  type HomeDesign,
  type LayoutId,
} from "@/lib/design";

type AppearancePanelProps = {
  design: HomeDesign;
  onChange: (design: HomeDesign) => void;
  className?: string;
};

export function AppearancePanel({
  design,
  onChange,
  className,
}: AppearancePanelProps) {
  const [appsOpen, setAppsOpen] = useState(false);
  const [details, setDetails] = useState(false);
  const [draftName, setDraftName] = useState("");

  if (details) {
    return (
      <aside
        data-appearance-panel
        className={`flex flex-col overflow-hidden rounded-[1.6rem] bg-background/95 p-4 text-foreground shadow-2xl ring-1 ring-white/15 ${className ?? ""}`}
      >
        <button
          type="button"
          className="mb-3 self-start rounded-full px-3 py-1.5 text-sm text-white/80"
          onClick={() => setDetails(false)}
        >
          Kendin yap
        </button>
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <DesignEditor design={design} onChange={onChange} />
        </div>
      </aside>
    );
  }

  const wallpaperName =
    design.wallpaper.type === "image"
      ? design.wallpaper.name || "Görsel"
      : WALLPAPER_NAMES[design.wallpaper.presetId];

  return (
    <aside
      data-appearance-panel
      className={`flex flex-col gap-3 overflow-hidden rounded-l-[32px] bg-[#15202BCC] p-12 text-white shadow-2xl backdrop-blur-[24px] ${className ?? ""}`}
    >
      <div>
        <p className="text-[0.68rem] font-medium tracking-[0.2em] text-white/50 uppercase">
          Görünüm
        </p>
        <h2 className="mt-1 font-sans text-[40px] leading-none font-semibold tracking-tight">
          Kendin yap
        </h2>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pr-1">
        <ChoiceRow
          label="Tasarım"
          value={panelLayoutLabel(design.layout)}
          onCycle={(direction) => {
            const current = (PANEL_LAYOUT_IDS as readonly string[]).includes(
              design.layout,
            )
              ? (design.layout as (typeof PANEL_LAYOUT_IDS)[number])
              : "mozaik";
            onChange({
              ...design,
              layout: cycleChoice(PANEL_LAYOUT_IDS, current, direction) as LayoutId,
            });
          }}
        />
        <ChoiceRow
          label="Arka plan"
          value={wallpaperName}
          onCycle={(direction) => {
            const current =
              design.wallpaper.type === "preset"
                ? design.wallpaper.presetId
                : WALLPAPER_PRESET_IDS[0];
            onChange({
              ...design,
              wallpaper: {
                type: "preset",
                presetId: cycleChoice(WALLPAPER_PRESET_IDS, current, direction),
              },
            });
          }}
        />
        <ChoiceRow
          label="Karolar"
          value={tileLabel(design.tiles)}
          onCycle={(direction) =>
            onChange({
              ...design,
              tiles: cycleChoice(TILE_IDS, design.tiles, direction),
            })
          }
        />
        <ChoiceRow
          label="Etiketler"
          value={labelModeLabel(design.labels)}
          onCycle={(direction) =>
            onChange({
              ...design,
              labels: cycleChoice(LABEL_IDS, design.labels, direction),
            })
          }
        />
        <ChoiceRow
          label="Logo rengi"
          value={logoColorLabel(design.logoColor)}
          onCycle={(direction) =>
            onChange({
              ...design,
              logoColor: cycleChoice(LOGO_COLOR_IDS, design.logoColor, direction),
            })
          }
        />
        <ChoiceRow
          label="Yazı tipi"
          value={fontLabel(design.fontStyle)}
          onCycle={(direction) =>
            onChange({
              ...design,
              fontStyle: cycleChoice(FONT_IDS, design.fontStyle, direction),
            })
          }
        />
        <ChoiceRow
          label="Saat"
          value={design.showClock ? "Göster" : "Gizle"}
          onCycle={() =>
            onChange({ ...design, showClock: !design.showClock })
          }
        />
        <button
          type="button"
          className="flex items-center justify-between rounded-2xl px-3 py-3 text-left hover:bg-white/10 focus-visible:bg-white focus-visible:text-black"
          onClick={() => setAppsOpen((open) => !open)}
        >
          <span className="text-[0.98rem]">Uygulamaları seç</span>
          <span className="text-sm text-white/70">{appsOpen ? "Kapat" : "Düzenle"}</span>
        </button>
        {appsOpen ? (
          <AppEditor
            design={design}
            draftName={draftName}
            onDraftName={setDraftName}
            onChange={onChange}
          />
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-3 text-sm">
        <Link href="/kumanda" className="rounded-full bg-white/10 px-3 py-1.5">
          Kumanda
        </Link>
        <Link href="/tv" className="rounded-full bg-white/10 px-3 py-1.5">
          Tam ekran
        </Link>
        <button
          type="button"
          className="rounded-full px-3 py-1.5 text-white/70"
          onClick={() => setDetails(true)}
        >
          Dosya ve REA
        </button>
      </div>
      <p className="text-xs text-white/45">
        Sol ve sağ ayarı değiştirir. Değişiklik hemen kaydolur.
      </p>
    </aside>
  );
}

function ChoiceRow({
  label,
  value,
  onCycle,
}: {
  label: string;
  value: string;
  onCycle: (direction: -1 | 1) => void;
}) {
  return (
    <div
      tabIndex={0}
      role="group"
      aria-label={label}
      className="flex h-[88px] items-center justify-between gap-3 rounded-2xl px-3 text-[26px] font-semibold outline-none hover:bg-white/10 focus-within:bg-white focus-within:text-black"
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") {
          event.preventDefault();
          event.stopPropagation();
          onCycle(1);
        }
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          event.stopPropagation();
          onCycle(-1);
        }
      }}
    >
      <span className="text-[0.98rem]">{label}</span>
      <span className="flex items-center gap-1.5 text-[0.95rem]">
        <button
          type="button"
          aria-label={`${label} önceki`}
          className="grid size-7 place-items-center rounded-full"
          onClick={() => onCycle(-1)}
        >
          ‹
        </button>
        <span className="min-w-[7.5rem] text-center">{value}</span>
        <button
          type="button"
          aria-label={`${label} sonraki`}
          className="grid size-7 place-items-center rounded-full"
          onClick={() => onCycle(1)}
        >
          ›
        </button>
      </span>
    </div>
  );
}

function AppEditor({
  design,
  draftName,
  onDraftName,
  onChange,
}: {
  design: HomeDesign;
  draftName: string;
  onDraftName: (value: string) => void;
  onChange: (design: HomeDesign) => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-black/25 p-3">
      {design.apps.length === 0 ? (
        <p className="text-sm text-white/60">Şerit boş.</p>
      ) : (
        design.apps.map((app, index) => (
          <div key={app.id} className="flex items-center gap-2 text-sm">
            <span className="min-w-0 flex-1 truncate">{app.name}</span>
            <button
              type="button"
              className="rounded-full bg-white/10 px-2 py-1"
              onClick={() =>
                onChange({
                  ...design,
                  apps: moveListItem(design.apps, index, -1),
                })
              }
            >
              Yukarı
            </button>
            <button
              type="button"
              className="rounded-full bg-white/10 px-2 py-1"
              onClick={() =>
                onChange({
                  ...design,
                  apps: moveListItem(design.apps, index, 1),
                })
              }
            >
              Aşağı
            </button>
            <button
              type="button"
              className="rounded-full bg-white/10 px-2 py-1"
              onClick={() =>
                onChange({
                  ...design,
                  apps: design.apps.filter((item) => item.id !== app.id),
                })
              }
            >
              Sil
            </button>
          </div>
        ))
      )}
      <form
        className="mt-1 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (design.apps.length >= LIMITS.apps) {
            return;
          }
          const name = draftName.trim() || "Yeni uygulama";
          onChange({
            ...design,
            apps: [
              ...design.apps,
              { id: newId(), name: name.slice(0, LIMITS.appName), colorId: "bakir" },
            ],
          });
          onDraftName("");
        }}
      >
        <input
          value={draftName}
          onChange={(event) => onDraftName(event.target.value)}
          placeholder="Uygulama adı"
          maxLength={LIMITS.appName}
          className="min-w-0 flex-1 rounded-full bg-white/10 px-3 py-1.5 text-sm outline-none"
        />
        <button type="submit" className="rounded-full bg-white px-3 py-1.5 text-sm text-black">
          Ekle
        </button>
      </form>
    </div>
  );
}
