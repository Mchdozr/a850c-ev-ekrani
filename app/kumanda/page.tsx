import type { Metadata } from "next";

import { KumandaRemote } from "@/components/kumanda-remote";

export const metadata: Metadata = {
  title: "Kumanda · A 850 C",
  description:
    "Telefondan A 850 C ev ekranının odağını gezdirin. YouTube ve Netflix kısayolları aynı sunucudaki televizyon sayfasına gider.",
};

export default function KumandaPage() {
  return <KumandaRemote />;
}
