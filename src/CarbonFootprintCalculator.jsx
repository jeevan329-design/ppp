import React, { useState, useMemo, useEffect } from "react";
import {
  Car, Home, Utensils, ShoppingBag, Leaf, ArrowRight, ArrowLeft,
  RotateCcw, Plane, Zap, Sparkles, TrendingDown, Droplets, Flame,
  Sun, CloudLightning, Trees, Globe2,
} from "lucide-react";

/* ---------------------------------------------------------
   Design system: Organic / Natural
   Moss #5D7052 · Terracotta #C18C5D · Sand #E6DCCD
   Stone #F0EBE5 · Timber #DED8CF · Loam #2C2C24
--------------------------------------------------------- */

const FONT_IMPORT = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700;9..144,800&family=Nunito:wght@400;500;600;700;800&display=swap');
`;

const NOISE_BG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

/* ---------------------------------------------------------
   Color helpers
--------------------------------------------------------- */
function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function lerpColor(hexA, hexB, t) {
  const a = hexToRgb(hexA), b = hexToRgb(hexB);
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r},${g},${bl})`;
}
function lerp3(c0, c1, c2, t) {
  return t <= 0.5 ? lerpColor(c0, c1, t * 2) : lerpColor(c1, c2, (t - 0.5) * 2);
}
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const lerp = (a, b, t) => a + (b - a) * t;

/* ---------------------------------------------------------
   Emission model (illustrative estimates, tCO2e / year)
   All inputs default to 0 / unselected — nothing is assumed.
--------------------------------------------------------- */
const DIET_ORDER = ["meatHeavy", "average", "vegetarian", "vegan"];
const DIET_FACTORS = {
  meatHeavy: { label: "Meat with most meals", value: 3.3 },
  average: { label: "Meat a few times a week", value: 2.5 },
  vegetarian: { label: "Vegetarian", value: 1.7 },
  vegan: { label: "Vegan", value: 1.4 },
};
const HEATING_FACTORS = {
  gas: { label: "Gas / oil", value: 1.9 },
  electric: { label: "Electric", value: 1.1 },
  renewable: { label: "Renewable / heat pump", value: 0.4 },
  none: { label: "None / mild climate", value: 0.1 },
};
const SPENDING_FACTORS = {
  low: { label: "Minimal — I buy little new", value: 0.7 },
  medium: { label: "Moderate — occasional purchases", value: 1.6 },
  high: { label: "High — I shop often", value: 2.9 },
};

function calculateFootprint(f) {
  const transport =
    (f.carKm * 52 * 0.171) / 1000 +
    f.flightsShort * 0.25 +
    f.flightsLong * 1.5 +
    (f.transitKm * 52 * 0.04) / 1000;

  const heatingVal = f.heating ? HEATING_FACTORS[f.heating].value : 0;
  const home = ((f.electricityKwh * 12 * 0.42) / 1000 + heatingVal) / f.householdSize;

  const diet = f.diet ? DIET_FACTORS[f.diet].value : 0;
  const consumption = f.spending ? SPENDING_FACTORS[f.spending].value : 0;

  const total = transport + home + diet + consumption;
  return { total, transport, home, diet, consumption };
}

const GLOBAL_AVERAGE = 4.7;
const CLIMATE_TARGET = 2.3;

/* ---------------------------------------------------------
   Small primitives
--------------------------------------------------------- */
function Pill({ selected, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex cursor-pointer items-center gap-1.5 whitespace-normal break-words rounded-full border-2 px-4 py-2 text-center text-xs leading-snug transition-all duration-200 active:scale-95 sm:px-5 sm:py-2.5 sm:text-sm sm:font-semibold ${
        selected
          ? "scale-[1.03] border-[#5D7052] bg-[#5D7052] text-[#F3F4F1] shadow-[0_6px_22px_-4px_rgba(93,112,82,0.55)] ring-2 ring-[#5D7052]/30 ring-offset-2 ring-offset-[#FEFEFA]"
          : "border-[#DED8CF] bg-white/60 text-[#4A4A40] hover:-translate-y-0.5 hover:border-[#5D7052] hover:bg-white hover:shadow-[0_4px_14px_-2px_rgba(93,112,82,0.2)] active:border-[#5D7052]/70 active:bg-[#5D7052]/10"
      }`}
    >
      {selected && (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="shrink-0">
          <path d="M4 12.5L9.5 18L20 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {children}
    </button>
  );
}

function Slider({ value, min, max, step, onChange, unit }) {
  return (
    <div className="flex items-center gap-4">
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 flex-1 cursor-pointer appearance-none rounded-full border-2 border-[#2C2C24] bg-[#E6DCCD] accent-[#5D7052]"
      />
      <span className="w-24 shrink-0 rounded-full border border-[#2C2C24]/30 bg-white/70 px-3 py-1.5 text-center font-mono text-sm font-semibold text-[#4A4A40]">
        {value} {unit}
      </span>
    </div>
  );
}

function StepShell({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="animate-[fadeIn_0.5s_ease]">
      <div className="mb-8 flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#5D7052]/15 backdrop-blur-sm">
          <Icon size={28} className="text-[#5D7052] drop-shadow-[0_1px_3px_rgba(255,255,255,0.9)]" strokeWidth={1.75} />
        </div>
        <div>
          <h3 style={{ fontFamily: "'Fraunces', serif", textShadow: "0 1px 12px rgba(255,255,255,0.9), 0 1px 3px rgba(255,255,255,0.9)" }} className="text-2xl font-semibold text-[#2C2C24]">
            {title}
          </h3>
          <p className="mt-1 text-sm font-medium text-[#4A4A40]" style={{ textShadow: "0 1px 8px rgba(255,255,255,0.9)" }}>{subtitle}</p>
        </div>
      </div>
      <div className="space-y-7">{children}</div>
    </div>
  );
}

/* ===========================================================
   SEMI-REALISTIC EARTH — the signature living visual
   Organic irregular landmasses, day/night shading, atmospheric
   rim glow, melting polar ice, industrial smoke sources.
=========================================================== */
const BLOB_A = "M-22,-8 C-18,-24 2,-30 18,-20 C32,-12 30,8 16,20 C2,30 -18,24 -24,8 C-27,-2 -26,-4 -22,-8 Z";
const BLOB_B = "M-16,-14 C-6,-24 14,-22 20,-8 C26,4 18,18 4,20 C-10,22 -22,12 -20,-2 C-19,-10 -20,-9 -16,-14 Z";
const BLOB_C = "M-12,-18 C0,-24 14,-16 16,-2 C18,10 8,20 -6,18 C-18,16 -20,2 -16,-8 C-14,-13 -15,-15 -12,-18 Z";
const BLOBS = { A: BLOB_A, B: BLOB_B, C: BLOB_C };

const CONTINENTS = [
  { blob: "A", x: 72, y: 52, scale: 1.35, rot: -12 },
  { blob: "B", x: 122, y: 46, scale: 1.05, rot: 24 },
  { blob: "A", x: 140, y: 88, scale: 0.68, rot: 42 },
  { blob: "C", x: 58, y: 98, scale: 1.15, rot: -22 },
  { blob: "B", x: 76, y: 136, scale: 0.95, rot: 12 },
  { blob: "A", x: 126, y: 138, scale: 0.62, rot: -32 },
  { blob: "C", x: 100, y: 74, scale: 0.48, rot: 15 },
  { blob: "B", x: 44, y: 72, scale: 0.4, rot: 6 },
  { blob: "C", x: 152, y: 116, scale: 0.36, rot: -18 },
  { blob: "A", x: 96, y: 110, scale: 0.3, rot: 50 },
];

const CLOUD_CLUSTERS = [
  { x: 58, y: 44, scale: 1, rot: 10 },
  { x: 128, y: 66, scale: 1.2, rot: -18 },
  { x: 92, y: 128, scale: 1.3, rot: 8 },
  { x: 148, y: 140, scale: 0.8, rot: -10 },
  { x: 40, y: 108, scale: 0.85, rot: 20 },
  { x: 108, y: 40, scale: 0.7, rot: -5 },
];

const SMOKE_SOURCES = [
  { x: 78, y: 58 }, { x: 118, y: 100 }, { x: 62, y: 118 },
];

function CloudCluster({ x, y, scale, rot, fill, opacity }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale})`} opacity={opacity}>
      <ellipse cx="0" cy="0" rx="16" ry="7" fill={fill} />
      <ellipse cx="-9" cy="2" rx="9" ry="5" fill={fill} />
      <ellipse cx="9" cy="1" rx="10" ry="5.5" fill={fill} />
    </g>
  );
}

function SemiRealisticEarth({ id, stress = 0, thriving = false, size = 320, showStars = false }) {
  const t = thriving ? 0 : clamp(stress, 0, 1);

  const oceanDeep = thriving ? "#0E5C86" : lerp3("#0E5C86", "#3E5C50", "#5A3A2C", t);
  const oceanLit = thriving ? "#3FA6D8" : lerp3("#3FA6D8", "#6E8F72", "#8A5A42", t);
  const landColor = thriving ? "#3D8A38" : lerp3("#4C7A3D", "#8A7040", "#5C5248", t);
  const atmosphereColor = thriving ? "#7FE3AE" : lerp3("#5FBFEA", "#CFA35E", "#B5493A", t);
  const cloudOpacity = thriving ? 0.9 : lerp(0.82, 0.22, t);
  const smogOpacity = thriving ? 0 : t > 0.2 ? lerp(0, 0.62, (t - 0.2) / 0.8) : 0;
  const iceScale = thriving ? 1.18 : lerp(1, 0.18, clamp(t / 0.85, 0, 1));
  const meltOpacity = thriving ? 0 : t > 0.15 ? clamp(Math.min(t, 0.9 - t) * 1.4, 0, 0.55) : 0;
  const crackOpacity = thriving ? 0 : t > 0.5 ? lerp(0, 0.85, (t - 0.5) / 0.5) : 0;
  const smokeCount = thriving ? 0 : t > 0.15 ? Math.ceil(lerp(1, 3, (t - 0.15) / 0.85)) : 0;
  const pulseSpeed = thriving ? 4.2 : lerp(5, 2.4, t);
  const heatShimmer = !thriving && t > 0.78;

  const clip = `${id}-clip`, oceanGrad = `${id}-ocean`, glow = `${id}-glow`, soften = `${id}-soften`, shade = `${id}-shade`, spec = `${id}-spec`;

  return (
    <div style={{ width: size, height: size, position: "relative", animation: `breathe ${pulseSpeed}s ease-in-out infinite` }}>
      {showStars && (
        <div className="pointer-events-none absolute inset-[-30%] -z-10">
          {[...Array(24)].map((_, i) => {
            const sx = (i * 37) % 100, sy = (i * 53) % 100;
            return (
              <div key={i} className="absolute rounded-full bg-white" style={{
                left: `${sx}%`, top: `${sy}%`, width: i % 5 === 0 ? 2.5 : 1.4, height: i % 5 === 0 ? 2.5 : 1.4,
                opacity: 0.3 + (i % 4) * 0.15, animation: `twinkle ${3 + (i % 4)}s ease-in-out ${i * 0.2}s infinite`,
              }} />
            );
          })}
        </div>
      )}

      <svg viewBox="0 0 200 200" width={size} height={size} style={{ overflow: "visible" }}>
        <defs>
          <clipPath id={clip}><circle cx="100" cy="100" r="85" /></clipPath>
          <radialGradient id={oceanGrad} cx="34%" cy="30%" r="80%">
            <stop offset="0%" stopColor={oceanLit} />
            <stop offset="100%" stopColor={oceanDeep} />
          </radialGradient>
          <linearGradient id={shade} x1="10%" y1="0%" x2="95%" y2="100%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0" />
            <stop offset="55%" stopColor="#000000" stopOpacity="0" />
            <stop offset="100%" stopColor="#02121C" stopOpacity="0.55" />
          </linearGradient>
          <radialGradient id={spec} cx="30%" cy="24%" r="30%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={glow} cx="50%" cy="50%" r="50%">
            <stop offset="62%" stopColor={atmosphereColor} stopOpacity="0" />
            <stop offset="100%" stopColor={atmosphereColor} stopOpacity="0.65" />
          </radialGradient>
          <filter id={soften}><feGaussianBlur stdDeviation="1.1" /></filter>
        </defs>

        {/* atmospheric rim glow */}
        <circle cx="100" cy="100" r="98" fill={`url(#${glow})`} style={{ filter: "blur(5px)" }} />

        {/* ocean */}
        <circle cx="100" cy="100" r="85" fill={`url(#${oceanGrad})`} />

        {/* landmasses + cracks */}
        <g clipPath={`url(#${clip})`} style={{ transformOrigin: "100px 100px", animation: "rotateSlow 150s linear infinite" }}>
          {CONTINENTS.map((c, i) => (
            <g key={i} transform={`translate(${c.x} ${c.y}) rotate(${c.rot}) scale(${c.scale})`}>
              <path d={BLOBS[c.blob]} fill={landColor} opacity={0.96} />
            </g>
          ))}
          {crackOpacity > 0.03 && (
            <g stroke="#A85448" strokeWidth="1" opacity={crackOpacity} fill="none" strokeLinecap="round">
              <path d="M60,50 L72,62 L64,76 L80,84" />
              <path d="M122,44 L134,58 L128,72" />
              <path d="M54,116 L68,126 L60,141" />
              <path d="M96,102 L108,112 L100,124" />
            </g>
          )}
        </g>

        {/* smog swirls (rotate opposite to land for parallax) */}
        {smogOpacity > 0.02 && (
          <g clipPath={`url(#${clip})`} filter={`url(#${soften})`} style={{ transformOrigin: "100px 100px", animation: "rotateSlowReverse 95s linear infinite" }}>
            {CLOUD_CLUSTERS.map((c, i) => (
              <CloudCluster key={i} {...c} scale={c.scale * 1.15} fill="#332F28" opacity={smogOpacity} />
            ))}
          </g>
        )}

        {/* clouds */}
        <g clipPath={`url(#${clip})`} filter={`url(#${soften})`} style={{ transformOrigin: "100px 100px", animation: "rotateSlow 75s linear infinite" }}>
          {CLOUD_CLUSTERS.map((c, i) => (
            <CloudCluster key={i} {...c} fill="#FFFFFF" opacity={cloudOpacity} />
          ))}
        </g>

        {/* polar ice caps (fixed — not affected by planet rotation) */}
        <g clipPath={`url(#${clip})`}>
          <ellipse cx="100" cy="24" rx={34 * iceScale} ry={17 * iceScale} fill="#F3FAFC" opacity={0.95} />
          <ellipse cx="100" cy="176" rx={30 * iceScale} ry={15 * iceScale} fill="#F3FAFC" opacity={0.95} />
          {meltOpacity > 0.02 && (
            <>
              <ellipse cx="100" cy="24" rx={34 * iceScale + 6} ry={17 * iceScale + 5} fill="none" stroke="#8FD3E8" strokeWidth="2" opacity={meltOpacity} />
              <ellipse cx="100" cy="176" rx={30 * iceScale + 6} ry={15 * iceScale + 5} fill="none" stroke="#8FD3E8" strokeWidth="2" opacity={meltOpacity} />
            </>
          )}
        </g>

        {/* day/night shading + specular */}
        <circle cx="100" cy="100" r="85" fill={`url(#${shade})`} clipPath={`url(#${clip})`} />
        <circle cx="100" cy="100" r="85" fill={`url(#${spec})`} clipPath={`url(#${clip})`} style={{ mixBlendMode: "screen" }} />

        {/* rim highlight */}
        <circle cx="100" cy="100" r="85" fill="none" stroke="#FFFFFF" strokeOpacity="0.22" strokeWidth="1.3" />

        {/* heat shimmer at extreme stress */}
        {heatShimmer && (
          <g clipPath={`url(#${clip})`} opacity="0.25">
            <path d="M40,60 Q100,50 160,60" stroke="#FFD8A8" strokeWidth="1" fill="none" style={{ animation: "shimmer 2.5s ease-in-out infinite" }} />
            <path d="M40,110 Q100,100 160,110" stroke="#FFD8A8" strokeWidth="1" fill="none" style={{ animation: "shimmer 2.5s ease-in-out 0.5s infinite" }} />
          </g>
        )}

        {/* industrial smoke sources */}
        {SMOKE_SOURCES.slice(0, smokeCount).map((s, si) => (
          <g key={si}>
            {[0, 1, 2].map((pi) => (
              <circle key={pi} cx={s.x} cy={s.y} r={2}
                fill="#3A362E"
                style={{ animation: `riseFadeSmoke 3.2s ease-out ${si * 0.5 + pi * 0.9}s infinite` }} />
            ))}
          </g>
        ))}

        {/* thriving sparkles */}
        {thriving && [0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const px = 100 + 90 * Math.cos(rad), py = 100 + 90 * Math.sin(rad);
          return (
            <circle key={i} cx={px} cy={py} r={2.4} fill="#B7E88A"
              style={{ animation: `riseFadeSparkle 3.2s ease-out ${i * 0.35}s infinite` }} />
          );
        })}
      </svg>
    </div>
  );
}

/* ===========================================================
   Category meta + suggestion logic
=========================================================== */
const CATEGORY_META = {
  transport: {
    label: "Transport", icon: Car, color: "#C18C5D", vignette: TransportSolutionVignette,
    detail: [
      "Transport is often one of the most flexible parts of a footprint to shrink, because there are usually several ways to make the same trip. Swapping even a couple of car trips a week for transit, cycling, or walking adds up fast over a year.",
      "For longer distances, trains and buses typically produce a fraction of the emissions per passenger compared to flying or driving solo, especially on routes under a few hundred kilometers.",
      "Flights carry an outsized share of personal transport emissions per trip. Combining trips, choosing direct routes, or simply flying less often are some of the highest-leverage changes available in this category.",
    ],
  },
  home: {
    label: "Home energy", icon: Home, color: "#5D7052", vignette: HomeEnergySolutionVignette,
    detail: [
      "How a home is heated tends to matter more than almost any other single choice in this category. Moving away from gas or oil toward a heat pump or a renewable electricity tariff is usually the single biggest lever available.",
      "Beyond heating, small efficiency habits compound over a year: sealing drafts, lowering the thermostat a degree or two, and switching to LED lighting all chip away at the baseline load.",
      "Household size matters too — energy use is typically shared across everyone living in a space, so per-person impact naturally drops as a household grows, all else being equal.",
    ],
  },
  diet: {
    label: "Diet", icon: Utensils, color: "#8A9A5B", vignette: DietSolutionVignette,
    detail: [
      "Diet has an outsized effect on footprint relative to how much thought most people give it. Red meat and dairy tend to carry a much higher footprint per calorie than plant-based foods, largely due to land use and methane from livestock.",
      "You don't need an all-or-nothing shift — cutting back gradually, like a few extra plant-based meals a week, captures a meaningful share of the benefit without requiring a full diet overhaul.",
      "Food waste is a quieter contributor: food that's grown, transported, and then thrown away still carries its full footprint. Planning portions and using up what's already in the fridge helps on this front too.",
    ],
  },
  consumption: {
    label: "Shopping & goods", icon: ShoppingBag, color: "#78786C", vignette: ConsumptionSolutionVignette,
    detail: [
      "Almost everything we buy carries an embedded footprint from raw materials, manufacturing, and shipping — long before it reaches a shelf. Buying less, and choosing well when you do, addresses that upstream cost directly.",
      "Repairing something rather than replacing it, or buying secondhand, effectively spreads that embedded footprint over a longer useful life instead of starting the cycle over.",
      "Durability matters more than price alone: a well-made item used for years usually beats several cheaper replacements, both for your footprint and your wallet.",
    ],
  },
};

function buildSuggestions(results, form) {
  const dietIdx = form.diet ? DIET_ORDER.indexOf(form.diet) : -1;
  const dietPotential = dietIdx >= 0 && dietIdx < DIET_ORDER.length - 1
    ? DIET_FACTORS[form.diet].value - DIET_FACTORS[DIET_ORDER[dietIdx + 1]].value
    : 0;
  const dietTip = dietIdx < 0
    ? "Once you've logged a diet, we can suggest a lower-impact step."
    : dietIdx < DIET_ORDER.length - 1
    ? `Shift toward ${DIET_FACTORS[DIET_ORDER[dietIdx + 1]].label.toLowerCase()} — even a few meals a week moves the needle.`
    : "You're already at the lowest-impact diet tier. Nothing to change here.";

  const homePotential = form.heating && form.heating !== "renewable"
    ? (HEATING_FACTORS[form.heating].value - HEATING_FACTORS.renewable.value) / form.householdSize + results.home * 0.1
    : results.home * 0.12;
  const homeTip = form.heating && form.heating !== "renewable"
    ? "Ask your energy provider about a renewable tariff, or look into a heat pump — usually the single biggest lever."
    : "Your heating is already low-impact. A smart thermostat can trim the rest.";

  const transportPotential = results.transport * 0.28;
  const transportTip = "Replace a couple of car trips a week with transit, biking, or carpooling, and rethink one flight a year.";

  const consumptionPotential = results.consumption * 0.35;
  const consumptionTip = "Buy fewer, better things — repair before replacing, and choose secondhand when you can.";

  return [
    { key: "home", current: results.home, potential: Math.max(0, homePotential), tip: homeTip },
    { key: "transport", current: results.transport, potential: Math.max(0, transportPotential), tip: transportTip },
    { key: "diet", current: results.diet, potential: Math.max(0, dietPotential), tip: dietTip },
    { key: "consumption", current: results.consumption, potential: Math.max(0, consumptionPotential), tip: consumptionTip },
  ].sort((a, b) => b.potential - a.potential);
}

/* ===========================================================
   Climate-effects illustrations (original SVG vignettes)
=========================================================== */
function VignetteFrame({ children }) {
  return (
    <div className="relative h-36 w-full overflow-hidden rounded-2xl border border-[#DED8CF]/50">
      <svg viewBox="0 0 200 120" className="h-full w-full">{children}</svg>
    </div>
  );
}
function IceVignette() {
  return (
    <VignetteFrame>
      <rect x="0" y="0" width="200" height="120" fill="#BFE3F0" />
      <rect x="0" y="70" width="200" height="50" fill="#3E8FB0" />
      <path d="M40,70 L70,20 L100,70 Z" fill="#F3FAFC" />
      <path d="M70,20 L74,34 L64,32 Z" fill="#D8EEF5" opacity="0.8" />
      <circle cx="120" cy="50" r="4" fill="#8FD3E8" style={{ animation: "riseFadeSmoke 2.4s ease-in 0s infinite" }} />
      <circle cx="132" cy="55" r="3" fill="#8FD3E8" style={{ animation: "riseFadeSmoke 2.4s ease-in 0.7s infinite" }} />
      <path d="M0,72 Q100,66 200,72" stroke="#2A6E8C" strokeWidth="1" fill="none" strokeDasharray="4 3" opacity="0.6" />
    </VignetteFrame>
  );
}
function WildfireVignette() {
  return (
    <VignetteFrame>
      <rect x="0" y="0" width="200" height="120" fill="#F7D9A0" />
      <circle cx="165" cy="28" r="16" fill="#F2B84B" />
      <path d="M0,95 L40,60 L60,95 L90,55 L120,95 L150,65 L200,95 L200,120 L0,120 Z" fill="#2C2C24" />
      <path d="M55,95 C60,80 50,72 55,60 C60,72 68,78 62,95 Z" fill="#D9542F" style={{ animation: "flicker 1.6s ease-in-out infinite" }} />
      <path d="M100,95 C105,78 96,70 100,55 C106,70 114,76 108,95 Z" fill="#E8752E" style={{ animation: "flicker 1.3s ease-in-out 0.3s infinite" }} />
      <path d="M140,95 C144,82 137,75 140,64 C145,75 151,80 146,95 Z" fill="#D9542F" style={{ animation: "flicker 1.8s ease-in-out 0.6s infinite" }} />
    </VignetteFrame>
  );
}
function DroughtVignette() {
  return (
    <VignetteFrame>
      <rect x="0" y="0" width="200" height="120" fill="#F3E3C4" />
      <circle cx="160" cy="30" r="14" fill="#E8A23D" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <line key={a} x1="160" y1="30" x2={160 + 22 * Math.cos((a * Math.PI) / 180)} y2={30 + 22 * Math.sin((a * Math.PI) / 180)} stroke="#E8A23D" strokeWidth="2" />
      ))}
      <rect x="0" y="70" width="200" height="50" fill="#B98A56" />
      <g stroke="#8B6238" strokeWidth="1.3" fill="none">
        <path d="M20,80 L40,95 L30,118" /><path d="M40,95 L65,90 L70,118" />
        <path d="M90,75 L100,100 L85,118" /><path d="M100,100 L130,92 L140,118" />
        <path d="M150,80 L165,100 L155,118" /><path d="M165,100 L185,90" />
      </g>
      <path d="M55,70 C50,55 60,45 55,30" stroke="#8B6238" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.8" />
    </VignetteFrame>
  );
}
function StormVignette() {
  return (
    <VignetteFrame>
      <rect x="0" y="0" width="200" height="120" fill="#7A8A94" />
      <ellipse cx="70" cy="35" rx="46" ry="20" fill="#4A5259" style={{ animation: "sway 4s ease-in-out infinite" }} />
      <ellipse cx="140" cy="45" rx="40" ry="18" fill="#3A4147" style={{ animation: "sway 4.5s ease-in-out 0.4s infinite" }} />
      <path d="M110,55 L100,80 L112,80 L98,110" stroke="#F0D96A" strokeWidth="2.5" fill="none" strokeLinejoin="round" style={{ animation: "flicker 2.2s steps(1) infinite" }} />
      <g stroke="#C7D6DE" strokeWidth="1.4" opacity="0.7">
        <line x1="20" y1="80" x2="10" y2="105" /><line x1="45" y1="85" x2="35" y2="112" />
        <line x1="150" y1="85" x2="140" y2="112" /><line x1="175" y1="80" x2="165" y2="105" />
      </g>
    </VignetteFrame>
  );
}
function BiodiversityVignette() {
  return (
    <VignetteFrame>
      <rect x="0" y="0" width="200" height="120" fill="#E6DCCD" />
      <path d="M100,120 L100,40" stroke="#6B5A44" strokeWidth="4" />
      <path d="M100,60 L60,40" stroke="#6B5A44" strokeWidth="3" />
      <path d="M100,75 L140,55" stroke="#6B5A44" strokeWidth="3" />
      <ellipse cx="55" cy="35" rx="14" ry="9" fill="#8A7040" opacity="0.9" style={{ animation: "riseFadeSmoke 4s ease-in 0s infinite" }} />
      <ellipse cx="145" cy="50" rx="13" ry="8" fill="#5D7052" opacity="0.9" />
      <ellipse cx="95" cy="48" rx="12" ry="8" fill="#8A9A5B" opacity="0.5" />
    </VignetteFrame>
  );
}

/* ---- Solution vignettes (Your path forward) ---- */
function TransportSolutionVignette() {
  return (
    <VignetteFrame>
      <rect x="0" y="0" width="200" height="120" fill="#F3E9D8" />
      <rect x="0" y="88" width="200" height="32" fill="#C9BBA0" />
      <path d="M0,88 Q100,82 200,88" stroke="#B0A183" strokeWidth="1.5" fill="none" />
      {/* train */}
      <rect x="20" y="52" width="70" height="34" rx="8" fill="#5D7052" />
      <rect x="28" y="60" width="16" height="14" rx="2" fill="#EAF2E6" />
      <rect x="50" y="60" width="16" height="14" rx="2" fill="#EAF2E6" />
      <circle cx="34" cy="90" r="6" fill="#2C2C24" />
      <circle cx="76" cy="90" r="6" fill="#2C2C24" />
      {/* bike */}
      <circle cx="140" cy="90" r="14" fill="none" stroke="#C18C5D" strokeWidth="3" />
      <circle cx="172" cy="90" r="14" fill="none" stroke="#C18C5D" strokeWidth="3" />
      <path d="M140,90 L156,62 L172,90 M156,62 L150,90 M156,62 L165,70" stroke="#C18C5D" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="156" cy="58" r="5" fill="#8A9A5B" />
    </VignetteFrame>
  );
}
function HomeEnergySolutionVignette() {
  return (
    <VignetteFrame>
      <rect x="0" y="0" width="200" height="120" fill="#DCEBF2" />
      <circle cx="164" cy="26" r="15" fill="#F2C55C" />
      <rect x="0" y="86" width="200" height="34" fill="#8A9A5B" />
      <path d="M40,86 L90,44 L140,86 Z" fill="#5D7052" />
      <rect x="60" y="60" width="60" height="26" fill="#3E5C42" opacity="0.9" />
      {/* solar panel roof */}
      <g stroke="#2C2C24" strokeWidth="1" opacity="0.8">
        <rect x="44" y="70" width="42" height="15" fill="#274B63" transform="skewX(-4)" />
        <line x1="58" y1="70" x2="58" y2="85" /><line x1="72" y1="70" x2="72" y2="85" />
        <line x1="44" y1="77" x2="86" y2="77" />
      </g>
      <circle cx="103" cy="72" r="6" fill="#F0EBE5" />
      <path d="M103,60 L103,64 M92,66 L95,68 M114,66 L111,68" stroke="#F0EBE5" strokeWidth="2" strokeLinecap="round" />
    </VignetteFrame>
  );
}
function DietSolutionVignette() {
  return (
    <VignetteFrame>
      <rect x="0" y="0" width="200" height="120" fill="#F0EBE0" />
      <ellipse cx="100" cy="70" rx="58" ry="34" fill="#FEFEFA" stroke="#DED8CF" strokeWidth="2" />
      <ellipse cx="100" cy="70" rx="40" ry="22" fill="#F5F1E8" />
      <ellipse cx="80" cy="64" rx="12" ry="9" fill="#8A9A5B" />
      <ellipse cx="104" cy="60" rx="9" ry="7" fill="#5D7052" />
      <ellipse cx="118" cy="72" rx="10" ry="8" fill="#C18C5D" />
      <ellipse cx="92" cy="80" rx="11" ry="7" fill="#D9542F" opacity="0.85" />
      <ellipse cx="70" cy="78" rx="8" ry="6" fill="#E8A23D" />
      <rect x="24" y="94" width="20" height="4" rx="2" fill="#B0A183" />
      <rect x="156" y="94" width="20" height="4" rx="2" fill="#B0A183" />
    </VignetteFrame>
  );
}
function ConsumptionSolutionVignette() {
  return (
    <VignetteFrame>
      <rect x="0" y="0" width="200" height="120" fill="#EDE7DC" />
      <rect x="0" y="92" width="200" height="28" fill="#C9BBA0" />
      {/* shopping bag with heart / reuse symbol */}
      <path d="M64,50 L64,42 C64,32 76,32 76,42 L76,50" stroke="#78786C" strokeWidth="3" fill="none" strokeLinecap="round" />
      <rect x="52" y="50" width="36" height="38" rx="4" fill="#8A9A5B" />
      <path d="M64,64 C64,58 72,58 72,64 C72,68 68,70 68,74 C68,70 64,68 64,64 Z" fill="#FEFEFA" />
      {/* repair / arrows loop */}
      <g stroke="#C18C5D" strokeWidth="2.5" fill="none" strokeLinecap="round">
        <path d="M112,58 A20,20 0 1 1 108,76" />
        <path d="M108,68 L108,76 L116,76" />
      </g>
      <rect x="140" y="58" width="30" height="30" rx="4" fill="#5D7052" opacity="0.85" />
      <path d="M148,73 L153,78 L163,66" stroke="#FEFEFA" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </VignetteFrame>
  );
}

/* ===========================================================
   SITEWIDE AMBIENT LIFE — leaves/flowers drifting down from
   the top. They thin out and wither as the calculated
   footprint (stress) rises. Fixed, pointer-events-none, so
   they never block controls.
=========================================================== */
function FallingPiece({ x, delay, duration, size, color, centerColor, shape }) {
  return (
    <div
      className="absolute top-[-10%]"
      style={{ left: `${x}%`, animation: `leafFall ${duration}s linear ${delay}s infinite` }}
    >
      <svg width={size} height={size} viewBox="0 0 24 24">
        {shape === "flower" ? (
          <g>
            {[0, 72, 144, 216, 288].map((a) => {
              const px = 12 + Math.cos((a * Math.PI) / 180) * 5;
              const py = 12 + Math.sin((a * Math.PI) / 180) * 5;
              return <ellipse key={a} cx={px} cy={py} rx="4" ry="2.6" fill={color} transform={`rotate(${a} ${px} ${py})`} />;
            })}
            <circle cx="12" cy="12" r="2.4" fill={centerColor} />
          </g>
        ) : (
          <path d="M12 2C7 6 4 10 4 15a8 8 0 0016 0c0-5-3-9-8-13z" fill={color} />
        )}
      </svg>
    </div>
  );
}

function FallingFoliage({ stress }) {
  const t = clamp(stress, 0, 1);
  const color = lerp3("#8A9A5B", "#C18C5D", "#7A5540", t);
  const centerColor = lerp3("#E8C55C", "#D8AE55", "#9C8258", t);
  const count = Math.max(3, Math.round(lerp(9, 3, t)));

  const items = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        x: (i * 53 + 7) % 100,
        delay: (i * 2.6) % 18,
        duration: 17 + (i % 5) * 3,
        size: 10 + (i % 4) * 2,
        shape: i % 3 === 0 ? "flower" : "leaf",
      })),
    [count]
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-[15] overflow-hidden opacity-40" aria-hidden="true">
      {items.map((it, i) => (
        <FallingPiece key={i} x={it.x} delay={it.delay} duration={it.duration} size={it.size} color={color} centerColor={centerColor} shape={it.shape} />
      ))}
    </div>
  );
}

const CLIMATE_TOPICS = [
  { icon: Droplets, title: "Melting ice, rising seas", vignette: IceVignette,
    body: "Polar ice sheets and glaciers are losing mass, and warming oceans expand in volume — together pushing sea levels higher and threatening coastal communities.",
    detail: [
      "Ice sheets in Greenland and Antarctica, along with mountain glaciers worldwide, have been shrinking for decades as warmer air and ocean water erode them from above and below. That meltwater flows into the ocean and adds to its volume directly.",
      "At the same time, warmer seawater simply takes up more space — a process called thermal expansion — which on its own accounts for a large share of the sea-level rise measured so far.",
      "The combined effect is a slow but steady creep of the tideline. Low-lying coastal cities, river deltas, and small island nations face more frequent flooding, saltwater intrusion into farmland and drinking water, and in some cases the eventual loss of habitable land.",
    ] },
  { icon: Flame, title: "Hotter extremes, more wildfire", vignette: WildfireVignette,
    body: "Heatwaves are becoming more frequent, longer, and more intense, drying out landscapes and lengthening wildfire seasons in many regions.",
    detail: [
      "As average temperatures climb, the hottest days get hotter and heatwaves last longer. Vegetation and soil dry out faster under this extra heat, turning forests and grasslands into ready fuel.",
      "Longer, drier summers push back the start and end dates of wildfire season in many parts of the world, giving fires more months in which to ignite and spread. Once burning, hotter and drier conditions let them grow faster and burn more intensely.",
      "Beyond the direct damage to homes and ecosystems, wildfire smoke degrades air quality across huge distances, creating health risks for people who may live nowhere near the flames themselves.",
    ] },
  { icon: Sun, title: "Deeper droughts", vignette: DroughtVignette,
    body: "Shifting rainfall patterns are making droughts more severe in some regions, straining freshwater supplies, farming, and food security.",
    detail: [
      "A warmer atmosphere changes where and how rain falls. Some regions see rainfall become less frequent but more intense when it does arrive, while others see prolonged dry stretches with little relief.",
      "Higher temperatures also increase evaporation from soil, rivers, and reservoirs, so even normal rainfall may no longer be enough to keep water supplies stable.",
      "The knock-on effects reach farming, drinking water access, and hydropower generation, and can deepen existing inequalities in regions that already have limited water infrastructure.",
    ] },
  { icon: CloudLightning, title: "Fiercer storms", vignette: StormVignette,
    body: "A warmer atmosphere holds more moisture, contributing to heavier rainfall and more intense storm systems in many parts of the world.",
    detail: [
      "Warmer air can hold significantly more water vapor. When that moisture-laden air feeds into a storm system, it has more fuel to work with, which tends to produce heavier rainfall in a shorter amount of time.",
      "Warmer ocean surface temperatures also provide more energy to tropical storms and hurricanes, contributing to a greater share of storms that intensify rapidly.",
      "The practical result is more flash flooding, more infrastructure strain, and storm damage that can outpace what drainage systems and building codes were originally designed to handle.",
    ] },
  { icon: Trees, title: "Biodiversity under pressure", vignette: BiodiversityVignette,
    body: "As habitats shift and extreme events increase, many species face mounting pressure — with ripple effects through entire ecosystems.",
    detail: [
      "Species are adapted to fairly specific temperature and rainfall ranges. As those ranges shift faster than many plants and animals can migrate or adapt, populations come under stress or are pushed out of their historic ranges entirely.",
      "Extreme events — wildfire, drought, flooding, heatwaves — can wipe out local populations outright, and habitat fragmentation from human development makes it harder for species to relocate to more suitable areas.",
      "Because ecosystems are interconnected, the loss or decline of one species can ripple outward — affecting pollination, food chains, and the natural processes that keep soil, water, and air systems in balance.",
    ] },
];

/* ===========================================================
   Nav
=========================================================== */
function NavBar({ page, setPage }) {
  const items = [
    { id: "home", label: "Home", icon: Leaf },
    { id: "calculate", label: "Calculate", icon: Car },
    { id: "results", label: "Results", icon: TrendingDown },
    { id: "pathForward", label: "Path Forward", icon: Sparkles },
    { id: "climate", label: "Climate Effects", icon: Globe2 },
  ];
  return (
    <div className="sticky top-4 z-40 mx-auto mb-4 w-fit max-w-full px-2">
      <nav className="flex flex-wrap items-center justify-center gap-1 rounded-full border border-[#DED8CF]/50 bg-white/75 p-1.5 shadow-[0_4px_20px_-2px_rgba(93,112,82,0.1)] backdrop-blur-md">
        <div className="mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#5D7052]">
          <Leaf size={16} className="text-white" />
        </div>
        {items.map((it) => {
          const isActive =
            it.id === "climate"
              ? page === "climate" || page === "climateDetail"
              : it.id === "pathForward"
              ? page === "pathForward" || page === "pathForwardDetail"
              : page === it.id;
          return (
            <button
              key={it.id}
              onClick={() => setPage(it.id)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-300 ${
                isActive
                  ? "bg-[#5D7052]/12 text-[#2C2C24] shadow-[0_2px_12px_-1px_rgba(93,112,82,0.2)] ring-1 ring-inset ring-[#5D7052]/55"
                  : "text-[#4A4A40] hover:bg-[#5D7052]/10"
              }`}
            >
              <it.icon size={15} className="text-[#5D7052]" />
              {it.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

/* ===========================================================
   Pages
=========================================================== */
function HomePage({ setPage }) {
  return (
    <section className="animate-[fadeIn_0.6s_ease] py-10 text-center">
      <span className="inline-block rounded-full border border-[#DED8CF]/60 bg-white/60 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-[#5D7052]">
        A quiet five minutes
      </span>
      <h1 style={{ fontFamily: "'Fraunces', serif" }} className="mx-auto mt-6 max-w-xl text-5xl font-bold leading-[1.05] text-[#2C2C24] md:text-6xl">
        Know the weight you carry.
      </h1>
      <div className="mx-auto my-8 flex justify-center">
        <SemiRealisticEarth id="home-earth" stress={0} size={300} showStars />
      </div>
      <p className="mx-auto max-w-md text-lg text-[#4A4A40]">
        This is Earth at rest — nothing counted yet. Answer four short questions about how you get
        around, live, eat, and buy, and watch it respond as you go.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <button onClick={() => setPage("calculate")} className="inline-flex items-center gap-2 rounded-full bg-[#5D7052] px-10 py-4 text-base font-bold text-[#F3F4F1] shadow-[0_4px_20px_-2px_rgba(93,112,82,0.35)] transition-all duration-300 hover:scale-105 hover:shadow-[0_6px_24px_-4px_rgba(93,112,82,0.45)] active:scale-95">
          Start your calculation <ArrowRight size={18} />
        </button>
        <button onClick={() => setPage("climate")} className="inline-flex items-center gap-2 rounded-full border-2 border-[#C18C5D] px-8 py-4 text-base font-bold text-[#C18C5D] transition-all duration-300 hover:scale-105 hover:bg-[#C18C5D] hover:text-white active:scale-95">
          See what's at stake
        </button>
      </div>
      <p className="mt-4 text-xs text-[#78786C]">Estimates only — a simplified model for reflection, not a certified audit.</p>
    </section>
  );
}

const STEPS = ["transport", "home", "diet", "consumption"];

function CalculatePage({ form, set, step, setStep, liveStress, onBackHome, onFinish }) {
  const nextDisabled =
    (step === 1 && !form.heating) || (step === 2 && !form.diet) || (step === 3 && !form.spending);

  return (
    <section className="animate-[fadeIn_0.5s_ease]">
      <div className="relative overflow-hidden rounded-[2rem] rounded-tl-[4rem] border border-[#DED8CF]/60 bg-transparent p-8 shadow-[0_10px_40px_-10px_rgba(193,140,93,0.15)] sm:p-12">
        <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
          <SemiRealisticEarth id="calc-earth-bg" stress={liveStress} size={380} />
        </div>

        <div className="relative z-10">
        <div className="mb-10 flex items-center justify-center gap-3">
          {STEPS.map((s, i) => (
            <div key={s} className="h-3 rounded-full transition-all duration-500" style={{ width: i === step ? 32 : 12, background: i <= step ? "#5D7052" : "#E6DCCD" }} />
          ))}
        </div>

        {step === 0 && (
          <StepShell icon={Car} title="Getting around" subtitle="Your typical week of travel.">
            <div>
              <label className="glow-label mb-2 block text-sm font-semibold text-[#4A4A40]">Car travel per week</label>
              <Slider value={form.carKm} min={0} max={600} step={10} unit="km" onChange={set("carKm")} />
            </div>
            <div>
              <label className="glow-label mb-2 block text-sm font-semibold text-[#4A4A40]">Public transit per week</label>
              <Slider value={form.transitKm} min={0} max={300} step={5} unit="km" onChange={set("transitKm")} />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="glow-label mb-2 flex items-center gap-1.5 text-sm font-semibold text-[#4A4A40]"><Plane size={14} /> Short flights / yr</label>
                <Slider value={form.flightsShort} min={0} max={10} step={1} unit="" onChange={set("flightsShort")} />
              </div>
              <div>
                <label className="glow-label mb-2 flex items-center gap-1.5 text-sm font-semibold text-[#4A4A40]"><Plane size={14} /> Long flights / yr</label>
                <Slider value={form.flightsLong} min={0} max={6} step={1} unit="" onChange={set("flightsLong")} />
              </div>
            </div>
          </StepShell>
        )}

        {step === 1 && (
          <StepShell icon={Home} title="At home" subtitle="Your household's energy use.">
            <div>
              <label className="glow-label mb-2 block text-sm font-semibold text-[#4A4A40]">People in your household</label>
              <Slider value={form.householdSize} min={1} max={6} step={1} unit="people" onChange={set("householdSize")} />
            </div>
            <div>
              <label className="glow-label mb-2 flex items-center gap-1.5 text-sm font-semibold text-[#4A4A40]"><Zap size={14} /> Electricity per month</label>
              <Slider value={form.electricityKwh} min={0} max={1200} step={25} unit="kWh" onChange={set("electricityKwh")} />
            </div>
            <div>
              <label className="glow-label mb-3 block text-sm font-semibold text-[#4A4A40]">Primary heating</label>
              <div className="flex flex-wrap gap-2 sm:gap-2.5">
                {Object.entries(HEATING_FACTORS).map(([k, v]) => (
                  <Pill key={k} selected={form.heating === k} onClick={() => set("heating")(k)}>{v.label}</Pill>
                ))}
              </div>
              {!form.heating && <p className="glow-label mt-2 text-xs font-semibold text-[#C18C5D]">Choose one to continue.</p>}
            </div>
          </StepShell>
        )}

        {step === 2 && (
          <StepShell icon={Utensils} title="What you eat" subtitle="Diet has a bigger impact than most expect.">
            <div className="flex flex-wrap gap-2 sm:gap-2.5">
              {Object.entries(DIET_FACTORS).map(([k, v]) => (
                <Pill key={k} selected={form.diet === k} onClick={() => set("diet")(k)}>{v.label}</Pill>
              ))}
            </div>
            {!form.diet && <p className="glow-label mt-2 text-xs font-semibold text-[#C18C5D]">Choose one to continue.</p>}
          </StepShell>
        )}

        {step === 3 && (
          <StepShell icon={ShoppingBag} title="Shopping & goods" subtitle="Clothing, electronics, and everything else you buy new.">
            <div className="flex flex-wrap gap-2 sm:gap-2.5">
              {Object.entries(SPENDING_FACTORS).map(([k, v]) => (
                <Pill key={k} selected={form.spending === k} onClick={() => set("spending")(k)}>{v.label}</Pill>
              ))}
            </div>
            {!form.spending && <p className="glow-label mt-2 text-xs font-semibold text-[#C18C5D]">Choose one to continue.</p>}
          </StepShell>
        )}

        <div className="mt-12 flex items-center justify-between">
          <button onClick={() => (step === 0 ? onBackHome() : setStep((s) => s - 1))} className="flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold text-[#5D7052] transition hover:bg-[#5D7052]/10">
            <ArrowLeft size={16} /> Back
          </button>
          <button
            disabled={nextDisabled}
            onClick={() => (step === STEPS.length - 1 ? onFinish() : setStep((s) => s + 1))}
            className={`flex items-center gap-2 rounded-full px-8 py-3 text-sm font-bold text-[#F3F4F1] shadow-[0_4px_20px_-2px_rgba(93,112,82,0.25)] transition-all duration-300 active:scale-95 ${
              nextDisabled ? "cursor-not-allowed bg-[#5D7052]/40" : "bg-[#5D7052] hover:scale-105"
            }`}
          >
            {step === STEPS.length - 1 ? "See my results" : "Next"} <ArrowRight size={16} />
          </button>
        </div>
        </div>
      </div>
    </section>
  );
}

function ResultsPage({ calculated, results, form, liveStress, setPage, onReset }) {
  if (!calculated) {
    return (
      <section className="flex flex-col items-center py-16 text-center animate-[fadeIn_0.5s_ease]">
        <SemiRealisticEarth id="results-empty-earth" stress={0} size={220} />
        <h2 style={{ fontFamily: "'Fraunces', serif" }} className="mt-8 text-3xl font-bold text-[#2C2C24]">
          Nothing calculated yet
        </h2>
        <p className="mt-3 max-w-sm text-[#4A4A40]">Run the calculator first — it only takes a few minutes.</p>
        <button onClick={() => setPage("calculate")} className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#5D7052] px-8 py-3.5 text-sm font-bold text-[#F3F4F1] shadow-[0_4px_20px_-2px_rgba(93,112,82,0.3)] transition-all duration-300 hover:scale-105 active:scale-95">
          Go to calculator <ArrowRight size={16} />
        </button>
      </section>
    );
  }

  const sorted = Object.entries(results).filter(([k]) => k !== "total").sort((a, b) => b[1] - a[1]);
  const topCategory = sorted[0][0];
  let verdict = "well below the global average";
  if (results.total > GLOBAL_AVERAGE) verdict = "above the global average";
  else if (results.total > CLIMATE_TARGET) verdict = "below average, but above the 1.5°C pathway";

  const suggestions = buildSuggestions(results, form);
  const totalPotential = suggestions.reduce((s, x) => s + x.potential, 0);
  const projectedTotal = Math.max(0.3, results.total - totalPotential);
  const projectedStress = clamp(projectedTotal / 10, 0, 1);

  return (
    <div className="animate-[fadeIn_0.6s_ease]">
      {/* answer */}
      <section className="rounded-[2rem] rounded-tl-[4rem] border border-[#DED8CF]/50 bg-[#FEFEFA] p-8 shadow-[0_10px_40px_-10px_rgba(193,140,93,0.2)] sm:p-12">
        <div className="flex flex-col items-center text-center">
          <span className="rounded-full border border-[#DED8CF]/60 bg-white/60 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-[#78786C]">
            Your estimate
          </span>
          <div className="relative my-8 flex items-center justify-center">
            <SemiRealisticEarth id="results-earth" stress={liveStress} size={280} />
            <div className="absolute flex flex-col items-center rounded-2xl bg-black/25 px-6 py-3 backdrop-blur-sm">
              <span style={{ fontFamily: "'Fraunces', serif" }} className="text-4xl font-bold text-white">
                {results.total.toFixed(1)}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-white/90">tCO₂e / year</span>
            </div>
          </div>
          <p className="max-w-md text-[#4A4A40]">
            That's <span className="font-semibold text-[#2C2C24]">{verdict}</span> of roughly {GLOBAL_AVERAGE}t,
            with a widely-cited 1.5°C-aligned target near {CLIMATE_TARGET}t.
          </p>
        </div>

        <div className="mt-10 flex items-end justify-center gap-8 border-y border-[#DED8CF]/60 py-8 sm:gap-14">
          {[
            { label: "1.5°C target", value: CLIMATE_TARGET },
            { label: "Global average", value: GLOBAL_AVERAGE },
            { label: "You", value: results.total },
          ].map((r) => (
            <div key={r.label} className="flex flex-col items-center gap-2">
              <SemiRealisticEarth id={`bench-${r.label.replace(/\s/g, "")}`} stress={clamp(r.value / 10, 0, 1)} size={68} />
              <span className="font-mono text-xs text-[#78786C]">{r.value.toFixed(1)}t</span>
              <span className="text-xs font-semibold text-[#4A4A40]">{r.label}</span>
            </div>
          ))}
        </div>

        <div className="mt-10 space-y-5">
          <h4 style={{ fontFamily: "'Fraunces', serif" }} className="text-xl font-semibold text-[#2C2C24]">Where it comes from</h4>
          {sorted.map(([key, value]) => {
            const meta = CATEGORY_META[key];
            const pct = results.total > 0 ? Math.round((value / results.total) * 100) : 0;
            return (
              <div key={key}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-semibold text-[#2C2C24]">
                    <meta.icon size={16} style={{ color: meta.color }} /> {meta.label}
                  </span>
                  <span className="font-mono text-[#78786C]">{value.toFixed(1)}t · {pct}%</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-[#F0EBE5]">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: meta.color }} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 rounded-[2rem] rounded-tl-[3.5rem] border border-[#DED8CF]/50 bg-white p-7 shadow-[0_4px_20px_-2px_rgba(93,112,82,0.15)]">
          <div className="mb-3 flex items-center gap-2">
            <Leaf size={20} className="text-[#5D7052]" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#5D7052]">
              Biggest opportunity: {CATEGORY_META[topCategory].label}
            </span>
          </div>
          <p className="text-[#4A4A40]">{suggestions.find((s) => s.key === topCategory)?.tip}</p>
        </div>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <button
            onClick={() => setPage("pathForward")}
            className="flex items-center gap-2 rounded-full bg-[#5D7052] px-8 py-3.5 text-sm font-bold text-[#F3F4F1] shadow-[0_4px_20px_-2px_rgba(93,112,82,0.3)] transition-all duration-300 hover:scale-105 active:scale-95"
          >
            Your path forward <ArrowRight size={16} />
          </button>
          <button onClick={onReset} className="flex items-center gap-2 rounded-full border-2 border-[#C18C5D] px-8 py-3 text-sm font-bold text-[#C18C5D] transition-all duration-300 hover:scale-105 hover:bg-[#C18C5D] hover:text-white">
            <RotateCcw size={16} /> Recalculate
          </button>
        </div>
      </section>
    </div>
  );
}

function PathForwardPage({ results, form, liveStress, setPage, onReset, onSelectCategory }) {
  const suggestions = buildSuggestions(results, form);
  const totalPotential = suggestions.reduce((s, x) => s + x.potential, 0);
  const projectedTotal = Math.max(0.3, results.total - totalPotential);
  const projectedStress = clamp(projectedTotal / 10, 0, 1);

  return (
    <div className="animate-[fadeIn_0.6s_ease]">
      <button
        onClick={() => setPage("results")}
        className="mb-6 flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-[#5D7052] transition hover:bg-[#5D7052]/10"
      >
        <ArrowLeft size={16} /> Back to your results
      </button>

      <div className="mb-8 flex w-full items-center justify-center">
        <SemiRealisticEarth id="pathforward-earth" stress={liveStress} size={220} />
      </div>

      <section className="rounded-[2rem] rounded-tr-[4rem] border border-[#DED8CF]/50 bg-[#F0EBE5]/60 p-8 shadow-[0_4px_20px_-2px_rgba(93,112,82,0.1)] sm:p-12">
        <div className="text-center">
          <span className="rounded-full border border-[#5D7052]/30 bg-[#5D7052]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-[#5D7052]">
            Your path forward
          </span>
          <h2 style={{ fontFamily: "'Fraunces', serif" }} className="mx-auto mt-5 max-w-lg text-3xl font-bold text-[#2C2C24] md:text-4xl">
            What actually moves your number
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[#4A4A40]">
            Ranked by where you have the most real leverage — based on your own answers. Tap a card for the full picture.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {suggestions.map((s) => {
            const meta = CATEGORY_META[s.key];
            return (
              <button
                key={s.key}
                onClick={() => onSelectCategory(s.key)}
                className="group cursor-pointer rounded-[1.5rem] border border-[#DED8CF]/60 bg-[#FEFEFA] p-6 text-left shadow-[0_4px_20px_-2px_rgba(93,112,82,0.08)] transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.02] hover:border-[#5D7052]/40 hover:shadow-[0_20px_40px_-10px_rgba(93,112,82,0.22)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#5D7052]"
              >
                <meta.vignette />
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2.5 font-semibold text-[#2C2C24]">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${meta.color}1A` }}>
                      <meta.icon size={18} style={{ color: meta.color }} />
                    </span>
                    {meta.label}
                  </span>
                  <ArrowRight size={16} className="shrink-0 text-[#5D7052] opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100" />
                </div>
                {s.potential > 0.05 && (
                  <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-[#5D7052]/10 px-3 py-1 text-xs font-bold text-[#5D7052]">
                    <TrendingDown size={13} /> up to −{s.potential.toFixed(1)}t/yr
                  </span>
                )}
                <p className="mt-3 text-sm text-[#4A4A40]">{s.tip}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-12 flex flex-col items-center justify-center gap-6 border-y border-[#DED8CF]/60 py-10 sm:flex-row sm:gap-16">
          <div className="flex flex-col items-center gap-2">
            <SemiRealisticEarth id="proj-now" stress={liveStress} size={100} />
            <span className="font-mono text-sm text-[#78786C]">{results.total.toFixed(1)}t now</span>
          </div>
          <ArrowRight className="rotate-90 text-[#78786C] sm:rotate-0" size={22} />
          <div className="flex flex-col items-center gap-2">
            <SemiRealisticEarth id="proj-then" stress={projectedStress} size={100} />
            <span className="font-mono text-sm text-[#5D7052]">{projectedTotal.toFixed(1)}t if you act</span>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center text-center">
          <SemiRealisticEarth id="thriving-earth" thriving size={230} showStars />
          <div className="mt-4 flex items-center gap-2">
            <Sparkles size={18} className="text-[#5D7052]" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#5D7052]">A lighter footprint, within reach</span>
            <Sparkles size={18} className="text-[#5D7052]" />
          </div>
          <p style={{ fontFamily: "'Fraunces', serif" }} className="mx-auto mt-5 max-w-lg text-2xl font-semibold leading-snug text-[#2C2C24]">
            The planet doesn't need one person to be perfect —
            it needs all of us to be a little better.
          </p>
          <p className="mx-auto mt-3 max-w-md text-sm text-[#78786C]">
            Every tonne you don't emit is one the earth never has to carry. Start with the one change above that feels easiest.
          </p>
        </div>

        <div className="mt-10 flex justify-center">
          <button onClick={onReset} className="flex items-center gap-2 rounded-full border-2 border-[#C18C5D] px-8 py-3 text-sm font-bold text-[#C18C5D] transition-all duration-300 hover:scale-105 hover:bg-[#C18C5D] hover:text-white">
            <RotateCcw size={16} /> Recalculate
          </button>
        </div>
      </section>
    </div>
  );
}

function PathForwardDetailPage({ categoryKey, results, form, onBack }) {
  if (!categoryKey) return null;
  const meta = CATEGORY_META[categoryKey];
  const suggestions = buildSuggestions(results, form);
  const s = suggestions.find((x) => x.key === categoryKey);

  return (
    <section className="animate-[fadeIn_0.5s_ease] py-6">
      <button
        onClick={onBack}
        className="mb-8 flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-[#5D7052] transition hover:bg-[#5D7052]/10"
      >
        <ArrowLeft size={16} /> Back to your path forward
      </button>

      <div className="flex flex-col items-center text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: `${meta.color}1A` }}>
          <meta.icon size={30} style={{ color: meta.color }} />
        </span>
        <h1 style={{ fontFamily: "'Fraunces', serif" }} className="mx-auto mt-5 text-3xl font-bold text-[#2C2C24] md:text-4xl">
          {meta.label}
        </h1>
        {s && s.potential > 0.05 && (
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#5D7052]/10 px-4 py-1.5 text-sm font-bold text-[#5D7052]">
            <TrendingDown size={15} /> up to −{s.potential.toFixed(1)}t/yr if you act here
          </span>
        )}
      </div>

      <div className="mx-auto mt-10 max-w-2xl">
        <meta.vignette />
        {s && (
          <div className="mt-6 rounded-[1.5rem] border border-[#DED8CF]/50 bg-white p-6 shadow-[0_4px_20px_-2px_rgba(93,112,82,0.1)]">
            <div className="mb-2 flex items-center gap-2">
              <Leaf size={16} className="text-[#5D7052]" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#5D7052]">Based on your answers</span>
            </div>
            <p className="text-[#4A4A40]">{s.tip}</p>
          </div>
        )}
        <div className="mt-8 space-y-5">
          {meta.detail.map((para, i) => (
            <p key={i} className="text-[#4A4A40] leading-relaxed">{para}</p>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-12 flex max-w-2xl flex-col items-center gap-4 rounded-[1.75rem] border border-[#DED8CF]/50 bg-[#F0EBE5]/60 p-7 text-center sm:flex-row sm:justify-between sm:text-left">
        <p className="text-sm text-[#4A4A40]">See how this fits with the rest of your footprint.</p>
        <button
          onClick={onBack}
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#5D7052] px-6 py-2.5 text-sm font-bold text-[#F3F4F1] shadow-[0_4px_20px_-2px_rgba(93,112,82,0.3)] transition-all duration-300 hover:scale-105 active:scale-95"
        >
          See other opportunities <ArrowRight size={15} />
        </button>
      </div>
    </section>
  );
}

function ClimatePage({ setPage, onSelectTopic }) {
  return (
    <section className="animate-[fadeIn_0.5s_ease] py-6">
      <div className="flex flex-col items-center text-center">
        <SemiRealisticEarth id="climate-earth" stress={0.82} size={240} />
        <span className="mt-6 inline-block rounded-full border border-[#DED8CF]/60 bg-white/60 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-[#A85448]">
          Where we're headed
        </span>
        <h1 style={{ fontFamily: "'Fraunces', serif" }} className="mx-auto mt-5 max-w-xl text-4xl font-bold text-[#2C2C24] md:text-5xl">
          What rising emissions actually do
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-[#4A4A40]">
          Every category in your calculator connects to something bigger. Tap a card for the full picture.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {CLIMATE_TOPICS.map((topic, i) => (
          <button
            key={topic.title}
            onClick={() => onSelectTopic(i)}
            className="group cursor-pointer rounded-[1.75rem] border border-[#DED8CF]/50 bg-[#FEFEFA] p-6 text-left shadow-[0_4px_20px_-2px_rgba(93,112,82,0.1)] transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.02] hover:border-[#5D7052]/40 hover:shadow-[0_20px_40px_-10px_rgba(93,112,82,0.28)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#5D7052]"
          >
            <topic.vignette />
            <div className="mt-4 flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                <topic.icon size={18} className="text-[#A85448]" />
                <h3 style={{ fontFamily: "'Fraunces', serif" }} className="text-lg font-semibold text-[#2C2C24]">{topic.title}</h3>
              </div>
              <ArrowRight size={16} className="shrink-0 text-[#5D7052] opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100" />
            </div>
            <p className="mt-2 text-sm leading-relaxed text-[#4A4A40]">{topic.body}</p>
          </button>
        ))}
      </div>

      <div className="mt-14 flex flex-col items-center text-center">
        <Globe2 size={28} className="text-[#5D7052]" />
        <p className="mx-auto mt-3 max-w-md text-[#4A4A40]">
          None of this is fixed. Your everyday choices — transport, energy, food, and consumption — are exactly the levers that bend the curve.
        </p>
        <button onClick={() => setPage("calculate")} className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#5D7052] px-9 py-3.5 text-sm font-bold text-[#F3F4F1] shadow-[0_4px_20px_-2px_rgba(93,112,82,0.3)] transition-all duration-300 hover:scale-105 active:scale-95">
          Calculate your own impact <ArrowRight size={16} />
        </button>
      </div>
    </section>
  );
}

function ClimateDetailPage({ topic, onBack }) {
  if (!topic) return null;
  const stressByTitle = {
    "Melting ice, rising seas": 0.62,
    "Hotter extremes, more wildfire": 0.78,
    "Deeper droughts": 0.7,
    "Fiercer storms": 0.74,
    "Biodiversity under pressure": 0.68,
  };
  return (
    <section className="animate-[fadeIn_0.5s_ease] py-6">
      <button
        onClick={onBack}
        className="mb-8 flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-[#5D7052] transition hover:bg-[#5D7052]/10"
      >
        <ArrowLeft size={16} /> Back to climate effects
      </button>

      <div className="flex flex-col items-center text-center">
        <SemiRealisticEarth id={`detail-${topic.title.replace(/\s/g, "")}`} stress={stressByTitle[topic.title] ?? 0.7} size={220} />
        <div className="mt-6 flex items-center gap-2.5">
          <topic.icon size={22} className="text-[#A85448]" />
          <h1 style={{ fontFamily: "'Fraunces', serif" }} className="text-3xl font-bold text-[#2C2C24] md:text-4xl">
            {topic.title}
          </h1>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-2xl">
        <topic.vignette />
        <div className="mt-8 space-y-5">
          {topic.detail.map((para, i) => (
            <p key={i} className="text-[#4A4A40] leading-relaxed">{para}</p>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-12 flex max-w-2xl flex-col items-center gap-4 rounded-[1.75rem] border border-[#DED8CF]/50 bg-[#F0EBE5]/60 p-7 text-center sm:flex-row sm:justify-between sm:text-left">
        <p className="text-sm text-[#4A4A40]">Curious how your own footprint contributes to this?</p>
        <button
          onClick={onBack}
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#5D7052] px-6 py-2.5 text-sm font-bold text-[#F3F4F1] shadow-[0_4px_20px_-2px_rgba(93,112,82,0.3)] transition-all duration-300 hover:scale-105 active:scale-95"
        >
          See other effects <ArrowRight size={15} />
        </button>
      </div>
    </section>
  );
}

/* ===========================================================
   Root app
=========================================================== */
const EMPTY_FORM = {
  carKm: 0, flightsShort: 0, flightsLong: 0, transitKm: 0,
  householdSize: 1, electricityKwh: 0, heating: null,
  diet: null, spending: null,
};

export default function CarbonFootprintCalculator() {
  const [page, setPage] = useState("home");
  const [step, setStep] = useState(0);
  const [calculated, setCalculated] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [climateTopicIndex, setClimateTopicIndex] = useState(null);
  const [pathForwardCategory, setPathForwardCategory] = useState(null);

  const results = useMemo(() => calculateFootprint(form), [form]);
  const liveStress = clamp(results.total / 10, 0, 1);
  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [page, climateTopicIndex, pathForwardCategory]);

  const reset = () => {
    setForm(EMPTY_FORM);
    setCalculated(false);
    setStep(0);
    setPage("calculate");
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#FDFCF8] text-[#2C2C24]" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <style>{`
        ${FONT_IMPORT}
        @keyframes fadeIn { from { opacity:0; transform: translateY(8px);} to {opacity:1; transform:none;} }
        @keyframes breathe { 0%,100% { transform: scale(1); } 50% { transform: scale(1.03); } }
        @keyframes rotateSlow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes rotateSlowReverse { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        @keyframes twinkle { 0%,100% { opacity:0.2; } 50% { opacity:0.9; } }
        @keyframes flicker { 0%,100% { opacity:1; transform:scaleY(1);} 50% { opacity:0.75; transform:scaleY(0.92);} }
        @keyframes sway { 0%,100% { transform: translateX(0); } 50% { transform: translateX(6px); } }
        @keyframes shimmer { 0%,100% { opacity:0.15; } 50% { opacity:0.4; } }
        @keyframes riseFadeSmoke {
          0% { transform: translateY(0) scale(0.6); opacity:0; }
          15% { opacity:0.65; }
          100% { transform: translateY(-22px) scale(1.6); opacity:0; }
        }
        @keyframes riseFadeSparkle {
          0% { transform: translateY(0) translateX(0) scale(0.4); opacity:0; }
          20% { opacity:1; }
          100% { transform: translateY(-60px) translateX(8px) scale(1); opacity:0; }
        }
        @keyframes leafFall {
          0% { transform: translateY(-10vh) translateX(0) rotate(0deg); opacity:0; }
          10% { opacity:0.55; }
          50% { transform: translateY(50vh) translateX(24px) rotate(160deg); }
          90% { opacity:0.55; }
          100% { transform: translateY(112vh) translateX(-16px) rotate(320deg); opacity:0; }
        }
        .glow-label { text-shadow: 0 1px 3px rgba(255,255,255,0.95), 0 1px 10px rgba(255,255,255,0.85); }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance:none; appearance:none;
          width:20px;height:20px;border-radius:50%;
          background:#5D7052; border:3px solid white;
          box-shadow:0 2px 8px rgba(93,112,82,0.4); cursor:pointer;
        }
      `}</style>

      <div className="pointer-events-none fixed inset-0 z-30 opacity-[0.035] mix-blend-multiply" style={{ backgroundImage: NOISE_BG }} />
      <div className="pointer-events-none absolute -top-32 -left-20 h-[420px] w-[420px] rounded-full opacity-20 blur-3xl" style={{ background: "#C18C5D" }} />
      <div className="pointer-events-none absolute top-40 -right-32 h-[500px] w-[500px] rounded-full opacity-15 blur-3xl" style={{ background: "#5D7052" }} />

      <FallingFoliage stress={liveStress} />

      <NavBar page={page} setPage={setPage} />

      <main className="relative z-10 mx-auto max-w-3xl px-4 pb-32 pt-6 sm:px-6">
        {page === "home" && <HomePage setPage={setPage} />}
        {page === "calculate" && (
          <CalculatePage
            form={form} set={set} step={step} setStep={setStep} liveStress={liveStress}
            onBackHome={() => setPage("home")}
            onFinish={() => { setCalculated(true); setPage("results"); }}
          />
        )}
        {page === "results" && (
          <ResultsPage
            calculated={calculated} results={results} form={form} liveStress={liveStress}
            setPage={setPage} onReset={reset}
          />
        )}
        {page === "pathForward" && (
          calculated ? (
            <PathForwardPage
              results={results} form={form} liveStress={liveStress}
              setPage={setPage} onReset={reset}
              onSelectCategory={(key) => { setPathForwardCategory(key); setPage("pathForwardDetail"); }}
            />
          ) : (
            <ResultsPage
              calculated={calculated} results={results} form={form} liveStress={liveStress}
              setPage={setPage} onReset={reset}
            />
          )
        )}
        {page === "pathForwardDetail" && (
          <PathForwardDetailPage
            categoryKey={pathForwardCategory}
            results={results} form={form}
            onBack={() => setPage("pathForward")}
          />
        )}
        {page === "climate" && (
          <ClimatePage
            setPage={setPage}
            onSelectTopic={(i) => { setClimateTopicIndex(i); setPage("climateDetail"); }}
          />
        )}
        {page === "climateDetail" && (
          <ClimateDetailPage
            topic={climateTopicIndex !== null ? CLIMATE_TOPICS[climateTopicIndex] : null}
            onBack={() => setPage("climate")}
          />
        )}
      </main>

      <footer className="relative z-10 pb-10 text-center text-xs text-[#78786C]">
        Groundwork · estimates are simplified and for personal reflection, not scientific reporting.
      </footer>
    </div>
  );
}
