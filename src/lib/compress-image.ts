export async function compressImage(
  file: File,
  opts?: { max?: number; maxChars?: number; hard?: number },
): Promise<string> {
  const max = opts?.max ?? 2048;
  const maxChars = opts?.maxChars ?? 900_000;
  const hard = opts?.hard ?? 1_100_000;
  const bitmap = await blobToImage(file);
  let w = bitmap.width;
  let h = bitmap.height;
  if (w > max || h > max) {
    const scale = Math.min(max / w, max / h);
    w = Math.round(w * scale);
    h = Math.round(h * scale);
  }
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not read that photo.");
  ctx.drawImage(bitmap, 0, 0, w, h);
  if ("close" in bitmap && typeof bitmap.close === "function") bitmap.close();
  let quality = 0.84;
  let url = canvas.toDataURL("image/jpeg", quality);
  while (url.length > maxChars && quality > 0.45) {
    quality -= 0.08;
    url = canvas.toDataURL("image/jpeg", quality);
  }
  if (url.length > hard) {
    throw new Error(
      opts
        ? "Photo is too heavy. Drop one packet, or skip the photo and type the line."
        : "Photo is too heavy. Back up a step and shoot again.",
    );
  }
  return url;
}

async function blobToImage(file: File): Promise<HTMLImageElement | ImageBitmap> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      /* fall through */
    }
  }
  return await new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that photo. Use the camera or a JPEG."));
    };
    img.src = url;
  });
}
