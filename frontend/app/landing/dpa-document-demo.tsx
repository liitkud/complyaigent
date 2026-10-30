"use client";

import { FileText } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// Real excerpt: Republic Act No. 10173 (Philippine Data Privacy Act of 2012),
// Sec. 20(c) — rendered from the National Privacy Commission's own PDF, with
// pdf.js's real text layer (selectable/copyable) overlaid on the canvas
// render. The four boxes below are placed at coordinates measured directly
// from the PDF's text geometry (via `pdftotext -bbox`), expressed as
// percentages of the rendered page so they stay pixel-accurate at any width.
const PDF_URL = "/hero-docs/ra-10173-sec20.pdf";
const WORKER_URL = "/pdf/pdf.worker.min.mjs";

type EssenceBox = {
  id: string;
  top: number;
  bottom: number;
  left: number;
  right: number;
  label: string;
  bucket: string;
  color: string;
  delay: number;
};

const essenceBoxes: EssenceBox[] = [
  {
    id: "1",
    top: 31.39,
    bottom: 37.43,
    left: 14.78,
    right: 82.41,
    label: "Network intrusion safeguards",
    bucket: "B",
    color: "#4edea3",
    delay: 0,
  },
  {
    id: "2",
    top: 39.48,
    bottom: 41.3,
    left: 14.78,
    right: 80.16,
    label: "A written security policy",
    bucket: "C",
    color: "#a78bc9",
    delay: 2,
  },
  {
    id: "3",
    top: 43.33,
    bottom: 49.37,
    left: 14.78,
    right: 84.7,
    label: "Vulnerability review process",
    bucket: "A2",
    color: "#f0c674",
    delay: 4,
  },
  {
    id: "4",
    top: 51.42,
    bottom: 57.43,
    left: 14.78,
    right: 84.7,
    label: "Continuous breach monitoring",
    bucket: "B",
    color: "#4edea3",
    delay: 6,
  },
];

export function DpaDocumentDemo() {
  const measureRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const renderGenerationRef = useRef(0);

  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [pageSize, setPageSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    let loadingTask: import("pdfjs-dist").PDFDocumentLoadingTask | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let resizeTimeout: ReturnType<typeof setTimeout> | null = null;

    async function init() {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = WORKER_URL;

      try {
        loadingTask = pdfjs.getDocument({ url: PDF_URL });
        const pdfDoc = await loadingTask.promise;
        if (cancelled || !pdfDoc) return;

        const page = await pdfDoc.getPage(1);
        if (cancelled) return;

        const renderAtWidth = async (targetWidth: number) => {
          if (!canvasRef.current || !textLayerRef.current || targetWidth <= 0) return;
          const generation = ++renderGenerationRef.current;

          const nativeViewport = page.getViewport({ scale: 1 });
          const scale = targetWidth / nativeViewport.width;
          const viewport = page.getViewport({ scale });

          const canvas = canvasRef.current;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;

          const outputScale = window.devicePixelRatio || 1;
          canvas.width = Math.floor(viewport.width * outputScale);
          canvas.height = Math.floor(viewport.height * outputScale);
          canvas.style.width = `${Math.floor(viewport.width)}px`;
          canvas.style.height = `${Math.floor(viewport.height)}px`;

          const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined;

          await page.render({ canvas, canvasContext: ctx, transform, viewport }).promise;
          if (cancelled || generation !== renderGenerationRef.current) return;

          const textLayerDiv = textLayerRef.current;
          textLayerDiv.innerHTML = "";
          textLayerDiv.style.width = `${Math.floor(viewport.width)}px`;
          textLayerDiv.style.height = `${Math.floor(viewport.height)}px`;

          const textContent = await page.getTextContent();
          if (cancelled || generation !== renderGenerationRef.current) return;

          const textLayer = new pdfjs.TextLayer({
            textContentSource: textContent,
            container: textLayerDiv,
            viewport,
          });
          await textLayer.render();
          if (cancelled || generation !== renderGenerationRef.current) return;

          setPageSize({ width: Math.floor(viewport.width), height: Math.floor(viewport.height) });
          setStatus("ready");
        };

        if (measureRef.current) {
          const initialWidth = measureRef.current.clientWidth;
          await renderAtWidth(initialWidth);
        }

        resizeObserver = new ResizeObserver((entries) => {
          const width = entries[0]?.contentRect.width;
          if (!width) return;
          if (resizeTimeout) clearTimeout(resizeTimeout);
          resizeTimeout = setTimeout(() => {
            void renderAtWidth(width);
          }, 150);
        });
        if (measureRef.current) resizeObserver.observe(measureRef.current);
      } catch (err) {
        console.error("Failed to render hero PDF excerpt:", err);
        if (!cancelled) setStatus("error");
      }
    }

    void init();

    return () => {
      cancelled = true;
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeObserver?.disconnect();
      void loadingTask?.destroy();
    };
  }, []);

  return (
    <section
      aria-label="Live demonstration: a real Data Privacy Act excerpt being categorized into FerretOPS rule buckets"
      className="mt-14 overflow-hidden rounded-md border border-[#343434] bg-[#141718] shadow-2xl shadow-black/60"
    >
      <div className="flex items-center justify-between border-b border-[#282d2f] bg-[#1a1e20] px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2 font-mono text-xs text-[#8d9697]">
          <FileText size={14} />
          <span className="font-semibold text-[#f1f1f1]">RA-10173-sec20.pdf</span>
        </div>
        <span className="flex items-center gap-1.5 font-mono text-[11px] text-[#4edea3]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#4edea3]" />
          {status === "ready" ? "Categorizing" : status === "error" ? "Render failed" : "Loading document…"}
        </span>
      </div>

      <div className="relative bg-[#0d1012] p-4 sm:p-6">
        <div ref={measureRef} className="relative mx-auto max-w-[640px]">
          {status === "loading" && (
            <div
              aria-hidden="true"
              className="aspect-[612/792] w-full animate-pulse rounded-sm border border-[#282d2f] bg-[#1a1e20]"
            />
          )}

          {status === "error" && (
            <div className="flex aspect-[612/792] w-full items-center justify-center rounded-sm border border-[#3a2a2a] bg-[#1a1515] p-6 text-center font-mono text-xs text-[#c98a8a]">
              Could not load the source PDF. Try refreshing.
            </div>
          )}

          <div
            className="relative"
            style={{
              width: pageSize ? `${pageSize.width}px` : undefined,
              height: pageSize ? `${pageSize.height}px` : undefined,
              display: status === "ready" ? "block" : "none",
              margin: "0 auto",
              maxWidth: "100%",
            }}
          >
            <canvas ref={canvasRef} className="block rounded-sm" />
            <div
              ref={textLayerRef}
              className="pdf-text-layer absolute left-0 top-0"
            />

            <div aria-hidden="true" className="pointer-events-none absolute inset-0">
              {essenceBoxes.map((box) => (
                <div
                  key={box.id}
                  className="hero-doc-box absolute rounded-[3px]"
                  style={{
                    top: `${box.top}%`,
                    left: `${box.left}%`,
                    width: `${box.right - box.left}%`,
                    height: `${box.bottom - box.top}%`,
                    animationDelay: `${box.delay}s`,
                    // @ts-expect-error -- CSS custom property for the keyframe to read
                    "--box-color": box.color,
                  }}
                >
                  <span
                    className="hero-doc-box-tag absolute -top-px left-0 whitespace-nowrap rounded-br-sm rounded-tl-[2px] border-b border-r px-1.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wide"
                    style={{
                      animationDelay: `${box.delay}s`,
                      borderColor: `${box.color}66`,
                      backgroundColor: "#141718",
                      color: box.color,
                      boxShadow: "0 2px 6px 0 rgba(0,0,0,0.45)",
                    }}
                  >
                    {box.label} <span className="opacity-70">· {box.bucket}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="mx-auto mt-4 max-w-[420px] text-center font-mono text-xs leading-relaxed text-[#8a8a8a]">
          Source: Republic Act No. 10173, §20(c) — National Privacy Commission (privacy.gov.ph). Text is the
          real, selectable PDF layer; labels are FerretOPS&apos;s bucket routing, not the statute&apos;s own wording.
        </p>
      </div>
    </section>
  );
}
