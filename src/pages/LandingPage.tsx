import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PodzoLogo } from '../components/branding/PodzoLogo';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="lp-hero-only">
      <div className="lp-hero-grid" />
      
      <div className="lp-hero-container">
        {/* Header Row - logo moved to top right corner as requested */}
        <header className="lp-header">
          <div className="lp-logo-box">
            <PodzoLogo variant="full" height={36} />
          </div>
        </header>

        {/* Center content */}
        <main className="lp-main">
          
          {/* Title with P centered exactly behind it */}
          <div className="lp-title-wrapper">
            <div className="lp-ghost-watermark">P</div>
            <h1 className="lp-hero-title">Let's make delivery&nbsp;simple.</h1>
          </div>

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
          position: relative;
          background: linear-gradient(135deg, var(--color-brand-blue-600, #2F5FE0) 0%, var(--color-brand-blue-700, #2648B8) 100%);
          color: #FFFFFF;
          font-family: 'Inter', sans-serif;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .lp-hero-grid {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px);
          background-size: 28px 28px;
          pointer-events: none;
        }

        .lp-hero-container {
          position: relative;
          z-index: 1;
          flex: 1;
          display: flex;
          flex-direction: column;
          max-width: 1200px;
          width: 100%;
          margin: 0 auto;
          padding: 2.5rem;
        }

        /* Logo placed in top right corner */
        .lp-header {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          margin-bottom: auto;
          width: 100%;
        }

        .lp-logo-box {
          display: inline-block;
          background: #FFFFFF;
          padding: 8px 16px;
          border-radius: 12px;
          box-shadow: 0 4px 16px rgba(47, 95, 224, 0.15);
        }

        .lp-main {
          margin-top: auto;
          margin-bottom: auto;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2rem;
          width: 100%;
          padding: 2rem 0;
        }

        .lp-title-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          padding: 2rem 0;
        }

        /* Ghost watermark centered precisely behind the title text */
        .lp-ghost-watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 36rem;
          font-weight: 800;
          color: rgba(255, 255, 255, 0.055);
          z-index: 0;
          pointer-events: none;
          user-select: none;
          font-family: 'Inter', sans-serif;
          line-height: 1;
        }

        .lp-hero-title {
          font-size: 4rem;
          font-weight: 850;
          line-height: 1.15;
          letter-spacing: -0.04em;
          margin: 0;
          position: relative;
          z-index: 1;
        }

        .lp-stats {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 12px;
          position: relative;
          z-index: 1;
        }

        .lp-stat-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.18);
          color: #FFFFFF;
          border-radius: 9999px;
          padding: 6px 18px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .lp-stat-pill strong {
          color: #FFFFFF;
          font-weight: 800;
        }

        .lp-cta-wrap {
          position: relative;
          z-index: 1;
          width: 100%;
          margin-top: 1rem;
        }

        .lp-start-btn {
          background: #FFFFFF;
          color: var(--color-brand-blue-600, #2F5FE0);
          border: none;
          border-radius: 10px;
          height: 50px;
          padding: 0 36px;
          font-weight: 700;
          font-size: 1.05rem;
          font-family: inherit;
          cursor: pointer;
          transition: background 0.15s, transform 0.15s, box-shadow 0.15s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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
            padding: 1.5rem;
          }
          
          .lp-hero-title {
            font-size: 2.8rem;
          }
          
          .lp-start-btn {
            width: 100%;
            max-width: 320px;
          }

          .lp-ghost-watermark {
            font-size: 22rem;
          }
        }
      `}</style>
    </div>
  );
}
