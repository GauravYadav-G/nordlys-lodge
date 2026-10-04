import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type CSSProperties,
  type MutableRefObject,
} from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";

export const EASE: [number, number, number, number] = [0.16, 0.84, 0.28, 1];
export const EASE_IN_OUT: [number, number, number, number] = [0.76, 0, 0.24, 1];

/* ================================================================== */
/*  WebGL fragment-shader canvas                                       */
/*  One full-screen triangle, uniforms: u_time, u_res, u_mouse         */
/* ================================================================== */

const VERT = `attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }`;

export const GLSL_NOISE = `
precision highp float;
uniform float u_time; uniform vec2 u_res; uniform vec2 u_mouse;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1.0,0.0)), u.x),
             mix(hash(i+vec2(0.0,1.0)), hash(i+vec2(1.0,1.0)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for(int i = 0; i < 6; i++){ v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
  return v;
}
`;

export function ShaderCanvas({
  frag,
  className = "",
  style,
  speed = 1,
  uniformsRef,
  dprMax = 1.75,
}: {
  frag: string;
  className?: string;
  style?: CSSProperties;
  speed?: number;
  /** Extra float uniforms, read every frame (e.g. `{ u_depth: 120 }`). */
  uniformsRef?: MutableRefObject<Record<string, number>>;
  dprMax?: number;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const cvs = ref.current;
    if (!cvs) return;
    const gl = cvs.getContext("webgl", {
      antialias: false,
      alpha: false,
      powerPreference: "low-power",
    });
    if (!gl) return;

    const mk = (type: number, src: string) => {
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.warn(gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    };

    const vs = mk(gl.VERTEX_SHADER, VERT);
    const fs = mk(gl.FRAGMENT_SHADER, frag);
    if (!vs || !fs) return;

    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.warn(gl.getProgramInfoLog(prog));
      return;
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    const aLoc = gl.getAttribLocation(prog, "a");
    gl.enableVertexAttribArray(aLoc);
    gl.vertexAttribPointer(aLoc, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, "u_time");
    const uRes = gl.getUniformLocation(prog, "u_res");
    const uMouse = gl.getUniformLocation(prog, "u_mouse");

    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    const onMove = (e: PointerEvent) => {
      mouse.tx = e.clientX / window.innerWidth;
      mouse.ty = 1 - e.clientY / window.innerHeight;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    let w = 0;
    let h = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, dprMax);
      const r = cvs.getBoundingClientRect();
      const nw = Math.max(1, Math.round(r.width * dpr));
      const nh = Math.max(1, Math.round(r.height * dpr));
      if (nw === w && nh === h) return;
      w = nw;
      h = nh;
      cvs.width = w;
      cvs.height = h;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uRes, w, h);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(cvs);

    let raf = 0;
    const t0 = performance.now();
    let visible = true;
    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
      },
      { rootMargin: "120px" },
    );
    io.observe(cvs);

    const locs: Record<string, WebGLUniformLocation | null> = {};
    const pushUniforms = () => {
      const u = uniformsRef?.current;
      if (!u) return;
      for (const k in u) {
        if (!(k in locs)) locs[k] = gl.getUniformLocation(prog, k);
        const l = locs[k];
        if (l) gl.uniform1f(l, u[k]);
      }
    };

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (!visible) return;
      mouse.x += (mouse.tx - mouse.x) * 0.045;
      mouse.y += (mouse.ty - mouse.y) * 0.045;
      gl.uniform1f(uTime, reduce ? 14 : ((now - t0) / 1000) * speed);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      pushUniforms();
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    if (reduce && !uniformsRef) {
      gl.uniform1f(uTime, 14);
      gl.uniform2f(uMouse, 0.5, 0.5);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    } else {
      raf = requestAnimationFrame(draw);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
    };
  }, [frag, speed, reduce, dprMax, uniformsRef]);

  return <canvas ref={ref} className={className} style={style} aria-hidden="true" />;
}

/* ================================================================== */
/*  Magnetic — element leans toward the pointer                        */
/* ================================================================== */
export function Magnetic({
  children,
  strength = 0.34,
  className = "",
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const reduce = useReducedMotion();
  const x = useSpring(0, { stiffness: 220, damping: 18, mass: 0.35 });
  const y = useSpring(0, { stiffness: 220, damping: 18, mass: 0.35 });

  useEffect(() => {
    if (reduce) return;
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const dist = Math.hypot(dx, dy);
      const radius = Math.max(r.width, r.height) * 1.15;
      if (dist < radius) {
        x.set(dx * strength);
        y.set(dy * strength);
      } else {
        x.set(0);
        y.set(0);
      }
    };
    const leave = () => {
      x.set(0);
      y.set(0);
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerleave", leave);
    };
  }, [strength, x, y, reduce]);

  return (
    <motion.span ref={ref} style={{ x, y }} className={`inline-block ${className}`}>
      {children}
    </motion.span>
  );
}

/* ================================================================== */
/*  MaskLines — each line rises out of a clipped box                   */
/* ================================================================== */
export function MaskLines({
  lines,
  className = "",
  lineClassName = "",
  delay = 0,
  stagger = 0.085,
  inView = true,
  duration = 1.05,
}: {
  lines: ReactNode[];
  className?: string;
  lineClassName?: string;
  delay?: number;
  stagger?: number;
  inView?: boolean;
  duration?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <span className={className}>
      {lines.map((l, i) => (
        <motion.span
          key={i}
          className={`block ${lineClassName}`}
          style={{ clipPath: "inset(-25% -8% -45% -8%)" }}
          initial={reduce ? "shown" : "hidden"}
          {...(inView
            ? { whileInView: "shown", viewport: { once: true, margin: "-12%" } }
            : { animate: "shown" })}
        >
          <motion.span
            className="block will-change-transform"
            variants={{ hidden: { y: "165%" }, shown: { y: 0 } }}
            transition={{ duration, delay: delay + i * stagger, ease: EASE }}
          >
            {l}
          </motion.span>
        </motion.span>
      ))}
    </span>
  );
}

/* ================================================================== */
/*  Reveal / Rule                                                      */
/* ================================================================== */
export function Reveal({
  children,
  delay = 0,
  y = 18,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? { opacity: 1 } : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-70px" }}
      transition={{ duration: 0.8, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

export function Rule({
  className = "",
  tone = "currentColor",
  delay = 0,
}: {
  className?: string;
  tone?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={`rule-draw h-px w-full ${className}`}
      style={{ background: tone }}
      initial={reduce ? { scaleX: 1 } : { scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 1.15, delay, ease: EASE }}
    />
  );
}

/* ================================================================== */
/*  Marquee — CSS-driven, duplicated track, pauses on hover            */
/* ================================================================== */
export function Marquee({
  children,
  duration = 28,
  reverse = false,
  className = "",
}: {
  children: ReactNode;
  duration?: number;
  reverse?: boolean;
  className?: string;
}) {
  return (
    <div className={`marquee relative overflow-hidden ${className}`}>
      <div
        className={`marquee-track ${reverse ? "rev" : ""}`}
        style={{ ["--dur" as string]: `${duration}s` }}
      >
        <span className="flex shrink-0 items-center">{children}</span>
        <span className="flex shrink-0 items-center" aria-hidden="true">
          {children}
        </span>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Measure — width of an element, for horizontal scroll tracks        */
/* ================================================================== */
export function useMeasure<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setSize({ w: el.scrollWidth, h: el.scrollHeight });
    });
    ro.observe(el);
    setSize({ w: el.scrollWidth, h: el.scrollHeight });
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}

/* A live clock, for studio footers. */
export function Clock({ tz = "Europe/Berlin", className = "" }: { tz?: string; className?: string }) {
  const [t, setT] = useState("");
  useEffect(() => {
    const tick = () =>
      setT(
        new Intl.DateTimeFormat("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
          timeZone: tz,
        }).format(new Date()),
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [tz]);
  return <span className={`num ${className}`}>{t}</span>;
}


/* ================================================================== */
/*  ParallaxImg — photograph that drifts inside its own mask           */
/* ================================================================== */
export function ParallaxImg({
  src,
  alt,
  className = "",
  imgClassName = "",
  amount = 10,
  position = "50% 50%",
}: {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  amount?: number;
  position?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [`-${amount}%`, `${amount}%`]);
  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.img
        src={src}
        alt={alt}
        style={
          reduce
            ? { objectPosition: position }
            : { y, scale: 1 + (amount * 2) / 100, objectPosition: position }
        }
        className={`absolute inset-0 h-full w-full object-cover ${imgClassName}`}
      />
    </div>
  );
}
