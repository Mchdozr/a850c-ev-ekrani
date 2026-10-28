"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { QrCode, Copy, Check } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { browserRemoteSession, pairingUrl } from "@/lib/pairing";

export function PhonePairing() {
  const [open, setOpen] = useState(false);
  const [origin, setOrigin] = useState("");
  const [session, setSession] = useState("");
  const [qr, setQr] = useState<{ url: string; src: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const url = pairingUrl(origin, session);

  useEffect(() => {
    let stopped = false;
    void fetch("/api/connection").then((r) => r.json()).catch(() => ({ origins: [] }))
      .then((data: { origins?: string[] }) => {
        if (stopped) return;
        setSession(browserRemoteSession());
        const current = window.location.origin;
        setOrigin(pairingUrl(current, browserRemoteSession()) ? current : data.origins?.[0] ?? "");
      });
    return () => { stopped = true; };
  }, []);

  useEffect(() => {
    let stopped = false;
    if (url) void QRCode.toDataURL(url, { width: 320, margin: 3, errorCorrectionLevel: "M" })
      .then((data) => { if (!stopped) setQr({ url, src: data }); }).catch(() => { if (!stopped) setQr(null); });
    return () => { stopped = true; };
  }, [url]);

  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild>
      <button type="button" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-xl transition hover:bg-white/20">
        <QrCode size={17} /> Telefonla bağlan
      </button>
    </DialogTrigger>
    <DialogContent className="gap-5 rounded-[32px] border border-white/15 bg-[#18212ce6] p-7 text-white shadow-2xl backdrop-blur-3xl sm:max-w-md">
      <DialogTitle className="text-2xl font-semibold">Telefonun kumandan olsun.</DialogTitle>
      <DialogDescription className="text-sm leading-relaxed text-white/65">Bu QR, aynı Wi-Fi’deki telefonunuzu tarayıcı önizlemesine bağlar. Önce bu sunucuda /tv ekranını açın.</DialogDescription>
      <div className="mx-auto rounded-3xl bg-white p-3">
        {url && qr?.url === url ? <Image src={qr.src} width={248} height={248} unoptimized alt="Tarayıcı ekranı kumandasını açan QR kod" /> : <div className="grid size-[248px] place-items-center p-6 text-center text-sm text-slate-700">QR için telefonunuzun erişebildiği sunucu adresini yazın.</div>}
      </div>
      <label className="grid gap-2 text-sm text-white/70">Sunucu adresi
        <input value={origin} onChange={(event) => { setOrigin(event.target.value); setCopied(false); }} placeholder="http://192.168.1.20:3000" inputMode="url" className="w-full rounded-xl border border-white/15 bg-black/20 px-4 py-3 text-white outline-none focus:border-white/65" />
      </label>
      {url ? <output data-pairing-url className="select-all break-all text-xs leading-relaxed text-white/60">{url}</output> : null}
      <button type="button" disabled={!url} className="flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black disabled:opacity-40" onClick={() => {
        if (url) void navigator.clipboard?.writeText(url).then(() => setCopied(true)).catch(() => setCopied(false));
      }}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? "Bağlantı kopyalandı" : "Kumanda bağlantısını kopyala"}</button>
      <p className="text-xs leading-relaxed text-white/50">APK’yı yönetmek için TV’de Menü tuşuna basıp TV’nin kendi QR kodunu okutun; bilgisayar gerekmez. Bu kumanda ev ekranında gezinir ve uygulamaları açar.</p>
    </DialogContent>
  </Dialog>;
}
