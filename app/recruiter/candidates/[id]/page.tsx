"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
    Brain,
    ArrowLeft,
    User,
    Mail,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Download,
    Clock,
    FileText,
    Code,
    MessageSquare,
    TrendingUp,
    Shield,
    Briefcase
} from "lucide-react"
import { getSubmissionById, updateSubmissionStatus } from "@/lib/submissionService"
import { CandidateSubmission } from "@/lib/submissionService"
import { toast } from "sonner"
import { ChevronDown, ChevronUp } from "lucide-react"
import { getBenchmarkComparison } from "@/lib/benchmarkService"

interface SkillScore {
    skill: string
    score: number
    maxScore: number
    percentage: number
}

interface CandidateReport {
    id: string
    name: string
    email: string
    jobTitle: string
    company: string
    submittedAt: string
    timeSpent: number
    status: 'pending' | 'evaluated' | 'shortlisted' | 'rejected'
    // Scores
    totalScore: number
    totalPossible: number
    percentage: number
    passed: boolean
    // Section breakdown
    sections: {
        mcq: { score: number; total: number; correct: number; totalQuestions: number }
        subjective: { score: number; total: number }
        coding: { score: number; total: number }
    }
    // Skill breakdown
    skillScores: SkillScore[]
    // Resume skills (claimed)
    resumeSkills: string[]
    // Anti-cheat
    tabSwitches: number
    pasteCount: number
    // AI insights
    aiInsights: string[]
    // Mismatch warnings
    skillMismatches: {
        skill: string
        claimed: string
        actual: string
        warning: string
    }[]
}

export default function CandidateReportPage() {
    const params = useParams()
    const router = useRouter()
    const candidateId = params.id as string

    const [report, setReport] = useState<CandidateReport | null>(null)
    const [loading, setLoading] = useState(true)
    const [submission, setSubmission] = useState<CandidateSubmission | null>(null)
    const [questions, setQuestions] = useState<any[]>([])
    const [showAnswers, setShowAnswers] = useState(false)

    useEffect(() => {
        const loadSubmission = async () => {
            // Decode the candidate ID (in case it was URL encoded)
            const decodedId = decodeURIComponent(candidateId)
            
            // Load real submission data (now async)
            let submission = await getSubmissionById(decodedId)
            
            // If still not found, try the original ID
            if (!submission) {
                submission = await getSubmissionById(candidateId)
            }
            
            if (!submission) {
                console.error('Submission not found for ID:', candidateId, 'or decoded:', decodedId)
                try {
                    const { getAllSubmissions } = await import('@/lib/submissionService')
                    const allSubmissions = await getAllSubmissions()
                    console.log('Available submissions:', allSubmissions.map((s: any) => ({ 
                        id: s.id, 
                        name: s.candidateInfo?.name || 'Unknown', 
                        email: s.candidateInfo?.email || 'No email' 
                    })))
                } catch (e) {
                    console.error('Error loading submissions:', e)
                }
                setLoading(false)
                return
            }

            // Store submission for answers display
            setSubmission(submission)

            // Load questions from job (try Supabase first, fallback to localStorage)
            try {
                const { getJobById } = await import('@/lib/jobService')
                const job = await getJobById(submission.jobId)
                if (job?.questions) {
                    setQuestions(job.questions)
                } else {
                    // Fallback to localStorage
                    const savedJobs = JSON.parse(localStorage.getItem('assessai_jobs') || '[]')
                    const localJob = savedJobs.find((j: any) => j.id === submission.jobId)
                    if (localJob?.questions) {
                        setQuestions(localJob.questions)
                    }
                }
            } catch (e) {
                // Fallback to localStorage
                const savedJobs = JSON.parse(localStorage.getItem('assessai_jobs') || '[]')
                const job = savedJobs.find((j: any) => j.id === submission.jobId)
                if (job?.questions) {
                    setQuestions(job.questions)
                }
            }

            // Calculate time spent with safe defaults
            const startedAt = submission.candidateInfo?.startedAt 
                ? new Date(submission.candidateInfo.startedAt) 
                : new Date(submission.submittedAt || new Date().toISOString())
            const submittedAt = new Date(submission.submittedAt || new Date().toISOString())
            const timeSpent = Math.round((submittedAt.getTime() - startedAt.getTime()) / 60000) // minutes

            // Convert submission to report format
            const report: CandidateReport = {
                id: submission.id,
                name: submission.candidateInfo?.name || 'Unknown Candidate',
                email: submission.candidateInfo?.email || 'No email provided',
                jobTitle: submission.jobTitle || 'Unknown Job',
                company: submission.company || 'Unknown Company',
                submittedAt: submission.submittedAt || new Date().toISOString(),
                timeSpent: timeSpent || 0,
                status: submission.status || 'pending',
                totalScore: submission.scores?.totalScore || 0,
                totalPossible: submission.scores?.totalPossible || 0,
                percentage: submission.scores?.percentage || 0,
                passed: (submission.scores?.percentage || 0) >= 60, // Assuming 60% passing
                sections: {
                    mcq: submission.scores?.sectionScores?.mcq || { score: 0, total: 0, correct: 0, totalQuestions: 0 },
                    subjective: submission.scores?.sectionScores?.subjective || { score: 0, total: 0 },
                    coding: submission.scores?.sectionScores?.coding || { score: 0, total: 0 }
                },
                skillScores: submission.scores?.skillScores 
                    ? Object.entries(submission.scores.skillScores).map(([skill, data]: [string, any]) => ({
                        skill,
                        score: data.score,
                        maxScore: data.total,
                        percentage: data.percentage
                    }))
                    : [],
                resumeSkills: submission.resumeData?.skills || [],
                tabSwitches: submission.antiCheatData?.tab_switches || 0,
                pasteCount: submission.antiCheatData?.copy_paste_detected ? 1 : 0,
                aiInsights: generateAIInsights(submission),
                skillMismatches: generateSkillMismatches(submission)
            }

            setReport(report)
            setLoading(false)
        }
        
        loadSubmission()
    }, [candidateId])

    const generateAIInsights = (submission: CandidateSubmission): string[] => {
        const insights: string[] = []
        
        if (submission.scores) {
            if (submission.scores.percentage >= 80) {
                insights.push("Excellent overall performance with strong technical knowledge.")
            } else if (submission.scores.percentage >= 60) {
                insights.push("Good performance with solid understanding of core concepts.")
            } else {
                insights.push("Performance indicates need for improvement in key areas.")
            }

            // Section-specific insights
            const mcqPercent = submission.scores.sectionScores.mcq.total > 0 
                ? (submission.scores.sectionScores.mcq.score / submission.scores.sectionScores.mcq.total) * 100 
                : 0
            if (mcqPercent >= 80) {
                insights.push("Strong performance in multiple choice questions.")
            }

            const codingPercent = submission.scores.sectionScores.coding.total > 0
                ? (submission.scores.sectionScores.coding.score / submission.scores.sectionScores.coding.total) * 100
                : 0
            if (codingPercent >= 70) {
                insights.push("Good problem-solving and coding skills demonstrated.")
            }
        }

        // Anti-cheat insights
        if (submission.antiCheatData.tab_switches > 3) {
            insights.push("Multiple tab switches detected during assessment.")
        }

        return insights.length > 0 ? insights : ["Assessment completed successfully."]
    }

    const generateSkillMismatches = (submission: CandidateSubmission) => {
        const mismatches: CandidateReport['skillMismatches'] = []
        
        if (submission.resumeData?.skills && submission.scores?.skillScores) {
            const resumeSkills = submission.resumeData.skills.map((s: string) => s.toLowerCase())
            
            Object.entries(submission.scores.skillScores).forEach(([skill, data]) => {
                const skillLower = skill.toLowerCase()
                const claimedInResume = resumeSkills.some((rs: string) => rs.includes(skillLower))
                
                if (claimedInResume && data.percentage < 50) {
                    mismatches.push({
                        skill,
                        claimed: "Listed in resume",
                        actual: data.percentage < 30 ? "Below Expected" : "Needs Improvement",
                        warning: `${skill} performance (${data.percentage}%) was lower than expected based on resume.`
                    })
                }
            })
        }

        return mismatches
    }

    const handleStatusChange = async (newStatus: 'shortlisted' | 'rejected') => {
        const updated = await updateSubmissionStatus(candidateId, newStatus)
        if (updated) {
            toast.success(`Candidate ${newStatus === 'shortlisted' ? 'shortlisted' : 'rejected'}`)
            // Reload data
            const submission = await getSubmissionById(candidateId)
            if (submission) {
                const startedAt = new Date(submission.candidateInfo.startedAt)
                const submittedAt = new Date(submission.submittedAt)
                const timeSpent = Math.round((submittedAt.getTime() - startedAt.getTime()) / 60000)
                
                const updatedReport: CandidateReport = {
                    ...report!,
                    timeSpent
                }
                setReport(updatedReport)
            }
        }
    }

    const handleDownloadReport = () => {
        if (!submission || !questions) {
            toast.error('Unable to generate report: Missing data')
            return
        }
        
        try {
            const { downloadPDFReport } = require('@/lib/pdfReportGenerator')
            downloadPDFReport(submission, questions, {
                includeAnswers: true,
                includeBenchmark: false
            })
            toast.success('PDF report opened in new window. Use browser print to save as PDF.')
        } catch (error) {
            console.error('Error generating PDF:', error)
            toast.error('Failed to generate PDF report')
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        )
    }

    if (!report) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-muted-foreground">Candidate not found</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex items-center justify-between">
                <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    className="text-gray-600 hover:text-gray-900"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Candidates
                </Button>
                <div className="flex gap-2">
                    {report && (report.status === 'pending' || report.status === 'evaluated') && (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => handleStatusChange('shortlisted')}
                                className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                            >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Shortlist
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => handleStatusChange('rejected')}
                                className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject
                            </Button>
                        </>
                    )}
                    <Button
                        onClick={handleDownloadReport}
                        className="bg-primary hover:bg-primary/90"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF Report
                    </Button>
                </div>
            </div>

            {/* Candidate Header Card */}
            <Card className="bg-white border border-gray-200 shadow-sm">
                <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row items-start justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg text-white font-bold text-3xl">
                                {report.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">{report.name}</h1>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Mail className="w-4 h-4" />
                                        <span>{report.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Briefcase className="w-4 h-4" />
                                        <span>{report.jobTitle} at {report.company}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-500 font-medium uppercase tracking-wider">Overall Score</span>
                                <div className={`text-5xl font-bold ${report.passed ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {report.percentage}%
                                </div>
                            </div>
                            <Badge className={`px-3 py-1 text-sm ${report.passed
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-red-50 text-red-700 border-red-200'
                                }`}>
                                {report.passed ? <CheckCircle className="w-4 h-4 mr-1.5" /> : <XCircle className="w-4 h-4 mr-1.5" />}
                                {report.passed ? 'Qualified' : 'Not Qualified'}
                            </Badge>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 pt-6 border-t border-gray-200">
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Time Taken</p>
                            <div className="flex items-center gap-2 text-gray-900 font-semibold">
                                <Clock className="w-4 h-4 text-blue-600" />
                                {report.timeSpent} mins
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Anti-Cheat Flags</p>
                            <div className="flex items-center gap-2 text-gray-900 font-semibold">
                                <Shield className="w-4 h-4 text-amber-600" />
                                {report.tabSwitches + report.pasteCount} warnings
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Submitted On</p>
                            <div className="text-gray-700 font-medium">
                                {new Date(report.submittedAt).toLocaleDateString()}
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Status</p>
                            <Badge className={`px-2 py-1 text-xs ${
                                report.status === 'shortlisted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                report.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                report.status === 'evaluated' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                                {report.status}
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Section Scores Breakdown */}
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 px-2">Performance Breakdown</h3>

                    <Card className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                                        <FileText className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">MCQs</p>
                                        <p className="text-xs text-gray-500">Multiple Choice</p>
                                    </div>
                                </div>
                                <span className="text-xl font-bold text-blue-600">
                                    {report.sections.mcq.total > 0 ? Math.round((report.sections.mcq.score / report.sections.mcq.total) * 100) : 0}%
                                </span>
                            </div>
                            <Progress value={report.sections.mcq.total > 0 ? (report.sections.mcq.score / report.sections.mcq.total) * 100 : 0} className="h-2" />
                        </CardContent>
                    </Card>

                    <Card className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                                        <MessageSquare className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">Subjective</p>
                                        <p className="text-xs text-gray-500">Written Responses</p>
                                    </div>
                                </div>
                                <span className="text-xl font-bold text-amber-600">
                                    {report.sections.subjective.total > 0 ? Math.round((report.sections.subjective.score / report.sections.subjective.total) * 100) : 0}%
                                </span>
                            </div>
                            <Progress value={report.sections.subjective.total > 0 ? (report.sections.subjective.score / report.sections.subjective.total) * 100 : 0} className="h-2" />
                        </CardContent>
                    </Card>

                    <Card className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                                        <Code className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">Coding</p>
                                        <p className="text-xs text-gray-500">Programming Problems</p>
                                    </div>
                                </div>
                                <span className="text-xl font-bold text-emerald-600">
                                    {report.sections.coding.total > 0 ? Math.round((report.sections.coding.score / report.sections.coding.total) * 100) : 0}%
                                </span>
                            </div>
                            <Progress value={report.sections.coding.total > 0 ? (report.sections.coding.score / report.sections.coding.total) * 100 : 0} className="h-2" />
                        </CardContent>
                    </Card>
                </div>

                <div className="md:col-span-2 space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 px-2">Detailed Analysis</h3>

                    {/* Skill Performance */}
                    <Card className="bg-white border border-gray-200">
                        <CardHeader>
                            <CardTitle className="text-gray-900 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-primary" />
                                Skill Proficiency
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {report.skillScores.length > 0 ? (
                                report.skillScores.map((skill, idx) => (
                                    <div key={idx}>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-gray-700 font-medium">{skill.skill}</span>
                                            <span className={`font-bold ${skill.percentage >= 70 ? 'text-emerald-600' :
                                                skill.percentage >= 50 ? 'text-amber-600' : 'text-red-600'
                                                }`}>
                                                {skill.percentage}%
                                            </span>
                                        </div>
                                        <Progress value={skill.percentage} className="h-2.5" />
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 text-sm">No skill scores available</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Benchmark Comparison */}
                    {submission && submission.scores && (() => {
                        try {
                            const benchmark = getBenchmarkComparison(submission, submission.assessmentId)
                            return (
                                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 mb-6">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <TrendingUp className="w-5 h-5 text-blue-600" />
                                            Benchmark Comparison
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="text-center p-3 bg-white rounded-lg">
                                                <div className="text-xs text-gray-500 mb-1">Your Score</div>
                                                <div className="text-2xl font-bold text-gray-900">{benchmark.candidatePercentage}%</div>
                                            </div>
                                            <div className="text-center p-3 bg-white rounded-lg">
                                                <div className="text-xs text-gray-500 mb-1">Average</div>
                                                <div className="text-2xl font-bold text-blue-600">{benchmark.benchmarkStats.average}%</div>
                                            </div>
                                            <div className="text-center p-3 bg-white rounded-lg">
                                                <div className="text-xs text-gray-500 mb-1">Top 10%</div>
                                                <div className="text-2xl font-bold text-emerald-600">{benchmark.benchmarkStats.top10Percent}%</div>
                                            </div>
                                            <div className="text-center p-3 bg-white rounded-lg">
                                                <div className="text-xs text-gray-500 mb-1">Percentile</div>
                                                <div className="text-2xl font-bold text-purple-600">{benchmark.benchmarkStats.percentile}th</div>
                                            </div>
                                        </div>
                                        <div className="mt-4">
                                            <div className="text-sm font-semibold text-gray-700 mb-2">Status: 
                                                <span className={`ml-2 ${
                                                    benchmark.overallStatus === 'top_performer' ? 'text-emerald-600' :
                                                    benchmark.overallStatus === 'above_average' ? 'text-blue-600' :
                                                    benchmark.overallStatus === 'average' ? 'text-amber-600' :
                                                    'text-red-600'
                                                }`}>
                                                    {benchmark.overallStatus.replace('_', ' ').toUpperCase()}
                                                </span>
                                            </div>
                                            {benchmark.recommendations.length > 0 && (
                                                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                                                    {benchmark.recommendations.map((rec, idx) => (
                                                        <li key={idx}>{rec}</li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        } catch (error) {
                            return null
                        }
                    })()}

                    {/* Plagiarism & Bot Detection Warnings */}
                    {(submission?.plagiarismData?.flagged || submission?.botDetectionData?.isBot) && (
                        <Card className="bg-red-50 border-red-200 mb-6">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-red-700">
                                    <AlertTriangle className="w-5 h-5" />
                                    Security Flags
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {submission.plagiarismData?.flagged && (
                                    <div className="p-3 bg-white rounded border border-red-200">
                                        <div className="font-semibold text-red-700 mb-1">⚠️ Plagiarism Detected</div>
                                        <div className="text-sm text-red-600">
                                            Similar content found in other submissions. Review candidate answers carefully.
                                        </div>
                                    </div>
                                )}
                                {submission.botDetectionData?.isBot && (
                                    <div className="p-3 bg-white rounded border border-red-200">
                                        <div className="font-semibold text-red-700 mb-1">🤖 Bot Activity Detected</div>
                                        <div className="text-sm text-red-600 mb-2">
                                            Risk Score: {submission.botDetectionData.riskScore}% | 
                                            Confidence: {submission.botDetectionData.confidence}%
                                        </div>
                                        {submission.botDetectionData.flags && submission.botDetectionData.flags.length > 0 && (
                                            <ul className="text-xs text-red-600 list-disc list-inside">
                                                {submission.botDetectionData.flags.slice(0, 3).map((flag: any, idx: number) => (
                                                    <li key={idx}>{flag.description}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Mismatches */}
                        {report.skillMismatches.length > 0 && (
                            <Card className="bg-amber-50 border-amber-200">
                                <CardHeader>
                                    <CardTitle className="text-amber-800 flex items-center gap-2 text-base">
                                        <AlertTriangle className="w-5 h-5" />
                                        Resume Gap Analysis
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {report.skillMismatches.map((mismatch, idx) => (
                                        <div key={idx} className="bg-white rounded-lg p-4 border border-amber-200">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-300">
                                                    {mismatch.skill}
                                                </Badge>
                                            </div>
                                            <div className="text-xs text-gray-600 grid grid-cols-2 gap-2 mb-2">
                                                <span>Claimed: <span className="text-gray-900 font-medium">{mismatch.claimed}</span></span>
                                                <span>Actual: <span className="text-gray-900 font-medium">{mismatch.actual}</span></span>
                                            </div>
                                            <p className="text-sm text-amber-800 leading-relaxed">"{mismatch.warning}"</p>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {/* AI Insights */}
                        <Card className="bg-blue-50 border-blue-200">
                            <CardHeader>
                                <CardTitle className="text-blue-800 flex items-center gap-2 text-base">
                                    <Brain className="w-5 h-5" />
                                    AI Observations
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {report.aiInsights.map((insight, idx) => (
                                    <div key={idx} className="flex gap-3 text-sm text-gray-700 leading-relaxed bg-white p-3 rounded-lg border border-blue-200">
                                        <SparklesIcon className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                                        <span>{insight}</span>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Actual Answers Section */}
            <Card className="bg-white border border-gray-200">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-gray-900 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-primary" />
                            Candidate's Actual Responses
                        </CardTitle>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAnswers(!showAnswers)}
                        >
                            {showAnswers ? 'Hide' : 'Show'} Answers
                        </Button>
                    </div>
                    <CardDescription>
                        View the actual answers submitted by the candidate
                    </CardDescription>
                </CardHeader>
                {showAnswers && submission && questions.length > 0 && (
                    <CardContent className="space-y-6">
                        {/* MCQ Answers */}
                        {questions.filter((q: any) => q.type === 'mcq').length > 0 && (
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-blue-600" />
                                    Multiple Choice Questions
                                </h4>
                                <div className="space-y-4">
                                    {questions.filter((q: any) => q.type === 'mcq').map((question: any, idx: number) => {
                                        const answer = submission.answers[question.id]
                                        const selectedOption = answer?.response?.selected_option
                                        const isCorrect = selectedOption === question.content.correct_answer
                                        const candidateAnswer = selectedOption !== null && selectedOption !== undefined
                                            ? question.content.options[selectedOption]
                                            : 'Not answered'
                                        const correctAnswer = question.content.options[question.content.correct_answer]

                                        return (
                                            <div key={question.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="font-medium text-gray-900">Q{idx + 1}:</span>
                                                            <span className="text-gray-700">{question.content.question}</span>
                                                        </div>
                                                        <div className="space-y-2 ml-6">
                                                            {question.content.options.map((option: string, optIdx: number) => (
                                                                <div
                                                                    key={optIdx}
                                                                    className={`p-2 rounded ${
                                                                        optIdx === selectedOption
                                                                            ? isCorrect
                                                                                ? 'bg-emerald-100 border-2 border-emerald-500'
                                                                                : 'bg-red-100 border-2 border-red-500'
                                                                            : optIdx === question.content.correct_answer
                                                                            ? 'bg-blue-50 border border-blue-300'
                                                                            : 'bg-white border border-gray-200'
                                                                    }`}
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <span className={`font-medium ${
                                                                            optIdx === selectedOption
                                                                                ? isCorrect ? 'text-emerald-700' : 'text-red-700'
                                                                                : optIdx === question.content.correct_answer
                                                                                ? 'text-blue-700' : 'text-gray-700'
                                                                        }`}>
                                                                            {String.fromCharCode(65 + optIdx)}.
                                                                        </span>
                                                                        <span className={optIdx === selectedOption ? 'font-semibold' : ''}>
                                                                            {option}
                                                                        </span>
                                                                        {optIdx === selectedOption && (
                                                                            <Badge className={isCorrect ? 'bg-emerald-500' : 'bg-red-500'}>
                                                                                Candidate's Answer
                                                                            </Badge>
                                                                        )}
                                                                        {optIdx === question.content.correct_answer && optIdx !== selectedOption && (
                                                                            <Badge className="bg-blue-500">Correct Answer</Badge>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="ml-4">
                                                        {isCorrect ? (
                                                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300">
                                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                                Correct
                                                            </Badge>
                                                        ) : (
                                                            <Badge className="bg-red-100 text-red-700 border-red-300">
                                                                <XCircle className="w-3 h-3 mr-1" />
                                                                Incorrect
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="mt-3 text-sm text-gray-600 ml-6">
                                                    <p><strong>Candidate selected:</strong> {candidateAnswer}</p>
                                                    {!isCorrect && (
                                                        <p><strong>Correct answer:</strong> {correctAnswer}</p>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Subjective Answers */}
                        {questions.filter((q: any) => q.type === 'subjective').length > 0 && (
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4 text-amber-600" />
                                    Subjective Questions
                                </h4>
                                <div className="space-y-4">
                                    {questions.filter((q: any) => q.type === 'subjective').map((question: any, idx: number) => {
                                        const answer = submission.answers[question.id]
                                        const answerText = answer?.response?.text || 'Not answered'

                                        return (
                                            <div key={question.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                                <div className="mb-2">
                                                    <span className="font-medium text-gray-900">Q{idx + 1}:</span>
                                                    <span className="text-gray-700 ml-2">{question.content.question}</span>
                                                </div>
                                                <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                                                    <p className="text-gray-700 whitespace-pre-wrap">{answerText}</p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Coding Answers */}
                        {questions.filter((q: any) => q.type === 'coding').length > 0 && (
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Code className="w-4 h-4 text-emerald-600" />
                                    Coding Questions
                                </h4>
                                <div className="space-y-4">
                                    {questions.filter((q: any) => q.type === 'coding').map((question: any, idx: number) => {
                                        const answer = submission.answers[question.id]
                                        const code = answer?.response?.code || 'No code submitted'
                                        const language = answer?.response?.language || 'unknown'

                                        return (
                                            <div key={question.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                                <div className="mb-2">
                                                    <span className="font-medium text-gray-900">Q{idx + 1}:</span>
                                                    <span className="text-gray-700 ml-2">{question.content.problem_statement}</span>
                                                </div>
                                                <div className="mt-3">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-sm text-gray-600">Language: {language}</span>
                                                    </div>
                                                    <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto text-sm">
                                                        <code>{code}</code>
                                                    </pre>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </CardContent>
                )}
            </Card>
        </div>
    )
}

function SparklesIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
        </svg>
    )
}
