"use client";

import { useEffect, useRef, type CanvasHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Particle = {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  speedX: number;
  speedY: number;
};

type ParticlesProps = CanvasHTMLAttributes<HTMLCanvasElement> & {
  quantity?: number;
  color?: string;
  size?: number;
  speed?: number;
};

function hexToRgb(color: string) {
  const value = Number.parseInt(color.replace("#", ""), 16);

  return {
    red: (value >> 16) & 255,
    green: (value >> 8) & 255,
    blue: value & 255,
  };
}

export function Particles({
  className,
  quantity = 100,
  color = "#ffffff",
  size = 1,
  speed = 0.25,
  ...props
}: ParticlesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const containerElement = containerRef.current;
    const canvasElement = canvasRef.current;

    if (!containerElement || !canvasElement) {
      return;
    }

    const context = canvasElement.getContext("2d");

    if (!context) {
      return;
    }

    const container = containerElement;
    const canvas = canvasElement;
    const canvasContext = context;
    const rgb = hexToRgb(color);
    let width = 0;
    let height = 0;
    let animationFrame = 0;
    let particles: Particle[] = [];

    function createParticle(): Particle {
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * size + 0.5,
        alpha: Math.random() * 0.65 + 0.2,
        speedX: (Math.random() - 0.5) * speed,
        speedY: (Math.random() - 0.5) * speed,
      };
    }

    function resize() {
      const bounds = container.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      const rootFontSize = Number.parseFloat(
        window.getComputedStyle(document.documentElement).fontSize,
      );

      width = bounds.width;
      height = bounds.height;
      canvas.width = width * pixelRatio;
      canvas.height = height * pixelRatio;
      canvas.style.width = `${width / rootFontSize}rem`;
      canvas.style.height = `${height / rootFontSize}rem`;
      canvasContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      particles = Array.from({ length: quantity }, createParticle);
    }

    function animate() {
      canvasContext.clearRect(0, 0, width, height);

      for (const particle of particles) {
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        if (particle.x < 0 || particle.x > width) {
          particle.speedX *= -1;
        }

        if (particle.y < 0 || particle.y > height) {
          particle.speedY *= -1;
        }

        canvasContext.beginPath();
        canvasContext.arc(
          particle.x,
          particle.y,
          particle.radius,
          0,
          Math.PI * 2,
        );
        canvasContext.fillStyle = `rgba(${rgb.red}, ${rgb.green}, ${rgb.blue}, ${particle.alpha})`;
        canvasContext.fill();
      }

      animationFrame = window.requestAnimationFrame(animate);
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();
    animate();

    return () => {
      resizeObserver.disconnect();
      window.cancelAnimationFrame(animationFrame);
    };
  }, [color, quantity, size, speed]);

  return (
    <div
      ref={containerRef}
      className={cn("pointer-events-none absolute inset-0", className)}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} {...props} />
    </div>
  );
}
