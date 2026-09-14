interface QrPosterOptions {
  bannerUrl?: string | null;
  qrCodeUrl: string;
  eventName: string;
  eventDate: string; // already formatted, e.g. "Aug 20, 2026"
  venue?: string | null;
}

// Same "resolve null instead of rejecting" pattern as lib/badge.ts - a
// failed remote image shouldn't break the whole poster, just fall back.
function loadImage(src: string, crossOrigin?: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = crossOrigin;
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && current) {
      lines.push(current);
      current = word;
      if (lines.length === maxLines - 1) break;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);

  if (lines.length > maxLines) lines.length = maxLines;
  const last = lines[lines.length - 1];
  if (last && ctx.measureText(last).width > maxWidth) {
    while (ctx.measureText(`${lines[lines.length - 1]}…`).width > maxWidth) {
      lines[lines.length - 1] = lines[lines.length - 1].slice(0, -1);
    }
    lines[lines.length - 1] += "…";
  }
  return lines;
}

// CSS object-fit: cover equivalent - crops the source so it fills the
// destination rect without distortion, instead of squashing/stretching it.
function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number,
  dy: number,
  dWidth: number,
  dHeight: number
) {
  const imgRatio = img.width / img.height;
  const destRatio = dWidth / dHeight;
  let sx: number;
  let sy: number;
  let sWidth: number;
  let sHeight: number;

  if (imgRatio > destRatio) {
    sHeight = img.height;
    sWidth = sHeight * destRatio;
    sx = (img.width - sWidth) / 2;
    sy = 0;
  } else {
    sWidth = img.width;
    sHeight = sWidth / destRatio;
    sx = 0;
    sy = (img.height - sHeight) / 2;
  }

  ctx.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
}

function drawGradientFallback(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const gradient = ctx.createLinearGradient(x, y, x + w, y + h);
  gradient.addColorStop(0, "#2563eb");
  gradient.addColorStop(1, "#14b8a6");
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, w, h);
}

// A single downloadable/shareable/printable poster: event banner filling
// the top half, event name + date, and a large QR code filling the bottom
// half - built once here so the popup preview, download, print, and share
// actions all use the exact same image instead of drifting apart.
export async function generateQrPosterDataUrl(options: QrPosterOptions): Promise<string> {
  const width = 1080;
  const height = 1600;
  const halfHeight = height / 2;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported in this browser");

  // Top half: banner photo, cover-fit, or a brand gradient if there isn't one.
  const banner = options.bannerUrl ? await loadImage(options.bannerUrl, "anonymous") : null;
  if (banner) {
    drawImageCover(ctx, banner, 0, 0, width, halfHeight);
  } else {
    drawGradientFallback(ctx, 0, 0, width, halfHeight);
  }

  // Bottom half: white card with event name, date/venue, and the QR code.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, halfHeight, width, halfHeight);

  ctx.textAlign = "center";
  let y = halfHeight + 90;

  ctx.fillStyle = "#0f172a";
  ctx.font = "700 46px Arial";
  const nameLines = wrapText(ctx, options.eventName, width - 120, 2);
  for (const line of nameLines) {
    ctx.fillText(line, width / 2, y);
    y += 56;
  }
  y += 6;

  ctx.fillStyle = "#475569";
  ctx.font = "500 28px Arial";
  const subtitle = options.venue ? `${options.eventDate} · ${options.venue}` : options.eventDate;
  ctx.fillText(subtitle, width / 2, y);
  y += 56;

  const qr = await loadImage(options.qrCodeUrl, "anonymous");
  const qrSize = 420;
  const qrX = width / 2 - qrSize / 2;
  const remainingSpace = height - y - 90;
  const qrY = y + Math.max((remainingSpace - qrSize) / 2, 0);

  if (qr) {
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(qrX - 24, qrY - 24, qrSize + 48, qrSize + 48, 16);
    ctx.stroke();
    ctx.drawImage(qr, qrX, qrY, qrSize, qrSize);
  }

  ctx.fillStyle = "#0d9488";
  ctx.font = "700 26px Arial";
  ctx.fillText("SCAN TO REGISTER", width / 2, qrY + qrSize + 60);

  return canvas.toDataURL("image/png");
}
