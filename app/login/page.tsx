"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/AuthContext"
import { Brain, Linkedin, Github } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const { signIn } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const { data, error } = await signIn(email, password)

      if (error) throw error

      if (data.user) {
        const accountType = data.user.user_metadata?.account_type
        if (accountType === 'recruiter') {
          router.push('/recruiter/dashboard')
        } else {
          router.push('/candidate/dashboard')
        }
      }
    } catch (err: any) {
      console.error(err)
      setError("Invalid email or password")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex w-full">
      {/* ========== LEFT: TESTIMONIAL / BRAND ========== */}
      <div className="hidden lg:flex flex-1 bg-gray-900 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-gray-900 opacity-90" />
        <img
          src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80"
          alt="Office"
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-20"
        />

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3 text-white">
            <div className="w-8 h-8 rounded bg-white/10 backdrop-blur flex items-center justify-center">
              <Brain className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold">AssessAI</span>
          </Link>
        </div>

        <div className="relative z-10 max-w-lg">
          <blockquote className="space-y-6">
            <p className="text-2xl font-medium text-white leading-relaxed">
              "AssessAI has completely transformed how we evaluate candidates. The AI insights are incredibly accurate and save us hours per hire."
            </p>
            <footer className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-700 overflow-hidden">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" alt="Sarah" />
              </div>
              <div>
                <div className="font-semibold text-white">Sarah Jenkins</div>
                <div className="text-blue-200 text-sm">Head of Talent, TechFlow</div>
              </div>
            </footer>
          </blockquote>
        </div>

        <div className="relative z-10 text-gray-400 text-sm">
          © 2024 AssessAI Inc.
        </div>
      </div>

      {/* ========== RIGHT: FORM ========== */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome back</h1>
            <p className="text-gray-500 mt-2">Enter your credentials to access your workspace</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                className="input-clean h-11"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" className="text-sm font-medium text-primary hover:text-blue-700">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                className="input-clean h-11"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm font-medium border border-red-200">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full h-11 btn-primary" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="h-11 border-gray-200 hover:bg-gray-50">
              <Github className="mr-2 h-4 w-4" />
              GitHub
            </Button>
            <Button variant="outline" className="h-11 border-gray-200 hover:bg-gray-50">
              <Linkedin className="mr-2 h-4 w-4 text-blue-600" />
              LinkedIn
            </Button>
          </div>

          <p className="text-center text-sm text-gray-500">
            Don't have an account?{" "}
            <Link href="/signup" className="font-semibold text-primary hover:text-blue-700">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
