import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="lp-hero-only">
      <div className="lp-hero-grid" />
      
      {/* Giant ghost watermark PODZO behind the title, taking full screen width */}
      <div className="lp-ghost-watermark">PODZO</div>
      
      {/* Centered Content Wrap taking 40% of screen height */}
      <div className="lp-hero-container">
        <main className="lp-main">
          <h1 className="lp-hero-title">Let's make delivery simple.</h1>
        </main>
      </div>

      {/* Get Started Button - downside of the watermark, not on it */}
      <div className="lp-cta-wrap-downside">
        <button 
          onClick={() => navigate('/login')} 
          className="lp-start-btn"
        >
          Get started
        </button>
      </div>

      <style>{`
        .lp-hero-only {
          min-height: 100vh;
          width: 100vw;
          background: linear-gradient(135deg, var(--color-brand-blue-600, #2F5FE0) 0%, var(--color-brand-blue-700, #2648B8) 100%);
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          position: relative;
          font-family: 'Inter', sans-serif;
        }

        .lp-hero-grid {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px);
          background-size: 28px 28px;
          pointer-events: none;
        }

        /* Watermark text scaling dynamically, made a little bright white */
        .lp-ghost-watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 22vw;
          font-weight: 900;
          letter-spacing: -0.05em;
          color: rgba(255, 255, 255, 0.09);
          z-index: 0;
          pointer-events: none;
          user-select: none;
          font-family: 'Inter', sans-serif;
          line-height: 1;
          white-space: nowrap;
        }

        /* Centered layout container takes 40% height of screen */
        .lp-hero-container {
          position: relative;
          z-index: 1;
          width: 100%;
          height: 40vh;
          min-height: 320px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .lp-main {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          max-width: 1200px;
          padding: 0 2rem;
        }

        .lp-hero-title {
          font-size: 2.3rem; /* slightly larger size */
          font-weight: 900;
          line-height: 1.25;
          letter-spacing: -0.03em;
          color: rgba(255, 255, 255, 0.85); /* soft white (white little less) */
          margin: 0;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
        }

        /* Positioned downside of the watermark so it does not overlap */
        .lp-cta-wrap-downside {
          position: absolute;
          bottom: 12vh;
          left: 50%;
          transform: translateX(-50%);
          z-index: 2;
          width: auto;
          display: flex;
          justify-content: center;
        }

        .lp-start-btn {
          background: #FFFFFF;
          color: var(--color-brand-blue-600, #2F5FE0);
          border: none;
          border-radius: 8px;
          height: 48px;
          padding: 0 40px;
          font-weight: 700;
          font-size: 1rem;
          font-family: inherit;
          cursor: pointer;
          transition: transform 0.15s, box-shadow 0.15s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.12);
        }

        .lp-start-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.18);
        }

        .lp-start-btn:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.4);
        }

        @media (max-width: 640px) {
          .lp-hero-container {
            height: 45vh;
            min-height: 280px;
          }

          .lp-hero-title {
            font-size: 1.5rem;
          }
          
          .lp-cta-wrap-downside {
            bottom: 8vh;
            width: 100%;
            padding: 0 2rem;
            box-sizing: border-box;
          }
          
          .lp-start-btn {
            width: 100%;
            max-width: 280px;
          }

          .lp-ghost-watermark {
            font-size: 22vw;
          }
        }
      `}</style>
    </div>
  );
}
