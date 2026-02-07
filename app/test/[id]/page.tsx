"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, FileText, Code, MessageSquare, CheckCircle2, Shield, ArrowRight, Brain } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

interface Job {
    id: string
    title: string
    company: string
    description: string
    parsed_skills?: {
        technical: string[]
        soft: string[]
        tools: string[]
        domain_knowledge: string[]
    }
    experience_level?: string
    config?: {
        duration_minutes: number
        passing_percentage: number
    }
    questions?: any[]
}

export default function AssessmentLinkPage() {
    const params = useParams()
    const router = useRouter()
    const assessmentId = params.id as string
    const { user, loading: authLoading } = useAuth()
    const [job, setJob] = useState<Job | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadJob = async () => {
            try {
                // Try Supabase first
                const { getJobById } = await import('@/lib/jobService')
                const supabaseJob = await getJobById(assessmentId)
                
                if (supabaseJob) {
                    // Format job for component
                    const formattedJob: Job = {
                        id: supabaseJob.id,
                        title: supabaseJob.title,
                        company: supabaseJob.company || '',
                        description: supabaseJob.description || '',
                        parsed_skills: supabaseJob.parsed_skills || { technical: [], soft: [], tools: [], domain_knowledge: [] },
                        experience_level: supabaseJob.experience_level || 'fresher',
                        config: supabaseJob.assessment?.config || {
                            mcq_count: 10,
                            mcq_weightage: 30,
                            subjective_count: 3,
                            subjective_weightage: 30,
                            coding_count: 2,
                            coding_weightage: 40,
                            duration_minutes: 60,
                            passing_percentage: 50
                        },
                        questions: supabaseJob.questions || [],
                        status: supabaseJob.status || 'active'
                    }
                    setJob(formattedJob)
                } else {
                    // Fallback to localStorage
                    const savedJobs = JSON.parse(localStorage.getItem('assessai_jobs') || '[]')
                    const foundJob = savedJobs.find((j: Job) => j.id === assessmentId)
                    if (foundJob) {
                        setJob(foundJob)
                    }
                }
            } catch (error) {
                console.error('Error loading job:', error)
                // Fallback to localStorage
                const savedJobs = JSON.parse(localStorage.getItem('assessai_jobs') || '[]')
                const foundJob = savedJobs.find((j: Job) => j.id === assessmentId)
                if (foundJob) {
                    setJob(foundJob)
                }
            } finally {
                setLoading(false)
            }
        }
        
        loadJob()
    }, [assessmentId])

    const handleStart = () => {
        // If user is logged in and has name/email, skip info page
        if (user && user.email && (user.user_metadata?.full_name || user.user_metadata?.name)) {
            // Auto-save candidate info and go directly to assessment
            const candidateInfo = {
                name: user.user_metadata?.full_name || user.user_metadata?.name || user.email.split('@')[0],
                email: user.email,
                assessmentId,
                startedAt: new Date().toISOString(),
                userId: user.id // Store user ID for logged-in users
            }
            sessionStorage.setItem(`candidate_info_${assessmentId}`, JSON.stringify(candidateInfo))
            router.push(`/test/${assessmentId}/assessment`)
        } else {
            // Redirect to candidate info collection
            router.push(`/test/${assessmentId}/info`)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
            </div>
        )
    }

    if (!job) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
                <Card className="max-w-md w-full">
                    <CardHeader>
                        <CardTitle className="text-red-600">Assessment Not Found</CardTitle>
                        <CardDescription>The assessment link you're looking for doesn't exist or has expired.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    const allSkills = [
        ...(job.parsed_skills?.technical || []),
        ...(job.parsed_skills?.tools || []),
        ...(job.parsed_skills?.domain_knowledge || [])
    ]

    const duration = job.config?.duration_minutes || 60
    const questionCount = job.questions?.length || 0
    const mcqCount = job.questions?.filter(q => q.type === 'mcq').length || 0
    const subjectiveCount = job.questions?.filter(q => q.type === 'subjective').length || 0
    const codingCount = job.questions?.filter(q => q.type === 'coding').length || 0

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            <div className="container mx-auto px-4 py-12 max-w-4xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm mb-4">
                        <Brain className="w-5 h-5 text-primary" />
                        <span className="font-semibold text-gray-900">AssessAI Assessment</span>
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-3">{job.title}</h1>
                    <p className="text-xl text-gray-600">{job.company}</p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    {/* Assessment Overview */}
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="w-5 h-5 text-primary" />
                                Assessment Overview
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3 text-gray-700">
                                <Clock className="w-5 h-5 text-gray-400" />
                                <div>
                                    <div className="font-semibold">Duration</div>
                                    <div className="text-sm text-gray-500">{duration} minutes</div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3 text-gray-700">
                                <FileText className="w-5 h-5 text-gray-400" />
                                <div>
                                    <div className="font-semibold">Total Questions</div>
                                    <div className="text-sm text-gray-500">{questionCount} questions</div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-200">
                                <div className="text-sm font-semibold text-gray-700 mb-2">Question Breakdown:</div>
                                <div className="flex flex-wrap gap-2">
                                    {mcqCount > 0 && (
                                        <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                                            {mcqCount} MCQs
                                        </Badge>
                                    )}
                                    {subjectiveCount > 0 && (
                                        <Badge variant="secondary" className="bg-purple-50 text-purple-700">
                                            {subjectiveCount} Subjective
                                        </Badge>
                                    )}
                                    {codingCount > 0 && (
                                        <Badge variant="secondary" className="bg-green-50 text-green-700">
                                            {codingCount} Coding
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Skills Being Evaluated */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Code className="w-5 h-5 text-primary" />
                                Skills Evaluated
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {allSkills.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {allSkills.slice(0, 10).map((skill, idx) => (
                                        <Badge key={idx} variant="outline" className="text-xs">
                                            {skill}
                                        </Badge>
                                    ))}
                                    {allSkills.length > 10 && (
                                        <Badge variant="outline" className="text-xs">
                                            +{allSkills.length - 10} more
                                        </Badge>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">Skills will be evaluated based on your responses.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Instructions */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-primary" />
                            Instructions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3 text-gray-700">
                            <li className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <div className="font-semibold">No Signup Required</div>
                                    <div className="text-sm text-gray-500">Just provide your name, email, and resume to get started.</div>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <div className="font-semibold">Sequential Sections</div>
                                    <div className="text-sm text-gray-500">Complete MCQs first, then subjective questions, and finally coding challenges.</div>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <div className="font-semibold">Auto-Save</div>
                                    <div className="text-sm text-gray-500">Your answers are automatically saved as you progress.</div>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <div className="font-semibold">Time Limit</div>
                                    <div className="text-sm text-gray-500">You have {duration} minutes to complete the assessment. Timer starts when you begin.</div>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <div className="font-semibold">Fair Assessment</div>
                                    <div className="text-sm text-gray-500">The system monitors assessment integrity to ensure fairness for all candidates.</div>
                                </div>
                            </li>
                        </ul>
                    </CardContent>
                </Card>

                {/* CTA */}
                <div className="text-center">
                    <Button 
                        onClick={handleStart}
                        size="lg"
                        className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg"
                    >
                        Start Assessment
                        <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                    <p className="text-sm text-gray-500 mt-4">No account creation required • Takes about {duration} minutes</p>
                </div>
            </div>
        </div>
    )
}
