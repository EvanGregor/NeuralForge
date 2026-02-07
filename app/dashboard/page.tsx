"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Brain,
  BookOpen,
  Code,
  MessageSquare,
  FileText,
  Award,
  TrendingUp,
  Users,
  Bell,
  Settings,
  LogOut,
  Upload,
  Target,
  Clock,
  Star,
  User,
  ChevronDown,
  Download,
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useResume } from "../contexts/ResumeContext"
import { getResumeData } from "@/lib/resumeService"

export default function Dashboard() {
  const { user: authUser, signOut, loading } = useAuth()
  const { resumeData, setResumeData, loadUserData, clearUserData } = useResume()
  const router = useRouter()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !authUser) {
      router.push("/login")
    }
  }, [authUser, loading, router])

  // Load user-specific resume data when user changes
  useEffect(() => {
    const loadResumeData = async () => {
      if (authUser?.id) {
        // Load user-specific data from localStorage first
        loadUserData(authUser.id)

        // Then try to load from Supabase
        try {
          const data = await getResumeData(authUser.id)
          if (data) {
            setResumeData({
              atsScore: data.ats_score,
              skills: data.skills || [],
              analysis: data.analysis || { strengths: [], improvements: [], overall: '' },
              personalInfo: data.personal_info || { name: '', email: '', phone: '', address: '' },
              experience: data.experience || [],
              education: data.education || [],
              summary: data.summary || '',
              achievements: data.achievements || [],
              certifications: data.certifications || [],
              languages: data.languages || [],
              projects: data.projects || [],
              lastUpdated: data.updated_at || new Date().toISOString()
            })
          }
        } catch (error) {
          console.error('Failed to load resume data from Supabase:', error)
          // Keep localStorage data if Supabase fails
        }
      } else {
        // Clear data when user logs out
        clearUserData()
      }
    }

    loadResumeData()
  }, [authUser?.id, loadUserData, clearUserData, setResumeData])

  // Get user data from auth user
  const user = {
    name: authUser?.user_metadata?.full_name || authUser?.email?.split('@')[0] || "User",
    email: authUser?.email || "",
    role: authUser?.user_metadata?.role || "Developer",
    location: authUser?.user_metadata?.location || "Unknown",
    avatar: authUser?.user_metadata?.avatar_url || null, // Will use initials if null
  }

  // Check if user is admin
  const isAdmin = user.email === "admin@gmail.com"

  // Generate initials from user name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Calculate stats based on current resume data
  const stats = {
    overallProgress: 68,
    testsCompleted: 12,
    skillsImproved: resumeData?.skills?.length || 0,
    resumeScore: resumeData?.atsScore || 0,
  }

  const modules = [
    {
      id: "jobs",
      title: "Browse Jobs",
      description: "Find opportunities that match your skills",
      icon: Target,
      progress: 0,
      color: "red",
      completed: 0,
      total: 10,
      route: "/jobs",
    },
    {
      id: "assessments",
      title: "My Assessments",
      description: "View your completed assessments",
      icon: Award,
      progress: 0,
      color: "red",
      completed: 0,
      total: 10,
      route: "/dashboard",
    },
  ]


  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Brain className="w-5 h-5 text-white animate-pulse" />
          </div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="border-b bg-gray-900/95 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">
              AssessAI
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-3 hover:bg-gray-800 rounded-lg p-2 transition-colors"
              >
                <Avatar>
                  <AvatarImage src={user.avatar || ""} alt={user.name} />
                  <AvatarFallback className="bg-red-600 text-white font-semibold">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-white">{user.name}</p>
                  <p className="text-xs text-gray-300">{user.role}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-300" />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="py-2">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-800">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        console.log("Edit Profile clicked")
                        setIsDropdownOpen(false) // Close dropdown first
                        router.push("/edit-profile")
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <User className="w-4 h-4" />
                      <span>Edit Profile</span>
                    </button>
                    <div className="border-t border-gray-100 mt-1">
                      <button
                        onClick={signOut}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50 flex items-center space-x-2"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome, {user.name}!</h1>
          <p className="text-gray-300">Continue your journey to become a successful {user.role}</p>
        </div>

        {/* Admin Layout - Special 2 Column Layout */}
        {isAdmin ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Left Column - Resume Score + Salary Prediction */}
            <div className="space-y-6">
              {/* Resume Score Card */}
              <Card className="border-gray-200 bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Resume Score</p>
                      <p className="text-2xl font-bold text-black">{stats.resumeScore}%</p>
                    </div>
                    <Star className="w-8 h-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>

              {/* Salary Prediction */}
              <Card className="bg-black text-white">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Salary Prediction</CardTitle>
                  <CardDescription className="text-gray-300">Based on your profile</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <p className="text-3xl font-bold">₹8.5L - ₹12L</p>
                    <p className="text-sm text-gray-300 mt-1">Expected Annual Package</p>
                    <Link href="/jobs">
                      <Button className="w-full mt-4 bg-white text-black hover:bg-gray-100">View Details</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Quick Actions + Recent Activity */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card className="bg-white border-gray-200">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-gray-800">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/jobs">
                    <Button className="w-full justify-start bg-transparent border-gray-300 text-gray-700 hover:bg-gray-50" variant="outline">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Resume
                    </Button>
                  </Link>
                  <Link href="/jobs">
                    <Button className="w-full justify-start bg-transparent border-gray-300 text-gray-700 hover:bg-gray-50" variant="outline">
                      <Clock className="w-4 h-4 mr-2" />
                      Take Mock Test
                    </Button>
                  </Link>
                  <Link href="/jobs">
                    <Button className="w-full justify-start bg-transparent border-gray-300 text-gray-700 hover:bg-gray-50" variant="outline">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      View Salary Insights
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          /* Regular User Layout - All Stats */
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="border-gray-200 bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Overall Progress</p>
                    <p className="text-2xl font-bold text-black">{stats.overallProgress}%</p>
                  </div>
                  <Target className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200 bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Tests Completed</p>
                    <p className="text-2xl font-bold text-black">{stats.testsCompleted}</p>
                  </div>
                  <Award className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200 bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Skills Improved</p>
                    <p className="text-2xl font-bold text-black">{stats.skillsImproved}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200 bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Resume Score</p>
                    <p className="text-2xl font-bold text-black">{stats.resumeScore}%</p>
                  </div>
                  <Star className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Sidebar for Regular Users */}
        {!isAdmin && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Learning Modules</h2>
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Learning Modules */}
              <div className="lg:col-span-2">
                <div className="grid md:grid-cols-2 gap-4">
                  {modules.map((module) => {
                    const IconComponent = module.icon
                    return (
                      <Card key={module.id} className="hover:shadow-lg hover:-translate-y-2 transition-all duration-300 cursor-pointer border-gray-200 bg-white">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <IconComponent className="w-8 h-8 text-red-600" />
                          </div>
                          <CardTitle className="text-lg text-gray-800">{module.title}</CardTitle>
                          <CardDescription className="text-gray-600">{module.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Link href={module.route}>
                            <Button className="w-full mt-4 bg-black hover:bg-gray-800 text-white" variant="default">
                              Continue Learning
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>

              {/* Sidebar */}
              <div className="flex flex-col space-y-4">
                {/* Quick Actions */}
                <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow duration-300 h-full">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-gray-800">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Link href="/jobs">
                      <Button className="w-full justify-start bg-transparent border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-red-300 transition-colors" variant="outline">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Resume
                      </Button>
                    </Link>
                    <Link href="/modules/aptitude">
                      <Button className="w-full justify-start bg-transparent border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-red-300 transition-colors" variant="outline">
                        <Clock className="w-4 h-4 mr-2" />
                        Take Mock Test
                      </Button>
                    </Link>
                    <Link href="/jobs">
                      <Button className="w-full justify-start bg-transparent border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-red-300 transition-colors" variant="outline">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        View Salary Insights
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* Skills Card */}
                <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow duration-300 h-full">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-gray-800">Your Skills</CardTitle>
                    <CardDescription className="text-gray-600 text-sm">
                      Skills extracted from your resume
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {resumeData?.skills && resumeData.skills.length > 0 ? (
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {resumeData.skills.slice(0, 6).map((skill, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {resumeData.skills.length > 6 && (
                            <Badge variant="outline" className="text-xs">
                              +{resumeData.skills.length - 6} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-3">
                        <p className="text-sm text-gray-500 mb-2">No skills detected yet</p>
                        <Link href="/jobs">
                          <Button size="sm" variant="outline">
                            Upload Resume
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Salary Prediction */}
                <Card className="bg-black text-white hover:shadow-xl transition-shadow duration-300 h-full">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Salary Prediction</CardTitle>
                    <CardDescription className="text-gray-300 text-sm">Based on your profile</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <p className="text-2xl font-bold">₹8.5L - ₹12L</p>
                      <p className="text-sm text-gray-300 mt-1">Expected Annual Package</p>
                      <Link href="/jobs">
                        <Button className="w-full mt-3 bg-white text-black hover:bg-gray-100">View Details</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* Learning Modules - Only for Admin Users */}
        {isAdmin && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Learning Modules</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {modules.map((module) => {
                const IconComponent = module.icon
                return (
                  <Card key={module.id} className="hover:shadow-lg hover:-translate-y-2 transition-all duration-300 cursor-pointer border-gray-200 bg-white">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <IconComponent className="w-8 h-8 text-red-600" />
                      </div>
                      <CardTitle className="text-lg text-gray-800">{module.title}</CardTitle>
                      <CardDescription className="text-gray-600">{module.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Link href={module.route}>
                        <Button className="w-full mt-4 bg-black hover:bg-gray-800 text-white" variant="default">
                          Continue Learning
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
