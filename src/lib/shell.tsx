import { useEffect, useRef, useState } from "react";
import Lenis from "lenis";
import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";
import { EASE, EASE_IN_OUT } from "./kit";

/* ================================================================== */
/*  Cursor — driven by [data-cursor] attributes anywhere in the tree   */
/*  data-cursor="grow" | "label" | "hide"                              */
/*  data-cursor-label="View project"                                   */
/* ================================================================== */
export function Cursor() {
  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState<"default" | "grow" | "label" | "hide">("default");
  const [label, setLabel] = useState("");
  const [down, setDown] = useState(false);

  const rawX = useMotionValue(-100);
  const rawY = useMotionValue(-100);
  const x = useSpring(rawX, { stiffness: 900, damping: 50, mass: 0.28 });
  const y = useSpring(rawY, { stiffness: 900, damping: 50, mass: 0.28 });
  const rx = useSpring(rawX, { stiffness: 190, damping: 22, mass: 0.5 });
  const ry = useSpring(rawY, { stiffness: 190, damping: 22, mass: 0.5 });

  useEffect(() => {
    const fine =
      window.matchMedia("(pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine) return;
    setEnabled(true);
    document.documentElement.classList.add("hide-cursor");

    const move = (e: PointerEvent) => {
      rawX.set(e.clientX);
      rawY.set(e.clientY);
    };
    const over = (e: PointerEvent) => {
      const el = (e.target as HTMLElement)?.closest?.("[data-cursor]") as
        | HTMLElement
        | null;
      if (el) {
        setMode((el.dataset.cursor as typeof mode) || "grow");
        setLabel(el.dataset.cursorLabel || "");
      } else {
        const inter = (e.target as HTMLElement)?.closest?.(
          "a, button, input, textarea, select",
        );
        setMode(inter ? "grow" : "default");
        setLabel("");
      }
    };
    const dn = () => setDown(true);
    const up = () => setDown(false);

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerover", over, { passive: true });
    window.addEventListener("pointerdown", dn);
    window.addEventListener("pointerup", up);
    return () => {
      document.documentElement.classList.remove("hide-cursor");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
      window.removeEventListener("pointerdown", dn);
      window.removeEventListener("pointerup", up);
    };
  }, [rawX, rawY]);

  if (!enabled) return null;

  const ringSize = mode === "label" ? 92 : mode === "grow" ? 56 : 30;

  return (
    <div className="pointer-events-none fixed inset-0 z-[120] mix-blend-difference">
      <motion.div
        className="absolute left-0 top-0 rounded-full bg-white"
        style={{ x, y, width: 6, height: 6, translateX: "-50%", translateY: "-50%" }}
        animate={{ opacity: mode === "hide" || mode === "label" ? 0 : 1 }}
        transition={{ duration: 0.2 }}
      />
      <motion.div
        className="absolute left-0 top-0 grid place-items-center rounded-full border border-white"
        style={{ x: rx, y: ry, translateX: "-50%", translateY: "-50%" }}
        animate={{
          width: ringSize,
          height: ringSize,
          opacity: mode === "hide" ? 0 : 1,
          backgroundColor: mode === "label" ? "rgba(255,255,255,1)" : "rgba(255,255,255,0)",
          scale: down ? 0.82 : 1,
        }}
        transition={{ duration: 0.34, ease: EASE }}
      >
        <AnimatePresence>
          {mode === "label" && label && (
            <motion.span
              key={label}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="label whitespace-nowrap text-black"
              style={{ fontSize: 9 }}
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

/* ================================================================== */
/*  Preloader — counts up, then lifts in three columns                 */
/* ================================================================== */
export function Preloader({ onDone }: { onDone: () => void }) {
  const [pct, setPct] = useState(0);
  const [lift, setLift] = useState(false);
  const done = useRef(false);

  useEffect(() => {
    const dur = 1500;
    const t0 = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 2.4);
      setPct(Math.round(eased * 100));
      if (p < 1) raf = requestAnimationFrame(step);
      else if (!done.current) {
        done.current = true;
        setTimeout(() => setLift(true), 180);
        setTimeout(onDone, 1180);
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-[110]">
      <div className="absolute inset-0 flex">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="h-full flex-1 bg-noir"
            initial={{ y: 0 }}
            animate={lift ? { y: "-101%" } : { y: 0 }}
            transition={{ duration: 0.85, delay: i * 0.06, ease: EASE_IN_OUT }}
          />
        ))}
      </div>

      <motion.div
        className="absolute inset-0 flex flex-col justify-between p-6 sm:p-10"
        animate={lift ? { opacity: 0 } : { opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-start justify-between">
          <span className="label text-bone/55">The Collection</span>
          <span className="label text-bone/55">2026</span>
        </div>

        <div className="flex items-end justify-between gap-6">
          <p
            className="font-instr text-bone"
            style={{ fontSize: "clamp(2rem,7vw,5.5rem)", lineHeight: 0.95 }}
          >
            Eight <em className="italic text-gold">worlds</em>, one anthology
          </p>
          <span
            className="num shrink-0 font-grotesk font-medium text-bone"
            style={{ fontSize: "clamp(2.5rem,9vw,8rem)", lineHeight: 0.8 }}
          >
            {String(pct).padStart(3, "0")}
          </span>
        </div>

        <div className="mt-6 h-px w-full bg-bone/20">
          <div
            className="h-full bg-gold transition-[width] duration-100"
            style={{ width: `${pct}%` }}
          />
        </div>
      </motion.div>
    </div>
  );
}

/* ================================================================== */
/*  Curtain — panel wipe between sites                                 */
/* ================================================================== */
export function Curtain({ show, name }: { show: boolean; name: string }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-[105]"
          initial="hidden"
          animate="shown"
          exit="gone"
        >
          <div className="absolute inset-0 flex">
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className="h-full flex-1 bg-noir"
                variants={{
                  hidden: { y: "101%" },
                  shown: { y: 0 },
                  gone: { y: "-101%" },
                }}
                transition={{
                  duration: 0.58,
                  delay: i * 0.045,
                  ease: EASE_IN_OUT,
                }}
              />
            ))}
          </div>
          <motion.div
            className="absolute inset-0 grid place-items-center"
            variants={{
              hidden: { opacity: 0 },
              shown: { opacity: 1 },
              gone: { opacity: 0 },
            }}
            transition={{ duration: 0.35, delay: 0.24 }}
          >
            <span
              className="font-syne font-extrabold uppercase tracking-[0.18em] text-bone"
              style={{ fontSize: "clamp(1.1rem,3.4vw,2.4rem)" }}
            >
              {name}
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ================================================================== */
/*  Scroll progress bar                                                */
/* ================================================================== */
export function ScrollBar({ tone = "#d6ff3f" }: { tone?: string }) {
  const [p, setP] = useState(0);
  useEffect(() => {
    const on = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setP(h > 0 ? window.scrollY / h : 0);
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
    };
  }, []);
  return (
    <div className="fixed inset-x-0 top-0 z-[90] h-[2px] bg-transparent">
      <div
        className="h-full origin-left"
        style={{ background: tone, transform: `scaleX(${p})`, width: "100%" }}
      />
    </div>
  );
}


/* ================================================================== */
/*  Smooth scroll — Lenis, with in-page anchors routed through it      */
/* ================================================================== */
let lenisInstance: Lenis | null = null;

export function scrollToTop() {
  if (lenisInstance) lenisInstance.scrollTo(0, { immediate: true, force: true });
  else window.scrollTo({ top: 0, behavior: "auto" });
}

export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.95, smoothWheel: true });
    lenisInstance = lenis;

    let raf = 0;
    const loop = (t: number) => {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.('a[href^="#"]') as HTMLAnchorElement | null;
      if (!a) return;
      const id = a.getAttribute("href");
      if (!id || id === "#") return;
      const el = document.querySelector(id) as HTMLElement | null;
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el, { duration: 1.5, easing: (x: number) => 1 - Math.pow(1 - x, 4) });
    };
    document.addEventListener("click", onClick);

    return () => {
      document.removeEventListener("click", onClick);
      cancelAnimationFrame(raf);
      lenis.destroy();
      lenisInstance = null;
    };
  }, []);
  return null;
}
