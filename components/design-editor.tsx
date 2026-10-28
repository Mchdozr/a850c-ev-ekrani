"use client";

import { useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Download,
  ImagePlus,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ReaPanel } from "@/components/rea-panel";
import {
  APP_COLOR_IDS,
  APP_COLORS,
  LAYOUT_IDS,
  LIMITS,
  WALLPAPER_NAMES,
  WALLPAPER_PRESET_IDS,
  createDefaultDesign,
  isAppColorId,
  isLayoutId,
  isWallpaperPresetId,
  layoutHint,
  layoutLabel,
  moveListItem,
  newId,
  parseDesign,
  type ContentCard,
  type ContentRow,
  type DockApp,
  type HomeDesign,
} from "@/lib/design";
import { compressWallpaper } from "@/lib/image";

export function DesignEditor({
  design,
  onChange,
}: {
  design: HomeDesign;
  onChange: (design: HomeDesign) => void;
}) {
  const imageRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const [resetOpen, setResetOpen] = useState(false);

  function patch(partial: Partial<HomeDesign>) {
    onChange({ ...design, ...partial });
  }

  function patchApp(id: string, partial: Partial<DockApp>) {
    onChange({
      ...design,
      apps: design.apps.map((app) =>
        app.id === id ? { ...app, ...partial } : app,
      ),
    });
  }

  function patchRow(id: string, partial: Partial<ContentRow>) {
    onChange({
      ...design,
      rows: design.rows.map((row) =>
        row.id === id ? { ...row, ...partial } : row,
      ),
    });
  }

  function patchCard(rowId: string, cardId: string, partial: Partial<ContentCard>) {
    onChange({
      ...design,
      rows: design.rows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              cards: row.cards.map((card) =>
                card.id === cardId ? { ...card, ...partial } : card,
              ),
            }
          : row,
      ),
    });
  }

  function addApp() {
    if (design.apps.length >= LIMITS.apps) {
      toast.error(`En fazla ${LIMITS.apps} uygulama ekleyebilirsiniz.`);
      return;
    }
    patch({
      apps: [
        ...design.apps,
        { id: newId(), name: "Yeni uygulama", colorId: "bakir" },
      ],
    });
  }

  function addRow() {
    if (design.rows.length >= LIMITS.rows) {
      toast.error(`En fazla ${LIMITS.rows} sıra ekleyebilirsiniz.`);
      return;
    }
    patch({
      rows: [
        ...design.rows,
        { id: newId(), title: "Yeni sıra", cards: [] },
      ],
    });
  }

  function addCard(row: ContentRow) {
    if (row.cards.length >= LIMITS.cards) {
      toast.error(`Bir sırada en fazla ${LIMITS.cards} kart olabilir.`);
      return;
    }
    patchRow(row.id, {
      cards: [
        ...row.cards,
        { id: newId(), title: "Yeni kart", meta: "Film" },
      ],
    });
  }

  async function onImage(file: File | undefined) {
    if (!file) {
      return;
    }
    try {
      const compressed = await compressWallpaper(file);
      patch({
        wallpaper: {
          type: "image",
          dataUrl: compressed.dataUrl,
          name: compressed.name,
        },
      });
      toast.success("Duvar görseli sıkıştırılıp kaydedildi.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Görsel yüklenemedi.",
      );
    }
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(design, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "a850c-ev-ekrani.json";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Tasarım JSON olarak indirildi.");
  }

  async function importJson(file: File | undefined) {
    if (!file) {
      return;
    }
    let text: string;
    try {
      text = await file.text();
    } catch {
      toast.error("Dosya okunamadı.");
      return;
    }
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      toast.error("Bu dosya geçerli bir JSON değil.");
      return;
    }
    try {
      const next = parseDesign(json);
      onChange(next);
      toast.success("Tasarım içeri aktarıldı.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Tasarım dosyası geçersiz.",
      );
    }
  }

  return (
    <Tabs defaultValue="gorunum" className="gap-4">
      <div className="w-full overflow-x-auto">
        <TabsList className="w-max">
          <TabsTrigger value="gorunum">Görünüm</TabsTrigger>
          <TabsTrigger value="duvar">Duvar</TabsTrigger>
          <TabsTrigger value="uygulama">Uygulamalar</TabsTrigger>
          <TabsTrigger value="icerik">İçerik</TabsTrigger>
          <TabsTrigger value="dosya">Dosya</TabsTrigger>
          <TabsTrigger value="rea">REA</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="gorunum" className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Düzen</CardTitle>
            <CardDescription>{layoutHint(design.layout)}</CardDescription>
          </CardHeader>
          <CardContent>
            <ToggleGroup
              type="single"
              variant="outline"
              spacing={0}
              value={design.layout}
              onValueChange={(value) => {
                if (isLayoutId(value)) {
                  patch({ layout: value });
                }
              }}
            >
              {LAYOUT_IDS.map(
                (layout) => (
                  <ToggleGroupItem key={layout} value={layout}>
                    {layoutLabel(layout)}
                  </ToggleGroupItem>
                ),
              )}
            </ToggleGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Karşılama</CardTitle>
            <CardDescription>
              Ekranın size söyleyeceği cümleler. Hava satırı sizin metninizdir.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="greeting">Karşılama</FieldLabel>
                <Textarea
                  id="greeting"
                  value={design.greeting}
                  maxLength={LIMITS.greeting}
                  rows={2}
                  onChange={(event) => patch({ greeting: event.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="profile">Profil adı</FieldLabel>
                <Input
                  id="profile"
                  value={design.profileName}
                  maxLength={LIMITS.profileName}
                  autoComplete="off"
                  onChange={(event) =>
                    patch({ profileName: event.target.value })
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="weather">Hava satırı</FieldLabel>
                <Input
                  id="weather"
                  value={design.weatherLine}
                  maxLength={LIMITS.weatherLine}
                  autoComplete="off"
                  onChange={(event) =>
                    patch({ weatherLine: event.target.value })
                  }
                />
                <FieldDescription>
                  Kendiniz yazın. Canlı hava servisi bağlanmaz.
                </FieldDescription>
              </Field>
              <Field orientation="horizontal">
                <FieldLabel htmlFor="clock">Saati göster</FieldLabel>
                <Switch
                  id="clock"
                  checked={design.showClock}
                  onCheckedChange={(checked) => patch({ showClock: checked })}
                />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lamba</CardTitle>
            <CardDescription>
              Üstten ince bir aydınlık bırakır. Şu an {design.lamp}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="lamp">Lamba yoğunluğu</FieldLabel>
                <Slider
                  id="lamp"
                  min={0}
                  max={100}
                  step={1}
                  value={[design.lamp]}
                  onValueChange={(value) => {
                    const next = value[0];
                    if (typeof next === "number") {
                      patch({ lamp: next });
                    }
                  }}
                />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="duvar" className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Hazır duvarlar</CardTitle>
            <CardDescription>
              Varsayılan duvar siyahtır. Diğer hazır duvarlar durur.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ToggleGroup
              type="single"
              variant="outline"
              spacing={1}
              className="flex w-full flex-wrap"
              value={
                design.wallpaper.type === "preset"
                  ? design.wallpaper.presetId
                  : ""
              }
              onValueChange={(value) => {
                if (isWallpaperPresetId(value)) {
                  patch({ wallpaper: { type: "preset", presetId: value } });
                }
              }}
            >
              {WALLPAPER_PRESET_IDS.map((id) => (
                <ToggleGroupItem key={id} value={id}>
                  {WALLPAPER_NAMES[id]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kendi görseliniz</CardTitle>
            <CardDescription>
              Yüklemeden önce tuvalde küçültülür, böylece tarayıcı kaydı şişmez.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <input
              ref={imageRef}
              type="file"
              accept="image/*"
              className="sr-only"
              aria-label="Duvar görseli seç"
              onChange={(event) => {
                const file = event.target.files?.[0];
                void onImage(file);
                event.target.value = "";
              }}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => imageRef.current?.click()}
              >
                <ImagePlus data-icon="inline-start" />
                Görsel yükle
              </Button>
              {design.wallpaper.type === "image" ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    patch({
                      wallpaper: { type: "preset", presetId: "siyah" },
                    })
                  }
                >
                  Görseli kaldır
                </Button>
              ) : null}
            </div>
            {design.wallpaper.type === "image" ? (
              <Badge variant="secondary">{design.wallpaper.name}</Badge>
            ) : (
              <p className="text-sm text-muted-foreground">
                Şu an hazır duvar kullanılıyor.
              </p>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="uygulama" className="flex flex-col gap-4">
        {design.apps.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Plus />
              </EmptyMedia>
              <EmptyTitle>Şerit boş</EmptyTitle>
              <EmptyDescription>
                YouTube, Netflix, BluTV ya da kendi kısayol adınızı ekleyin. Bu
                bir görünüm; uygulama buradan kurulmaz.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button type="button" onClick={addApp}>
                <Plus data-icon="inline-start" />
                Uygulama ekle
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <>
            {design.apps.map((app, index) => (
              <Card key={app.id} size="sm">
                <CardHeader>
                  <CardTitle>{app.name.trim() || "Adsız"}</CardTitle>
                  <CardDescription>Şeritte {index + 1}. sıra</CardDescription>
                  <CardAction>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        aria-label="Yukarı taşı"
                        disabled={index === 0}
                        onClick={() =>
                          patch({ apps: moveListItem(design.apps, index, -1) })
                        }
                      >
                        <ChevronUp data-icon="inline-start" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        aria-label="Aşağı taşı"
                        disabled={index === design.apps.length - 1}
                        onClick={() =>
                          patch({ apps: moveListItem(design.apps, index, 1) })
                        }
                      >
                        <ChevronDown data-icon="inline-start" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Uygulamayı sil"
                        onClick={() =>
                          patch({
                            apps: design.apps.filter((item) => item.id !== app.id),
                          })
                        }
                      >
                        <Trash2 data-icon="inline-start" />
                      </Button>
                    </div>
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor={`app-${app.id}`}>Ad</FieldLabel>
                      <Input
                        id={`app-${app.id}`}
                        value={app.name}
                        maxLength={LIMITS.appName}
                        autoComplete="off"
                        onChange={(event) =>
                          patchApp(app.id, { name: event.target.value })
                        }
                      />
                    </Field>
                    <Field>
                      <FieldLabel>Renk</FieldLabel>
                      <ToggleGroup
                        type="single"
                        variant="outline"
                        spacing={1}
                        className="flex flex-wrap"
                        value={app.colorId}
                        onValueChange={(value) => {
                          if (isAppColorId(value)) {
                            patchApp(app.id, { colorId: value });
                          }
                        }}
                      >
                        {APP_COLOR_IDS.map((colorId) => (
                          <ToggleGroupItem
                            key={colorId}
                            value={colorId}
                            aria-label={APP_COLORS[colorId].name}
                            className="size-8"
                          >
                            <span
                              className="size-3 rounded-full"
                              style={{ background: APP_COLORS[colorId].swatch }}
                            />
                          </ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                    </Field>
                  </FieldGroup>
                </CardContent>
              </Card>
            ))}
            <Button type="button" variant="outline" onClick={addApp}>
              <Plus data-icon="inline-start" />
              Uygulama ekle
            </Button>
          </>
        )}
      </TabsContent>

      <TabsContent value="icerik" className="flex flex-col gap-4">
        {design.rows.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Plus />
              </EmptyMedia>
              <EmptyTitle>İçerik sırası yok</EmptyTitle>
              <EmptyDescription>
                Salon düzeninde sıralar alt alta durur. Sinema düzeni ilk kartı
                afiş yapar.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button type="button" onClick={addRow}>
                <Plus data-icon="inline-start" />
                Sıra ekle
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <>
            {design.rows.map((row, rowIndex) => (
              <Card key={row.id}>
                <CardHeader>
                  <CardTitle>{row.title.trim() || "Adsız sıra"}</CardTitle>
                  <CardDescription>
                    {row.cards.length === 0
                      ? "Bu sırada kart yok"
                      : `${row.cards.length} kart`}
                  </CardDescription>
                  <CardAction>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        aria-label="Sırayı yukarı taşı"
                        disabled={rowIndex === 0}
                        onClick={() =>
                          patch({ rows: moveListItem(design.rows, rowIndex, -1) })
                        }
                      >
                        <ChevronUp data-icon="inline-start" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        aria-label="Sırayı aşağı taşı"
                        disabled={rowIndex === design.rows.length - 1}
                        onClick={() =>
                          patch({ rows: moveListItem(design.rows, rowIndex, 1) })
                        }
                      >
                        <ChevronDown data-icon="inline-start" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Sırayı sil"
                        onClick={() =>
                          patch({
                            rows: design.rows.filter((item) => item.id !== row.id),
                          })
                        }
                      >
                        <Trash2 data-icon="inline-start" />
                      </Button>
                    </div>
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor={`row-${row.id}`}>Sıra adı</FieldLabel>
                      <Input
                        id={`row-${row.id}`}
                        value={row.title}
                        maxLength={LIMITS.rowTitle}
                        autoComplete="off"
                        onChange={(event) =>
                          patchRow(row.id, { title: event.target.value })
                        }
                      />
                    </Field>
                    {row.cards.length === 0 ? (
                      <Empty className="border">
                        <EmptyHeader>
                          <EmptyTitle>Kart yok</EmptyTitle>
                          <EmptyDescription>
                            Başlık ve kısa bir bilgi ekleyin. Örneğin film ya da
                            dizi adı.
                          </EmptyDescription>
                        </EmptyHeader>
                        <EmptyContent>
                          <Button type="button" onClick={() => addCard(row)}>
                            <Plus data-icon="inline-start" />
                            Kart ekle
                          </Button>
                        </EmptyContent>
                      </Empty>
                    ) : (
                      row.cards.map((card, cardIndex) => (
                        <div
                          key={card.id}
                          className="flex flex-col gap-3 rounded-lg bg-muted/40 p-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium">
                              {card.title.trim() || "Adsız kart"}
                            </p>
                            <div className="flex gap-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="icon-sm"
                                aria-label="Kartı yukarı taşı"
                                disabled={cardIndex === 0}
                                onClick={() =>
                                  patchRow(row.id, {
                                    cards: moveListItem(row.cards, cardIndex, -1),
                                  })
                                }
                              >
                                <ChevronUp data-icon="inline-start" />
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon-sm"
                                aria-label="Kartı aşağı taşı"
                                disabled={cardIndex === row.cards.length - 1}
                                onClick={() =>
                                  patchRow(row.id, {
                                    cards: moveListItem(row.cards, cardIndex, 1),
                                  })
                                }
                              >
                                <ChevronDown data-icon="inline-start" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                aria-label="Kartı sil"
                                onClick={() =>
                                  patchRow(row.id, {
                                    cards: row.cards.filter(
                                      (item) => item.id !== card.id,
                                    ),
                                  })
                                }
                              >
                                <Trash2 data-icon="inline-start" />
                              </Button>
                            </div>
                          </div>
                          <Field>
                            <FieldLabel htmlFor={`card-title-${card.id}`}>
                              Başlık
                            </FieldLabel>
                            <Input
                              id={`card-title-${card.id}`}
                              value={card.title}
                              maxLength={LIMITS.cardTitle}
                              autoComplete="off"
                              onChange={(event) =>
                                patchCard(row.id, card.id, {
                                  title: event.target.value,
                                })
                              }
                            />
                          </Field>
                          <Field>
                            <FieldLabel htmlFor={`card-meta-${card.id}`}>
                              Bilgi
                            </FieldLabel>
                            <Input
                              id={`card-meta-${card.id}`}
                              value={card.meta}
                              maxLength={LIMITS.cardMeta}
                              autoComplete="off"
                              onChange={(event) =>
                                patchCard(row.id, card.id, {
                                  meta: event.target.value,
                                })
                              }
                            />
                          </Field>
                        </div>
                      ))
                    )}
                  </FieldGroup>
                </CardContent>
                {row.cards.length > 0 ? (
                  <CardFooter>
                    <Button type="button" variant="outline" onClick={() => addCard(row)}>
                      <Plus data-icon="inline-start" />
                      Kart ekle
                    </Button>
                  </CardFooter>
                ) : null}
              </Card>
            ))}
            <Button type="button" variant="outline" onClick={addRow}>
              <Plus data-icon="inline-start" />
              Sıra ekle
            </Button>
          </>
        )}
      </TabsContent>

      <TabsContent value="rea" className="flex flex-col gap-4">
        <ReaPanel design={design} onChange={onChange} />
      </TabsContent>

      <TabsContent value="dosya" className="flex flex-col gap-4">
        <Alert>
          <AlertTitle>Kayıt bu tarayıcıda</AlertTitle>
          <AlertDescription>
            Tasarım localStorage içine yazılır. Aynı JSON, televizyondaki Ev
            ekranı uygulamasında /sdcard/Download/a850c-ev-ekrani.json olarak
            okunur. Google başlatıcısının paketine yazılmaz.
          </AlertDescription>
        </Alert>
        <Card>
          <CardHeader>
            <CardTitle>JSON</CardTitle>
            <CardDescription>
              Geçersiz bir dosya ekranı değiştirmez; hata olarak söylenir.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <input
              ref={importRef}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              aria-label="Tasarım JSON dosyası seç"
              onChange={(event) => {
                const file = event.target.files?.[0];
                void importJson(file);
                event.target.value = "";
              }}
            />
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={exportJson}>
                <Download data-icon="inline-start" />
                Dışa aktar
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => importRef.current?.click()}
              >
                <Upload data-icon="inline-start" />
                İçe aktar
              </Button>
            </div>
            <Separator />
            <Button
              type="button"
              variant="destructive"
              onClick={() => setResetOpen(true)}
            >
              Örnek salona dön
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Örnek salona dönülsün mü?</DialogTitle>
            <DialogDescription>
              Karşılama, duvar, uygulamalar ve sıralar bu tarayıcıdaki kayıtla
              birlikte örnek akşam ekranına döner.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setResetOpen(false)}
            >
              Vazgeç
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                onChange(createDefaultDesign());
                setResetOpen(false);
                toast.success("Örnek salon ekranı yüklendi.");
              }}
            >
              Sıfırla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
}
