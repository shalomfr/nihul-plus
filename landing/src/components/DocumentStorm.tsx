"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { RoundedBox, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";

/* ── Types ── */
interface DocumentStormProps {
  onSettled?: () => void;
}

interface DocDescriptor {
  id: number;
  w: number;
  h: number;
  tx: number;
  ty: number;
  tz: number;
  rx0: number;
  ry0: number;
  rz0: number;
  depth: number;
  variant: "default" | "chart" | "checklist" | "header" | "image";
  hue: number;
}

/* ── Constants ── */
const MOBILE_BP = 767;
const DESKTOP_N = 28;
const MOBILE_N = 14;
const VARIANTS: DocDescriptor["variant"][] = [
  "default",
  "chart",
  "checklist",
  "header",
  "image",
];

/* ── Deterministic random ── */
function seeded(seed: number) {
  const v = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return v - Math.floor(v);
}

/* ── Descriptor builder ── */
function buildDescriptors(n: number): DocDescriptor[] {
  return Array.from({ length: n }, (_, i) => {
    const s = i + 1;
    const depth = seeded(s * 7);
    return {
      id: i,
      w: 0.8 + seeded(s) * 0.4,
      h: 1.0 + seeded(s + 2) * 0.45,
      tx: (seeded(s + 4) - 0.5) * 8,
      ty: (seeded(s + 6) - 0.3) * 5,
      tz: (depth - 0.5) * 3,
      rx0: (seeded(s + 10) - 0.5) * 0.9,
      ry0: (seeded(s + 12) - 0.5) * 1.0,
      rz0: (seeded(s + 8) - 0.5) * 1.2,
      depth,
      variant: VARIANTS[Math.floor(seeded(s + 14) * VARIANTS.length)],
      hue: 210 + Math.floor(seeded(s + 16) * 40),
    };
  });
}

/* ══════════════════════════════════════
   Procedural Canvas Textures
   ══════════════════════════════════════ */

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  color: string,
) {
  ctx.fillStyle = color;
  roundRect(ctx, x, y, w, 10, 5);
  ctx.fill();
}

function drawLine(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  color: string,
) {
  ctx.fillStyle = color;
  roundRect(ctx, x, y, w, 7, 4);
  ctx.fill();
}

function generateTexture(
  variant: DocDescriptor["variant"],
  hue: number,
): THREE.CanvasTexture {
  const W = 256,
    H = 320,
    P = 20;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext("2d")!;
  const a = `hsla(${hue},72%,58%,`;
  const gray = "rgba(100,116,139,0.14)";
  const fullW = W - P * 2;

  // White background + border
  ctx.fillStyle = "#fff";
  roundRect(ctx, 0, 0, W, H, 12);
  ctx.fill();
  ctx.strokeStyle = "rgba(226,232,240,0.7)";
  ctx.lineWidth = 2;
  roundRect(ctx, 1, 1, W - 2, H - 2, 11);
  ctx.stroke();

  switch (variant) {
    case "default":
      drawBar(ctx, P, 28, W * 0.5, a + "0.25)");
      drawLine(ctx, P, 52, fullW, a + "0.16)");
      drawLine(ctx, P, 70, fullW, gray);
      drawLine(ctx, P, 88, fullW * 0.65, gray);
      break;

    case "chart": {
      drawBar(ctx, P, 28, W * 0.4, a + "0.25)");
      const barW = (fullW - 24) / 5;
      const heights = [0.35, 0.57, 0.8, 0.93, 0.65];
      const opacities = [0.22, 0.33, 0.45, 0.6, 0.38];
      heights.forEach((hf, i) => {
        const bH = 80 * hf;
        ctx.fillStyle = `hsla(${hue},72%,58%,${opacities[i]})`;
        roundRect(ctx, P + i * (barW + 6), 55 + 80 - bH, barW, bH, 4);
        ctx.fill();
      });
      drawLine(ctx, P, 150, fullW * 0.65, gray);
      break;
    }

    case "checklist": {
      drawBar(ctx, P, 28, W * 0.55, a + "0.25)");
      const fracs = [0.8, 0.6, 0.9];
      [true, true, false].forEach((checked, idx) => {
        const y = 55 + idx * 28;
        ctx.strokeStyle = a + "0.35)";
        ctx.lineWidth = 2;
        roundRect(ctx, P, y, 14, 14, 3);
        ctx.stroke();
        if (checked) {
          ctx.strokeStyle = `hsla(${hue},72%,48%,0.7)`;
          ctx.lineWidth = 2.5;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.beginPath();
          ctx.moveTo(P + 3, y + 8);
          ctx.lineTo(P + 6, y + 11);
          ctx.lineTo(P + 11, y + 4);
          ctx.stroke();
        }
        drawLine(ctx, P + 22, y + 3, (fullW - 22) * fracs[idx], gray);
      });
      break;
    }

    case "header":
      ctx.fillStyle = a + "0.12)";
      roundRect(ctx, P, 24, fullW, 58, 8);
      ctx.fill();
      drawBar(ctx, P + 8, 34, fullW * 0.6, a + "0.35)");
      drawLine(ctx, P + 8, 56, fullW * 0.85, gray);
      drawLine(ctx, P, 100, fullW, gray);
      drawLine(ctx, P, 118, fullW * 0.65, gray);
      break;

    case "image":
      drawBar(ctx, P, 28, W * 0.45, a + "0.25)");
      ctx.fillStyle = `hsla(${hue},60%,65%,0.12)`;
      roundRect(ctx, P, 52, fullW, 100, 8);
      ctx.fill();
      ctx.strokeStyle = `hsla(${hue},60%,55%,0.35)`;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(P + 20, 132);
      ctx.lineTo(P + 50, 74);
      ctx.lineTo(P + 80, 104);
      ctx.lineTo(P + 120, 64);
      ctx.lineTo(P + 160, 114);
      ctx.stroke();
      ctx.fillStyle = `hsla(${hue},60%,55%,0.25)`;
      ctx.beginPath();
      ctx.arc(P + 40, 82, 10, 0, Math.PI * 2);
      ctx.fill();
      drawLine(ctx, P, 168, fullW * 0.65, gray);
      break;
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.needsUpdate = true;
  return tex;
}

/* ══════════════════════════════════════
   DocCard – single 3D document mesh
   ══════════════════════════════════════ */

function DocCard({
  desc,
  setRef,
}: {
  desc: DocDescriptor;
  setRef: (m: THREE.Mesh | null) => void;
}) {
  const tex = useMemo(
    () => generateTexture(desc.variant, desc.hue),
    [desc.variant, desc.hue],
  );
  useEffect(() => () => tex.dispose(), [tex]);

  return (
    <RoundedBox
      ref={setRef}
      args={[desc.w, desc.h, 0.02]}
      radius={0.06}
      smoothness={4}
    >
      <meshStandardMaterial
        map={tex}
        transparent
        opacity={0}
        side={THREE.DoubleSide}
      />
    </RoundedBox>
  );
}

/* ══════════════════════════════════════
   Scene – lights, shadows, GSAP timeline
   ══════════════════════════════════════ */

function Scene({
  descriptors,
  onDone,
}: {
  descriptors: DocDescriptor[];
  onDone: () => void;
}) {
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const { invalidate } = useThree();
  const doneRef = useRef(false);

  useEffect(() => {
    doneRef.current = false;
    const meshes = meshRefs.current.filter(
      (m): m is THREE.Mesh => m !== null,
    );
    if (meshes.length === 0) {
      onDone();
      return;
    }

    /* reduced motion → skip animation, show final state */
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      meshes.forEach((m, i) => {
        const d = descriptors[i];
        m.position.set(d.tx, d.ty, d.tz);
        m.rotation.set(0, 0, 0);
        (m.material as THREE.MeshStandardMaterial).opacity = 1;
      });
      invalidate();
      onDone();
      return;
    }

    /* set initial positions: above the viewport with wild rotation */
    meshes.forEach((m, i) => {
      const d = descriptors[i];
      m.position.set(
        d.tx + (seeded((i + 1) * 3) - 0.5) * 4,
        12 + seeded((i + 1) * 5) * 6,
        d.tz,
      );
      m.rotation.set(d.rx0 * 3, d.ry0 * 3, d.rz0 * 3);
      (m.material as THREE.MeshStandardMaterial).opacity = 0;
    });
    invalidate();

    /* ── GSAP Timeline ── */
    const tl = gsap.timeline({ onUpdate: () => invalidate() });

    /* Phase 1 – Storm: fall from above (0.9s, staggered) */
    tl.addLabel("storm", 0);
    meshes.forEach((m, i) => {
      const d = descriptors[i];
      const stagger = seeded((i + 1) * 7) * 0.4;
      tl.to(
        m.position,
        {
          x: d.tx * 0.9,
          y: d.ty + 0.8,
          z: d.tz,
          duration: 0.9,
          ease: "power2.in",
        },
        `storm+=${stagger}`,
      );
      tl.to(
        m.rotation,
        {
          x: d.rx0,
          y: d.ry0,
          z: d.rz0,
          duration: 0.9,
          ease: "power2.in",
        },
        `storm+=${stagger}`,
      );
      tl.to(
        m.material,
        {
          opacity: 0.5 + d.depth * 0.5,
          duration: 0.6,
          ease: "power1.in",
        },
        `storm+=${stagger}`,
      );
    });

    /* Phase 2 – Converge: to target positions (0.65s) */
    tl.addLabel("converge", ">-0.25");
    meshes.forEach((m, i) => {
      const d = descriptors[i];
      tl.to(
        m.position,
        { x: d.tx, y: d.ty, z: d.tz, duration: 0.65, ease: "power3.out" },
        "converge",
      );
      tl.to(
        m.rotation,
        {
          x: 0.09,
          y: 0,
          z: (seeded((i + 1) * 3) - 0.5) * 0.06,
          duration: 0.65,
          ease: "power3.out",
        },
        "converge",
      );
      tl.to(m.material, { opacity: 1, duration: 0.45 }, "converge");
    });

    /* Phase 3 – Settle: flatten rotation (0.48s) */
    tl.addLabel("settle", ">-0.1");
    meshes.forEach((m, i) => {
      tl.to(
        m.rotation,
        {
          x: 0,
          y: 0,
          z: (seeded((i + 1) * 5) - 0.5) * 0.05,
          duration: 0.48,
          ease: "back.out(1.2)",
        },
        "settle",
      );
    });

    /* Phase 4 – Signal done */
    tl.call(
      () => {
        if (!doneRef.current) {
          doneRef.current = true;
          onDone();
        }
      },
      [],
      ">+0.05",
    );

    return () => {
      tl.kill();
    };
  }, [descriptors, onDone, invalidate]);

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 5]} intensity={0.8} />
      <ContactShadows
        position={[0, -3.5, 0]}
        opacity={0.35}
        scale={14}
        blur={2.5}
        far={6}
      />
      {descriptors.map((d, i) => (
        <DocCard
          key={d.id}
          desc={d}
          setRef={(m) => {
            meshRefs.current[i] = m;
          }}
        />
      ))}
    </>
  );
}

/* ══════════════════════════════════════
   DocumentStorm – main export
   ══════════════════════════════════════ */

export default function DocumentStorm({ onSettled }: DocumentStormProps) {
  const [count, setCount] = useState(DESKTOP_N);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const descriptors = useMemo(() => buildDescriptors(count), [count]);

  /* Responsive document count */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia(`(max-width: ${MOBILE_BP}px)`);
    const update = () => setCount(mq.matches ? MOBILE_N : DESKTOP_N);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  /* After 3D settle → fade the canvas wrapper → call onSettled */
  const handleDone = useCallback(() => {
    if (wrapperRef.current) {
      gsap.to(wrapperRef.current, {
        opacity: 0,
        duration: 0.3,
        ease: "power2.inOut",
        onComplete: () => onSettled?.(),
      });
    } else {
      onSettled?.();
    }
  }, [onSettled]);

  return (
    <div ref={wrapperRef} className="storm-canvas-wrapper" aria-hidden="true">
      <Canvas
        frameloop="demand"
        dpr={[1, 1.5]}
        camera={{ fov: 50, position: [0, 0, 8], near: 0.1, far: 50 }}
        gl={{ alpha: true, antialias: true }}
      >
        <Scene descriptors={descriptors} onDone={handleDone} />
      </Canvas>
    </div>
  );
}
