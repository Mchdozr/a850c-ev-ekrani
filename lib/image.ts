import { LIMITS } from "@/lib/design";

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Görsel okunamadı. JPEG, PNG ya da WebP deneyin."));
    };
    image.src = url;
  });
}

export async function compressWallpaper(
  file: File,
): Promise<{ dataUrl: string; name: string }> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Yalnızca bir görsel dosyası seçin.");
  }
  const image = await loadImage(file);
  const maxEdge = 1280;
  const scale = Math.min(1, maxEdge / image.width, maxEdge / image.height);
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Görsel işlenemedi.");
  }
  context.drawImage(image, 0, 0, width, height);
  let quality = 0.72;
  let dataUrl = canvas.toDataURL("image/jpeg", quality);
  while (dataUrl.length > LIMITS.imageChars && quality > 0.45) {
    quality = Math.round((quality - 0.1) * 100) / 100;
    dataUrl = canvas.toDataURL("image/jpeg", quality);
  }
  if (dataUrl.length > LIMITS.imageChars) {
    throw new Error("Görsel sıkıştırıldıktan sonra hâlâ çok büyük.");
  }
  const name = file.name.replace(/\.[^.]+$/, "").slice(0, LIMITS.imageName);
  return { dataUrl, name: name || "Duvar görseli" };
}
