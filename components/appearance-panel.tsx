"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

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
  wallpaperCss,
  type HomeDesign,
} from "@/lib/design";
import { compressWallpaper } from "@/lib/image";
import { HOME_THEMES, applyTheme, matchingTheme } from "@/lib/themes";

type AppearancePanelProps = {
  design: HomeDesign;
  onChange: (design: HomeDesign) => void;
  className?: string;
};

const rowClass =
  "flex min-h-[clamp(64px,13.1cqw,88px)] shrink-0 items-center justify-between gap-2 rounded-2xl px-3 py-2 text-[clamp(16px,3.87cqw,26px)] leading-snug outline-none transition-colors hover:bg-white/[0.07] focus-within:bg-white focus-within:text-[#14202c]";

export function AppearancePanel({
  design,
  onChange,
  className,
}: AppearancePanelProps) {
  const [appsOpen, setAppsOpen] = useState(false);
  const [details, setDetails] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [uploading, setUploading] = useState(false);
  const imageRef = useRef<HTMLInputElement>(null);
  const latestDesign = useRef(design);
  useEffect(() => {
    latestDesign.current = design;
  }, [design]);

  async function uploadPhoto(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const image = await compressWallpaper(file);
      onChange({
        ...latestDesign.current,
        wallpaper: { type: "image", dataUrl: image.dataUrl, name: image.name },
      });
      toast.success("Fotoğraf arka plana eklendi.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Fotoğraf yüklenemedi.",
      );
    } finally {
      setUploading(false);
    }
  }

  const panelClass = `@container flex min-w-0 flex-col overflow-hidden rounded-[28px] border border-white/[0.16] bg-[#182331]/65 text-white shadow-[0_24px_80px_#00000045,inset_0_1px_0_#ffffff12] backdrop-blur-[44px] ${className ?? ""}`;

  if (details) {
    return (
      <aside
        data-appearance-panel
        aria-label="Dosya ve REA ayarları"
        className={panelClass}
      >
        <div className="border-b border-white/10 p-5">
          <button
            type="button"
            className="flex min-h-10 items-center gap-2 rounded-full px-3 text-sm text-white/85 outline-none hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white"
            onClick={() => setDetails(false)}
          >
            <ArrowLeft className="size-4" aria-hidden="true" /> Görünüme dön
          </button>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">
            Dosya ve REA
          </h2>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 [scrollbar-width:thin]">
          <DesignEditor
            design={design}
            onChange={onChange}
            defaultTab="dosya"
          />
        </div>
      </aside>
    );
  }

  const wallpaperName =
    design.wallpaper.type === "image"
      ? design.wallpaper.name || "Kendi fotoğrafın"
      : WALLPAPER_NAMES[design.wallpaper.presetId];
  const theme = matchingTheme(design);

  return (
    <aside
      data-appearance-panel
      aria-label="Görünüm ayarları"
      className={panelClass}
    >
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 p-[clamp(20px,4.5cqw,30px)]">
        <div>
          <p className="mb-2 text-[11px] font-semibold tracking-[0.22em] text-[#c7d3e3]/65 uppercase">
            Kendi ekranın
          </p>
          <h2 className="text-[clamp(28px,5.95cqw,40px)] leading-none font-semibold tracking-tight">
            Kendin yap
          </h2>
        </div>
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white/[0.07] ring-1 ring-white/10">
          <SlidersHorizontal
            className="size-5 text-white/75"
            aria-hidden="true"
          />
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-[clamp(12px,3cqw,20px)] [scrollbar-width:thin]">
        <section
          aria-label="Tema galerisi"
          className="mb-4 rounded-[20px] border border-white/10 bg-black/10 p-3"
        >
          <div className="mb-3 flex items-center justify-between gap-2 text-[clamp(12px,2.4cqw,16px)]">
            <span className="flex items-center gap-2 font-medium">
              <Sparkles className="size-4 text-[#d3dded]" aria-hidden="true" />
              Temalar
            </span>
            <span className="text-right text-white/55">
              {theme?.name ?? "Özel görünüm"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 @min-[480px]:grid-cols-4">
            {HOME_THEMES.map((preset) => (
              <button
                key={preset.id}
                type="button"
                aria-pressed={theme?.id === preset.id}
                aria-label={`${preset.name} temasını uygula`}
                title={preset.description}
                onClick={() => onChange(applyTheme(design, preset))}
                className="group relative flex h-[clamp(76px,16cqw,108px)] flex-col justify-end overflow-hidden rounded-xl border border-white/15 p-2.5 text-left outline-none transition hover:border-white/50 focus-visible:ring-2 focus-visible:ring-white aria-pressed:border-white/80 aria-pressed:ring-1 aria-pressed:ring-white/70"
              >
                <span
                  className="absolute inset-0 transition-transform duration-500 group-hover:scale-110 motion-reduce:transition-none"
                  style={{
                    background: wallpaperCss(preset.appearance.wallpaper),
                  }}
                />
                <span className="absolute inset-0 bg-gradient-to-t from-[#071018]/95 via-[#071018]/15 to-transparent" />
                {theme?.id === preset.id ? (
                  <Check
                    className="absolute top-2 right-2 size-4 rounded-full bg-white p-0.5 text-black"
                    aria-hidden="true"
                  />
                ) : null}
                <span className="relative text-[clamp(12px,2.4cqw,16px)] leading-tight font-medium">
                  {preset.name}
                </span>
              </button>
            ))}
          </div>
        </section>

        <div className="flex flex-col gap-1">
          <ChoiceRow
            label="Tasarım"
            value={panelLayoutLabel(design.layout)}
            onCycle={(direction) =>
              onChange({
                ...design,
                layout: cycleChoice(PANEL_LAYOUT_IDS, design.layout, direction),
              })
            }
          />
          <ChoiceRow
            label="Arka plan"
            value={wallpaperName}
            onCycle={(direction) =>
              onChange({
                ...design,
                wallpaper: {
                  type: "preset",
                  presetId: cycleChoice(
                    WALLPAPER_PRESET_IDS,
                    design.wallpaper.type === "preset"
                      ? design.wallpaper.presetId
                      : WALLPAPER_PRESET_IDS[0],
                    direction,
                  ),
                },
              })
            }
          />
          <input
            ref={imageRef}
            type="file"
            accept="image/*"
            className="sr-only"
            aria-label="Duvar fotoğrafı seç"
            disabled={uploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              void uploadPhoto(file);
            }}
          />
          <button
            type="button"
            className={`${rowClass} w-full text-left disabled:opacity-60`}
            disabled={uploading}
            onClick={() => imageRef.current?.click()}
          >
            <span className="font-medium">Fotoğraf yükle</span>
            <span className="flex shrink-0 items-center gap-2 text-current/65">
              {uploading
                ? "Hazırlanıyor…"
                : design.wallpaper.type === "image"
                  ? "Değiştir"
                  : "Görsel seç"}
              <ImagePlus className="size-[1.1em]" aria-hidden="true" />
            </span>
          </button>
          <div className={`${rowClass} flex-wrap`}>
            <label htmlFor="panel-lamp" className="font-medium">
              Lamba
            </label>
            <div className="flex w-[58%] min-w-0 items-center gap-3">
              <input
                id="panel-lamp"
                aria-label="Lamba yoğunluğu"
                type="range"
                min={0}
                max={100}
                step={1}
                value={design.lamp}
                onChange={(event) =>
                  onChange({ ...design, lamp: Number(event.target.value) })
                }
                className="h-6 min-w-0 flex-1 cursor-pointer accent-[#cbdcf3]"
              />
              <output
                htmlFor="panel-lamp"
                className="w-[3.6em] shrink-0 text-right font-semibold tabular-nums"
              >
                {design.lamp}%
              </output>
            </div>
          </div>
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
                logoColor: cycleChoice(
                  LOGO_COLOR_IDS,
                  design.logoColor,
                  direction,
                ),
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
            className={`${rowClass} w-full text-left`}
            aria-expanded={appsOpen}
            aria-controls="panel-apps"
            onClick={() => setAppsOpen((open) => !open)}
          >
            <span className="font-medium">Uygulamalar</span>
            <span className="flex items-center gap-2 text-current/65">
              {design.apps.length} seçili{" "}
              <ChevronRight
                className={`size-[1.1em] transition-transform ${appsOpen ? "rotate-90" : ""}`}
                aria-hidden="true"
              />
            </span>
          </button>
          {appsOpen ? (
            <div id="panel-apps">
              <AppEditor
                design={design}
                draftName={draftName}
                onDraftName={setDraftName}
                onChange={onChange}
              />
            </div>
          ) : null}
        </div>
      </div>

      <div className="shrink-0 border-t border-white/10 bg-[#101a26]/30 p-[clamp(16px,3cqw,24px)]">
        <div className="flex flex-wrap items-center gap-2 text-[clamp(12px,2.4cqw,16px)]">
          <Link
            href="/kumanda"
            className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2.5 outline-none transition hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white"
          >
            Kumanda
          </Link>
          <Link
            href="/tv"
            className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2.5 outline-none transition hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white"
          >
            Tam ekran
          </Link>
          <button
            type="button"
            className="ml-auto rounded-full px-3 py-2.5 text-white/65 outline-none transition hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white"
            onClick={() => setDetails(true)}
          >
            Dosya ve REA
          </button>
        </div>
        <p className="mt-3 text-[clamp(11px,2cqw,13px)] text-white/45">
          Her değişiklik önizlemeye yansır ve bu tarayıcıya kaydolur.
        </p>
      </div>
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
      className={rowClass}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
          event.preventDefault();
          event.stopPropagation();
          onCycle(event.key === "ArrowRight" ? 1 : -1);
        }
      }}
    >
      <span className="min-w-0 font-medium">{label}</span>
      <span className="grid w-[58%] min-w-0 grid-cols-[1.2em_minmax(0,1fr)_1.2em] items-center gap-1 font-semibold">
        <button
          type="button"
          aria-label={`${label} önceki`}
          className="grid min-h-10 place-items-center rounded-full outline-none"
          onClick={() => onCycle(-1)}
        >
          <ChevronLeft className="size-[0.8em] opacity-50" aria-hidden="true" />
        </button>
        <span className="min-w-0 text-center wrap-anywhere">{value}</span>
        <button
          type="button"
          aria-label={`${label} sonraki`}
          className="grid min-h-10 place-items-center rounded-full outline-none"
          onClick={() => onCycle(1)}
        >
          <ChevronRight
            className="size-[0.8em] opacity-50"
            aria-hidden="true"
          />
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
              {
                id: newId(),
                name: name.slice(0, LIMITS.appName),
                colorId: "bakir",
              },
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
        <button
          type="submit"
          className="rounded-full bg-white px-3 py-1.5 text-sm text-black"
        >
          Ekle
        </button>
      </form>
    </div>
  );
}
