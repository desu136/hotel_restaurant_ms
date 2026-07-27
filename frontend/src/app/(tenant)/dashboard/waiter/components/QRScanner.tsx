"use client"
import * as React from "react"
import jsQR from "jsqr"

interface QRScannerProps { onScan: (data: string) => void; onError: (error: string) => void }

export function QRScanner({ onScan, onError }: QRScannerProps) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null)
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const streamRef = React.useRef<MediaStream | null>(null)
  const animRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    let isMounted = true

    async function initCamera() {
      if (typeof window === "undefined" || !navigator?.mediaDevices?.getUserMedia) {
        onError("Camera access requires HTTPS. Use HTTPS (e.g. ngrok) or continue with simulated actions.")
        return
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        if (!isMounted) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.setAttribute("playsinline", "true")
          videoRef.current.play().catch(console.error)
        }
        animRef.current = requestAnimationFrame(scan)
      } catch (err: any) { onError(err.message || "Failed to access camera.") }
    }

    function scan() {
      if (!isMounted) return
      const video = videoRef.current; const canvas = canvasRef.current
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        const ctx = canvas.getContext("2d", { willReadFrequently: true })
        if (ctx) {
          canvas.width = video.videoWidth; canvas.height = video.videoHeight
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          try {
            const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" })
            if (code?.data) { onScan(code.data); return }
          } catch (e) { console.error("jsQR scan error:", e) }
        }
      }
      animRef.current = requestAnimationFrame(scan)
    }

    initCamera()
    return () => {
      isMounted = false
      if (animRef.current) cancelAnimationFrame(animRef.current)
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    }
  }, [onScan, onError])

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
      <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" muted playsInline />
      <canvas ref={canvasRef} className="hidden" />
      <div className="absolute inset-0 border-[30px] border-black/80 pointer-events-none z-10" />
      <div className="w-64 h-64 border-2 border-white/20 rounded-3xl relative flex items-center justify-center overflow-hidden z-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-amber-500 rounded-tl-lg" />
        <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-amber-500 rounded-tr-lg" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-amber-500 rounded-bl-lg" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-amber-500 rounded-br-lg" />
        <div className="absolute left-0 right-0 h-1 bg-amber-500 opacity-80 shadow-[0_0_15px_rgba(245,158,11,0.8)] animate-pulse" style={{ top: "0%" }} />
      </div>
    </div>
  )
}
