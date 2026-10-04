import { useEffect, useState } from "react";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Clock, EASE, EASE_IN_OUT, MaskLines, Reveal } from "./lib/kit";
import { img } from "./lib/img";

/* ================================================================== */
/*  Data                                                               */
/* ================================================================== */
type Season = "winter" | "summer";

const IMG = {
  winter: img("fjord-winter.jpg"),
  summer: img("fjord-summer.jpg"),
  blue: img("fjord-cabin-blue.jpg"),
  green: img("fjord-cabin-green.jpg"),
  red: img("fjord-cabin-red.jpg"),
  aerial: img("fjord-aerial.jpg"),
  mist: img("fjord-mist.jpg"),
  lake: img("fjord-lake.jpg"),
};

const SEASONS: Record<Season, { label: string; months: string; accent: string; head: [string, string]; sub: string; pos: string }> = {
  winter: {
    label: "Winter",
    months: "Oct — Mar",
    accent: "#a9cfe0",
    head: ["Where the dark", "is blue."],
    sub: "Aurora over black water, woodsmoke, and days that last a few hours.",
    pos: "50% 58%",
  },
  summer: {
    label: "Summer",
    months: "Apr — Sep",
    accent: "#f0b35a",
    head: ["Where the night", "never comes."],
    sub: "The midnight sun, still water, and no reason to go indoors.",
    pos: "50% 62%",
  },
};

const CABINS = [
  {
    id: "blaa",
    name: "Blåhytta",
    sleeps: 2,
    size: 34,
    img: IMG.blue,
    rate: { winter: 4900, summer: 3900 },
    blurb: "A one-room cabin at the water’s edge. A bed under a skylight, a woodstove, and a bath that faces the fjord.",
    features: ["Skylight bed", "Woodstove", "Outdoor bath"],
  },
  {
    id: "gron",
    name: "Grønnhuset",
    sleeps: 4,
    size: 62,
    img: IMG.green,
    rate: { winter: 6400, summer: 5200 },
    blurb: "Two bedrooms, a long table, and a kitchen built for people who like to cook. The jetty is yours.",
    features: ["Two bedrooms", "Long-table kitchen", "Private jetty"],
  },
  {
    id: "rod",
    name: "Rødbua",
    sleeps: 6,
    size: 96,
    img: IMG.red,
    rate: { winter: 8900, summer: 7400 },
    blurb: "The old fish-buyer’s house, restored. Three bedrooms, a wood-fired sauna, and the best view of the mountain.",
    features: ["Three bedrooms", "Wood-fired sauna", "Boat included"],
  },
];

type Exp = { name: string; when: string; season: Season | "both"; dur: string; price: number; img: string; blurb: string };
const EXPERIENCES: Exp[] = [
  { name: "Aurora chase by boat", when: "Oct — Mar", season: "winter", dur: "4 h", price: 1450, img: IMG.winter, blurb: "Out past the skerries in a small boat, engine off, waiting for the sky to move." },
  { name: "Ski touring with a guide", when: "Feb — Apr", season: "winter", dur: "Full day", price: 1900, img: IMG.blue, blurb: "Skins on at sea level, the summit by lunch, the whole fjord below you." },
  { name: "Wood sauna & cold plunge", when: "All year", season: "both", dur: "2 h", price: 0, img: IMG.green, blurb: "Fired from four o’clock. The jetty is the plunge pool." },
  { name: "Sea-eagle safari", when: "All year", season: "both", dur: "3 h", price: 1100, img: IMG.aerial, blurb: "White-tailed eagles nest on the cliffs across the water. We know which ones." },
  { name: "Midnight-sun ridge hike", when: "May — Jul", season: "summer", dur: "6 h", price: 950, img: IMG.lake, blurb: "Start at ten in the evening. Reach the ridge at one, in full gold light." },
  { name: "Kayak among the skerries", when: "Jun — Aug", season: "summer", dur: "3 h", price: 850, img: IMG.mist, blurb: "Flat water, seals on the rocks, and nothing to do but paddle." },
  { name: "Supper at the long table", when: "Aug — Sep", season: "summer", dur: "Evening", price: 1250, img: IMG.summer, blurb: "Whatever came out of the sea that day, cooked on the fire, eaten outdoors." },
  { name: "Cod racks at first light", when: "Feb — Apr", season: "winter", dur: "2 h", price: 700, img: IMG.red, blurb: "Walk the drying racks with the last fishermen who still hang their catch by hand." },
];

/* ================================================================== */
/*  Date helpers                                                       */
/* ================================================================== */
const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const addDays = (d: Date, n: number) => {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
};
const parse = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const nightsBetween = (a: string, b: string) => Math.round((parse(b).getTime() - parse(a).getTime()) / 86400000);
const seasonOf = (s: string): Season => {
  const m = parse(s).getMonth();
  return m >= 3 && m <= 8 ? "summer" : "winter";
};
const nok = (n: number) => `NOK ${n.toLocaleString("en-US")}`;
const hashStr = (s: string) => Array.from(s).reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
const longDate = (s: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(parse(s));

/* ================================================================== */
/*  Season switch                                                      */
/* ================================================================== */
function SeasonSwitch({ season, setSeason, dark }: { season: Season; setSeason: (s: Season) => void; dark: boolean }) {
  return (
    <div
      role="group"
      aria-label="Season"
      className={`relative flex rounded-full border p-1 backdrop-blur-md transition-colors duration-500 ${
        dark ? "border-spruce/25 bg-fog/60" : "border-fog/35 bg-spruce/25"
      }`}
    >
      {(["winter", "summer"] as Season[]).map((s) => {
        const on = season === s;
        return (
          <button
            key={s}
            type="button"
            aria-pressed={on}
            onClick={() => setSeason(s)}
            data-cursor="grow"
            className={`relative z-10 rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors duration-300 ${
              on ? "text-spruce" : dark ? "text-spruce/70" : "text-fog/80"
            }`}
          >
            {on && (
              <motion.span
                layoutId="season-pill"
                transition={{ duration: 0.5, ease: EASE }}
                className="absolute inset-0 -z-10 rounded-full"
                style={{ background: SEASONS[s].accent }}
              />
            )}
            {SEASONS[s].label}
          </button>
        );
      })}
    </div>
  );
}

/* ================================================================== */
/*  Booking panel                                                      */
/* ================================================================== */
function BookingPanel({
  open,
  onClose,
  arrive,
  depart,
  guests,
}: {
  open: boolean;
  onClose: () => void;
  arrive: string;
  depart: string;
  guests: number;
}) {
  const [step, setStep] = useState<"list" | "details" | "done">("list");
  const [cabinId, setCabinId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");

  const n = nightsBetween(arrive, depart);
  const s = seasonOf(arrive);
  const rows = CABINS.map((c) => ({
    c,
    fits: guests <= c.sleeps,
    booked: hashStr(arrive + c.id) % 4 === 0,
    total: c.rate[s] * n,
  }));
  const chosen = rows.find((r) => r.c.id === cabinId);

  useEffect(() => {
    if (open) {
      setStep("list");
      setCabinId(null);
      setErr("");
    }
  }, [open, arrive, depart, guests]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setErr("Please tell us your name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return setErr("That email doesn’t look right.");
    setErr("");
    setStep("done");
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          data-modal
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex justify-end bg-spruce/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.aside
            data-lenis-prevent
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.6, ease: EASE }}
            onClick={(e) => e.stopPropagation()}
            className="flex h-full w-full max-w-[540px] flex-col overflow-y-auto bg-fog p-6 text-spruce sm:p-9"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-spruce/55">
                  {step === "list" ? "Availability" : step === "details" ? "Your request" : "Request sent"}
                </p>
                <p className="mt-1 font-cormorant text-[2rem] font-light leading-tight">
                  {longDate(arrive)} — {longDate(depart)}
                </p>
                <p className="mt-1 text-[14px] text-spruce/65">
                  {n} nights · {guests} {guests === 1 ? "guest" : "guests"} · {SEASONS[s].label} rates
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                data-cursor="grow"
                className="grid h-10 w-10 place-items-center rounded-full border border-spruce/25 text-[18px] transition-colors hover:bg-spruce hover:text-fog"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {step === "list" && (
              <ul className="mt-9 space-y-4">
                {rows.map(({ c, fits, booked, total }) => {
                  const ok = fits && !booked;
                  return (
                    <li key={c.id} className={`overflow-hidden border border-spruce/15 bg-white/40 ${ok ? "" : "opacity-60"}`}>
                      <div className="grid grid-cols-[110px_1fr]">
                        <img src={c.img} alt={c.name} className="h-full w-full object-cover" />
                        <div className="p-4">
                          <div className="flex items-baseline justify-between gap-2">
                            <h3 className="font-cormorant text-[1.6rem] font-medium leading-none">{c.name}</h3>
                            <span className="text-[12px] text-spruce/60">Sleeps {c.sleeps}</span>
                          </div>
                          <p className="mt-2 text-[13px] leading-snug text-spruce/65">
                            {!fits ? `Too small for ${guests} guests.` : booked ? "Booked for these dates." : `${nok(c.rate[s])} per night`}
                          </p>
                          <div className="mt-3 flex items-center justify-between">
                            <span className="num text-[1.05rem] font-semibold">{ok ? nok(total) : "—"}</span>
                            <button
                              type="button"
                              disabled={!ok}
                              onClick={() => {
                                setCabinId(c.id);
                                setStep("details");
                              }}
                              data-cursor="grow"
                              className="rounded-full bg-spruce px-4 py-2 text-[12px] font-medium text-fog transition-colors hover:bg-fjord disabled:cursor-not-allowed disabled:bg-spruce/25"
                            >
                              Select
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {step === "details" && chosen && (
              <form onSubmit={submit} noValidate className="mt-9">
                <div className="flex items-center justify-between border border-spruce/15 bg-white/40 p-4">
                  <div>
                    <p className="font-cormorant text-[1.6rem] font-medium leading-none">{chosen.c.name}</p>
                    <p className="mt-1.5 text-[13px] text-spruce/60">
                      {n} nights × {nok(chosen.c.rate[s])}
                    </p>
                  </div>
                  <p className="num text-[1.25rem] font-semibold">{nok(chosen.total)}</p>
                </div>
                <label className="mt-6 block">
                  <span className="text-[12px] font-medium uppercase tracking-[0.12em] text-spruce/55">Name</span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 w-full border-b border-spruce/30 bg-transparent py-2.5 text-[16px] outline-none focus:border-fjord"
                    placeholder="Ingrid Solberg"
                  />
                </label>
                <label className="mt-5 block">
                  <span className="text-[12px] font-medium uppercase tracking-[0.12em] text-spruce/55">Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full border-b border-spruce/30 bg-transparent py-2.5 text-[16px] outline-none focus:border-fjord"
                    placeholder="you@example.com"
                  />
                </label>
                {err && <p className="mt-3 text-[13px] text-[#b3402a]">{err}</p>}
                <p className="mt-5 text-[13px] leading-relaxed text-spruce/60">
                  This is a request, not a charge. We confirm within a day, and take a 20% deposit only once you are happy.
                </p>
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep("list")}
                    className="rounded-full border border-spruce/30 px-5 py-3 text-[14px] font-medium transition-colors hover:bg-spruce hover:text-fog"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    data-cursor="grow"
                    className="flex-1 rounded-full bg-spruce px-5 py-3 text-[14px] font-medium text-fog transition-colors hover:bg-fjord"
                  >
                    Send request
                  </button>
                </div>
              </form>
            )}

            {step === "done" && chosen && (
              <div className="mt-12">
                <p className="font-cormorant text-[clamp(2.4rem,5vw,3.4rem)] font-light italic leading-[1.02]">
                  Takk, {name.split(" ")[0]}.
                </p>
                <p className="mt-5 text-[15px] leading-[1.7] text-spruce/75">
                  {chosen.c.name} is held for you from {longDate(arrive)} to {longDate(depart)}. A confirmation will
                  reach {email} within a day.
                </p>
                <p className="mt-8 text-[12px] font-medium uppercase tracking-[0.14em] text-spruce/50">
                  Reference NL-{(hashStr(arrive + depart + chosen.c.id) % 9000) + 1000}
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-8 rounded-full bg-spruce px-6 py-3 text-[14px] font-medium text-fog transition-colors hover:bg-fjord"
                >
                  Done
                </button>
              </div>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ================================================================== */
/*  Cabin block — the photograph opens out as it reaches the centre     */
/* ================================================================== */
function CabinBlock({ cabin, index, season }: { cabin: (typeof CABINS)[number]; index: number; season: Season }) {
  const ref = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const clip = useTransform(
    scrollYProgress,
    [0, 1],
    ["inset(12% 15% 12% 15% round 12px)", "inset(0% 0% 0% 0% round 0px)"],
  );
  const scale = useTransform(scrollYProgress, [0, 1], [1.22, 1]);
  const cardOpacity = useTransform(scrollYProgress, [0.6, 1], [0, 1]);
  const cardY = useTransform(scrollYProgress, [0.6, 1], [28, 0]);
  const right = index % 2 === 1;

  return (
    <article ref={ref} className="relative h-[92vh] min-h-[600px] w-full overflow-hidden bg-fog">
      <motion.div style={{ clipPath: clip }} className="absolute inset-0 bg-spruce">
        <motion.img src={cabin.img} alt={cabin.name} style={{ scale }} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-spruce/55 via-transparent to-transparent" />
      </motion.div>

      <motion.div
        style={{ opacity: cardOpacity, y: cardY }}
        className={`absolute bottom-6 left-5 right-5 max-w-[500px] bg-fog p-6 text-spruce shadow-[0_30px_60px_-30px_rgba(10,20,16,0.6)] sm:bottom-10 sm:p-8 ${
          right ? "sm:left-auto sm:right-10" : "sm:left-10 sm:right-auto"
        }`}
      >
        <div className="flex items-baseline justify-between">
          <span className="text-[12px] font-medium uppercase tracking-[0.14em] text-spruce/55">
            Cabin 0{index + 1}
          </span>
          <span className="text-[12px] text-spruce/60">
            Sleeps {cabin.sleeps} · {cabin.size} m²
          </span>
        </div>
        <h3 className="mt-3 font-cormorant text-[clamp(2.4rem,4vw,3.4rem)] font-light leading-none tracking-[-0.01em]">
          {cabin.name}
        </h3>
        <p className="mt-4 text-[15px] leading-[1.65] text-spruce/75">{cabin.blurb}</p>
        <ul className="mt-5 flex flex-wrap gap-2">
          {cabin.features.map((f) => (
            <li key={f} className="rounded-full border border-spruce/20 px-3 py-1 text-[12px] text-spruce/70">
              {f}
            </li>
          ))}
        </ul>
        <div className="mt-6 flex items-center justify-between border-t border-spruce/15 pt-5">
          <p>
            <span className="text-[12px] text-spruce/55">{SEASONS[season].label} · from</span>
            <span className="num ml-2 text-[1.2rem] font-semibold">{nok(cabin.rate[season])}</span>
            <span className="text-[12px] text-spruce/55"> / night</span>
          </p>
          <a
            href="#top"
            data-cursor="label"
            data-cursor-label="Dates"
            className="rounded-full bg-spruce px-5 py-2.5 text-[13px] font-medium text-fog transition-colors hover:bg-fjord"
          >
            Check dates
          </a>
        </div>
      </motion.div>
    </article>
  );
}

/* ================================================================== */
/*  Page                                                               */
/* ================================================================== */
export default function Nordlys() {
  const [season, setSeason] = useState<Season>("winter");
  const S = SEASONS[season];

  const [arrive, setArrive] = useState(() => iso(addDays(new Date(), 28)));
  const [depart, setDepart] = useState(() => iso(addDays(new Date(), 32)));
  const [guests, setGuests] = useState(2);
  const [err, setErr] = useState("");
  const [panel, setPanel] = useState(false);
  const [solid, setSolid] = useState(false);
  const [hoverExp, setHoverExp] = useState(0);
  const [split, setSplit] = useState<Season | null>(null);

  useEffect(() => {
    const on = () => setSolid(window.scrollY > window.innerHeight * 0.8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const onArrive = (v: string) => {
    setArrive(v);
    if (v && nightsBetween(v, depart) < 2) setDepart(iso(addDays(parse(v), 3)));
  };

  const check = () => {
    if (arrive < iso(new Date())) return setErr("Arrival can’t be in the past.");
    const n = nightsBetween(arrive, depart);
    if (n < 2) return setErr("Two nights is the minimum stay.");
    if (n > 21) return setErr("For stays over 21 nights, please write to us.");
    setErr("");
    setPanel(true);
  };

  const exp = EXPERIENCES[hoverExp] ?? EXPERIENCES[0];
  const fieldCls =
    "mt-1 w-full bg-transparent text-[16px] font-medium text-spruce outline-none [color-scheme:light]";

  return (
    <div className="min-h-screen bg-fog font-instsans text-spruce">
      {/* ================= NAV ================= */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-500 ${
          solid ? "border-b border-spruce/10 bg-fog/85 backdrop-blur-md" : "border-b border-transparent"
        }`}
      >
        <div className="mx-auto flex h-[68px] max-w-[1560px] items-center gap-6 px-5 sm:px-8 lg:px-12">
          <a
            href="#top"
            className={`font-cormorant text-[1.7rem] font-medium tracking-[0.02em] transition-colors duration-500 ${
              solid ? "text-spruce" : "text-fog"
            }`}
          >
            Nordlys
          </a>
          <nav className="ml-8 hidden items-center gap-8 md:flex">
            {[
              ["#cabins", "Cabins"],
              ["#seasons", "Seasons"],
              ["#experiences", "Experiences"],
              ["#reserve", "Reserve"],
            ].map(([h, l]) => (
              <a
                key={h}
                href={h}
                className={`text-[14px] transition-colors duration-500 ${
                  solid ? "text-spruce/70 hover:text-spruce" : "text-fog/80 hover:text-fog"
                }`}
              >
                {l}
              </a>
            ))}
          </nav>
          <div className="ml-auto">
            <SeasonSwitch season={season} setSeason={setSeason} dark={solid} />
          </div>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <section id="top" className="relative flex h-[100svh] min-h-[760px] flex-col justify-end overflow-hidden bg-spruce text-fog">
        <AnimatePresence initial={false}>
          <motion.div
            key={season}
            className="absolute inset-0"
            initial={{ clipPath: "inset(0 0 0 100%)" }}
            animate={{ clipPath: "inset(0 0 0 0%)" }}
            exit={{ opacity: 1, transition: { duration: 1.4 } }}
            transition={{ duration: 1.3, ease: EASE_IN_OUT }}
          >
            <img
              src={IMG[season]}
              alt={season === "winter" ? "A red cabin on a snowy shore at sunset" : "Golden light over a fjord village"}
              className="kenburns h-full w-full object-cover"
              style={{ objectPosition: S.pos }}
            />
          </motion.div>
        </AnimatePresence>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-spruce/55 via-spruce/5 to-spruce/70" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(21,35,30,0.55),rgba(21,35,30,0.18)_55%,transparent)]" />

        <div className="relative mx-auto w-full max-w-[1560px] px-5 pb-8 sm:px-8 lg:px-12">
          <p className="text-[13px] font-medium uppercase tracking-[0.16em] text-fog/80">
            Lofoten, Norway · 68° N · Open all year
          </p>

          <AnimatePresence mode="wait">
            <motion.div
              key={season}
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.25 } }}
              style={{ textShadow: "0 2px 40px rgba(10,20,16,0.45)" }}
            >
              <MaskLines
                inView={false}
                delay={0.1}
                className="mt-5 block font-cormorant font-light leading-[0.92] tracking-[-0.02em]"
                lines={[
                  <span key="a" style={{ fontSize: "clamp(3.4rem, 10vw, 10rem)" }}>{S.head[0]}</span>,
                  <span key="b" style={{ fontSize: "clamp(3.4rem, 10vw, 10rem)" }}>
                    <em className="italic" style={{ color: S.accent }}>{S.head[1]}</em>
                  </span>,
                ]}
              />
              <p className="mt-6 max-w-[44ch] text-[clamp(1rem,1.3vw,1.2rem)] leading-[1.6] text-fog/85">{S.sub}</p>
            </motion.div>
          </AnimatePresence>

          {/* booking bar */}
          <div className="mt-10 max-w-[1080px] bg-fog/95 p-2 text-spruce shadow-[0_30px_70px_-30px_rgba(5,12,10,0.8)] backdrop-blur-md sm:p-3">
            <div className="grid gap-px bg-spruce/10 sm:grid-cols-[1fr_1fr_0.8fr_auto]">
              <label className="block bg-fog px-5 py-3.5">
                <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-spruce/55">Arrive</span>
                <input
                  type="date"
                  className={fieldCls}
                  min={iso(new Date())}
                  value={arrive}
                  onChange={(e) => onArrive(e.target.value)}
                />
              </label>
              <label className="block bg-fog px-5 py-3.5">
                <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-spruce/55">Depart</span>
                <input
                  type="date"
                  className={fieldCls}
                  min={arrive}
                  value={depart}
                  onChange={(e) => setDepart(e.target.value)}
                />
              </label>
              <div className="bg-fog px-5 py-3.5">
                <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-spruce/55">Guests</span>
                <div className="mt-1 flex items-center justify-between">
                  <button
                    type="button"
                    aria-label="Fewer guests"
                    onClick={() => setGuests((g) => Math.max(1, g - 1))}
                    className="grid h-7 w-7 place-items-center rounded-full border border-spruce/25 transition-colors hover:bg-spruce hover:text-fog"
                  >
                    −
                  </button>
                  <span className="num text-[16px] font-medium">{guests}</span>
                  <button
                    type="button"
                    aria-label="More guests"
                    onClick={() => setGuests((g) => Math.min(6, g + 1))}
                    className="grid h-7 w-7 place-items-center rounded-full border border-spruce/25 transition-colors hover:bg-spruce hover:text-fog"
                  >
                    +
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={check}
                data-cursor="label"
                data-cursor-label="Search"
                className="bg-spruce px-8 py-4 text-[14px] font-medium text-fog transition-colors duration-300 hover:bg-fjord"
              >
                Check availability
              </button>
            </div>
          </div>
          <p className="mt-3 h-5 text-[13px] text-[#ffb8a8]" role="alert">
            {err}
          </p>
        </div>
      </section>

      {/* ================= INTRO ================= */}
      <section className="px-5 py-28 sm:px-8 lg:px-12 lg:py-40">
        <div className="mx-auto grid max-w-[1560px] gap-16 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <Reveal>
              <p className="font-cormorant text-[clamp(2.1rem,5.4vw,5rem)] font-light leading-[1.08] tracking-[-0.015em]">
                Six cabins
                <span
                  aria-hidden="true"
                  className="mx-2 inline-block h-[0.66em] w-[1.5em] translate-y-[0.04em] rounded-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${IMG.aerial})` }}
                />
                on a working fishing shore. No reception desk,
                <span
                  aria-hidden="true"
                  className="mx-2 inline-block h-[0.66em] w-[1.5em] translate-y-[0.04em] rounded-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${IMG.lake})` }}
                />
                no minibar, no schedule — only the tide, the stove and whatever the weather decides.
              </p>
            </Reveal>
          </div>
          <div className="lg:col-span-3 lg:col-start-10 lg:self-end">
            <Reveal delay={0.15}>
              <p className="text-[15px] leading-[1.75] text-spruce/70">
                Nordlys is run by two families who have fished this coast for four generations. We rebuilt the old
                fish-buyer’s quay by hand, board by board, and kept everything that still worked.
              </p>
            </Reveal>
          </div>
        </div>

        <div className="mx-auto mt-20 grid max-w-[1560px] grid-cols-2 gap-y-8 border-t border-spruce/15 pt-8 sm:grid-cols-4">
          {[
            ["68° N", "Above the Arctic Circle"],
            ["6", "Cabins, no more"],
            ["2", "Nights minimum"],
            ["0", "Televisions"],
          ].map(([k, v], i) => (
            <Reveal key={v} delay={i * 0.06}>
              <p className="num font-cormorant text-[clamp(2.4rem,4vw,3.6rem)] font-light leading-none">{k}</p>
              <p className="mt-2 text-[13px] text-spruce/60">{v}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ================= CABINS ================= */}
      <section id="cabins">
        <div className="mx-auto flex max-w-[1560px] flex-col justify-between gap-4 px-5 pb-12 sm:px-8 md:flex-row md:items-end lg:px-12">
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-spruce/55">The cabins</p>
            <h2 className="mt-3 font-cormorant text-[clamp(2.6rem,6vw,5.6rem)] font-light leading-[0.95] tracking-[-0.02em]">
              Three of six, <em className="italic">shown</em>.
            </h2>
          </div>
          <p className="max-w-[34ch] text-[14px] leading-relaxed text-spruce/60">
            Rates shown for {SEASONS[season].label.toLowerCase()}. Switch season at the top to compare.
          </p>
        </div>
        <div className="space-y-6">
          {CABINS.map((c, i) => (
            <CabinBlock key={c.id} cabin={c} index={i} season={season} />
          ))}
        </div>
      </section>

      {/* ================= TWO LIGHTS ================= */}
      <section id="seasons" className="mt-28 bg-spruce text-fog">
        <div className="flex min-h-[88vh] flex-col md:flex-row">
          {(["winter", "summer"] as Season[]).map((s) => {
            const on = split === s;
            const copy =
              s === "winter"
                ? "From October the dark comes back. Aurora over black water, woodsmoke in the air, and at midwinter a sun that barely clears the mountains."
                : "From late May to mid-July the sun does not set. Midnight is gold, the water is still, and the whole coast stays awake.";
            return (
              <motion.div
                key={s}
                onMouseEnter={() => setSplit(s)}
                onMouseLeave={() => setSplit(null)}
                animate={{ flexGrow: split === null ? 1 : on ? 2.1 : 0.8 }}
                transition={{ duration: 0.85, ease: EASE }}
                className="relative min-h-[64vh] flex-1 basis-0 overflow-hidden"
              >
                <img
                  src={s === "winter" ? IMG.winter : IMG.lake}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ objectPosition: s === "winter" ? "20% 60%" : "50% 50%" }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-spruce/85 via-spruce/15 to-spruce/30" />
                <div className="relative flex h-full min-h-[64vh] flex-col justify-between p-6 sm:p-10">
                  <span className="text-[12px] font-medium uppercase tracking-[0.16em] text-fog/75">
                    {SEASONS[s].months}
                  </span>
                  <div>
                    <h3
                      className="font-cormorant font-light leading-[0.9] tracking-[-0.02em]"
                      style={{ fontSize: "clamp(4rem, 9vw, 9rem)" }}
                    >
                      {SEASONS[s].label}
                    </h3>
                    <p className="mt-5 max-w-[42ch] text-[15px] leading-[1.7] text-fog/85">{copy}</p>
                    <a
                      href="#top"
                      onClick={() => setSeason(s)}
                      data-cursor="label"
                      data-cursor-label="Switch"
                      className="mt-6 inline-flex items-center gap-3 rounded-full border border-fog/50 px-5 py-2.5 text-[13px] font-medium transition-colors hover:bg-fog hover:text-spruce"
                    >
                      Show the site in {s} <span>→</span>
                    </a>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ================= EXPERIENCES ================= */}
      <section id="experiences" className="px-5 py-28 sm:px-8 lg:px-12 lg:py-40">
        <div className="mx-auto max-w-[1560px]">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-spruce/55">Experiences</p>
              <h2 className="mt-3 font-cormorant text-[clamp(2.6rem,6vw,5.6rem)] font-light leading-[0.95] tracking-[-0.02em]">
                What the {season} is for.
              </h2>
            </div>
            <p className="max-w-[34ch] text-[14px] leading-relaxed text-spruce/60">
              In-season experiences are lit. Everything else is still possible — just not in{" "}
              {season === "winter" ? "winter" : "summer"}.
            </p>
          </div>

          <div className="mt-14 grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_1.1fr] lg:gap-16">
            <div className="lg:sticky lg:top-24 lg:self-start">
              <div className="relative aspect-[4/5] overflow-hidden bg-spruce">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.img
                    key={exp.name}
                    src={exp.img}
                    alt={exp.name}
                    initial={{ opacity: 0, scale: 1.08 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.7, ease: EASE }}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </AnimatePresence>
                <div className="absolute inset-0 bg-gradient-to-t from-spruce/70 via-transparent to-transparent" />
                <p className="absolute bottom-5 left-5 right-5 font-cormorant text-[1.6rem] font-light italic leading-snug text-fog">
                  {exp.blurb}
                </p>
              </div>
            </div>

            <ul className="border-t border-spruce/20">
              {EXPERIENCES.map((e, i) => {
                const inSeason = e.season === "both" || e.season === season;
                return (
                  <li key={e.name}>
                    <button
                      type="button"
                      onMouseEnter={() => setHoverExp(i)}
                      onFocus={() => setHoverExp(i)}
                      onClick={() => setHoverExp(i)}
                      data-cursor="grow"
                      className={`group grid w-full grid-cols-[2.4rem_1fr_auto] items-baseline gap-4 border-b border-spruce/20 py-6 text-left transition-opacity duration-500 ${
                        inSeason ? "opacity-100" : "opacity-40 hover:opacity-70"
                      }`}
                    >
                      <span className="num text-[12px] text-spruce/45">{String(i + 1).padStart(2, "0")}</span>
                      <span>
                        <span
                          className="block font-cormorant text-[clamp(1.6rem,2.8vw,2.4rem)] font-light leading-[1.05] transition-transform duration-500 group-hover:translate-x-2"
                          style={{ color: hoverExp === i ? "#2f4a56" : undefined }}
                        >
                          {e.name}
                        </span>
                        <span className="mt-2 block text-[13px] text-spruce/55">
                          {e.when} · {e.dur}
                          {!inSeason && <span className="ml-2 rounded-full border border-spruce/30 px-2 py-0.5 text-[11px]">Out of season</span>}
                        </span>
                      </span>
                      <span className="num text-[14px] font-medium">{e.price === 0 ? "Included" : nok(e.price)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      {/* ================= RESERVE / FOOTER ================= */}
      <section id="reserve" className="bg-spruce px-5 py-28 text-fog sm:px-8 lg:px-12 lg:py-36">
        <div className="mx-auto max-w-[1560px]">
          <MaskLines
            className="block font-cormorant font-light leading-[0.94] tracking-[-0.02em]"
            lines={[
              <span key="a" style={{ fontSize: "clamp(2.8rem, 8.6vw, 8.6rem)" }}>Two nights is the minimum.</span>,
              <span key="b" style={{ fontSize: "clamp(2.8rem, 8.6vw, 8.6rem)" }}>
                Most people <em className="italic" style={{ color: S.accent }}>stay five.</em>
              </span>,
            ]}
          />
          <Reveal delay={0.1}>
            <a
              href="#top"
              data-cursor="label"
              data-cursor-label="Dates"
              className="mt-12 inline-flex items-center gap-4 rounded-full px-8 py-4 text-[15px] font-medium text-spruce transition-transform duration-500 hover:scale-[1.03]"
              style={{ background: S.accent }}
            >
              Check availability <span>↑</span>
            </a>
          </Reveal>

          <div className="mt-24 grid gap-10 border-t border-fog/20 pt-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-fog/50">Find us</p>
              <p className="mt-3 text-[15px] leading-relaxed text-fog/80">
                Nordlys Lodge, Havnevegen 4
                <br />
                8310 Kabelvåg, Lofoten
              </p>
            </div>
            <div>
              <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-fog/50">Getting here</p>
              <p className="mt-3 text-[15px] leading-relaxed text-fog/80">
                Fly to Leknes (LKN) or Svolvær (SVJ). We collect from both.
              </p>
            </div>
            <div>
              <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-fog/50">Write</p>
              <p className="mt-3 text-[15px] leading-relaxed text-fog/80">
                hei@nordlys-lofoten.no
                <br />
                Replies within a day
              </p>
            </div>
            <div>
              <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-fog/50">Local time</p>
              <p className="mt-3 text-[15px] leading-relaxed text-fog/80">
                <Clock tz="Europe/Oslo" className="text-[1.4rem] text-fog" />
              </p>
            </div>
          </div>
          <p className="mt-16 text-[12px] text-fog/40">
            © 2026 Nordlys Lodge AS · Photographs are illustrative stock images of the Norwegian coast.
          </p>
        </div>
      </section>

      <BookingPanel open={panel} onClose={() => setPanel(false)} arrive={arrive} depart={depart} guests={guests} />
    </div>
  );
}
