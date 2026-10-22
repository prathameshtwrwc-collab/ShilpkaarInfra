"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const RouteScene = dynamic(() => import("./RouteScene"), { ssr: false, loading: () => null });

type Step = { title: string; body: string };

function canUseWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/** 2D fallback: the same route as a flat survey drawing. */
function RouteDiagram({ step }: { step: number }) {
  const pts = [
    [40, 150],
    [170, 70],
    [300, 130],
    [440, 60],
  ];
  return (
    <svg viewBox="0 0 480 200" className="h-full w-full" aria-hidden="true">
      {Array.from({ length: 9 }, (_, i) => (
        <path
          key={i}
          d={`M0 ${30 + i * 20} C 120 ${10 + i * 22}, 260 ${50 + i * 18}, 480 ${20 + i * 21}`}
          stroke="#c4bcae"
          strokeOpacity="0.22"
          fill="none"
        />
      ))}
      <path d="M40 150 C 100 120, 120 70, 170 70 S 250 140, 300 130 S 400 60, 440 60" stroke="#5f594f" strokeWidth="1.5" fill="none" strokeDasharray="4 5" />
      {pts.map(([x, y], i) => (
        <g key={i}>
          <line x1={x} y1={y} x2={x} y2={y - 34} stroke="#c4bcae" strokeOpacity="0.5" />
          <rect x={x - 6} y={y - 46} width="12" height="12" fill={i <= step ? "#f06a1f" : "#5f594f"} />
          <text x={x + 10} y={y - 36} fill="#c4bcae" fontSize="10" fontFamily="monospace">
            0{i + 1}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function WorkingModel({ steps }: { steps: Step[] }) {
  const root = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const [step, setStep] = useState(0);
  const [use3D, setUse3D] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const desktop = window.matchMedia("(min-width: 1024px)").matches;
    setUse3D(!reduce && desktop && canUseWebGL());

    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "200px" });
    io.observe(el);

    const st = ScrollTrigger.create({
      trigger: el,
      start: "top 70%",
      end: "bottom 60%",
      onUpdate: (self) => {
        progress.current = self.progress;
        setStep(Math.min(steps.length - 1, Math.floor(self.progress * steps.length * 0.999)));
      },
    });
    return () => {
      io.disconnect();
      st.kill();
    };
  }, [steps.length]);

  return (
    <div ref={root} className="relative grid gap-10 lg:grid-cols-12 lg:gap-8">
      <div className="lg:col-span-7">
        <div className="relative aspect-[16/10] lg:sticky lg:top-[calc(var(--header-h)+2rem)] lg:aspect-[16/11]">
          <div className="absolute inset-0 border border-paper/12 bg-ink-2">
            {use3D ? <RouteScene progress={progress} active={visible} /> : <div className="absolute inset-0 grid place-items-center p-6"><RouteDiagram step={step} /></div>}
          </div>
          <div className="label pointer-events-none absolute left-4 top-4 text-paper/50">Fig. 03 — Working model · source to site</div>
          <div className="label pointer-events-none absolute bottom-4 right-4 flex items-center gap-2 text-paper/70">
            <span className="h-1.5 w-1.5 bg-accent" />
            Stage 0{step + 1} / 0{steps.length}
          </div>
        </div>
      </div>

      <ol className="lg:col-span-5 lg:py-[12vh]">
        {steps.map((s, i) => (
          <li
            key={i}
            className={clsx(
              "border-t border-paper/12 py-7 transition-colors duration-500 lg:min-h-[34vh]",
              i === step ? "text-paper" : "text-paper/60",
            )}
          >
            <div className="flex items-baseline gap-5">
              <span className={clsx("font-mono text-sm transition-colors", i <= step ? "text-accent" : "text-paper/60")}>0{i + 1}</span>
              <div>
                <h4 className="display text-[2.1rem] sm:text-5xl">{s.title}</h4>
                <p className="mt-3 max-w-sm text-[0.9375rem] leading-relaxed text-paper/65">{s.body}</p>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
