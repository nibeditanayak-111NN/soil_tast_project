import type { ImagePrediction } from "./types";

/**
 * Browser-side stand-in for the CNN soil classifier.
 * Performs OpenCV-style preprocessing (resize, grey-world colour correction),
 * extracts colour/texture features and maps them onto soil classes, then
 * renders a Grad-CAM style saliency overlay.
 */
const CLASSES = [
  { name: "Alluvial", h: 32, s: 0.32, v: 0.52 },
  { name: "Black", h: 28, s: 0.14, v: 0.22 },
  { name: "Red", h: 14, s: 0.52, v: 0.42 },
  { name: "Laterite", h: 20, s: 0.46, v: 0.36 },
  { name: "Sandy", h: 40, s: 0.28, v: 0.72 },
  { name: "Clay", h: 26, s: 0.24, v: 0.4 },
];

function rgbToHsv(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max === 0 ? 0 : d / max, v: max };
}

export async function classifySoilImage(dataUrl: string): Promise<ImagePrediction> {
  const img = await loadImage(dataUrl);
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);

  // grey-world colour correction
  let sr = 0;
  let sg = 0;
  let sb = 0;
  const px = size * size;
  for (let i = 0; i < data.length; i += 4) {
    sr += data[i]!;
    sg += data[i + 1]!;
    sb += data[i + 2]!;
  }
  const mean = (sr + sg + sb) / (3 * px);
  const gains = [mean / (sr / px || 1), mean / (sg / px || 1), mean / (sb / px || 1)];

  const cells = 8;
  const cell = size / cells;
  const saliency: number[] = [];
  let hs = 0;
  let ss = 0;
  let vs = 0;
  for (let cy = 0; cy < cells; cy++) {
    for (let cx = 0; cx < cells; cx++) {
      let lum = 0;
      let lum2 = 0;
      let n = 0;
      for (let y = cy * cell; y < (cy + 1) * cell; y++) {
        for (let x = cx * cell; x < (cx + 1) * cell; x++) {
          const i = (Math.floor(y) * size + Math.floor(x)) * 4;
          const r = Math.min(255, data[i]! * gains[0]!);
          const g = Math.min(255, data[i + 1]! * gains[1]!);
          const b = Math.min(255, data[i + 2]! * gains[2]!);
          const hsv = rgbToHsv(r, g, b);
          hs += hsv.h;
          ss += hsv.s;
          vs += hsv.v;
          const l = 0.299 * r + 0.587 * g + 0.114 * b;
          lum += l;
          lum2 += l * l;
          n++;
        }
      }
      const m = lum / n;
      saliency.push(Math.sqrt(Math.max(0, lum2 / n - m * m)));
    }
  }
  const feat = { h: hs / px, s: ss / px, v: vs / px };

  const scored = CLASSES.map((c) => {
    const d =
      Math.abs(c.h - feat.h) / 60 + Math.abs(c.s - feat.s) * 2.2 + Math.abs(c.v - feat.v) * 2.4;
    return { name: c.name, logit: -d * 3.2 };
  }).sort((a, b) => b.logit - a.logit);
  const exps = scored.map((s) => Math.exp(s.logit));
  const sum = exps.reduce((a, b) => a + b, 0);
  const probs = scored.map((s, i) => ({ name: s.name, p: exps[i]! / sum }));

  const top = probs[0]!;
  const next = probs[1]!;
  const confidence = top.p;
  const reliability: ImagePrediction["reliability"] =
    confidence > 0.9 ? "high" : confidence > 0.75 ? "moderate" : confidence > 0.55 ? "low" : "unknown";

  const maxS = Math.max(...saliency, 1);
  const focusIdx = saliency.indexOf(Math.max(...saliency));
  const fx = focusIdx % cells;
  const fy = Math.floor(focusIdx / cells);
  const focus = `${fy < cells / 3 ? "top" : fy > (2 * cells) / 3 ? "bottom" : "middle"}-${fx < cells / 3 ? "left" : fx > (2 * cells) / 3 ? "right" : "centre"}`;

  return {
    soilType: top.name,
    confidence,
    nextBest: next.name,
    nextBestConfidence: next.p,
    reliability,
    heatmapDataUrl: renderHeatmap(img, saliency, cells, maxS),
    focus,
    caution:
      confidence - next.p < 0.25
        ? `Confidence is close between ${top.name} and ${next.name}. Confirm '${top.name}' against local knowledge before acting on it.`
        : undefined,
  };
}

function renderHeatmap(
  img: HTMLImageElement,
  saliency: number[],
  cells: number,
  maxS: number,
): string {
  const out = document.createElement("canvas");
  out.width = 256;
  out.height = 256;
  const ctx = out.getContext("2d")!;
  ctx.drawImage(img, 0, 0, 256, 256);
  const cell = 256 / cells;
  ctx.globalAlpha = 0.55;
  for (let y = 0; y < cells; y++) {
    for (let x = 0; x < cells; x++) {
      const t = saliency[y * cells + x]! / maxS;
      const r = Math.round(255 * Math.min(1, t * 1.6));
      const g = Math.round(255 * Math.min(1, Math.abs(1 - Math.abs(t - 0.5) * 2)));
      const b = Math.round(255 * Math.max(0, 1 - t * 1.8));
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x * cell, y * cell, cell + 1, cell + 1);
    }
  }
  ctx.globalAlpha = 1;
  return out.toDataURL("image/jpeg", 0.8);
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Server-side style validation + normalisation before analysis. */
export async function normalizeUpload(file: File, maxEdge = 1024): Promise<string> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
    throw new Error("Only JPEG, PNG or WEBP images are supported.");
  }
  if (file.size > 12 * 1024 * 1024) throw new Error("Image is larger than 12 MB.");
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
  const img = await loadImage(dataUrl);
  const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.85);
}