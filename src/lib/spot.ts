function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h *= 60;
  return [h < 0 ? h + 360 : h, s, l];
}

function hslToHex(h: number, s: number, l: number) {
  const a = s * Math.min(l, 1 - l);
  const channel = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(c * 255).toString(16).padStart(2, "0");
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`;
}

export async function extractSpot(src: string): Promise<string | null> {
  const img = new Image();
  img.crossOrigin = "anonymous";
  // own URL so the browser doesn't reuse the cached non-CORS copy from <img> tags
  img.src = `${src}${src.includes("?") ? "&" : "?"}spot`;
  await img.decode();

  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 20;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);

  const buckets = Array.from({ length: 12 }, () => ({ weight: 0, h: 0, s: 0 }));
  for (let i = 0; i < data.length; i += 4) {
    const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);
    if (s < 0.25 || l < 0.12 || l > 0.9) continue;
    const weight = s * (1 - Math.abs(l - 0.5));
    const bucket = buckets[Math.floor(h / 30) % 12];
    bucket.weight += weight;
    bucket.h += h * weight;
    bucket.s += s * weight;
  }

  const best = buckets.reduce((a, b) => (b.weight > a.weight ? b : a));
  if (best.weight < 4) return null;

  const saturation = Math.min(0.85, Math.max(0.5, best.s / best.weight));
  return hslToHex(best.h / best.weight, saturation, 0.48);
}
