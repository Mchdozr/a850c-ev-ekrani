"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

import { AppGlyphMark } from "@/components/app-marks";
import { PosterStill } from "@/components/poster-still";
import { APP_COLORS, wallpaperCss, type HomeDesign } from "@/lib/design";
import { appKey, cardKey, heroKey } from "@/lib/focus";
import { appMarkKind } from "@/lib/marks";
import { glyphFill, mosaicSlots, tileFill, tileInk } from "@/lib/mosaic";
import { formatIstanbulDate, formatIstanbulTime } from "@/lib/time";

type TvScreenProps = {
  design: HomeDesign;
  focusKey: string | null;
  onActivate: (key: string) => void;
};

function useNow() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

function ClockBlock({
  now,
  large,
  mosaic,
  align = "end",
}: {
  now: Date | null;
  large?: boolean;
  mosaic?: boolean;
  align?: "end" | "center" | "start";
}) {
  return (
    <div
      className={
        align === "center"
          ? "flex flex-col items-center gap-[0.55cqw] text-center"
          : align === "start"
            ? "flex flex-col items-start gap-[0.2cqw] text-left"
            : "flex flex-col items-end gap-[0.35cqw] text-right"
      }
    >
      <p
        className={
          large
            ? "font-sans text-[15cqw] leading-none font-light tracking-tight tabular-nums"
            : mosaic
              ? "font-sans text-[5.83cqw] leading-none font-light tracking-tight text-white tabular-nums"
              : "font-sans text-[5.8cqw] leading-none font-light tracking-tight tabular-nums"
        }
      >
        {now ? formatIstanbulTime(now) : "--:--"}
      </p>
      <p
        className={
          mosaic
            ? "text-[1.46cqw] font-medium text-[#C5CED8]"
            : "text-[1.15cqw] font-light text-foreground/45"
        }
      >
        {now ? formatIstanbulDate(now) : "İstanbul"}
      </p>
    </div>
  );
}

function TvButton({
  itemKey,
  focused,
  onActivate,
  className,
  mark,
  label,
  style,
  children,
}: {
  itemKey: string;
  focused: boolean;
  onActivate: (key: string) => void;
  className: string;
  mark?: string;
  label?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      data-tv-item
      data-focus-key={itemKey}
      data-focused={focused ? "true" : "false"}
      data-app-mark={mark}
      aria-label={label}
      className={className}
      style={style}
      onClick={() => onActivate(itemKey)}
    >
      {children}
    </button>
  );
}

function AppDock({
  design,
  focusKey,
  onActivate,
  thin,
  vertical,
}: {
  design: HomeDesign;
  focusKey: string | null;
  onActivate: (key: string) => void;
  thin?: boolean;
  vertical?: boolean;
}) {
  if (design.apps.length === 0) {
    return (
      <p className="text-[1.3cqw] font-light text-foreground/50">
        Uygulama şeridi boş.
      </p>
    );
  }
  return (
    <div
      className={
        vertical
          ? "flex w-[9.2cqw] shrink-0 flex-col items-center gap-[0.85cqw] overflow-y-auto px-[0.4cqw] py-[0.7cqw]"
          : "flex items-end gap-[1.35cqw] overflow-x-auto px-[0.35cqw] py-[0.45cqw]"
      }
    >
      {design.apps.map((app) => (
        <BrandTile
          key={app.id}
          design={design}
          app={app}
          featured={false}
          compact={thin}
          focusKey={focusKey}
          onActivate={onActivate}
          className={vertical ? "h-[12.8cqh] w-[7.8cqw] shrink-0" : "h-[12.8cqh] w-[10cqw] shrink-0"}
        />
      ))}
    </div>
  );
}

function ContentCardButton({
  rowId,
  cardId,
  title,
  meta,
  focusKey,
  onActivate,
  hero,
}: {
  rowId: string;
  cardId: string;
  title: string;
  meta: string;
  focusKey: string | null;
  onActivate: (key: string) => void;
  hero?: boolean;
}) {
  const key = hero ? heroKey(rowId, cardId) : cardKey(rowId, cardId);
  const label = title.trim() || "Adsız kart";
  return (
    <TvButton
      itemKey={key}
      focused={focusKey === key}
      onActivate={onActivate}
      className={
        hero
          ? "flex h-full min-h-0 w-full flex-1 flex-col justify-end rounded-[1.4cqw] p-[1.6cqw] text-left"
          : "flex w-[14.8cqw] shrink-0 flex-col gap-[0.4cqw] text-left"
      }
    >
      <span
        className={
          hero
            ? "tv-glow relative flex h-full min-h-[12cqw] flex-col justify-end gap-[0.55cqw] overflow-hidden rounded-[1.15cqw] p-[1.5cqw]"
            : "tv-glow relative block aspect-video overflow-hidden rounded-[1.15cqw]"
        }
      >
        <PosterStill
          cardId={cardId}
          title={hero ? undefined : label}
          meta={hero ? undefined : meta.trim() || "Bilgi yok"}
        />
        {hero ? (
          <>
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
            <span className="relative text-[1.1cqw] font-medium tracking-[0.16em] text-white/80 uppercase">
              Öne çıkan
            </span>
            <span className="relative font-sans text-[4cqw] leading-none font-light tracking-tight text-white">
              {label}
            </span>
            <span className="relative text-[1.35cqw] font-light text-white/80">
              {meta.trim() || "Bilgi yok"}
            </span>
          </>
        ) : null}
      </span>
    </TvButton>
  );
}

function SalonLayout({
  design,
  focusKey,
  onActivate,
  now,
}: TvScreenProps & { now: Date | null }) {
  return (
    <div className="relative h-full">
      {design.showClock ? (
        <div className="absolute top-[5.93cqh] left-[5cqw]">
          <ClockBlock now={now} align="start" mosaic />
        </div>
      ) : null}
      <div className="absolute bottom-[12.6cqh] left-0 flex w-full items-end justify-center gap-[1.25cqw]">
        {design.apps.map((app, index) => (
          <BrandTile
            key={app.id}
            design={design}
            app={app}
            featured={index < 2}
            focusKey={focusKey}
            onActivate={onActivate}
            className={index < 2 ? "h-[19.26cqh] w-[18.75cqw]" : "h-[16.3cqh] w-[11.25cqw]"}
          />
        ))}
      </div>
      <HelpLine />
    </div>
  );
}

function SinemaLayout({
  design,
  focusKey,
  onActivate,
}: TvScreenProps) {
  const cards = design.rows.flatMap((row) =>
    row.cards.map((card) => ({ row, card })),
  );
  const hero = cards[0];
  const side = cards.slice(1);
  return (
    <div className="flex h-full min-h-0 gap-[1.4cqw] p-[2.6cqw]">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {hero ? (
          <ContentCardButton
            rowId={hero.row.id}
            cardId={hero.card.id}
            title={hero.card.title}
            meta={hero.card.meta}
            focusKey={focusKey}
            onActivate={onActivate}
            hero
          />
        ) : (
          <div className="flex h-full items-center justify-center rounded-[1.4cqw] bg-white/[0.04] p-[2cqw] text-center text-[1.55cqw] font-light text-foreground/65 ring-1 ring-white/10">
            Sinema düzeni için bir kart ekleyin. A 850 C afişi burada durur.
          </div>
        )}
      </div>
      <div className="flex w-[28%] min-w-0 flex-col gap-[0.7cqw] overflow-y-auto py-[0.4cqw]">
        <p className="text-[1.05cqw] font-medium tracking-[0.14em] text-foreground/45 uppercase">
          A 850 C
        </p>
        {side.length === 0 ? (
          <p className="text-[1.25cqw] font-light text-foreground/50">
            Yan liste boş.
          </p>
        ) : (
          side.map(({ row, card }) => {
            const key = cardKey(row.id, card.id);
            return (
              <TvButton
                key={card.id}
                itemKey={key}
                focused={focusKey === key}
                onActivate={onActivate}
                className="tv-glow flex flex-col gap-[0.2cqw] rounded-[0.95cqw] bg-white/[0.06] px-[0.95cqw] py-[0.75cqw] text-left ring-1 ring-white/10"
              >
                <span className="truncate font-sans text-[1.45cqw] leading-tight font-medium">
                  {card.title.trim() || "Adsız kart"}
                </span>
                <span className="truncate text-[1.1cqw] font-light text-foreground/50">
                  {card.meta.trim() || row.title}
                </span>
              </TvButton>
            );
          })
        )}
      </div>
      <AppDock
        design={design}
        focusKey={focusKey}
        onActivate={onActivate}
        thin
        vertical
      />
    </div>
  );
}

function SaatLayout({
  design,
  focusKey,
  onActivate,
  now,
}: TvScreenProps & { now: Date | null }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const reveal = () => setShown(true);
    const onKey = (event: KeyboardEvent) => {
      if (event.key.startsWith("Arrow")) {
        reveal();
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("tv-reveal-apps", reveal);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("tv-reveal-apps", reveal);
    };
  }, []);
  return (
    <div className="relative h-full" data-clock-apps={shown ? "shown" : "hidden"}>
      <div className="absolute inset-0 flex items-center justify-center">
        {design.showClock ? (
          <p className="font-sans text-[8.33cqw] leading-none font-light tracking-tight text-white tabular-nums">
            {now ? formatIstanbulTime(now) : "--:--"}
          </p>
        ) : (
          <p className="font-sans text-[4cqw] font-medium text-white">Saat gizli.</p>
        )}
      </div>
      {shown ? (
        <div className="absolute bottom-[12.6cqh] left-0 flex w-full items-end justify-center gap-[1.25cqw]">
          {design.apps.map((app, index) => (
            <BrandTile
              key={app.id}
              design={design}
              app={app}
              featured={index < 2}
              focusKey={focusKey}
              onActivate={onActivate}
              className={index < 2 ? "h-[19.26cqh] w-[18.75cqw]" : "h-[16.3cqh] w-[11.25cqw]"}
            />
          ))}
        </div>
      ) : null}
      <HelpLine />
    </div>
  );
}

function BrandTile({
  design,
  app,
  featured,
  focusKey,
  onActivate,
  className,
  compact = false,
}: {
  design: HomeDesign;
  app: HomeDesign["apps"][number];
  featured: boolean;
  focusKey: string | null;
  onActivate: (key: string) => void;
  className: string;
  compact?: boolean;
}) {
  const kind = appMarkKind(app.id, app.name);
  const color = APP_COLORS[app.colorId];
  const fill = tileFill(kind, design.tiles, design.logoColor, color.swatch);
  const ink = kind === "letter" && design.tiles === "marka" && design.logoColor === "marka" ? color.ink : tileInk(fill);
  const mark = glyphFill(kind, design.tiles, design.logoColor, color.ink);
  const label = app.name.trim() || "Adsız";
  const nameSize = compact ? "text-[0.95cqw]" : featured ? "text-[1.55cqw]" : "text-[1.22cqw]";
  return (
    <TvButton
      itemKey={appKey(app.id)}
      focused={focusKey === appKey(app.id)}
      onActivate={onActivate}
      mark={kind}
      label={label}
      className={`tv-glow relative overflow-hidden rounded-[1.46cqw] border border-white/15 text-left backdrop-blur-2xl ${className}`}
      style={{
        backgroundColor: fill,
        backgroundImage: "linear-gradient(145deg, rgba(255,255,255,0.13), rgba(255,255,255,0.015) 48%, rgba(0,0,0,0.08))",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2), 0 12px 30px rgba(0,0,0,0.16)",
      }}
    >
      <span className={`flex h-full flex-col items-center justify-center ${compact ? "gap-[0.2cqw] p-[0.45cqw]" : "gap-[0.45cqw] p-[0.8cqw]"}`}>
        {design.labels === "ad" ? (
          <span className={`max-w-full truncate font-sans leading-tight font-semibold ${nameSize}`} style={{ color: ink }}>
            {label}
          </span>
        ) : (
          <span className="flex min-h-0 w-full flex-1 items-center justify-center">
            <span className={`block h-full max-h-full ${kind === "ayarlar" ? "aspect-square max-w-[40%]" : kind === "netflix" || kind === "youtube" ? "w-[65%]" : "w-[91%]"}`}>
              <AppGlyphMark
                kind={kind}
                fill={mark}
                letter={label.slice(0, 1).toLocaleUpperCase("tr-TR")}
              />
            </span>
          </span>
        )}
        {design.labels === "logo-ad" ? (
          <span className={`max-w-full shrink-0 truncate font-semibold ${nameSize}`} style={{ color: ink }}>
            {label}
          </span>
        ) : null}
      </span>
    </TvButton>
  );
}

function HelpLine() {
  return (
    <p className="absolute bottom-[2.2cqh] left-[5cqw] text-[1.25cqw] font-medium text-[#C5CED8]">
      Tamam: Aç · Yön tuşları: Gezin
    </p>
  );
}

function MosaicLayout({
  design,
  focusKey,
  onActivate,
  now,
}: TvScreenProps & { now: Date | null }) {
  const slots = mosaicSlots(design.apps);
  const rows = [...new Set(slots.map((slot) => slot.row))]
    .sort((left, right) => left - right)
    .map((row) => slots.filter((slot) => slot.row === row).sort((left, right) => left.column - right.column));
  return (
    <div className="relative h-full">
      {design.showClock ? (
        <div className="absolute top-[5.93cqh] left-[5cqw]">
          <ClockBlock now={now} align="start" mosaic />
        </div>
      ) : null}
      <div className="absolute top-[42.22cqh] bottom-[10cqh] left-[5cqw] flex w-[90cqw] flex-col gap-[2.22cqh] overflow-y-auto overflow-x-hidden p-[0.65cqw] -m-[0.65cqw] [scrollbar-width:none]">
        {slots.length === 0 ? (
          <p className="text-[1.5cqw] font-semibold text-white">Uygulama seçilmedi.</p>
        ) : (
          rows.map((row, index) => (
            <div key={index} className="grid shrink-0 gap-[1.25cqw]" style={{ gridTemplateColumns: `repeat(${row[0]?.featured ? 2 : 4}, minmax(0, 1fr))` }}>
              {row.map((slot) => (
                <BrandTile
                  key={slot.app.id}
                  design={design}
                  app={slot.app}
                  featured={slot.featured}
                  focusKey={focusKey}
                  onActivate={onActivate}
                  className={slot.featured ? "h-[23.7cqh] w-full" : "h-[17.04cqh] w-full"}
                />
              ))}
            </div>
          ))
        )}
      </div>
      <HelpLine />
    </div>
  );
}

function ScreenBody(props: TvScreenProps & { now: Date | null }) {
  switch (props.design.layout) {
    case "mozaik":
      return <MosaicLayout {...props} />;
    case "salon":
      return <SalonLayout {...props} />;
    case "sinema":
      return <SinemaLayout {...props} />;
    case "saat":
      return <SaatLayout {...props} />;
    default: {
      const exhaustive: never = props.design.layout;
      return exhaustive;
    }
  }
}

export function TvScreen(props: TvScreenProps) {
  const now = useNow();
  const lamp = Math.min(100, Math.max(0, props.design.lamp)) / 100;
  const scrim = "linear-gradient(180deg, rgba(5,10,18,0.24) 0%, transparent 34%, rgba(5,10,18,0.12) 67%, rgba(5,10,18,0.35) 100%)";
  const font = props.design.fontStyle === "yumusak" ? "var(--font-nunito-sans)" : "var(--font-inter)";
  return (
    <div
      className="relative h-full w-full overflow-hidden bg-background font-sans text-foreground [container-type:size]"
      data-font={props.design.fontStyle}
      style={{ "--font-body": font, fontFamily: `${font}, sans-serif` } as CSSProperties}
    >
      <div
        className="absolute inset-0"
        style={{ background: wallpaperCss(props.design.wallpaper) }}
      />
      <div
        className="lamp-glow pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(78% 64% at 72% -8%, rgba(255,224,181,${0.55 * lamp}), transparent 72%)`,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: scrim }}
      />
      <div className="relative h-full">
        <ScreenBody {...props} now={now} />
      </div>
      <button
        type="button"
        aria-label="Canlı TV kısayolu"
        onClick={() => props.onActivate("app:app-canli-tv")}
        className="absolute right-[5cqw] top-[4.6cqw] rounded-full border border-white/30 bg-[#1a1110]/55 px-[1.35cqw] py-[0.8cqw] text-[1.12cqw] font-semibold text-white shadow-lg backdrop-blur-xl transition hover:bg-[#6a3d1b]/75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        Canlı TV
      </button>
    </div>
  );
}
