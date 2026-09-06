"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { X } from "lucide-react";
import { useTourStore } from "@/lib/tour-store";
import { getTourSteps } from "@/constants/tour-steps";
import { Button } from "@/components/common/Button";

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PADDING = 8;

function LanguagePrompt() {
  const { chooseLanguage, end } = useTourStore();

  return (
    <div className="fixed inset-0 z-[200]">
      <div className="fixed inset-0 bg-black/60" />
      <div className="fixed left-1/2 top-1/2 w-80 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-start justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-900">Choose your language / अपनी भाषा चुनें</h3>
          <button onClick={end} className="text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex gap-2">
          <Button className="flex-1" onClick={() => chooseLanguage("en")}>
            English
          </Button>
          <Button className="flex-1" onClick={() => chooseLanguage("hi")}>
            हिंदी
          </Button>
        </div>
      </div>
    </div>
  );
}

export function TourOverlay() {
  const { choosingLanguage, active, language, stepIndex, next, prev, end } = useTourStore();
  const [rect, setRect] = useState<Rect | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const steps = getTourSteps(language);
  const step = steps[stepIndex];

  // Navigate to whatever page this step needs, whenever the step (or arrival) changes.
  useEffect(() => {
    if (!active || !step?.page) return;
    if (step.page !== pathname) {
      router.push(step.page);
    }
  }, [active, step, pathname, router]);

  // Measure (and keep re-measuring) the target element — it may not exist yet
  // right after a page navigation, so retry briefly instead of giving up at once.
  useEffect(() => {
    if (!active || !step?.target) {
      setRect(null);
      return;
    }

    let cancelled = false;
    let attempts = 0;

    function tryMeasure() {
      if (cancelled) return;
      const el = document.querySelector(`[data-tour="${step!.target}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        const r = el.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      } else if (attempts < 30) {
        attempts++;
        setTimeout(tryMeasure, 100);
      } else {
        setRect(null);
      }
    }

    tryMeasure();
    const settleTimeout = setTimeout(tryMeasure, 500); // re-measure after smooth-scroll settles

    function onWindowChange() {
      tryMeasure();
    }
    window.addEventListener("resize", onWindowChange);
    window.addEventListener("scroll", onWindowChange, true);

    return () => {
      cancelled = true;
      clearTimeout(settleTimeout);
      window.removeEventListener("resize", onWindowChange);
      window.removeEventListener("scroll", onWindowChange, true);
    };
  }, [active, step, stepIndex, pathname]);

  if (choosingLanguage) return <LanguagePrompt />;
  if (!active || !step) return null;

  const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;

  let tooltipStyle: React.CSSProperties = {
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
  };

  if (rect) {
    const placement = step.placement ?? "bottom";
    if (placement === "bottom") {
      tooltipStyle = { top: rect.top + rect.height + 16, left: Math.min(Math.max(rect.left, 16), vw - 336) };
    } else if (placement === "top") {
      tooltipStyle = { top: Math.max(rect.top - 16, 16), left: Math.min(Math.max(rect.left, 16), vw - 336), transform: "translateY(-100%)" };
    } else if (placement === "right") {
      tooltipStyle = { top: Math.min(Math.max(rect.top, 16), vh - 220), left: rect.left + rect.width + 16 };
    } else {
      tooltipStyle = { top: Math.min(Math.max(rect.top, 16), vh - 220), left: Math.max(rect.left - 336 - 16, 16) };
    }
  }

  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[200]">
      {rect ? (
        <>
          <div
            className="fixed bg-black/60 transition-all duration-200"
            style={{ top: 0, left: 0, width: "100%", height: Math.max(0, rect.top - PADDING) }}
          />
          <div
            className="fixed bg-black/60 transition-all duration-200"
            style={{
              top: rect.top + rect.height + PADDING,
              left: 0,
              width: "100%",
              height: Math.max(0, vh - (rect.top + rect.height + PADDING)),
            }}
          />
          <div
            className="fixed bg-black/60 transition-all duration-200"
            style={{ top: rect.top - PADDING, left: 0, width: Math.max(0, rect.left - PADDING), height: rect.height + PADDING * 2 }}
          />
          <div
            className="fixed bg-black/60 transition-all duration-200"
            style={{
              top: rect.top - PADDING,
              left: rect.left + rect.width + PADDING,
              width: Math.max(0, vw - (rect.left + rect.width + PADDING)),
              height: rect.height + PADDING * 2,
            }}
          />
          <div
            className="pointer-events-none fixed rounded-md ring-2 ring-blue-500 transition-all duration-200"
            style={{ top: rect.top - PADDING, left: rect.left - PADDING, width: rect.width + PADDING * 2, height: rect.height + PADDING * 2 }}
          />
        </>
      ) : (
        <div className="fixed inset-0 bg-black/60" />
      )}

      <div className="fixed w-80 rounded-lg bg-white p-4 shadow-xl" style={tooltipStyle}>
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-900">{step.title}</h3>
          <button onClick={end} className="text-slate-400 hover:text-slate-600" title="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-slate-600">{step.description}</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {stepIndex + 1} / {steps.length}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={end}>
              End Tour
            </Button>
            <Button variant="outline" size="sm" onClick={prev} disabled={isFirst}>
              Back
            </Button>
            <Button size="sm" onClick={next}>
              {isLast ? "Finish" : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
