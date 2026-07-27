// [ignoring loop detection]
"use client"
import * as React from "react"
import { Loader2 } from "lucide-react"
import { RestaurantProfileCard, RestaurantEmptyState } from "./components/RestaurantProfileCard"
import { RestaurantEditModal } from "./components/RestaurantEditModal"

interface Restaurant {
  id: string; name: string; logo_url?: string | null; banner_url?: string | null; created_at: string
  tenant?: { owner_name: string; email: string; phone?: string | null; business_type: string; status: string } | null
}

export default function MyRestaurant() {
  const [restaurant, setRestaurant] = React.useState<Restaurant | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [showRestForm, setShowRestForm] = React.useState(false)
  const [restForm, setRestForm] = React.useState({ name: "", logo_url: "", banner_url: "" })
  const [restSubmitting, setRestSubmitting] = React.useState(false)
  const [restError, setRestError] = React.useState("")
  const [logoUploading, setLogoUploading] = React.useState(false)
  const [bannerUploading, setBannerUploading] = React.useState(false)

  const loadData = React.useCallback(async () => {
    setLoading(true)
    try {
      const myRes = await fetch("/api/restaurant/my")
      setRestaurant(myRes.ok ? await myRes.json() : null)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [])

  React.useEffect(() => { loadData() }, [loadData])

  const uploadImage = async (file: File, field: "logo_url" | "banner_url", setUploading: (v: boolean) => void) => {
    setUploading(true)
    const formData = new FormData()
    formData.append("image", file)
    try {
      const res = await fetch("/api/upload/image", { method: "POST", body: formData })
      const data = await res.json()
      if (res.ok && data.success) setRestForm(f => ({ ...f, [field]: data.data.url }))
      else setRestError(data.error || "Failed to upload image")
    } catch { setRestError("Network error uploading image") }
    finally { setUploading(false) }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    await uploadImage(file, "logo_url", setLogoUploading)
  }

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    await uploadImage(file, "banner_url", setBannerUploading)
  }

  const openRestEdit = () => {
    setRestForm({ name: restaurant?.name ?? "", logo_url: restaurant?.logo_url ?? "", banner_url: restaurant?.banner_url ?? "" })
    setRestError(""); setShowRestForm(true)
  }

  const handleRestSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!restForm.name.trim()) { setRestError("Restaurant name is required."); return }
    setRestSubmitting(true); setRestError("")
    try {
      const res = await fetch("/api/restaurant/my", { method: restaurant ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: restForm.name.trim(), logo_url: restForm.logo_url || null, banner_url: restForm.banner_url || null }) })
      const data = await res.json()
      if (!res.ok) { setRestError(data.error ?? "Something went wrong"); return }
      setRestaurant(prev => prev ? { ...prev, ...data } : data)
      setShowRestForm(false)
    } catch { setRestError("Network error. Please try again.") }
    finally { setRestSubmitting(false) }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary-600)]" /></div>

  return (
    <div className="space-y-6">
      {restaurant ? (
        <RestaurantProfileCard restaurant={restaurant} onEdit={openRestEdit} />
      ) : (
        <RestaurantEmptyState onSetup={() => { setRestForm({ name: "", logo_url: "", banner_url: "" }); setRestError(""); setShowRestForm(true) }} />
      )}

      <RestaurantEditModal show={showRestForm} restForm={restForm} setRestForm={setRestForm} isEdit={!!restaurant}
        submitting={restSubmitting} error={restError} logoUploading={logoUploading} bannerUploading={bannerUploading}
        onClose={() => setShowRestForm(false)} onSubmit={handleRestSubmit} onLogoUpload={handleLogoUpload} onBannerUpload={handleBannerUpload} />
    </div>
  )
}
