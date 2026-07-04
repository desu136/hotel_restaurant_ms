"use client"
import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, RefreshCw, ChevronRight, Clock, Scan, QrCode, Camera } from "lucide-react"
import { getUserProfile } from "@/lib/miniapp-bridge"
import { createPortal } from "react-dom"
import jsQR from "jsqr"

// ─── Types ───────────────────────────────────────────────────────────────────
type FilterTab = "ALL" | "DINE_IN" | "TAKEAWAY" | "DELIVERY"

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "ALL",      label: "All" },
  { key: "DINE_IN",  label: "Dine-In" },
  { key: "TAKEAWAY", label: "Takeaway" },
  { key: "DELIVERY", label: "Delivery" },
]

const STATUS_LABEL: Record<string, string> = {
  PENDING:   "Pending",
  PREPARING: "Preparing",
  READY:     "Ready",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
}

const STATUS_COLOR: Record<string, string> = {
  PENDING:   "text-amber-600 bg-amber-50 border-amber-200",
  PREPARING: "text-blue-600 bg-blue-50 border-blue-200",
  READY:     "text-green-600 bg-green-50 border-green-200",
  COMPLETED: "text-gray-500 bg-gray-50 border-gray-200",
  CANCELLED: "text-red-500 bg-red-50 border-red-200",
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function MyOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)
  const [activeFilter, setActiveFilter] = React.useState<FilterTab>("ALL")
  const [toast, setToast] = React.useState<{ msg: string; icon: string } | null>(null)
  const [scanningOrderId, setScanningOrderId] = React.useState<string | null>(null)
  const [scannerError, setScannerError] = React.useState<string | null>(null)

  const showToast = (msg: string, icon = "✅") => {
    setToast({ msg, icon })
    setTimeout(() => setToast(null), 2800)
  }

  // ── Fetch orders (dual strategy: SSO userId + localStorage IDs) ────────────
  const fetchOrders = React.useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      let ssoOrders: any[] = []

      // Strategy 1: SSO userId
      try {
        const profile = await getUserProfile()
        if (profile?.id) {
          const res = await fetch(
            `/api/orders/public/history?userId=${encodeURIComponent(profile.id)}`
          )
          if (res.ok) ssoOrders = await res.json()
        }
      } catch (_) {}

      // Strategy 2: localStorage order IDs
      const localIds: string[] = []
      if (typeof window !== "undefined") {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key?.startsWith("placed_orders_")) {
            try {
              const ids: string[] = JSON.parse(localStorage.getItem(key) || "[]")
              localIds.push(...ids)
            } catch (_) {}
          }
        }
      }

      const ssoIds = new Set(ssoOrders.map((o: any) => o.id))
      const remaining = localIds.filter(id => !ssoIds.has(id))

      let localOrders: any[] = []
      if (remaining.length > 0) {
        try {
          const res = await fetch(
            `/api/orders/public/history?orderIds=${remaining.join(",")}`
          )
          if (res.ok) localOrders = await res.json()
        } catch (_) {}
      }

      const all = [...ssoOrders, ...localOrders].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      setOrders(all)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  React.useEffect(() => { fetchOrders() }, [fetchOrders])

  const handleDeliveryQRScan = React.useCallback(async (codeString: string) => {
    if (!scanningOrderId) return;
    
    const prefix = "order_delivery:";
    if (!codeString.startsWith(prefix)) {
      showToast("Invalid QR code scanned. Please scan the waiter's delivery QR code.", "❌");
      return;
    }
    
    const scannedId = codeString.substring(prefix.length);
    if (scannedId !== scanningOrderId) {
      showToast("This QR code does not match the selected order.", "❌");
      return;
    }
    
    try {
      const res = await fetch(`/api/orders/public/${scannedId}/confirm-delivery`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        showToast("Delivery confirmed! Enjoy your meal! 🍽️", "✅");
        setScanningOrderId(null);
        setScannerError(null);
        fetchOrders(true);
      } else {
        const errData = await res.json();
        showToast(errData.error || "Failed to confirm delivery.", "❌");
      }
    } catch (err) {
      console.error("Error confirming delivery:", err);
      showToast("Network error confirming delivery.", "❌");
    }
  }, [scanningOrderId, fetchOrders]);

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filtered = activeFilter === "ALL"
    ? orders
    : orders.filter(o => o.order_type === activeFilter)

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-[system-ui,sans-serif]">

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-gray-900 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-xl flex items-center gap-2 animate-fade-in">
          <span>{toast.icon}</span>{toast.msg}
        </div>
      )}

      {/* ── Header ── */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3.5">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-1 rounded-full active:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="font-extrabold text-sm text-gray-900">My Orders</h1>
          <button
            onClick={() => fetchOrders(true)}
            disabled={refreshing}
            className="p-2 -mr-1 rounded-full active:bg-gray-100 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-gray-500 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* ── Filter Tabs ── */}
        <div className="flex gap-0 px-4 pb-0 overflow-x-auto scrollbar-none">
          {FILTER_TABS.map(tab => {
            const count = tab.key === "ALL"
              ? orders.length
              : orders.filter(o => o.order_type === tab.key).length
            return (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`relative shrink-0 px-4 py-2.5 text-xs font-bold transition-colors ${
                  activeFilter === tab.key
                    ? "text-amber-600"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {tab.label}
                {count > 0 && tab.key !== "ALL" && (
                  <span className={`ml-1 text-[9px] font-black px-1 py-0.5 rounded-full ${
                    activeFilter === tab.key
                      ? "bg-amber-500 text-white"
                      : "bg-gray-100 text-gray-400"
                  }`}>{count}</span>
                )}
                {activeFilter === tab.key && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-t-full" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 px-4 py-4 flex flex-col gap-3 pb-10">
        {loading ? (
          // Loading skeleton
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
              <div className="h-10 bg-gray-100" />
              <div className="flex gap-3 p-4">
                <div className="w-14 h-14 rounded-xl bg-gray-100 shrink-0" />
                <div className="flex-1 flex flex-col gap-2 pt-1">
                  <div className="h-3 bg-gray-100 rounded-full w-3/4" />
                  <div className="h-2 bg-gray-100 rounded-full w-1/2" />
                  <div className="h-2 bg-gray-100 rounded-full w-1/3" />
                </div>
              </div>
              <div className="flex gap-2 px-4 pb-4">
                <div className="flex-1 h-8 bg-gray-100 rounded-xl" />
                <div className="flex-1 h-8 bg-amber-100 rounded-xl" />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          // Empty state
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center">
              <Clock className="w-9 h-9 text-amber-300" />
            </div>
            <div>
              <p className="font-extrabold text-sm text-gray-800">No orders yet</p>
              <p className="text-[11px] text-gray-400 mt-1 max-w-[200px] mx-auto leading-relaxed">
                {activeFilter === "ALL"
                  ? "You haven't placed any orders yet. Start exploring our menu!"
                  : `No ${activeFilter.toLowerCase().replace("_", "-")} orders found.`}
              </p>
            </div>
            <button
              onClick={() => router.push("/home")}
              className="mt-2 bg-amber-500 text-white font-extrabold text-xs px-7 py-2.5 rounded-xl active:scale-95 transition-all shadow-sm"
            >
              Browse Menu
            </button>
          </div>
        ) : (
          // Order cards
          filtered.map((order: any) => {
            const restaurantName: string =
              order.branch?.restaurant?.name ||
              order.branch?.name ||
              "Restaurant"
            const restaurantId: string | null =
              order.branch?.restaurant?.id || null


            const firstItem = (order.items || [])[0]
            const firstImage = firstItem?.menu_item?.image_url
            const itemCount = (order.items || []).reduce(
              (s: number, it: any) => s + (it.quantity || 1), 0
            )
            const totalNum = parseFloat((order.total_amount || 0).toString())
            const orderDate = new Date(order.created_at).toLocaleDateString([], {
              month: "short", day: "numeric", year: "numeric"
            })
            const orderTime = new Date(order.created_at).toLocaleTimeString([], {
              hour: "2-digit", minute: "2-digit"
            })

            const orderTypeLabel =
              order.order_type === "DINE_IN"  ? "Dine-In"  :
              order.order_type === "TAKEAWAY" ? "Takeaway" :
              order.order_type === "DELIVERY" ? "Delivery" : "Order"

            const statusLabel = STATUS_LABEL[order.status] || order.status
            const statusColor = STATUS_COLOR[order.status] || "text-gray-500 bg-gray-50 border-gray-200"

            return (
              <div
                key={order.id}
                className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm"
              >
                {/* Card Header */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50/70 border-b border-gray-100">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[11px] font-extrabold text-gray-800 truncate">
                      {restaurantName}
                    </span>
                    {(order as any).order_number && (
                      <span className="shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded bg-gray-200 text-gray-800 border border-gray-300">
                        #{(order as any).order_number}
                      </span>
                    )}
                    <span className="shrink-0 text-[8px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700 border border-amber-200">
                      {orderTypeLabel}
                    </span>
                  </div>
                  <span className={`shrink-0 text-[8px] font-bold uppercase px-2 py-0.5 rounded-full border ${statusColor}`}>
                    {statusLabel}
                  </span>
                </div>

                {/* Card Body */}
                <div className="flex gap-3 px-4 py-3">
                  {/* Food thumbnail */}
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0 flex items-center justify-center">
                    {firstImage ? (
                      <img src={firstImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">🍽️</span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs text-gray-900 leading-snug line-clamp-1">
                      {firstItem?.menu_item?.display_name || "Item"}
                    </p>
                    {order.items?.length > 1 && (
                      <p className="text-[9px] text-gray-400 mt-0.5">
                        + {order.items.length - 1} more item{order.items.length - 1 !== 1 ? "s" : ""}
                      </p>
                    )}
                    <p className="text-[9px] text-gray-400 mt-1">
                      {orderDate} · {orderTime}
                    </p>
                    <p className="text-[9px] text-gray-400">
                      {itemCount} item{itemCount !== 1 ? "s" : ""}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="shrink-0 text-right pt-0.5">
                    <p className="font-extrabold text-sm text-gray-900">${totalNum.toFixed(2)}</p>
                  </div>
                </div>

                {/* Card Footer — action buttons */}
                <div className="flex items-center gap-2 px-4 pb-3">
                  {order.status === "READY" ? (
                    <button
                      onClick={() => setScanningOrderId(order.id)}
                      className="flex-1 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-[10px] font-extrabold text-white transition-all active:scale-95 shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Scan className="w-3.5 h-3.5" />
                      Scan to Confirm Delivery
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => showToast("Invoice feature coming soon!", "🧾")}
                        className="flex-1 py-2 rounded-xl border border-gray-200 text-[10px] font-bold text-gray-600 bg-white active:bg-gray-50 transition-all active:scale-95"
                      >
                        Get Invoice
                      </button>
                      <button
                        onClick={() => {
                          if (restaurantId) {
                            router.push(`/menu/${restaurantId}?orderType=${order.order_type || "DINE_IN"}`)
                          } else {
                            router.push("/home")
                          }
                        }}
                        className="flex-1 py-2 rounded-xl bg-amber-500 text-[10px] font-extrabold text-white active:bg-amber-600 transition-all active:scale-95 shadow-sm"
                      >
                        Order Again
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* SCANNER MODAL */}
      {scanningOrderId && typeof window !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-sm flex flex-col items-center justify-end sm:justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-white rounded-t-[2.5rem] sm:rounded-3xl overflow-hidden shadow-2xl relative flex flex-col h-[85vh] sm:h-[500px] transition-transform duration-300">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <QrCode className="w-4 h-4 text-amber-500" />
                Scan Delivery QR Code
              </h3>
              <button
                onClick={() => {
                  setScanningOrderId(null)
                  setScannerError(null)
                }}
                className="text-gray-400 hover:text-gray-900 text-sm px-2 py-1 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>

            {/* Viewfinder Area */}
            <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden">
              {scannerError ? (
                <div className="p-6 text-center space-y-3 z-20">
                  <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto text-red-500">
                    <Camera className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-white font-bold">Camera Access Failed</p>
                  <p className="text-[11px] text-gray-400 leading-relaxed max-w-[280px] mx-auto">
                    {scannerError}
                  </p>
                  <p className="text-[10px] text-amber-500/90 font-medium animate-pulse">
                    Please use simulated action below if testing on HTTP without camera permissions.
                  </p>
                </div>
              ) : (
                <>
                  <QRScanner onScan={handleDeliveryQRScan} onError={(err) => setScannerError(err)} />
                  {/* Hint text */}
                  <div className="absolute bottom-4 left-0 right-0 text-center z-20 pointer-events-none">
                    <span className="bg-black/60 text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest border border-white/5">
                      Point camera at waiter's delivery QR
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Simulation/testing actions */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/50 space-y-3 shrink-0">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Testing Fallback (HTTP / No second device)
              </span>
              <button
                onClick={() => {
                  handleDeliveryQRScan(`order_delivery:${scanningOrderId}`)
                }}
                className="w-full bg-green-600 hover:bg-green-500 text-white text-xs font-black py-2.5 px-3 rounded-xl shadow-md transition-all active:scale-95 text-center flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Scan className="w-3.5 h-3.5" />
                Simulate Scan and Confirm Delivery
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

interface QRScannerProps {
  onScan: (data: string) => void;
  onError: (error: string) => void;
}

function QRScanner({ onScan, onError }: QRScannerProps) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const animRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    async function initCamera() {
      if (typeof window === "undefined" || !navigator || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        onError("Camera access requires a secure connection (HTTPS) on mobile. Accessing via HTTP blocks camera APIs. Please use HTTPS or continue testing with the simulated actions below.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }
        });

        if (!isMounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true");
          videoRef.current.play().catch(e => {
            console.error("Video play failed:", e);
          });
        }

        animRef.current = requestAnimationFrame(scan);
      } catch (err: any) {
        console.error("Camera capture error:", err);
        onError(err.message || "Failed to access camera. Please verify camera permissions are granted.");
      }
    }

    function scan() {
      if (!isMounted) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

          try {
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "dontInvert"
            });
            if (code && code.data) {
              onScan(code.data);
              return; // Stop scan loop
            }
          } catch (e) {
            console.error("jsQR scan error:", e);
          }
        }
      }
      animRef.current = requestAnimationFrame(scan);
    }

    initCamera();

    return () => {
      isMounted = false;
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [onScan, onError]);

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        muted
        playsInline
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Viewfinder Grid Overlay */}
      <div className="absolute inset-0 border-[30px] border-black/80 pointer-events-none z-10" />
      <div className="w-64 h-64 border-2 border-white/20 rounded-3xl relative flex items-center justify-center overflow-hidden z-20 pointer-events-none">
        {/* Corners */}
        <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-amber-500 rounded-tl-lg" />
        <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-amber-500 rounded-tr-lg" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-amber-500 rounded-bl-lg" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-amber-500 rounded-br-lg" />

        {/* Laser Animation */}
        <div className="absolute left-0 right-0 h-1 bg-amber-500 opacity-80 shadow-[0_0_15px_rgba(245,158,11,0.8)] animate-pulse"
          style={{
            animation: "scanner-laser 2s ease-in-out infinite",
            top: "0%"
          }}
        />
      </div>
    </div>
  );
}
