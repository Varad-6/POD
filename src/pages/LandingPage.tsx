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
          <h1 className="lp-hero-title">Let's make delivery&nbsp;simple.</h1>
          
          {/* Get Started Button */}
          <div className="lp-cta-wrap">
            <button 
              onClick={() => navigate('/login')} 
              className="lp-start-btn"
            >
              Get started
            </button>
          </div>
        </main>
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

        /* Watermark text scaling dynamically and cutting off left/right edges, height 40% vh */
        .lp-ghost-watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 22vw;
          font-weight: 900;
          letter-spacing: -0.05em;
          color: rgba(255, 255, 255, 0.055);
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
          gap: 2rem;
          width: 100%;
          max-width: 1200px;
          padding: 0 2rem;
        }

        .lp-hero-title {
          font-size: 4rem;
          font-weight: 850;
          line-height: 1.15;
          letter-spacing: -0.04em;
          color: #FFFFFF;
          margin: 0;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }

        .lp-cta-wrap {
          margin-top: 0.5rem;
          width: 100%;
        }

        .lp-start-btn {
          background: #FFFFFF;
          color: var(--color-brand-blue-600, #2F5FE0);
          border: none;
          border-radius: 10px;
          height: 48px;
          padding: 0 36px;
          font-weight: 700;
          font-size: 1rem;
          font-family: inherit;
          cursor: pointer;
          transition: background 0.15s, transform 0.15s, box-shadow 0.15s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(255, 255, 255, 0.15);
        }

        .lp-start-btn:hover {
          background: var(--color-brand-blue-50, #EEF2FE);
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(255, 255, 255, 0.25);
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
            font-size: 2.8rem;
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
