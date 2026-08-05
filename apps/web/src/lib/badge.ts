interface BadgeOptions {
  logoUrl?: string | null;
  attendeeName: string;
  registrationNumber: string;
  eventName: string;
  eventDate: string; // already formatted, e.g. "Aug 20, 2026"
  qrCodeDataUrl: string;
}

function loadImage(src: string, crossOrigin?: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = crossOrigin;
    img.onload = () => resolve(img);
    // If a remote image (e.g. an event logo) fails to load or taints the
    // canvas, the badge should still generate - just without that image.
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

export async function generateBadgeDataUrl(options: BadgeOptions): Promise<string> {
  const width = 420;
  const height = 640;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported in this browser");

  // Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // Top accent bar
  const primary = "#2563eb";
  const accent = "#f97316";
  ctx.fillStyle = primary;
  ctx.fillRect(0, 0, width, 14);

  let y = 50;

  // Logo (circular crop) if present
  if (options.logoUrl) {
    const logo = await loadImage(options.logoUrl, "anonymous");
    if (logo) {
      const size = 72;
      const x = width / 2 - size / 2;
      ctx.save();
      ctx.beginPath();
      ctx.arc(width / 2, y + size / 2, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(logo, x, y, size, size);
      ctx.restore();
      y += size + 20;
    }
  }

  ctx.textAlign = "center";
  ctx.fillStyle = "#64748b";
  ctx.font = "600 12px Arial";
  ctx.fillText("EVENT REGISTRATION", width / 2, y);
  y += 26;

  ctx.fillStyle = "#0f172a";
  ctx.font = "700 20px Arial";
  const eventLines = wrapText(ctx, options.eventName, width - 60, 2);
  for (const line of eventLines) {
    ctx.fillText(line, width / 2, y);
    y += 26;
  }
  y += 10;

  // Divider
  ctx.strokeStyle = "#e2e8f0";
  ctx.beginPath();
  ctx.moveTo(40, y);
  ctx.lineTo(width - 40, y);
  ctx.stroke();
  y += 40;

  ctx.fillStyle = "#64748b";
  ctx.font = "600 12px Arial";
  ctx.fillText("ATTENDEE", width / 2, y);
  y += 30;

  ctx.fillStyle = "#0f172a";
  ctx.font = "700 26px Arial";
  const nameLines = wrapText(ctx, options.attendeeName, width - 60, 2);
  for (const line of nameLines) {
    ctx.fillText(line, width / 2, y);
    y += 32;
  }
  y += 8;

  // Registration number pill
  ctx.font = "600 13px monospace";
  const pillText = options.registrationNumber;
  const pillWidth = ctx.measureText(pillText).width + 32;
  ctx.fillStyle = "#eff6ff";
  const pillX = width / 2 - pillWidth / 2;
  ctx.beginPath();
  ctx.roundRect(pillX, y - 20, pillWidth, 32, 16);
  ctx.fill();
  ctx.fillStyle = primary;
  ctx.fillText(pillText, width / 2, y);
  y += 44;

  ctx.fillStyle = "#64748b";
  ctx.font = "400 14px Arial";
  ctx.fillText(options.eventDate, width / 2, y);
  y += 36;

  // QR code
  const qr = await loadImage(options.qrCodeDataUrl);
  const qrSize = 170;
  if (qr) {
    ctx.drawImage(qr, width / 2 - qrSize / 2, y, qrSize, qrSize);
    y += qrSize + 16;
  }

  ctx.fillStyle = accent;
  ctx.font = "600 12px Arial";
  ctx.fillText("Present this code at check-in", width / 2, y);

  return canvas.toDataURL("image/png");
}
