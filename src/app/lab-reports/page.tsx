"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

// ==========================================
// OPTIMIZED CONSTELLATION CANVAS ENGINE
// ==========================================
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseSpeed: number;
}

function ConstellationCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    const linkDist = 110;
    const maxParticles = 120;
    const lineAlpha = 0.08;
    const hoverRadius = 150;
    const hoverBoost = 0.05;

    let mouseX = -9999;
    let mouseY = -9999;
    let mouseActive = false;

    // Resize handler - preserving existing particles on height-only changes
    const resizeCanvas = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;

      canvas.width = width;
      canvas.height = height;

      const area = width * height;
      const targetCount = Math.min(Math.floor(area / 15000), maxParticles);

      if (particles.length < targetCount) {
        const toSpawn = targetCount - particles.length;
        for (let i = 0; i < toSpawn; i++) {
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.8,
            vy: (Math.random() - 0.5) * 0.8,
            baseSpeed: 0.3 + Math.random() * 0.4,
          });
        }
      } else if (particles.length > targetCount) {
        particles = particles.slice(0, targetCount);
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });
    resizeObserver.observe(container);
    resizeCanvas();

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
      mouseActive = true;
    };

    const handleMouseLeave = () => {
      mouseX = -9999;
      mouseY = -9999;
      mouseActive = false;
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);

    const animate = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // 1. Update drift and apply hover boost
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.x += p.vx * p.baseSpeed;
        p.y += p.vy * p.baseSpeed;

        if (mouseActive) {
          const dx = mouseX - p.x;
          const dy = mouseY - p.y;
          const dist = Math.hypot(dx, dy);

          if (dist < hoverRadius) {
            const force = (hoverRadius - dist) / hoverRadius;
            p.x += (dx / dist) * force * hoverBoost * 2;
            p.y += (dy / dist) * force * hoverBoost * 2;
          }
        }

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
        ctx.fill();
      }

      // 2. Spatial grid hashing connection check
      const grid: Record<string, Particle[]> = {};
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const cx = Math.floor(p.x / linkDist);
        const cy = Math.floor(p.y / linkDist);
        const key = `${cx}_${cy}`;
        if (!grid[key]) grid[key] = [];
        grid[key].push(p);
      }

      const processedPairs = new Set<string>();

      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        const cx = Math.floor(p1.x / linkDist);
        const cy = Math.floor(p1.y / linkDist);

        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            const key = `${cx + dx}_${cy + dy}`;
            const cellParticles = grid[key];
            if (!cellParticles) continue;

            for (let j = 0; j < cellParticles.length; j++) {
              const p2 = cellParticles[j];
              if (p1 === p2) continue;

              const p1Idx = particles.indexOf(p1);
              const p2Idx = particles.indexOf(p2);
              const pairKey = p1Idx < p2Idx ? `${p1Idx}_${p2Idx}` : `${p2Idx}_${p1Idx}`;

              if (processedPairs.has(pairKey)) continue;
              processedPairs.add(pairKey);

              const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);

              if (dist < linkDist) {
                const alpha = lineAlpha * (1 - dist / linkDist);
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.strokeStyle = `rgba(0, 0, 0, ${alpha})`;
                ctx.lineWidth = 0.8;
                ctx.stroke();
              }
            }
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 z-0 pointer-events-none">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}

// ==========================================
// MAIN LAB REPORTS PAGE COMPONENT
// ==========================================
export default function LabReportsPage() {
  const brands = [
    {
      name: "Dazed",
      downloadPackHref: "https://drive.google.com/drive/folders/17PwLcU4zOjQVs_POwreQMgWFlyES3YPa?usp=drive_link",
      categories: [
        {
          label: "Batch Oils",
          groups: [
            {
              links: [
                { name: "CBD (Full Panel)", href: "https://drive.google.com/file/d/1ZajjVSWiJBj4W_X93BU-99NiJ_BCs31w/view?usp=drivesdk" },
                { name: "CBG (Full Panel)", href: "https://drive.google.com/file/d/16HFA2RjeiubTZn_kRCXCDfskaVPXB09m/view?usp=drivesdk" },
                { name: "CBN (Full Panel)", href: "https://drive.google.com/file/d/1xOOzwyJB7AcKTmr0N-H7Lelo6xza-WjZ/view?usp=drivesdk" },
                { name: "D10-THC (Full Panel)", href: "https://drive.google.com/file/d/19nC8jdvJFhla_MhSboSFCJaurR_K-LlB/view?usp=drivesdk" },
                { name: "D8-THC (Full Panel)", href: "https://drive.google.com/file/d/1pVMwxpssMUh2qFoJ7R08SdReYRHGy-ds/view?usp=drivesdk" },
                { name: "D9-THC (Full Panel)", href: "https://drive.google.com/file/d/1UdyPViMFi3D86rSg4r8lgX0yoO7IxGRP/view?usp=drivesdk" },
                { name: "HHC (Full Panel)", href: "https://drive.google.com/file/d/172Pj8q-p7P24CeXNSsD_A_HB7IC5JP6E/view?usp=drivesdk" },
                { name: "HHCP (Full Panel)", href: "https://drive.google.com/file/d/1kEq4eWDEV5D0i4Pm2bNT2ezG8LzYjs4b/view?usp=drivesdk" },
                { name: "THCP (Full Panel)", href: "https://drive.google.com/file/d/1_tDic8CYSwS11BNhG44humzY5P4xk0Ea/view?usp=drivesdk" },
              ]
            }
          ]
        },
        {
          label: "Cartridges",
          groups: [
            {
              subtitle: "Atomic Blenz - THCA | D9P",
              links: [
                { name: "Atomic Blenz 2g Rainbow Untz", href: "https://drive.google.com/file/d/1BtY5pAj5W0O5xi0KVbNPqSy_r4sAEhFC/view?usp=drivesdk" },
                { name: "Atomic Blenz 2g Super Diesel", href: "https://drive.google.com/file/d/1C0zjHHIlYaZ7bkW74NkUWYbtK-mMTsOq/view?usp=drivesdk" },
                { name: "Atomic Blenz 2g Zelato", href: "https://drive.google.com/file/d/12PZ11MgZzMOhFxiau_-5y0kO7X8ozqdr/view?usp=drivesdk" }
              ]
            },
            {
              subtitle: "Atomic Blenz - HHC | HHCP",
              links: [
                { name: "Atomic H Blenz 2g Blue Dream", href: "https://drive.google.com/file/d/16XqXxpKfaOHqVptPh5bSqsBIEHcS2L8G/view?usp=drivesdk" },
                { name: "Atomic H Blenz 2g F1 Durban", href: "https://drive.google.com/file/d/13cOofdZmeYNK599j032laWUYaCr4ozzR/view?usp=drivesdk" },
                { name: "Atomic H Blenz 2g Skywalker", href: "https://drive.google.com/file/d/1Eb5ULRs7JYooDEKiYrQpdp1h4Zf8jpoY/view?usp=drivesdk" }
              ]
            },
            {
              subtitle: "THCA",
              links: [
                { name: "THCA Diamonds Sauze 2g Cali Gas", href: "https://drive.google.com/file/d/1KE3jEoGS1_Zg88mXD_lbpmbbuIwi6m3S/view?usp=drivesdk" },
                { name: "THCA Diamonds Sauze 2g Ghost Train", href: "https://drive.google.com/file/d/1BSqQEVRBlFttfo6NKHmqUe2L3fUNvouk/view?usp=drivesdk" },
                { name: "THCA Diamonds Sauze 2g Purple Punch", href: "https://drive.google.com/file/d/1fcB546bnSVdW2XkOwERtGbz0SUVWsNfU/view?usp=drivesdk" }
              ]
            },
            {
              subtitle: "THCP",
              links: [
                { name: "THCP 2g Blue Zushi", href: "https://drive.google.com/file/d/1dYKA7iG7wDICFHYpzJjLeEbYUFibLr4Z/view?usp=drivesdk" },
                { name: "THCP 2g Lemon Pie", href: "https://drive.google.com/file/d/1xupk1LSt0kOlXPv1ZLypUeroZCDzh8cg/view?usp=drivesdk" },
                { name: "THCP 2g Rainbow Untz", href: "https://drive.google.com/file/d/1LzeELNivAiJ9MoRv1D5T14KCwxc3A-y6/view?usp=drivesdk" },
                { name: "THCP 2g Super Diesel", href: "https://drive.google.com/file/d/1fPp_FUWVyX4-tTCHLJ7_5EgeAnfgDY7R/view?usp=drivesdk" },
                { name: "THCP 2g Tiger's Blood", href: "https://drive.google.com/file/d/12kdo5rcYTdEE21Aq14S4iWFeZlkZPCkq/view?usp=drivesdk" },
                { name: "THCP 2g Zelato", href: "https://drive.google.com/file/d/1jaft9BuQPGFosZ2eAdSC0qp6oRS8i8eC/view?usp=drivesdk" }
              ]
            }
          ]
        },
        {
          label: "Concentrates",
          groups: [
            {
              subtitle: "Ai Blenz - THCA",
              links: [
                { name: "THCA Ai Blenz Dab Triad 3g Crack Jack", href: "https://drive.google.com/file/d/1EqbknTt16PGIBa9OQcQPZZpqhyoAov7g/view?usp=drivesdk" },
                { name: "THCA Ai Blenz Dab Triad 3g Gelatti Biscotti", href: "https://drive.google.com/file/d/1Rk7s-JBKZlzHDgAsnPIdCiCN7hyHJiKS/view?usp=drivesdk" },
                { name: "THCA Ai Blenz Dab Triad 3g MK-Urkle", href: "https://drive.google.com/file/d/1M4IwZjas0mwiS8BMtcuy5vLRJW-c-QA7/view?usp=drivesdk" }
              ]
            },
            {
              subtitle: "Ai Blenz - THCP",
              links: [
                { name: "THCP Ai Blenz Dab Triad 3g Quantum Death Glue", href: "https://drive.google.com/file/d/1I2ZA8E0RSaf9plnLxbih5yy2I8IcOO4H/view?usp=drivesdk" }
              ]
            }
          ]
        },
        {
          label: "Disposables",
          groups: [
            {
              subtitle: "D9P | THCA",
              links: [
                { name: "Money Blenz 3g Disposable - Berry Blast", href: "https://drive.google.com/file/d/1pVMwxpssMUh2qFoJ7R08SdReYRHGy-ds/view?usp=drivesdk" },
                { name: "Money Blenz 3g Disposable - Maui Wowie", href: "https://drive.google.com/file/d/1pVMwxpssMUh2qFoJ7R08SdReYRHGy-ds/view?usp=drivesdk" }
              ]
            }
          ]
        },
        {
          label: "Edibles",
          groups: [
            {
              subtitle: "Gummies",
              links: [
                { name: "Supersonic Gummies 2500mg - Blue Razz", href: "https://drive.google.com/file/d/1_tDic8CYSwS11BNhG44humzY5P4xk0Ea/view?usp=drivesdk" },
                { name: "Supersonic Gummies 2500mg - Watermelon", href: "https://drive.google.com/file/d/1_tDic8CYSwS11BNhG44humzY5P4xk0Ea/view?usp=drivesdk" }
              ]
            }
          ]
        },
        {
          label: "Flower",
          groups: [
            {
              subtitle: "Indoor Flower",
              links: [
                { name: "Frosted Flower 3.5g - Gushers", href: "https://drive.google.com/file/d/1fcB546bnSVdW2XkOwERtGbz0SUVWsNfU/view?usp=drivesdk" }
              ]
            }
          ]
        },
        {
          label: "Pre-rolls",
          groups: [
            {
              subtitle: "Diamonds Pre-rolls",
              links: [
                { name: "THCA Diamonds Pre-rolls 2g - Skywalker", href: "https://drive.google.com/file/d/1fcB546bnSVdW2XkOwERtGbz0SUVWsNfU/view?usp=drivesdk" }
              ]
            }
          ]
        }
      ]
    },
    {
      name: "Brixz NYC",
      downloadPackHref: "https://drive.google.com/drive/folders/16KRkO4K7eDkpx5rzZMuNMOvusGFWplTL?usp=share_link",
      categories: [
        {
          label: "Batch Oils",
          groups: [
            {
              links: [
                { name: "THCA Badder Bulk COA", href: "https://drive.google.com/file/d/1ZajjVSWiJBj4W_X93BU-99NiJ_BCs31w/view?usp=drivesdk" }
              ]
            }
          ]
        },
        {
          label: "Concentrates",
          groups: [
            {
              subtitle: "THCA",
              links: [
                { name: "THCA 2g Pure Diamonds", href: "https://drive.google.com/file/d/1EqbknTt16PGIBa9OQcQPZZpqhyoAov7g/view?usp=drivesdk" },
                { name: "THCA Badder 2g Grandaddy Purp", href: "https://drive.google.com/file/d/1fcB546bnSVdW2XkOwERtGbz0SUVWsNfU/view?usp=drivesdk" },
                { name: "THCA Badder 2g Strawnana", href: "https://drive.google.com/file/d/1fcB546bnSVdW2XkOwERtGbz0SUVWsNfU/view?usp=drivesdk" },
                { name: "THCA Badder 2g Super Lemon Haze", href: "https://drive.google.com/file/d/1fcB546bnSVdW2XkOwERtGbz0SUVWsNfU/view?usp=drivesdk" }
              ]
            }
          ]
        },
        {
          label: "Disposables",
          groups: [
            {
              subtitle: "D9P | THCA",
              links: [
                { name: "D9P/THCA Highrise 7g Blue Zkittlz", href: "https://drive.google.com/file/d/1dYKA7iG7wDICFHYpzJjLeEbYUFibLr4Z/view?usp=drivesdk" },
                { name: "D9P/THCA Highrise 7g Super Silver Haze", href: "https://drive.google.com/file/d/1dYKA7iG7wDICFHYpzJjLeEbYUFibLr4Z/view?usp=drivesdk" },
                { name: "D9P/THCA Highrise 7g Zookiez", href: "https://drive.google.com/file/d/1dYKA7iG7wDICFHYpzJjLeEbYUFibLr4Z/view?usp=drivesdk" }
              ]
            },
            {
              subtitle: "HHCP | HHC",
              links: [
                { name: "HHCP/HHC Highrise 7g Gruntz", href: "https://drive.google.com/file/d/16XqXxpKfaOHqVptPh5bSqsBIEHcS2L8G/view?usp=drivesdk" },
                { name: "HHCP/HHC Highrise 7g Harleg OG", href: "https://drive.google.com/file/d/16XqXxpKfaOHqVptPh5bSqsBIEHcS2L8G/view?usp=drivesdk" },
                { name: "HHCP/HHC Highrise 7g Super Skunk", href: "https://drive.google.com/file/d/16XqXxpKfaOHqVptPh5bSqsBIEHcS2L8G/view?usp=drivesdk" }
              ]
            }
          ]
        },
        {
          label: "Edibles",
          groups: [
            {
              subtitle: "CBD+ Collection",
              links: [
                { name: "Brixz CBD+ Gummies 3000mg", href: "https://drive.google.com/file/d/1_tDic8CYSwS11BNhG44humzY5P4xk0Ea/view?usp=drivesdk" }
              ]
            }
          ]
        },
        {
          label: "Nicotine",
          groups: [
            {
              subtitle: "Disposable Devices",
              links: [
                { name: "Brixz 9000 Puffs Disposable", href: "https://drive.google.com/file/d/1pVMwxpssMUh2qFoJ7R08SdReYRHGy-ds/view?usp=drivesdk" },
                { name: "Brixz 3.0 Disposable", href: "https://drive.google.com/file/d/1pVMwxpssMUh2qFoJ7R08SdReYRHGy-ds/view?usp=drivesdk" }
              ]
            }
          ]
        }
      ]
    },
    {
      name: "Shrumfuzed",
      downloadPackHref: "https://drive.google.com/drive/folders/16KRkO4K7eDkpx5rzZMuNMOvusGFWplTL?usp=share_link",
      categories: [
        {
          label: "Chocolates",
          groups: [
            {
              subtitle: "Shrooms Chocolates",
              links: [
                { name: "Classic Chocolates 10ct - Milk Chocolate", href: "https://drive.google.com/file/d/1ZajjVSWiJBj4W_X93BU-99NiJ_BCs31w/view?usp=drivesdk" }
              ]
            }
          ]
        },
        {
          label: "Classic",
          groups: [
            {
              subtitle: "Shrooms Gummies",
              links: [
                { name: "Classic Gummies 10ct - Strawberry", href: "https://drive.google.com/file/d/112PZ11MgZzMOhFxiau_-5y0kO7X8ozqdr/view?usp=drivesdk" }
              ]
            }
          ]
        },
        {
          label: "Gummies",
          groups: [
            {
              subtitle: "Active Gummies",
              links: [
                { name: "MAX Gummies 10ct - Blue Razz", href: "https://drive.google.com/file/d/112PZ11MgZzMOhFxiau_-5y0kO7X8ozqdr/view?usp=drivesdk" }
              ]
            }
          ]
        },
        {
          label: "Max",
          groups: [
            {
              subtitle: "MAX Strength",
              links: [
                { name: "MAX Chocolates 10ct - Dark Chocolate", href: "https://drive.google.com/file/d/1ZajjVSWiJBj4W_X93BU-99NiJ_BCs31w/view?usp=drivesdk" }
              ]
            }
          ]
        },
        {
          label: "Tablets",
          groups: [
            {
              subtitle: "Tabz System",
              links: [
                { name: "Tabz Capsules 5ct", href: "https://drive.google.com/file/d/112PZ11MgZzMOhFxiau_-5y0kO7X8ozqdr/view?usp=drivesdk" }
              ]
            }
          ]
        }
      ]
    }
  ];

  return (
    <div id="constellation-field" className="relative min-h-screen text-[#333333] font-sans pb-16 overflow-hidden bg-white select-none">
      
      {/* CSS styling block mirroring the user provided Elementor config */}
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --bg: #ffffff;
          --text: #333333;
          --muted: rgba(0, 0, 0, .62);
          --line: rgba(0, 0, 0, .18);
          --line2: rgba(0, 0, 0, .10);
          --pill-bg: #ffffff;
          --pill-border: rgba(0, 0, 0, .30);
          --pill-hover: rgba(0, 0, 0, .06);
          --sub-bg: #f7f7f7;
          --sub-border: rgba(0, 0, 0, .10);
          --max: 1280px;
          --g: 22px;
        }

        #constellation-field {
          position: relative;
          background: var(--bg);
          color: var(--text);
          padding: 22px 16px 60px;
          overflow: hidden;
        }

        .hb3 {
          position: relative;
          z-index: 1;
          max-width: var(--max);
          margin: 0 auto;
        }

        .hb3-hero {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 10px 0 24px;
        }

        .hb3-title {
          margin: 0;
          font-size: 4rem;
          line-height: 100%;
          text-transform: uppercase;
          font-weight: 700;
          color: var(--text);
        }

        @media (max-width: 768px) {
          .hb3-hero {
            flex-direction: column;
            align-items: flex-start;
          }
          .hb3-title {
            font-size: 3rem;
          }
        }

        .hb3-sub {
          margin: 10px 0 0;
          color: var(--muted);
          font-weight: 300;
          font-size: 16px;
          line-height: 1.4;
          max-width: 70ch;
        }

        .hb3-downloadAll {
          flex: 0 0 auto;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          color: #ffffff;
          background: var(--text);
          border: 1px solid var(--pill-border);
          padding: 10px 22px;
          border-radius: 999px;
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: .08em;
          text-transform: uppercase;
          transition: transform .12s ease, background .12s ease;
          white-space: nowrap;
        }

        .hb3-downloadAll:hover {
          transform: translateY(-1px);
          background: #d93b2e;
          color: #ffffff;
          border-color: #d93b2e;
        }

        .hb3-grid {
          margin-top: 18px;
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: var(--g);
        }

        .hb3-brand {
          grid-column: span 4;
          padding-top: 14px;
        }

        @media (max-width: 980px) {
          .hb3-brand {
            grid-column: span 6;
          }
        }

        @media (max-width: 640px) {
          .hb3-brand {
            grid-column: span 12;
          }
        }

        .hb3-brandHead {
          margin-bottom: 24px;
        }

        .hb3-brandName {
          margin: 0;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .02em;
          font-size: 1.8rem;
          line-height: 100%;
        }

        .hb3-packBtn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          color: var(--text);
          border: 1px solid var(--pill-border);
          border-radius: 999px;
          padding: 7px 14px;
          font-size: 0.75rem;
          margin-top: 10px;
          font-weight: 700;
          letter-spacing: .08em;
          text-transform: uppercase;
          background: #fff;
          transition: background .12s ease, transform .12s ease, border-color .12s ease, color .12s ease;
          white-space: nowrap;
        }

        .hb3-packBtn:hover {
          background: #d93b2e;
          color: #ffffff;
          border-color: #d93b2e;
          transform: translateY(-1px);
        }

        .hb3-packBtn .hb3-arrow {
          width: 6px;
          height: 6px;
          display: inline-block;
          border: 2px solid currentColor;
          border-left: 0;
          border-bottom: 0;
          transform: rotate(45deg);
          margin-left: 2px;
        }

        .hb3-catList {
          margin: 0;
          padding: 0;
          list-style: none;
          border-top: 1px solid var(--line2);
        }

        details.hb3-cat {
          border-bottom: 1px solid var(--line2);
          overflow: hidden;
        }

        details.hb3-cat:last-of-type {
          border-bottom: none !important;
        }

        summary.hb3-catRow {
          list-style: none;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 24px 0;
          cursor: pointer;
          position: relative;
          z-index: 2;
        }

        summary.hb3-catRow::-webkit-details-marker {
          display: none;
        }

        .hb3-catLabel {
          font-size: 16px;
          font-weight: 400;
          letter-spacing: .01em;
          line-height: 130%;
        }

        .hb3-plus {
          width: 14px;
          height: 14px;
          position: relative;
          flex: 0 0 auto;
          opacity: .95;
          transition: transform .3s ease;
        }

        .hb3-plus:before,
        .hb3-plus:after {
          content: "";
          position: absolute;
          left: 50%;
          top: 50%;
          width: 12px;
          height: 2px;
          background: var(--text);
          transform: translate(-50%, -50%);
        }

        .hb3-plus:after {
          width: 2px;
          height: 12px;
        }

        details[open] .hb3-plus {
          transform: rotate(45deg);
        }

        .hb3-subBox {
          padding: 0 8px 20px 8px;
          margin: 0;
          width: 100%;
          transform-origin: top center;
          animation: slideDown 0.25s ease-out forwards;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .hb3-subLinks {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .hb3-subLinks li {
          margin: 0;
          padding: 0;
          margin-bottom: 8px;
        }

        .hb3-subLinks li:last-child {
          margin-bottom: 0;
        }

        .hb3-subLinks a {
          text-decoration: underline;
          color: var(--text);
          font-size: 0.85rem;
          font-weight: 500;
          transition: color .12s ease, transform .12s ease;
          display: inline-block;
        }

        .hb3-subLinks a:hover {
          color: #d93b2e;
          transform: translateX(2px);
        }

        .hb3-subTitle {
          font-size: 0.85rem;
          font-weight: 700;
          margin: 18px 0 8px 0;
          color: var(--text);
          text-transform: uppercase;
          letter-spacing: .02em;
          border-bottom: 1px dashed var(--line2);
          padding-bottom: 2px;
        }

        .hb3-subBox > .hb3-subTitle:first-child {
          margin-top: 2px;
        }
      ` }} />

      {/* Render particle animation engine */}
      <ConstellationCanvas />

      {/* Breadcrumb Header */}
      <div className="border-b border-black/10 bg-[#f7f7f7] relative z-10">
        <div className="mx-auto max-w-[1280px] px-6 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-black/65">
          <div className="flex items-center gap-2">
            <Link href="/" className="hover:text-black transition">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-black">Lab Reports</span>
          </div>
        </div>
      </div>

      {/* Lab Reports Content */}
      <div className="hb3 relative z-10 px-6 mt-8">
        
        {/* Hero Section */}
        <div className="hb3-hero">
          <div>
            <h1 className="hb3-title">LAB REPORTS</h1>
            <p className="hb3-sub">
              Transparency you can trust. View all COA’s below, organized by brand and product category.
            </p>
          </div>

          <a 
            className="hb3-downloadAll" 
            href="https://drive.google.com/drive/folders/16KRkO4K7eDkpx5rzZMuNMOvusGFWplTL?usp=share_link" 
            target="_blank" 
            rel="noopener"
          >
            Download All
          </a>
        </div>

        {/* Brands Accordion Grid */}
        <div className="hb3-grid">
          {brands.map((brand) => (
            <section key={brand.name} className="hb3-brand">
              <div className="hb3-brandHead">
                <h3 className="hb3-brandName">{brand.name}</h3>
                <a className="hb3-packBtn" href={brand.downloadPackHref} target="_blank" rel="noopener">
                  Download Pack <span className="hb3-arrow" aria-hidden="true"></span>
                </a>
              </div>

              <div className="hb3-catList">
                {brand.categories.map((category) => (
                  <details key={category.label} className="hb3-cat group">
                    <summary className="hb3-catRow">
                      <span className="hb3-catLabel">{category.label}</span>
                      <span className="hb3-plus" aria-hidden="true"></span>
                    </summary>
                    <div className="hb3-subBox">
                      {category.groups.map((group, groupIdx) => (
                        <div key={groupIdx}>
                          {(group as { subtitle?: string }).subtitle && (
                            <h6 className="hb3-subTitle">{(group as { subtitle?: string }).subtitle}</h6>
                          )}
                          <ul className="hb3-subLinks">
                            {group.links.map((link) => (
                              <li key={link.name}>
                                <a href={link.href} target="_blank" rel="noopener">
                                  <span>{link.name}</span>
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>

      </div>

    </div>
  );
}
