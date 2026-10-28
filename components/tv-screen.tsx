"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

import { AppGlyphMark, AppMark } from "@/components/app-marks";
import { PosterStill } from "@/components/poster-still";
import { APP_COLORS, wallpaperCss, type HomeDesign } from "@/lib/design";
import { appKey, cardKey, heroKey } from "@/lib/focus";
import { appMarkKind, type AppMarkKind } from "@/lib/marks";
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
  style,
  children,
}: {
  itemKey: string;
  focused: boolean;
  onActivate: (key: string) => void;
  className: string;
  mark?: string;
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
      className={className}
      style={style}
      onClick={() => onActivate(itemKey)}
    >
      {children}
    </button>
  );
}

function AppGlyph({
  id,
  name,
  colorId,
  lead,
  thin,
}: {
  id: string;
  name: string;
  colorId: HomeDesign["apps"][number]["colorId"];
  lead: boolean;
  thin?: boolean;
}) {
  const color = APP_COLORS[colorId];
  const label = name.trim() || "Adsız";
  const kind = appMarkKind(id, label);
  const iconClass = thin
    ? lead
      ? "size-[4.7cqw] text-[1.7cqw]"
      : "size-[3.15cqw] text-[1.15cqw]"
    : lead
      ? "size-[6.7cqw] text-[2.35cqw]"
      : "size-[4.15cqw] text-[1.45cqw]";
  return (
    <span className="flex flex-col items-center gap-[0.42cqw]">
      <span
        className={`tv-glow block overflow-hidden rounded-[30%] font-sans font-medium ${iconClass}`}
      >
        <AppMark
          kind={kind}
          letter={label.slice(0, 1).toLocaleUpperCase("tr-TR")}
          swatch={color.swatch}
          ink={color.ink}
        />
      </span>
      <span
        className={
          lead
            ? "max-w-[8.4cqw] truncate text-[1.18cqw] font-medium text-foreground/90"
            : "max-w-[6.4cqw] truncate text-[1cqw] font-light text-foreground/50"
        }
      >
        {label}
      </span>
    </span>
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
      {design.apps.map((app, index) => {
        const key = appKey(app.id);
        const separate =
          index === 1 && design.apps.length > 2
            ? vertical
              ? "mb-[1.1cqw]"
              : "mr-[1.8cqw]"
            : "";
        return (
          <TvButton
            key={app.id}
            itemKey={key}
            focused={focusKey === key}
            onActivate={onActivate}
            mark={appMarkKind(app.id, app.name)}
            className={`shrink-0 rounded-[1.2cqw] text-left ${separate}`}
          >
            <AppGlyph
              id={app.id}
              name={app.name}
              colorId={app.colorId}
              lead={index < 2}
              thin={thin}
            />
          </TvButton>
        );
      })}
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
    const onKey = (event: KeyboardEvent) => {
      if (event.key.startsWith("Arrow")) {
        setShown(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return (
    <div className="relative h-full">
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

const BRAND_LOGOS: Partial<
  Record<AppMarkKind, { src: string; fit: "cover" | "contain"; plate: string }>
> = {
  youtube: { src: "/logos/youtube.png", fit: "contain", plate: "#000000" },
  netflix: { src: "/logos/netflix.png", fit: "contain", plate: "#000000" },
  disney: { src: "/logos/disney.png", fit: "cover", plate: "#041824" },
  tabii: { src: "/logos/tabii.png", fit: "cover", plate: "#FFFFFF" },
};

function BrandTile({
  design,
  app,
  featured,
  focusKey,
  onActivate,
  className,
}: {
  design: HomeDesign;
  app: HomeDesign["apps"][number];
  featured: boolean;
  focusKey: string | null;
  onActivate: (key: string) => void;
  className: string;
}) {
  const kind = appMarkKind(app.id, app.name);
  const color = APP_COLORS[app.colorId];
  const fill = tileFill(kind, design.tiles, design.logoColor, color.swatch);
  const ink = tileInk(fill);
  const mark = glyphFill(kind, design.tiles, design.logoColor, color.ink);
  const label = app.name.trim() || "Adsız";
  const nameSize = featured ? "text-[2.08cqw]" : "text-[1.56cqw]";
  const logo = design.labels === "ad" ? undefined : BRAND_LOGOS[kind];
  return (
    <TvButton
      itemKey={appKey(app.id)}
      focused={focusKey === appKey(app.id)}
      onActivate={onActivate}
      mark={kind}
      className={`tv-glow relative overflow-hidden rounded-[1.46cqw] text-left ${className}`}
      style={{ background: logo ? logo.plate : fill }}
    >
      {logo ? (
        <img
          src={logo.src}
          alt={label}
          className={
            logo.fit === "cover"
              ? "absolute inset-0 h-full w-full object-cover"
              : "absolute inset-0 m-auto h-[86%] w-auto max-w-[92%] object-contain"
          }
        />
      ) : (
        <span className="flex h-full flex-col justify-between p-[0.7cqw]">
          {design.labels === "ad" ? (
            <span className={`font-sans leading-tight font-semibold ${nameSize}`} style={{ color: ink }}>
              {label}
            </span>
          ) : (
            <span className="flex flex-1 items-center justify-center px-[0.6cqw]">
              <span className={featured ? "h-[7.2cqh] w-[78%]" : "h-[5.4cqh] w-[86%]"}>
                <AppGlyphMark
                  kind={kind}
                  fill={mark}
                  letter={label.slice(0, 1).toLocaleUpperCase("tr-TR")}
                />
              </span>
            </span>
          )}
          {design.labels === "logo" || (kind !== "letter" && kind !== "ayarlar") ? null : (
            <span className={`truncate font-semibold ${nameSize}`} style={{ color: ink }}>
              {label}
            </span>
          )}
        </span>
      )}
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
  const lead = slots.filter((slot) => slot.featured).sort((a, b) => a.column - b.column);
  const rest = slots.filter((slot) => !slot.featured).sort((a, b) => a.column - b.column);
  return (
    <div className="relative h-full">
      {design.showClock ? (
        <div className="absolute top-[5.93cqh] left-[5cqw]">
          <ClockBlock now={now} align="start" mosaic />
        </div>
      ) : null}
      <div className="absolute top-[42.22cqh] left-[5cqw] flex flex-col gap-[2.22cqh]">
        {slots.length === 0 ? (
          <p className="text-[1.5cqw] font-semibold text-white">Uygulama seçilmedi.</p>
        ) : (
          <>
            <div className="flex gap-[1.25cqw]">
              {lead.map((slot) => (
                <BrandTile
                  key={slot.app.id}
                  design={design}
                  app={slot.app}
                  featured
                  focusKey={focusKey}
                  onActivate={onActivate}
                  className="h-[23.7cqh] w-[44.375cqw]"
                />
              ))}
            </div>
            <div className="flex gap-[1.25cqw]">
              {rest.map((slot) => (
                <BrandTile
                  key={slot.app.id}
                  design={design}
                  app={slot.app}
                  featured={false}
                  focusKey={focusKey}
                  onActivate={onActivate}
                  className="h-[17.04cqh] w-[21.56cqw]"
                />
              ))}
            </div>
          </>
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
  const photo =
    props.design.wallpaper.type === "preset" &&
    (props.design.wallpaper.presetId === "sonbahar-bahce" ||
      props.design.wallpaper.presetId === "istanbul-aksam");
  const scrim = photo
    ? "linear-gradient(180deg, #0B0F1499 0%, transparent 22%, #0B0F1466 58%, #0B0F14cc 100%)"
    : "linear-gradient(180deg, #0B0F1466 0%, transparent 32%, #0B0F14aa 100%)";
  return (
    <div
      className="relative h-full w-full overflow-hidden bg-background font-sans text-foreground [container-type:size]"
      data-font={props.design.fontStyle}
      style={
        props.design.fontStyle === "yumusak"
          ? { fontFamily: "var(--font-soft), sans-serif" }
          : undefined
      }
    >
      <div
        className="absolute inset-0"
        style={{ background: wallpaperCss(props.design.wallpaper) }}
      />
      {photo ? null : (
        <div
          className="lamp-glow pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(78% 48% at 72% -8%, oklch(0.95 0.01 260 / ${0.55 * lamp}), transparent 68%)`,
          }}
        />
      )}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: scrim }}
      />
      <div className="relative h-full">
        <ScreenBody {...props} now={now} />
      </div>
    </div>
  );
}
