// The Aussie Vape House logo mark, recreated as procedural SVG from the
// approved design: concentric Aboriginal-style dot rings with an outlined
// vape device at the centre. Deterministic output (rounded coords) so
// server and client render byte-identically.

const CHAR = "#241a0e";
const TERRA = "#b4451c";
const RUST = "#8a2f1a";
const OCHRE = "#dda032";
const ORANGE = "#cf5f24";

const rnd = (x: number) => Math.round(x * 1000) / 1000;

type Ring = {
  r: number;
  n: number;
  dr: number;
  color: string;
  /** keep only dots whose |cos angle| exceeds this (side dots) */
  sideOnly?: number;
};

const RINGS: Ring[] = [
  { r: 47, n: 56, dr: 1.5, color: CHAR },
  { r: 43.5, n: 40, dr: 2.6, color: TERRA },
  { r: 39.5, n: 44, dr: 1.7, color: RUST },
  { r: 36, n: 32, dr: 2.7, color: OCHRE },
  { r: 32.5, n: 40, dr: 1.5, color: CHAR },
  { r: 29, n: 26, dr: 2.9, color: ORANGE },
  { r: 25.5, n: 32, dr: 1.5, color: RUST },
  { r: 22, n: 22, dr: 2.4, color: OCHRE },
  { r: 18.5, n: 26, dr: 1.3, color: CHAR },
  { r: 15, n: 18, dr: 1.2, color: TERRA, sideOnly: 0.4 },
];

export function logoDots(): { cx: number; cy: number; r: number; fill: string }[] {
  const dots: { cx: number; cy: number; r: number; fill: string }[] = [];
  for (const ring of RINGS) {
    for (let i = 0; i < ring.n; i++) {
      const a = (i / ring.n) * Math.PI * 2 - Math.PI / 2;
      if (ring.sideOnly && Math.abs(Math.cos(a)) < ring.sideOnly) continue;
      dots.push({
        cx: rnd(Math.cos(a) * ring.r),
        cy: rnd(Math.sin(a) * ring.r),
        r: ring.dr,
        fill: ring.color,
      });
    }
  }
  return dots;
}

export default function LogoMark({
  size = 44,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="-50 -50 100 100"
      className={className}
      aria-hidden
    >
      {logoDots().map((d, i) => (
        <circle key={i} cx={d.cx} cy={d.cy} r={d.r} fill={d.fill} />
      ))}
      {/* Vape device outline at the centre */}
      <rect x={-2.3} y={-15} width={4.6} height={4.4} rx={1.8} fill="none" stroke={TERRA} strokeWidth={1.6} />
      <rect x={-5.2} y={-11.5} width={10.4} height={23} rx={3.6} fill="none" stroke={TERRA} strokeWidth={2} />
      <rect x={-1.4} y={-3} width={2.8} height={6} rx={1.4} fill="none" stroke={TERRA} strokeWidth={1.3} />
    </svg>
  );
}
