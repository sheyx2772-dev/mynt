"use client";

import { useMemo } from "react";

export type ParticleKind = "petals" | "sparkles" | "cyber" | "stars";

function resolveKind(themeId?: string): ParticleKind {
  switch (themeId) {
    case "suzani":
    case "naqsh":
      return "petals";
    case "devops":
    case "lime":
      return "cyber";
    case "sheen":
    case "xarita":
      return "stars";
    case "genesis":
    case "rahbar":
    default:
      return "sparkles";
  }
}

// Particle glyphs:
// 1. Petal: graceful organic cherry/rose petal
// 2. Sparkle: elegant 4-point diamond star
// 3. Cyber: glowing digital matrix cross / hex
// 4. Star: 8-point twinkling star
function renderParticleSvg(kind: ParticleKind, color: string) {
  if (kind === "petals") {
    return (
      <svg viewBox="0 0 24 24" fill={color} className="size-full drop-shadow-sm">
        <path d="M12 2C8.5 6.5 6 12 12 21C18 12 15.5 6.5 12 2Z" />
      </svg>
    );
  }
  if (kind === "cyber") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} className="size-full">
        <rect x="7" y="7" width="10" height="10" rx="2" fill={color} fillOpacity={0.4} />
      </svg>
    );
  }
  if (kind === "stars") {
    return (
      <svg viewBox="0 0 24 24" fill={color} className="size-full drop-shadow">
        <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
      </svg>
    );
  }
  // Sparkle default
  return (
    <svg viewBox="0 0 24 24" fill={color} className="size-full drop-shadow">
      <path d="M12 2L13.8 9.2L21 11L13.8 12.8L12 20L10.2 12.8L3 11L10.2 9.2L12 2Z" />
    </svg>
  );
}

function resolveColor(kind: ParticleKind, themeId?: string): string {
  if (kind === "petals") return themeId === "suzani" ? "#f472b6" : "#fbbf24";
  if (kind === "cyber") return themeId === "devops" ? "#00ffc4" : "#abff09";
  if (kind === "stars") return themeId === "sheen" ? "#38bdf8" : "#fbbf24";
  return "#e5c158"; // gold sparkles
}

// Lightweight, GPU-accelerated falling and floating particle overlay.
// Brings the card atmosphere to life with falling petals, stars, or cyber sparks.
export default function ProfileParticles({
  themeId,
  kind: explicitKind,
  className = "",
}: {
  themeId?: string;
  kind?: ParticleKind;
  className?: string;
}) {
  const kind = explicitKind ?? resolveKind(themeId);
  const color = resolveColor(kind, themeId);

  // 14 deterministic particles with random offsets, speeds and sway
  const particles = useMemo(() => {
    return Array.from({ length: 14 }).map((_, i) => {
      const left = ((i * 7.3 + 4) % 92) + "%";
      const duration = 6 + (i % 5) * 1.8; // 6s - 13.2s
      const delay = (i % 6) * 1.2; // 0s - 6s
      const size = 11 + (i % 4) * 4; // 11px - 23px
      const sway = 15 + (i % 3) * 15; // 15px - 45px
      const opacity = 0.45 + (i % 3) * 0.2; // 0.45 - 0.85
      return { id: i, left, duration, delay, size, sway, opacity };
    });
  }, []);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      <style>{`
        @keyframes flex-particle-fall {
          0% {
            transform: translateY(-40px) rotate(0deg);
            opacity: 0;
          }
          12% {
            opacity: var(--p-op, 0.7);
          }
          88% {
            opacity: var(--p-op, 0.7);
          }
          100% {
            transform: translateY(calc(100% + 40px)) rotate(360deg);
            opacity: 0;
          }
        }
        @keyframes flex-particle-sway {
          0%, 100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(var(--p-sway, 25px));
          }
        }
        .flex-particle-wrapper {
          position: absolute;
          top: 0;
          will-change: transform;
          animation: flex-particle-fall linear infinite;
        }
        .flex-particle-inner {
          will-change: transform;
          animation: flex-particle-sway ease-in-out infinite alternate;
        }
      `}</style>

      {particles.map((p) => (
        <div
          key={p.id}
          className="flex-particle-wrapper"
          style={
            {
              left: p.left,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              "--p-op": p.opacity,
            } as React.CSSProperties
          }
        >
          <div
            className="flex-particle-inner"
            style={
              {
                width: `${p.size}px`,
                height: `${p.size}px`,
                animationDuration: `${p.duration * 0.65}s`,
                "--p-sway": `${p.sway}px`,
              } as React.CSSProperties
            }
          >
            {renderParticleSvg(kind, color)}
          </div>
        </div>
      ))}
    </div>
  );
}
