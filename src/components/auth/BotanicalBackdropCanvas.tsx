import React, { useEffect, useRef } from 'react';

type ParticleKind = 'leaf' | 'flower' | 'mote';

interface BotanicalParticle {
  kind: ParticleKind;
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  angle: number;
  spin: number;
  flutterPhase: number;
  flutterSpeed: number;
  flutterAmp: number;
  tiltPhase: number;
  tiltSpeed: number;
  alpha: number;
  color: string;
  accentColor: string;
  petalCount: 4 | 5;
}

const LEAF_COLORS = [
  { fill: 'rgba(74, 222, 128, 0.42)', vein: 'rgba(187, 247, 208, 0.48)' },
  { fill: 'rgba(34, 197, 94, 0.36)', vein: 'rgba(134, 239, 172, 0.45)' },
  { fill: 'rgba(134, 239, 172, 0.34)', vein: 'rgba(220, 252, 231, 0.42)' },
  { fill: 'rgba(22, 163, 74, 0.38)', vein: 'rgba(134, 239, 172, 0.38)' },
];

const FLOWER_COLORS = [
  { petal: 'rgba(220, 252, 231, 0.44)', center: 'rgba(74, 222, 128, 0.72)' },
  { petal: 'rgba(187, 247, 208, 0.38)', center: 'rgba(34, 197, 94, 0.7)' },
  { petal: 'rgba(134, 239, 172, 0.36)', center: 'rgba(240, 253, 244, 0.75)' },
];

function createParticle(width: number, height: number, scatterY = false): BotanicalParticle {
  const roll = Math.random();
  const kind: ParticleKind = roll < 0.44 ? 'leaf' : roll < 0.74 ? 'flower' : 'mote';

  const depth = 0.45 + Math.random() * 0.55; // 0.45 (far/tiny) .. 1.0 (near)
  const leafPalette = LEAF_COLORS[Math.floor(Math.random() * LEAF_COLORS.length)];
  const flowerPalette = FLOWER_COLORS[Math.floor(Math.random() * FLOWER_COLORS.length)];

  const size =
    kind === 'leaf'
      ? (4.2 + Math.random() * 5.2) * depth
      : kind === 'flower'
      ? (3.6 + Math.random() * 4.4) * depth
      : (1.0 + Math.random() * 1.4) * depth;

  // Gentle diagonal breeze floating from bottom-left/bottom toward top-right
  const speedScale = 0.45 + depth * 0.65;
  const vy = -(10 + Math.random() * 16) * speedScale;
  const vx = (5 + Math.random() * 11) * speedScale;

  const startX = Math.random() * (width + 80) - 40;
  const startY = scatterY ? Math.random() * (height + 40) - 20 : height + 16 + Math.random() * 40;

  return {
    kind,
    x: startX,
    y: startY,
    size,
    vx,
    vy,
    angle: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.9,
    flutterPhase: Math.random() * Math.PI * 2,
    flutterSpeed: 0.9 + Math.random() * 1.3,
    flutterAmp: (8 + Math.random() * 14) * depth,
    tiltPhase: Math.random() * Math.PI * 2,
    tiltSpeed: 1.0 + Math.random() * 1.5,
    alpha: (kind === 'mote' ? 0.25 + Math.random() * 0.45 : 0.42 + Math.random() * 0.48) * depth,
    color:
      kind === 'leaf'
        ? leafPalette.fill
        : kind === 'flower'
        ? flowerPalette.petal
        : 'rgba(134, 239, 172, 0.65)',
    accentColor:
      kind === 'leaf'
        ? leafPalette.vein
        : kind === 'flower'
        ? flowerPalette.center
        : 'rgba(74, 222, 128, 0.35)',
    petalCount: Math.random() < 0.65 ? 5 : 4,
  };
}

function drawLeaf(ctx: CanvasRenderingContext2D, p: BotanicalParticle, time: number) {
  const tilt = 0.55 + 0.45 * Math.sin(time * p.tiltSpeed + p.tiltPhase);
  const s = p.size;

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle);
  ctx.scale(1, tilt);
  ctx.globalAlpha = p.alpha;

  // Delicate curved botanical leaf silhouette
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.bezierCurveTo(s * 0.72, -s * 0.42, s * 0.68, s * 0.45, 0, s);
  ctx.bezierCurveTo(-s * 0.68, s * 0.45, -s * 0.72, -s * 0.42, 0, -s);
  ctx.closePath();
  ctx.fillStyle = p.color;
  ctx.fill();

  // Subtle leaf midrib vein & tiny stem
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.78);
  ctx.lineTo(0, s * 1.18);
  ctx.strokeStyle = p.accentColor;
  ctx.lineWidth = Math.max(0.55, s * 0.09);
  ctx.lineCap = 'round';
  ctx.stroke();

  ctx.restore();
}

function drawFlower(ctx: CanvasRenderingContext2D, p: BotanicalParticle, time: number) {
  const tilt = 0.68 + 0.32 * Math.cos(time * p.tiltSpeed + p.tiltPhase);
  const s = p.size;
  const petals = p.petalCount;

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle);
  ctx.scale(1, tilt);
  ctx.globalAlpha = p.alpha;

  // Soft outer petals
  ctx.fillStyle = p.color;
  for (let i = 0; i < petals; i++) {
    const theta = (i * Math.PI * 2) / petals;
    ctx.save();
    ctx.rotate(theta);
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.56, s * 0.3, s * 0.52, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Luminous emerald center stamen
  ctx.beginPath();
  ctx.arc(0, 0, Math.max(0.9, s * 0.24), 0, Math.PI * 2);
  ctx.fillStyle = p.accentColor;
  ctx.fill();

  ctx.restore();
}

function drawMote(ctx: CanvasRenderingContext2D, p: BotanicalParticle, time: number) {
  const pulse = 0.65 + 0.35 * Math.sin(time * p.flutterSpeed * 1.4 + p.flutterPhase);
  ctx.save();
  ctx.globalAlpha = p.alpha * pulse;

  // Soft halo
  const r = p.size * 2.4;
  const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
  grad.addColorStop(0, p.color);
  grad.addColorStop(0.45, p.accentColor);
  grad.addColorStop(1, 'rgba(34, 197, 94, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export const BotanicalBackdropCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let particles: BotanicalParticle[] = [];
    let rafId = 0;
    let lastTime = performance.now();

    const syncDimensions = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      width = rect.width;
      height = rect.height;
      const isCompact = width < 640;
      dpr = Math.min(window.devicePixelRatio || 1, isCompact ? 1.5 : 2);

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Proportional particle count so both mobile and full-screen desktop feel airy and fast
      const area = width * height;
      const minParticles = isCompact ? 16 : 26;
      const maxParticles = isCompact ? 30 : 85;
      const targetCount = Math.max(minParticles, Math.min(maxParticles, Math.round(area / 18000)));
      if (particles.length === 0) {
        particles = Array.from({ length: targetCount }, () =>
          createParticle(width, height, true)
        );
      } else if (particles.length < targetCount) {
        while (particles.length < targetCount) {
          particles.push(createParticle(width, height, true));
        }
      } else if (particles.length > targetCount) {
        particles.length = targetCount;
      }
    };

    syncDimensions();

    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            syncDimensions();
            if (prefersReducedMotion) renderStatic();
          })
        : null;
    resizeObserver?.observe(canvas);

    const renderFrame = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;
      const tSec = now / 1000;

      if (width > 0 && height > 0) {
        ctx.clearRect(0, 0, width, height);

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          const sway =
            Math.sin(tSec * p.flutterSpeed + p.flutterPhase) * p.flutterAmp * dt;

          p.x += p.vx * dt + sway;
          p.y += p.vy * dt;
          p.angle += p.spin * dt;

          // Wrap seamlessly once particles float past the top or right edge
          if (p.y < -24 || p.x > width + 32) {
            const respawnFromLeft = Math.random() < 0.28;
            const fresh = createParticle(width, height, false);
            if (respawnFromLeft) {
              fresh.x = -18;
              fresh.y = height * (0.2 + Math.random() * 0.78);
            } else {
              fresh.x = Math.random() * (width * 0.92) - 20;
              fresh.y = height + 18;
            }
            particles[i] = fresh;
            continue;
          }

          if (p.kind === 'leaf') {
            drawLeaf(ctx, p, tSec);
          } else if (p.kind === 'flower') {
            drawFlower(ctx, p, tSec);
          } else {
            drawMote(ctx, p, tSec);
          }
        }
      }

      rafId = window.requestAnimationFrame(renderFrame);
    };

    const renderStatic = () => {
      if (width <= 0 || height <= 0) return;
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        if (p.kind === 'leaf') drawLeaf(ctx, p, 0);
        else if (p.kind === 'flower') drawFlower(ctx, p, 0);
        else drawMote(ctx, p, 0);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (rafId) {
          window.cancelAnimationFrame(rafId);
          rafId = 0;
        }
      } else if (!prefersReducedMotion && !rafId) {
        lastTime = performance.now();
        rafId = window.requestAnimationFrame(renderFrame);
      }
    };

    if (prefersReducedMotion) {
      renderStatic();
    } else {
      rafId = window.requestAnimationFrame(renderFrame);
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      resizeObserver?.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 w-full h-full"
    />
  );
};
