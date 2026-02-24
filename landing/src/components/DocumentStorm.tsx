"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";

interface DocumentStormProps {
  onSettled?: () => void;
}

interface DocumentDescriptor {
  id: number;
  width: number;
  height: number;
  targetX: number;
  targetY: number;
  initialRotate: number;
  depth: number;
}

const MOBILE_BREAKPOINT = 767;
const DESKTOP_DOCUMENT_COUNT = 24;
const MOBILE_DOCUMENT_COUNT = 12;

function getDeterministicRandom(seed: number): number {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function buildDocumentDescriptors(documentCount: number): DocumentDescriptor[] {
  return Array.from({ length: documentCount }, (_, index) => {
    const baseSeed = index + 1;
    const width = 88 + Math.floor(getDeterministicRandom(baseSeed) * 32);
    const height = 112 + Math.floor(getDeterministicRandom(baseSeed + 2) * 36);
    const targetX = -320 + Math.floor(getDeterministicRandom(baseSeed + 4) * 640);
    const targetY = -40 + Math.floor(getDeterministicRandom(baseSeed + 6) * 260);
    const initialRotate = -28 + getDeterministicRandom(baseSeed + 8) * 56;
    const depth = 0.65 + getDeterministicRandom(baseSeed + 10) * 0.35;

    return {
      id: index,
      width,
      height,
      targetX,
      targetY,
      initialRotate,
      depth,
    };
  });
}

export default function DocumentStorm({ onSettled }: DocumentStormProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const documentRefs = useRef<Array<HTMLDivElement | null>>([]);
  const settledRef = useRef(false);
  const [documentCount, setDocumentCount] = useState(DESKTOP_DOCUMENT_COUNT);

  const descriptors = useMemo(
    () => buildDocumentDescriptors(documentCount),
    [documentCount],
  );

  const finalizeTimeline = useCallback(() => {
    if (settledRef.current) {
      return;
    }

    settledRef.current = true;
    onSettled?.();
  }, [onSettled]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    const updateCount = () => {
      setDocumentCount(
        mediaQuery.matches ? MOBILE_DOCUMENT_COUNT : DESKTOP_DOCUMENT_COUNT,
      );
    };

    updateCount();
    mediaQuery.addEventListener("change", updateCount);

    return () => {
      mediaQuery.removeEventListener("change", updateCount);
    };
  }, []);

  useEffect(() => {
    settledRef.current = false;
    const documentNodes = documentRefs.current.filter(
      (node): node is HTMLDivElement => node !== null,
    );

    if (!rootRef.current || documentNodes.length === 0) {
      finalizeTimeline();
      return;
    }

    const context = gsap.context(() => {
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (prefersReducedMotion) {
        gsap.set(documentNodes, {
          x: (index: number) => descriptors[index].targetX,
          y: (index: number) => descriptors[index].targetY,
          rotate: 0,
          scale: 1,
          opacity: 1,
          filter: "blur(0px)",
        });
        finalizeTimeline();
        return;
      }

      const timeline = gsap.timeline({
        defaults: { ease: "power3.out" },
        onComplete: finalizeTimeline,
      });

      timeline.set(documentNodes, {
        transformOrigin: "center center",
        x: (index: number) => descriptors[index].targetX * 1.2,
        y: (index: number) => -window.innerHeight - index * 28,
        rotate: (index: number) => descriptors[index].initialRotate,
        scale: (index: number) => descriptors[index].depth,
        opacity: 0.2,
        filter: "blur(6px)",
      });

      timeline.to(documentNodes, {
        duration: 0.78,
        y: (index: number) => descriptors[index].targetY + 180,
        x: (index: number) => descriptors[index].targetX * 0.85,
        rotate: (index: number) => descriptors[index].initialRotate * 1.1,
        scale: 1,
        opacity: 0.92,
        filter: "blur(1.2px)",
        ease: "power2.in",
        stagger: { each: 0.03, from: "random" },
      });

      timeline.to(documentNodes, {
        duration: 0.56,
        y: (index: number) => descriptors[index].targetY,
        x: (index: number) => descriptors[index].targetX,
        rotate: (index: number) => descriptors[index].initialRotate * 0.25,
        filter: "blur(0.6px)",
        opacity: 1,
        ease: "power3.out",
        stagger: { each: 0.02, from: "center" },
      });

      timeline.to(documentNodes, {
        duration: 0.42,
        rotate: 0,
        filter: "blur(0px)",
        boxShadow: "0 10px 28px rgba(15, 23, 42, 0.12)",
        ease: "power2.out",
        stagger: { each: 0.015, from: "edges" },
      });
    }, rootRef);

    return () => {
      context.revert();
    };
  }, [descriptors, finalizeTimeline]);

  return (
    <div ref={rootRef} className="storm-layer" aria-hidden="true">
      <div className="storm-anchor">
        {descriptors.map((descriptor, index) => (
          <div
            key={descriptor.id}
            ref={(node) => {
              documentRefs.current[index] = node;
            }}
            className="storm-document"
            style={{
              width: `${descriptor.width}px`,
              height: `${descriptor.height}px`,
              zIndex: 5 + Math.round(descriptor.depth * 10),
            }}
          >
            <div className="storm-document-header" />
            <div className="storm-document-line storm-document-line-strong" />
            <div className="storm-document-line" />
            <div className="storm-document-line storm-document-line-short" />
          </div>
        ))}
      </div>
    </div>
  );
}
