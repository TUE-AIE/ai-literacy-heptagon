/**
 * Rasterise a <figure class="plate"> containing an inline <svg> into a PNG.
 *
 * Strategy:
 *  - Serialise just the inline <svg> via XMLSerializer.
 *  - Copy relevant computed styles onto a clone so the rasterised SVG carries
 *    its own appearance without depending on an external stylesheet.
 *  - Load the serialised SVG into an <img> via a blob URL, draw it to a
 *    2x-dpr canvas, and download.
 *
 * This path preserves our <filter> effects (ink bleed) because the filters
 * are defined inline inside the SVG. CSS custom properties (var(--profile)
 * etc.) are resolved to literal colours on clone so the rasterised output
 * doesn't inherit an empty :root.
 */

const PROPS_TO_INLINE = [
  "fill", "stroke", "stroke-width", "stroke-dasharray", "opacity",
  "fill-opacity", "stroke-opacity",
  "font-family", "font-size", "font-style", "font-weight",
  "letter-spacing", "text-transform", "font-variation-settings"
];

function inlineStyles(source: SVGElement, target: SVGElement): void {
  const srcWalker = document.createTreeWalker(source, NodeFilter.SHOW_ELEMENT);
  const dstWalker = document.createTreeWalker(target, NodeFilter.SHOW_ELEMENT);
  let s: Node | null = srcWalker.currentNode;
  let d: Node | null = dstWalker.currentNode;
  while (s && d) {
    if (s instanceof Element && d instanceof Element) {
      const cs = window.getComputedStyle(s);
      let style = "";
      for (const prop of PROPS_TO_INLINE) {
        const v = cs.getPropertyValue(prop);
        if (v && v !== "normal" && v !== "none" && v !== "auto") {
          style += `${prop}:${v};`;
        }
      }
      if (style) d.setAttribute("style", style);
    }
    s = srcWalker.nextNode();
    d = dstWalker.nextNode();
  }
}

export async function rasterisePlate(svg: SVGSVGElement, filename: string): Promise<void> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  inlineStyles(svg, clone);

  // Ensure required root attributes — some browsers reject standalone SVG without xmlns.
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");

  // Work out the intended raster size from the rendered SVG bbox.
  const rect = svg.getBoundingClientRect();
  const cssW = Math.max(1, rect.width);
  const cssH = Math.max(1, rect.height);
  const dpr = Math.max(2, window.devicePixelRatio || 1);
  const pxW = Math.round(cssW * dpr);
  const pxH = Math.round(cssH * dpr);

  // Background colour from tokens — so the exported PNG isn't transparent.
  const paper = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue("--paper").trim() || "#F2EDE3";

  const serialised = new XMLSerializer().serializeToString(clone);
  const svgBlob = new Blob([serialised], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const img = new Image();
    img.decoding = "async";
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Failed to load SVG for rasterisation"));
      img.src = svgUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = pxW;
    canvas.height = pxH;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No 2D canvas context");
    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, pxW, pxH);
    ctx.drawImage(img, 0, 0, pxW, pxH);

    const pngBlob: Blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("toBlob returned null"))),
        "image/png"
      );
    });
    const pngUrl = URL.createObjectURL(pngBlob);
    const a = document.createElement("a");
    a.href = pngUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(pngUrl), 500);
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}
