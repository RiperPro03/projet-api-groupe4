"use client";

import {
  useState,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

type MagicCardProps = {
  children: ReactNode;
  className?: string;
  gradientSize?: number;
  gradientColor?: string;
  gradientOpacity?: number;
  gradientFrom?: string;
  gradientTo?: string;
};

export function MagicCard({
  children,
  className,
  gradientSize = 220,
  gradientColor = "rgb(255 255 255 / 0.16)",
  gradientOpacity = 0.85,
  gradientFrom = "var(--color-breezy-green)",
  gradientTo = "var(--color-breezy-yellow)",
}: MagicCardProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  function handleMouseMove(event: MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();

    setMousePosition({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  }

  const style = {
    "--magic-card-x": `${mousePosition.x}px`,
    "--magic-card-y": `${mousePosition.y}px`,
    "--magic-card-size": `${gradientSize}px`,
    "--magic-card-color": gradientColor,
    "--magic-card-opacity": isHovering ? gradientOpacity : 0,
    "--magic-card-from": gradientFrom,
    "--magic-card-to": gradientTo,
  } as CSSProperties;

  return (
    <div
      className={cn(
        "group/magic-card relative overflow-hidden rounded-lg border border-border bg-card text-card-foreground",
        className
      )}
      style={style}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-(--magic-card-opacity) transition-opacity duration-300"
        style={{
          background:
            "radial-gradient(var(--magic-card-size) circle at var(--magic-card-x) var(--magic-card-y), var(--magic-card-from), var(--magic-card-to) 35%, transparent 70%)",
        }}
      />
      <div className="absolute inset-px rounded-[calc(0.5rem-1px)] bg-card" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-px rounded-[calc(0.5rem-1px)] opacity-(--magic-card-opacity) transition-opacity duration-300"
        style={{
          background:
            "radial-gradient(var(--magic-card-size) circle at var(--magic-card-x) var(--magic-card-y), var(--magic-card-color), transparent 70%)",
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
