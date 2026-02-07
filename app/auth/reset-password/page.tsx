"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // NOTE: We intentionally do NOT redirect away if there is no immediate
  // session yet. When the user clicks the reset link, Supabase will attach
  // a one-time token in the URL, and the session may not be available the
  // instant this component mounts. Instead, we rely on supabase.auth.updateUser
  // to fail gracefully if the token is invalid/expired and show an error.

  const handleUpdatePassword = async () => {
    if (!password || !confirmPassword) {
      setError("Please fill in both password fields")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)
    setError("")

    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      setError(error.message || "Failed to update password")
      return
    }

    router.replace("/login")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <Card className="bg-white border border-gray-200 shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-800">Reset your password</CardTitle>
            <CardDescription className="text-gray-600">
              Enter a new password for your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">New password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Confirm new password</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
            <Button
              onClick={handleUpdatePassword}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? "Updating..." : "Update password"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
