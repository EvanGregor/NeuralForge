"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/AuthContext"
import { Brain, User, Briefcase, ChevronRight } from "lucide-react"

export default function SignupPage() {
  const router = useRouter()
  const { signUp } = useAuth()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    accountType: "candidate" // 'candidate' | 'recruiter'
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const { data, error } = await signUp(formData.email, formData.password, {
        full_name: formData.fullName,
        account_type: formData.accountType,
        role: formData.accountType // Also send as 'role' for database trigger compatibility
      })

      if (error) throw error

      if (data.user) {
        // Successful signup, redirect to respective dashboard
        if (formData.accountType === 'recruiter') {
          router.push('/recruiter/dashboard')
        } else {
          router.push('/candidate/dashboard')
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex w-full">
      {/* ========== LEFT: BRANDING ========== */}
      <div className="hidden lg:flex flex-1 bg-blue-600 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-700 to-indigo-600" />

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3 text-white">
            <div className="w-8 h-8 rounded bg-white/20 backdrop-blur flex items-center justify-center">
              <Brain className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold">AssessAI</span>
          </Link>
        </div>

        <div className="relative z-10 max-w-lg text-white">
          <h2 className="text-4xl font-bold mb-6">Join the future of hiring</h2>
          <ul className="space-y-4 text-blue-100">
            <li className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center"><ChevronRight className="w-4 h-4" /></div>
              <span>AI-powered candidate screening</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center"><ChevronRight className="w-4 h-4" /></div>
              <span>Automated technical assessments</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center"><ChevronRight className="w-4 h-4" /></div>
              <span>Bias-free evaluation process</span>
            </li>
          </ul>
        </div>

        <div className="relative z-10 text-blue-200 text-sm">
          Privacy Policy &bull; Terms of Service
        </div>
      </div>

      {/* ========== RIGHT: SIGNUP FORM ========== */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white overflow-y-auto">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Create an account</h1>
            <p className="text-gray-500 mt-2">Get started with your free trial today</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-6">
            {/* Account Type */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleInputChange("accountType", "candidate")}
                className={`p-4 rounded-lg border text-left transition-all ${formData.accountType === 'candidate'
                  ? 'border-primary bg-blue-50 ring-1 ring-primary'
                  : 'border-gray-200 hover:border-gray-300'
                  }`}
              >
                <div className={`p-2 w-fit rounded-md mb-3 ${formData.accountType === 'candidate' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}>
                  <User className="w-5 h-5" />
                </div>
                <div className="font-semibold text-sm text-gray-900">Candidate</div>
                <div className="text-xs text-gray-500 mt-1">I want a job</div>
              </button>

              <button
                type="button"
                onClick={() => handleInputChange("accountType", "recruiter")}
                className={`p-4 rounded-lg border text-left transition-all ${formData.accountType === 'recruiter'
                  ? 'border-primary bg-blue-50 ring-1 ring-primary'
                  : 'border-gray-200 hover:border-gray-300'
                  }`}
              >
                <div className={`p-2 w-fit rounded-md mb-3 ${formData.accountType === 'recruiter' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}>
                  <Briefcase className="w-5 h-5" />
                </div>
                <div className="font-semibold text-sm text-gray-900">Recruiter</div>
                <div className="text-xs text-gray-500 mt-1">I want to hire</div>
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  className="input-clean h-11"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange("fullName", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Work Email</Label>
                <Input
                  id="email"
                  type="email"
                  className="input-clean h-11"
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  className="input-clean h-11"
                  placeholder="Min. 8 characters"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-11 btn-primary" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-primary hover:text-blue-700">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
