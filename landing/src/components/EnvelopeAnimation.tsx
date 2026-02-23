"use client";

import { motion } from "motion/react";

export default function EnvelopeAnimation() {
  return (
    <motion.div
      className="envelope-scene"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="env">
        {/* paper with checkmark */}
        <div className="env-paper">
          <svg width="60" height="60" viewBox="0 0 30 30" fill="none">
            <circle
              cx="15"
              cy="15"
              r="12"
              fill="#f0fdf4"
              stroke="#16a34a"
              strokeWidth="2"
              className="env-check-circle"
            />
            <path
              d="M9 15.5L13 19.5L21 10.5"
              stroke="#16a34a"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="env-check-mark"
            />
          </svg>
        </div>

        {/* envelope back wall */}
        <div className="env-back" />

        {/* envelope front V-fold */}
        <div className="env-front" />

        {/* flap */}
        <div className="env-flap-wrap">
          <div className="env-flap" />
        </div>
      </div>

      {/* Glow ring behind envelope */}
      <div className="env-glow" />

      <style>{`
        .envelope-scene {
          display: flex;
          justify-content: center;
          align-items: flex-end;
          height: 260px;
          position: relative;
        }

        .env {
          position: relative;
          width: 220px;
          height: 165px;
        }

        /* ── glow ── */
        .env-glow {
          position: absolute;
          bottom: 10px;
          left: 50%;
          transform: translateX(-50%);
          width: 280px;
          height: 200px;
          border-radius: 50%;
          background: radial-gradient(ellipse at center, rgba(37, 99, 235, 0.12) 0%, transparent 70%);
          pointer-events: none;
          animation: glowPulse 5s ease-in-out infinite;
        }

        /* ── back wall ── */
        .env-back {
          position: absolute;
          left: 0;
          right: 0;
          top: 38px;
          bottom: 0;
          background: linear-gradient(180deg, #dbeafe 0%, #eff6ff 100%);
          border-radius: 8px 8px 24px 24px;
          box-shadow: 0 12px 48px rgba(37, 99, 235, 0.2), 0 4px 16px rgba(37, 99, 235, 0.1);
          z-index: 1;
        }

        /* ── front V fold ── */
        .env-front {
          position: absolute;
          top: 38px;
          left: 0;
          width: 220px;
          height: 127px;
          z-index: 3;
          clip-path: polygon(0 10%, 50% 78%, 100% 10%, 100% 100%, 0 100%);
          background: linear-gradient(180deg, #eff6ff 0%, #ffffff 100%);
          border-radius: 0 0 24px 24px;
        }

        /* ── paper ── */
        .env-paper {
          position: absolute;
          left: 50%;
          width: 110px;
          height: 90px;
          margin-left: -55px;
          bottom: 12px;
          background: #ffffff;
          border: 2px solid #e8ecf4;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
          animation: paperSlide 5s ease-in-out infinite, paperZ 5s step-end infinite;
        }

        /* ── flap wrapper ── */
        .env-flap-wrap {
          position: absolute;
          top: 38px;
          left: 0;
          width: 220px;
          height: 0;
          z-index: 4;
          perspective: 800px;
        }

        .env-flap {
          width: 0;
          height: 0;
          border-left: 110px solid transparent;
          border-right: 110px solid transparent;
          border-top: 62px solid #bfdbfe;
          transform-origin: top center;
          animation: flapOpen 5s ease-in-out infinite;
          filter: drop-shadow(0 2px 4px rgba(37, 99, 235, 0.1));
        }

        /* ── checkmark parts ── */
        .env-check-circle {
          opacity: 0;
          animation: checkFade 5s ease infinite;
        }

        .env-check-mark {
          stroke-dasharray: 26;
          stroke-dashoffset: 26;
          animation: checkDraw 5s ease infinite;
        }

        /* ═══════ KEYFRAMES ═══════ */

        @keyframes flapOpen {
          0%, 5%    { transform: rotateX(0deg); }
          20%       { transform: rotateX(170deg); }
          72%       { transform: rotateX(170deg); }
          87%, 100% { transform: rotateX(0deg); }
        }

        @keyframes paperSlide {
          0%, 20%   { transform: translateY(0); }
          38%       { transform: translateY(-105px); }
          62%       { transform: translateY(-105px); }
          80%, 100% { transform: translateY(0); }
        }

        @keyframes paperZ {
          0%        { z-index: 2; }
          28%       { z-index: 5; }
          74%       { z-index: 2; }
        }

        @keyframes checkFade {
          0%, 34%   { opacity: 0; }
          42%, 58%  { opacity: 1; }
          66%, 100% { opacity: 0; }
        }

        @keyframes checkDraw {
          0%, 36%   { stroke-dashoffset: 26; }
          48%, 56%  { stroke-dashoffset: 0; }
          68%, 100% { stroke-dashoffset: 26; }
        }

        @keyframes glowPulse {
          0%, 20%   { opacity: 0.5; }
          38%, 62%  { opacity: 1; }
          80%, 100% { opacity: 0.5; }
        }
      `}</style>
    </motion.div>
  );
}
