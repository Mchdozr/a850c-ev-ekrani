export type AppMarkKind =
  | "youtube"
  | "netflix"
  | "disney"
  | "blutv"
  | "tabii"
  | "ayarlar"
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
  return "letter";
}
