"use client";

import { motion } from "motion/react";

export default function EnvelopeAnimation() {
  return (
    <motion.div
      className="envelope-scene"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="env">
        {/* paper with checkmark */}
        <div className="env-paper">
          <svg width="36" height="36" viewBox="0 0 30 30" fill="none">
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

      {/* Glow */}
      <div className="env-glow" />

      <style>{`
        .envelope-scene {
          display: flex;
          justify-content: center;
          align-items: flex-end;
          height: 150px;
          position: relative;
        }

        .env {
          position: relative;
          width: 130px;
          height: 98px;
        }

        /* ── glow ── */
        .env-glow {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 180px;
          height: 140px;
          border-radius: 50%;
          background: radial-gradient(ellipse at center, rgba(37, 99, 235, 0.1) 0%, transparent 70%);
          pointer-events: none;
          animation: glowPulse 5s ease-in-out infinite;
        }

        /* ── back wall ── */
        .env-back {
          position: absolute;
          left: 0;
          right: 0;
          top: 22px;
          bottom: 0;
          background: linear-gradient(180deg, #dbeafe 0%, #eff6ff 100%);
          border-radius: 5px 5px 16px 16px;
          box-shadow: 0 8px 32px rgba(37, 99, 235, 0.18), 0 2px 10px rgba(37, 99, 235, 0.08);
          z-index: 1;
        }

        /* ── front V fold ── */
        .env-front {
          position: absolute;
          top: 22px;
          left: 0;
          width: 130px;
          height: 76px;
          z-index: 3;
          clip-path: polygon(0 10%, 50% 78%, 100% 10%, 100% 100%, 0 100%);
          background: linear-gradient(180deg, #eff6ff 0%, #ffffff 100%);
          border-radius: 0 0 16px 16px;
        }

        /* ── paper ── */
        .env-paper {
          position: absolute;
          left: 50%;
          width: 66px;
          height: 54px;
          margin-left: -33px;
          bottom: 8px;
          background: #ffffff;
          border: 1.5px solid #e8ecf4;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
          animation: paperSlide 5s ease-in-out infinite, paperZ 5s step-end infinite;
        }

        /* ── flap wrapper ── */
        .env-flap-wrap {
          position: absolute;
          top: 22px;
          left: 0;
          width: 130px;
          height: 0;
          z-index: 4;
          perspective: 600px;
        }

        .env-flap {
          width: 0;
          height: 0;
          border-left: 65px solid transparent;
          border-right: 65px solid transparent;
          border-top: 38px solid #bfdbfe;
          transform-origin: top center;
          animation: flapOpen 5s ease-in-out infinite;
          filter: drop-shadow(0 1px 3px rgba(37, 99, 235, 0.08));
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
          38%       { transform: translateY(-62px); }
          62%       { transform: translateY(-62px); }
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
