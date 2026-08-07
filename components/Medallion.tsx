// Aboriginal-dot-art-inspired medallions, generated as pure SVG.
// Concentric rings of painted dots, solid rings and radiating ticks in the
// site's earth palette — original artwork, no sourced imagery.

const BLACK = "#241a0e";
const TERRA = "#b4451c";
const RUST = "#8a2f1a";
const OCHRE = "#dda032";
const GOLD = "#9c731a";
const ORANGE = "#e07020";
const CREAM = "#f2e7d3";

// Round trig output so server and client render byte-identical SVG
// (unrounded floats serialize differently across JS engines → hydration noise)
const rnd = (x: number) => Math.round(x * 1000) / 1000;

type Spec =
  | { t: "disc"; r: number; fill: string }
  | { t: "ring"; r: number; w: number; color: string }
  | { t: "dots"; r: number; n: number; dr: number; fill: string; off?: number }
  | { t: "ticks"; r: number; n: number; len: number; w: number; color: string };

const VARIANTS: Spec[][] = [
  // 0 — classic target: cream dots on a black band, tick halo
  [
    { t: "disc", r: 9, fill: TERRA },
    { t: "ring", r: 14, w: 3, color: BLACK },
    { t: "dots", r: 20, n: 16, dr: 2.3, fill: GOLD },
    { t: "ring", r: 26.5, w: 6, color: BLACK },
    { t: "dots", r: 26.5, n: 18, dr: 2, fill: CREAM },
    { t: "ticks", r: 33, n: 24, len: 6, w: 2.4, color: TERRA },
    { t: "dots", r: 43, n: 26, dr: 2, fill: BLACK },
  ],
  // 1 — sun: ochre core, long black rays
  [
    { t: "disc", r: 10, fill: OCHRE },
    { t: "dots", r: 16, n: 12, dr: 2.6, fill: BLACK },
    { t: "ring", r: 22, w: 4, color: TERRA },
    { t: "dots", r: 28, n: 20, dr: 2.2, fill: RUST },
    { t: "ticks", r: 34, n: 16, len: 9, w: 3, color: BLACK },
  ],
  // 2 — bloom: petal dots growing outward
  [
    { t: "disc", r: 6, fill: BLACK },
    { t: "dots", r: 11, n: 8, dr: 2.8, fill: ORANGE },
    { t: "dots", r: 18, n: 12, dr: 3.2, fill: TERRA },
    { t: "dots", r: 26, n: 16, dr: 3.6, fill: BLACK },
    { t: "dots", r: 35, n: 20, dr: 4, fill: OCHRE },
  ],
  // 3 — ringed: banded core with a fine tick fringe
  [
    { t: "disc", r: 8, fill: RUST },
    { t: "ring", r: 12.5, w: 3, color: OCHRE },
    { t: "ring", r: 17.5, w: 3, color: BLACK },
    { t: "dots", r: 24, n: 22, dr: 2.2, fill: TERRA },
    { t: "ring", r: 30, w: 2.5, color: BLACK },
    { t: "ticks", r: 34, n: 30, len: 5, w: 2, color: GOLD },
  ],
  // 4 — orbit: alternating offset dot rings
  [
    { t: "disc", r: 3, fill: BLACK },
    { t: "dots", r: 7, n: 6, dr: 2, fill: BLACK },
    { t: "ring", r: 13, w: 5, color: ORANGE },
    { t: "dots", r: 20, n: 14, dr: 2.6, fill: BLACK },
    { t: "dots", r: 27, n: 14, dr: 3.4, fill: OCHRE, off: Math.PI / 14 },
    { t: "ring", r: 33, w: 2, color: RUST },
    { t: "dots", r: 40, n: 30, dr: 1.8, fill: BLACK },
  ],
  // 5 — spark: cream dots on terracotta, short black rays
  [
    { t: "disc", r: 7, fill: BLACK },
    { t: "ring", r: 13, w: 6, color: TERRA },
    { t: "dots", r: 13, n: 10, dr: 2.2, fill: CREAM },
    { t: "ticks", r: 20, n: 12, len: 5, w: 2.6, color: BLACK },
    { t: "dots", r: 29, n: 18, dr: 2.4, fill: TERRA },
    { t: "dots", r: 36, n: 22, dr: 2, fill: GOLD },
  ],
];

function Ring({
  spec,
  idx,
  map,
}: {
  spec: Spec;
  idx: number;
  map: (c: string) => string;
}) {
  switch (spec.t) {
    case "disc":
      return <circle key={idx} r={spec.r} fill={map(spec.fill)} />;
    case "ring":
      return (
        <circle key={idx} r={spec.r} fill="none" stroke={map(spec.color)} strokeWidth={spec.w} />
      );
    case "dots": {
      const dots = [];
      for (let i = 0; i < spec.n; i++) {
        const a = (i / spec.n) * Math.PI * 2 + (spec.off ?? 0);
        dots.push(
          <circle
            key={i}
            cx={rnd(Math.cos(a) * spec.r)}
            cy={rnd(Math.sin(a) * spec.r)}
            r={spec.dr}
            fill={map(spec.fill)}
          />
        );
      }
      return <g key={idx}>{dots}</g>;
    }
    case "ticks": {
      const ticks = [];
      for (let i = 0; i < spec.n; i++) {
        const deg = rnd((i / spec.n) * 360);
        ticks.push(
          <line
            key={i}
            y1={-spec.r}
            y2={-(spec.r + spec.len)}
            stroke={map(spec.color)}
            strokeWidth={spec.w}
            strokeLinecap="round"
            transform={`rotate(${deg})`}
          />
        );
      }
      return <g key={idx}>{ticks}</g>;
    }
  }
}

export default function Medallion({
  variant = 0,
  size = 48,
  className = "",
  onDark = false,
}: {
  variant?: number;
  size?: number;
  className?: string;
  /** Swap black elements for cream so the artwork reads on dark grounds */
  onDark?: boolean;
}) {
  const specs = VARIANTS[variant % VARIANTS.length];
  const map = (c: string) => (onDark && c === BLACK ? CREAM : c);
  return (
    <svg
      width={size}
      height={size}
      viewBox="-50 -50 100 100"
      className={className}
      aria-hidden
    >
      <g>
        {specs.map((spec, i) => (
          <Ring key={i} spec={spec} idx={i} map={map} />
        ))}
      </g>
    </svg>
  );
}

// Dots wound along an Archimedean spiral — the classic Aboriginal spiral
// motif. The centre stays empty (r0) so a product shot can sit inside it.
export function DotSpiral({
  size = 380,
  turns = 3,
  r0 = 27,
  r1 = 46,
  className = "",
}: {
  size?: number;
  turns?: number;
  r0?: number;
  r1?: number;
  className?: string;
}) {
  const palette = [TERRA, OCHRE, RUST, GOLD];
  const steps = 150;
  const dots = [];
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const theta = t * turns * Math.PI * 2;
    const r = r0 + (r1 - r0) * t;
    dots.push(
      <circle
        key={i}
        cx={rnd(Math.cos(theta) * r)}
        cy={rnd(Math.sin(theta) * r)}
        r={rnd(1.5 + 1.1 * t)}
        fill={palette[i % palette.length]}
        opacity={0.9}
      />
    );
  }
  return (
    <svg width={size} height={size} viewBox="-50 -50 100 100" className={className} aria-hidden>
      {dots}
    </svg>
  );
}

// A centred trio of medallions used as a section divider
export function MedallionDivider() {
  return (
    <div className="flex items-center justify-center gap-7 py-2" aria-hidden>
      <Medallion variant={1} size={30} className="opacity-80" />
      <Medallion variant={0} size={48} />
      <Medallion variant={3} size={30} className="opacity-80" />
    </div>
  );
}
