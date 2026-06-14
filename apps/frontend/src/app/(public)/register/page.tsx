"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Hotel, UtensilsCrossed, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react"

export default function RegisterPage() {
  const [step, setStep] = React.useState(1)
  const [formData, setFormData] = React.useState({
    businessName: "",
    businessType: "HOTEL", // HOTEL, RESTAURANT, HOTEL_RESTAURANT
    ownerName: "",
    email: "",
    phone: "",
    password: "",
  })
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isSuccess, setIsSuccess] = React.useState(false)

  const handleNext = () => setStep((s) => s + 1)
  const handlePrev = () => setStep((s) => Math.max(1, s - 1))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const res = await fetch("/api/tenant/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        setIsSuccess(true)
      } else {
        alert("Registration failed. Please try again.")
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 50 : -50,
      opacity: 0,
    }),
  }

  if (isSuccess) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full">
          <Card className="text-center p-8">
            <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <CardTitle className="text-2xl mb-2">Registration Complete!</CardTitle>
            <CardDescription className="text-base mb-6">
              Your business has been successfully registered. You are currently in a pending state until a Super Admin approves your account.
            </CardDescription>
            <Button className="w-full" onClick={() => window.location.href = "/"}>
              Return Home
            </Button>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="max-w-xl w-full">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Create your account</h1>
          <p className="text-[var(--muted)]">Join HospitalityHub and manage your business efficiently.</p>
        </div>

        {/* Step Indicators */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-2">
            {[1, 2, 3].map((i) => (
              <React.Fragment key={i}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${step >= i ? 'bg-[var(--color-primary-600)] text-white' : 'bg-[var(--surface-hover)] text-[var(--muted)]'}`}>
                  {i}
                </div>
                {i < 3 && <div className={`w-12 h-1 transition-colors ${step > i ? 'bg-[var(--color-primary-600)]' : 'bg-[var(--surface-hover)]'}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        <Card className="overflow-hidden glass relative">
          <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
            <AnimatePresence mode="wait" custom={1}>
              {step === 1 && (
                <motion.div
                  key="step1"
                  custom={1}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                >
                  <CardHeader>
                    <CardTitle>Business Details</CardTitle>
                    <CardDescription>Tell us about your establishment.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Business Name</label>
                      <Input 
                        required 
                        placeholder="Grand Hotel & Spa" 
                        value={formData.businessName}
                        onChange={e => setFormData({...formData, businessName: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Business Type</label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => setFormData({...formData, businessType: 'HOTEL'})}
                          className={`p-4 border rounded-lg flex flex-col items-center justify-center space-y-2 transition-all ${formData.businessType === 'HOTEL' ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-50)] text-[var(--color-primary-900)] dark:bg-[var(--color-primary-900)]/20 dark:text-blue-400 ring-1 ring-[var(--color-primary-500)]' : 'border-[var(--surface-border)] hover:bg-[var(--surface-hover)]'}`}
                        >
                          <Hotel className="w-6 h-6" />
                          <span className="font-medium text-sm">Hotel</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({...formData, businessType: 'RESTAURANT'})}
                          className={`p-4 border rounded-lg flex flex-col items-center justify-center space-y-2 transition-all ${formData.businessType === 'RESTAURANT' ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-50)] text-[var(--color-primary-900)] dark:bg-[var(--color-primary-900)]/20 dark:text-blue-400 ring-1 ring-[var(--color-primary-500)]' : 'border-[var(--surface-border)] hover:bg-[var(--surface-hover)]'}`}
                        >
                          <UtensilsCrossed className="w-6 h-6" />
                          <span className="font-medium text-sm">Restaurant</span>
                        </button>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="justify-end">
                    <Button type="submit" disabled={!formData.businessName}>
                      Next <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </CardFooter>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  custom={1}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                >
                  <CardHeader>
                    <CardTitle>Owner Information</CardTitle>
                    <CardDescription>We need this to create your administrative account.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Full Name</label>
                      <Input 
                        required 
                        placeholder="John Doe"
                        value={formData.ownerName}
                        onChange={e => setFormData({...formData, ownerName: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email Address</label>
                      <Input 
                        type="email" 
                        required 
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Phone Number</label>
                      <Input 
                        required 
                        placeholder="+1 (555) 000-0000"
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="justify-between">
                    <Button variant="ghost" type="button" onClick={handlePrev}>
                      <ArrowLeft className="mr-2 w-4 h-4" /> Back
                    </Button>
                    <Button type="submit" disabled={!formData.ownerName || !formData.email || !formData.phone}>
                      Next <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </CardFooter>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  custom={1}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                >
                  <CardHeader>
                    <CardTitle>Secure Account</CardTitle>
                    <CardDescription>Set a password for your admin account.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Password</label>
                      <Input 
                        type="password" 
                        required 
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                      />
                    </div>
                    
                    <div className="mt-6 p-4 bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-900)]/20 rounded-lg text-sm">
                      <h4 className="font-semibold text-[var(--color-primary-900)] dark:text-blue-300 mb-2">What happens next?</h4>
                      <ul className="space-y-2 text-[var(--muted)] dark:text-blue-100/70">
                        <li className="flex items-start"><CheckCircle2 className="w-4 h-4 mr-2 mt-0.5 text-[var(--color-primary-500)] shrink-0" /> Your tenant workspace will be created.</li>
                        <li className="flex items-start"><CheckCircle2 className="w-4 h-4 mr-2 mt-0.5 text-[var(--color-primary-500)] shrink-0" /> A 14-day free trial will be automatically initiated.</li>
                        <li className="flex items-start"><CheckCircle2 className="w-4 h-4 mr-2 mt-0.5 text-[var(--color-primary-500)] shrink-0" /> You will wait for Super Admin approval before going live.</li>
                      </ul>
                    </div>
                  </CardContent>
                  <CardFooter className="justify-between">
                    <Button variant="ghost" type="button" onClick={handlePrev} disabled={isSubmitting}>
                      <ArrowLeft className="mr-2 w-4 h-4" /> Back
                    </Button>
                    <Button type="submit" disabled={!formData.password || isSubmitting} isLoading={isSubmitting}>
                      Complete Registration
                    </Button>
                  </CardFooter>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </Card>
      </div>
    </div>
  )
}
