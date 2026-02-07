"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Clock, FileText, Home, LayoutDashboard } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

export default function SubmittedPage() {
    const params = useParams()
    const router = useRouter()
    const assessmentId = params.id as string
    const { user } = useAuth()
    const [job, setJob] = useState<any>(null)

    useEffect(() => {
        const loadJob = async () => {
            try {
                // Try Supabase first
                const { getJobById } = await import('@/lib/jobService')
                const supabaseJob = await getJobById(assessmentId)
                
                if (supabaseJob) {
                    setJob({
                        id: supabaseJob.id,
                        title: supabaseJob.title,
                        company: supabaseJob.company || ''
                    })
                } else {
                    // Fallback to localStorage
                    const savedJobs = JSON.parse(localStorage.getItem('assessai_jobs') || '[]')
                    const foundJob = savedJobs.find((j: any) => j.id === assessmentId)
                    if (foundJob) {
                        setJob(foundJob)
                    }
                }
            } catch (error) {
                console.error('Error loading job:', error)
                // Fallback to localStorage
                const savedJobs = JSON.parse(localStorage.getItem('assessai_jobs') || '[]')
                const foundJob = savedJobs.find((j: any) => j.id === assessmentId)
                if (foundJob) {
                    setJob(foundJob)
                }
            }
        }
        
        loadJob()
    }, [assessmentId])

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
            <Card className="max-w-2xl w-full">
                <CardContent className="pt-12 pb-8 px-8 text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-10 h-10 text-green-600" />
                    </div>

                    <CardTitle className="text-3xl font-bold text-gray-900 mb-3">
                        Assessment Submitted Successfully!
                    </CardTitle>
                    
                    <p className="text-gray-600 mb-8 text-lg">
                        Thank you for completing the assessment for <span className="font-semibold">{job?.title}</span> at <span className="font-semibold">{job?.company}</span>.
                    </p>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 text-left">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-primary" />
                            What Happens Next?
                        </h3>
                        <ul className="space-y-3 text-sm text-gray-700">
                            <li className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <div className="font-medium">Your responses are being evaluated</div>
                                    <div className="text-gray-500">Our AI system is analyzing your answers and resume.</div>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <div className="font-medium">Recruiter will review your assessment</div>
                                    <div className="text-gray-500">The hiring team will be notified and review your submission.</div>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <div className="font-medium">You'll hear back soon</div>
                                    <div className="text-gray-500">If selected, the recruiter will contact you via email.</div>
                                </div>
                            </li>
                        </ul>
                    </div>

                    <div className="flex gap-4 justify-center">
                        {user ? (
                            <Button
                                onClick={() => router.push('/candidate/dashboard')}
                                className="bg-primary hover:bg-primary/90"
                            >
                                <LayoutDashboard className="w-4 h-4 mr-2" />
                                Go to Dashboard
                            </Button>
                        ) : (
                            <Button
                                variant="outline"
                                onClick={() => router.push('/')}
                            >
                                <Home className="w-4 h-4 mr-2" />
                                Go to Homepage
                            </Button>
                        )}
                    </div>

                    <p className="text-sm text-gray-500 mt-6">
                        Your assessment has been securely saved. {user ? 'You can view it in your dashboard.' : 'You can close this page.'}
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
