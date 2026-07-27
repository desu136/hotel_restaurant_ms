"use client"
import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"

export default function SlideshowImage({
  images,
  alt,
  className,
  interval = 3000,
}: {
  images: string[]
  alt: string
  className?: string
  interval?: number
}) {
  const [idx, setIdx] = React.useState(0)
  const all = images.filter(Boolean)

  React.useEffect(() => {
    if (all.length <= 1) return
    const t = setInterval(() => setIdx(i => (i + 1) % all.length), interval)
    return () => clearInterval(t)
  }, [all.length, interval])

  if (all.length === 0) return null

  return (
    <div className={`relative overflow-hidden ${className ?? ""}`}>
      <AnimatePresence mode="sync">
        <motion.img
          key={all[idx]}
          src={all[idx]}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{
            opacity: 1,
            scale: [1, 1.09, 1.03, 1.10, 1],
            x: [0, 5, -3, 3, 0],
            y: [0, -3, 5, -2, 0],
          }}
          exit={{ opacity: 0, scale: 1.03 }}
          transition={{
            opacity: { duration: 0.8, ease: "easeInOut" },
            scale: { duration: interval / 1000 + 2, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" },
            x: { duration: interval / 1000 + 2, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" },
            y: { duration: interval / 1000 + 2, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" },
          }}
        />
      </AnimatePresence>
      {all.length > 1 && (
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1 z-10 pointer-events-none">
          {all.map((_, i) => (
            <span
              key={i}
              className={`w-1 h-1 rounded-full transition-all duration-500 ${i === idx ? "bg-white w-3" : "bg-white/40"}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
