export type AppMarkKind =
  | "youtube"
  | "netflix"
  | "disney"
  | "blutv"
  | "tabii"
  | "ayarlar"
  | "canli-tv"
  | "letter";

export function appMarkKind(id: string, name: string): AppMarkKind {
  const haystack = `${id} ${name}`.toLocaleLowerCase("tr-TR");
  if (haystack.includes("youtube")) {
    return "youtube";
  }
  if (haystack.includes("netflix")) {
    return "netflix";
  }
  if (haystack.includes("disney")) {
    return "disney";
  }
  if (haystack.includes("blutv") || haystack.includes("blu tv")) {
    return "blutv";
  }
  if (haystack.includes("tabii")) {
    return "tabii";
  }
  if (haystack.includes("ayarlar") || haystack.includes("settings")) {
    return "ayarlar";
  }
  if (haystack.includes("canli-tv") || haystack.includes("canlı tv") || haystack.includes("live tv")) {
    return "canli-tv";
  }
  return "letter";
}
