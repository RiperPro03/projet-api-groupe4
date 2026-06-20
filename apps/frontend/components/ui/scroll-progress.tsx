"use client"

import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"

interface ScrollProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  ref?: React.Ref<HTMLDivElement>
}

function getScrollProgress() {
  if (typeof window === "undefined") {
    return 0
  }

  const scrollTop = window.scrollY || document.documentElement.scrollTop
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight

  if (maxScroll <= 0) {
    return 0
  }

  return Math.min(Math.max(scrollTop / maxScroll, 0), 1)
}

export function ScrollProgress({
  className,
  ref,
  style,
  ...props
}: ScrollProgressProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let frame: number | null = null

    const scheduleProgressUpdate = () => {
      if (frame !== null) {
        return
      }

      frame = window.requestAnimationFrame(() => {
        frame = null
        setProgress(getScrollProgress())
      })
    }

    scheduleProgressUpdate()
    window.addEventListener("scroll", scheduleProgressUpdate, { passive: true })
    window.addEventListener("resize", scheduleProgressUpdate)

    return () => {
      if (frame !== null) {
        window.cancelAnimationFrame(frame)
      }

      window.removeEventListener("scroll", scheduleProgressUpdate)
      window.removeEventListener("resize", scheduleProgressUpdate)
    }
  }, [])

  return (
    <div
      ref={ref}
      className={cn(
        "fixed inset-x-0 top-0 z-50 h-px origin-left bg-linear-to-r from-[#A97CF8] via-[#F38CB8] to-[#FDCC92]",
        className
      )}
      style={{
        ...style,
        transform: `scaleX(${progress})`,
      }}
      {...props}
    />
  )
}
