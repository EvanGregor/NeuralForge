"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { 
    Clock, 
    FileText, 
    Code, 
    MessageSquare, 
    CheckCircle2, 
    ArrowRight, 
    ArrowLeft,
    Send,
    Shield,
    AlertCircle
} from "lucide-react"
import dynamic from "next/dynamic"
import { useAuth } from "@/contexts/AuthContext"

const MonacoEditor = dynamic(
    () => import("@monaco-editor/react").then((mod) => mod.default),
    { ssr: false, loading: () => <div className="h-96 bg-slate-900/50 animate-pulse rounded-xl" /> }
)

type Section = 'mcq' | 'subjective' | 'coding'
type QuestionType = 'mcq' | 'subjective' | 'coding'

interface Question {
    id: string
    type: QuestionType
    difficulty: string
    skill_tags: string[]
    marks: number
    content: any
    order: number
}

interface Job {
    id: string
    title: string
    company: string
    config?: {
        duration_minutes: number
        passing_percentage: number
    }
    questions?: Question[]
}

interface Answer {
    question_id: string
    question_type: string
    response: any
    time_spent_seconds: number
}

interface AntiCheatData {
    tab_switches: number
    copy_paste_detected: boolean
    time_anomalies: boolean
    question_times: Record<string, number>
    suspicious_patterns: string[]
}

export default function SequentialAssessmentPage() {
    const params = useParams()
    const router = useRouter()
    const assessmentId = params.id as string
    const { user } = useAuth()

    const [job, setJob] = useState<Job | null>(null)
    const [loading, setLoading] = useState(true)
    const [currentSection, setCurrentSection] = useState<Section>('mcq')
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [answers, setAnswers] = useState<Record<string, Answer>>({})
    const [timeRemaining, setTimeRemaining] = useState(0)
    const [submitted, setSubmitted] = useState(false)
    const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now())
    
    // Anti-cheat tracking (silent)
    const [antiCheatData, setAntiCheatData] = useState<AntiCheatData>({
        tab_switches: 0,
        copy_paste_detected: false,
        time_anomalies: false,
        question_times: {},
        suspicious_patterns: []
    })
    const antiCheatRef = useRef<AntiCheatData>(antiCheatData)

    // Load job and candidate info
    useEffect(() => {
        const loadJob = async () => {
            try {
                // Try Supabase first
                const { getJobById } = await import('@/lib/jobService')
                const supabaseJob = await getJobById(assessmentId)
                
                if (supabaseJob) {
                    // Format job for component
                    const formattedJob: any = {
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
                        status: supabaseJob.status || 'active',
                        assessmentId: supabaseJob.assessment?.id || assessmentId // Store actual assessment ID
                    }
                    setJob(formattedJob)
                    setTimeRemaining((formattedJob.config?.duration_minutes || 60) * 60)
                } else {
                    // Fallback to localStorage
                    const savedJobs = JSON.parse(localStorage.getItem('assessai_jobs') || '[]')
                    const foundJob = savedJobs.find((j: Job) => j.id === assessmentId)
                    
                    if (foundJob) {
                        setJob(foundJob)
                        setTimeRemaining((foundJob.config?.duration_minutes || 60) * 60)
                    }
                }
            } catch (error) {
                console.error('Error loading job:', error)
                // Fallback to localStorage
                const savedJobs = JSON.parse(localStorage.getItem('assessai_jobs') || '[]')
                const foundJob = savedJobs.find((j: Job) => j.id === assessmentId)
                
                if (foundJob) {
                    setJob(foundJob)
                    setTimeRemaining((foundJob.config?.duration_minutes || 60) * 60)
                }
            }
        }
        
        loadJob()
        
        // Check if candidate info exists
        const candidateInfo = sessionStorage.getItem(`candidate_info_${assessmentId}`)
        
        // If no candidate info and user is logged in, auto-create it
        if (!candidateInfo && user) {
            const autoCandidateInfo = {
                name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
                email: user.email || '',
                assessmentId,
                startedAt: new Date().toISOString(),
                userId: user.id
            }
            sessionStorage.setItem(`candidate_info_${assessmentId}`, JSON.stringify(autoCandidateInfo))
        } else if (!candidateInfo && !user) {
            // Not logged in and no info, redirect to info page
            router.push(`/test/${assessmentId}/info`)
            return
        }
        
        setLoading(false)
    }, [assessmentId, router, user])

    // Timer
    useEffect(() => {
        if (submitted || timeRemaining <= 0) return

        const timer = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev <= 1) {
                    handleSubmit()
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [submitted, timeRemaining])

    // Silent anti-cheat: Tab switch detection
    useEffect(() => {
        if (submitted) return

        const handleVisibilityChange = () => {
            if (document.hidden) {
                setAntiCheatData(prev => {
                    const updated = {
                        ...prev,
                        tab_switches: prev.tab_switches + 1
                    }
                    antiCheatRef.current = updated
                    return updated
                })
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    }, [submitted])

    // Silent anti-cheat: Copy-paste detection
    useEffect(() => {
        if (submitted) return

        const handlePaste = () => {
            setAntiCheatData(prev => {
                const updated = {
                    ...prev,
                    copy_paste_detected: true
                }
                antiCheatRef.current = updated
                return updated
            })
        }

        document.addEventListener('paste', handlePaste)
        return () => document.removeEventListener('paste', handlePaste)
    }, [submitted])

    // Track time per question
    useEffect(() => {
        if (submitted) return
        
        const questionId = getCurrentQuestion()?.id
        if (!questionId) return

        const interval = setInterval(() => {
            const timeSpent = Math.round((Date.now() - questionStartTime) / 1000)
            setAntiCheatData(prev => ({
                ...prev,
                question_times: {
                    ...prev.question_times,
                    [questionId]: timeSpent
                }
            }))
        }, 1000)

        return () => clearInterval(interval)
    }, [questionStartTime, submitted, currentSection, currentQuestionIndex])

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const getQuestionsBySection = (section: Section): Question[] => {
        if (!job?.questions) return []
        return job.questions
            .filter(q => q.type === section)
            .sort((a, b) => a.order - b.order)
    }

    const getCurrentQuestion = (): Question | null => {
        const sectionQuestions = getQuestionsBySection(currentSection)
        return sectionQuestions[currentQuestionIndex] || null
    }

    const getSectionProgress = (section: Section) => {
        const sectionQuestions = getQuestionsBySection(section)
        const answered = sectionQuestions.filter(q => answers[q.id]).length
        return { answered, total: sectionQuestions.length }
    }

    const updateAnswer = useCallback((questionId: string, response: any) => {
        const timeSpent = Math.round((Date.now() - questionStartTime) / 1000)
        
        setAnswers((prev) => {
            const updatedAnswers = {
                ...prev,
                [questionId]: {
                    question_id: questionId,
                    question_type: getCurrentQuestion()?.type || 'mcq',
                    response,
                    time_spent_seconds: (prev[questionId]?.time_spent_seconds || 0) + timeSpent
                }
            }
            
            // Auto-save to sessionStorage
            sessionStorage.setItem(`assessment_answers_${assessmentId}`, JSON.stringify(updatedAnswers))
            
            return updatedAnswers
        })
    }, [questionStartTime, assessmentId])

    const handleNext = () => {
        const sectionQuestions = getQuestionsBySection(currentSection)
        
        if (currentQuestionIndex < sectionQuestions.length - 1) {
            setQuestionStartTime(Date.now())
            setCurrentQuestionIndex(currentQuestionIndex + 1)
        } else {
            // Move to next section
            if (currentSection === 'mcq') {
                setCurrentSection('subjective')
                setCurrentQuestionIndex(0)
            } else if (currentSection === 'subjective') {
                setCurrentSection('coding')
                setCurrentQuestionIndex(0)
            }
            setQuestionStartTime(Date.now())
        }
    }

    const handlePrev = () => {
        if (currentQuestionIndex > 0) {
            setQuestionStartTime(Date.now())
            setCurrentQuestionIndex(currentQuestionIndex - 1)
        } else {
            // Move to previous section
            if (currentSection === 'subjective') {
                setCurrentSection('mcq')
                const mcqQuestions = getQuestionsBySection('mcq')
                setCurrentQuestionIndex(mcqQuestions.length - 1)
            } else if (currentSection === 'coding') {
                setCurrentSection('subjective')
                const subjQuestions = getQuestionsBySection('subjective')
                setCurrentQuestionIndex(subjQuestions.length - 1)
            }
            setQuestionStartTime(Date.now())
        }
    }

    const handleSubmit = async () => {
        // Save final answers and anti-cheat data
        const candidateInfo = JSON.parse(sessionStorage.getItem(`candidate_info_${assessmentId}`) || '{}')
        
        // Use the actual assessment ID from the job if available, otherwise use the job ID
        // The submission service will look up the assessment ID if needed
        const actualAssessmentId = (job as any)?.assessmentId || assessmentId
        
        const submissionData = {
            assessmentId: actualAssessmentId,
            candidateInfo,
            answers,
            antiCheatData: antiCheatRef.current,
            submittedAt: new Date().toISOString(),
            job: {
                ...job,
                id: job?.id || assessmentId,
                assessmentId: actualAssessmentId // Include assessment ID in job object for lookup
            }
        }
        
        // Save to sessionStorage (for candidate reference)
        sessionStorage.setItem(`submission_${assessmentId}`, JSON.stringify(submissionData))
        
        // Save to recruiter-accessible storage and evaluate
        try {
            const { saveSubmission } = await import('@/lib/submissionService')
            const { evaluateAndSaveSubmission } = await import('@/lib/evaluationService')
            
            // Validate submission data before saving
            if (!submissionData.candidateInfo?.name || !submissionData.candidateInfo?.email) {
                console.error('Missing candidate info:', submissionData.candidateInfo)
                throw new Error('Missing candidate information')
            }
            
            if (!submissionData.job?.id || !submissionData.job?.title) {
                console.error('Missing job info:', submissionData.job)
                throw new Error('Missing job information')
            }
            
            // Save submission (now async with Supabase support)
            const submission = await saveSubmission(submissionData)
            console.log('Submission saved:', submission.id)
            
            // Evaluate and calculate scores
            if (job?.questions && Array.isArray(job.questions) && job.questions.length > 0) {
                console.log('Evaluating submission with', job.questions.length, 'questions')
                await evaluateAndSaveSubmission(submission, job.questions)
                console.log('Evaluation complete')
                
                // Run plagiarism and bot detection
                try {
                    const { checkSubmissionPlagiarism } = await import('@/lib/plagiarismDetection')
                    const { detectBotActivity } = await import('@/lib/botDetection')
                    const { updateSubmissionPlagiarism, updateSubmissionBotDetection } = require('@/lib/submissionService')
                    
                    // Check plagiarism
                    const plagiarismResults = await checkSubmissionPlagiarism(submission, job.questions)
                    const hasPlagiarism = Object.values(plagiarismResults).some(r => r.flagged)
                    
                    if (hasPlagiarism) {
                        updateSubmissionPlagiarism(submission.id, plagiarismResults)
                        console.log('Plagiarism detected')
                    }
                    
                    // Detect bot activity
                    const botDetection = detectBotActivity(submission, job.questions)
                    if (botDetection.isBot || botDetection.riskScore >= 50) {
                        updateSubmissionBotDetection(submission.id, botDetection)
                        console.log('Bot activity detected', botDetection)
                    }
                } catch (error) {
                    console.error('Error in plagiarism/bot detection:', error)
                    // Don't fail submission if detection fails
                }
            } else {
                console.warn('No questions available for evaluation')
            }
        } catch (error) {
            console.error('Error saving submission:', error)
            // Still redirect even if save fails (candidate shouldn't see error)
        }
        
        // Mark as submitted and redirect
        setSubmitted(true)
        router.push(`/test/${assessmentId}/submitted`)
    }

    const canProceedToNextSection = () => {
        const sectionQuestions = getQuestionsBySection(currentSection)
        return currentQuestionIndex === sectionQuestions.length - 1
    }

    const canSubmit = () => {
        return currentSection === 'coding' && canProceedToNextSection()
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
                <Card>
                    <CardContent className="pt-6 text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Assessment Not Found</h2>
                        <p className="text-gray-500">This assessment is not available.</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const currentQuestion = getCurrentQuestion()
    const mcqProgress = getSectionProgress('mcq')
    const subjProgress = getSectionProgress('subjective')
    const codingProgress = getSectionProgress('coding')
    
    const mcqQuestions = getQuestionsBySection('mcq')
    const subjQuestions = getQuestionsBySection('subjective')
    const codingQuestions = getQuestionsBySection('coding')

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-lg font-bold text-gray-900">{job.title}</h1>
                            <p className="text-sm text-gray-500">{job.company}</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <Clock className="w-4 h-4" />
                                <span className={timeRemaining < 300 ? 'text-red-600' : ''}>
                                    {formatTime(timeRemaining)}
                                </span>
                            </div>
                            <Badge variant="outline" className="flex items-center gap-1">
                                <Shield className="w-3 h-3" />
                                Protected
                            </Badge>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 max-w-6xl">
                {/* Section Progress */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <div className={`flex-1 ${currentSection === 'mcq' ? 'opacity-100' : 'opacity-50'}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <FileText className="w-4 h-4 text-primary" />
                                <span className="text-sm font-semibold">Section A: MCQs</span>
                                <Badge variant="secondary" className="ml-2">
                                    {mcqProgress.answered}/{mcqProgress.total}
                                </Badge>
                            </div>
                            <Progress value={(mcqProgress.answered / mcqProgress.total) * 100} className="h-2" />
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        <div className={`flex-1 ${currentSection === 'subjective' ? 'opacity-100' : currentSection === 'coding' ? 'opacity-100' : 'opacity-50'}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <MessageSquare className="w-4 h-4 text-purple-600" />
                                <span className="text-sm font-semibold">Section B: Subjective</span>
                                <Badge variant="secondary" className="ml-2">
                                    {subjProgress.answered}/{subjProgress.total}
                                </Badge>
                            </div>
                            <Progress value={(subjProgress.answered / subjProgress.total) * 100} className="h-2" />
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        <div className={`flex-1 ${currentSection === 'coding' ? 'opacity-100' : 'opacity-50'}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <Code className="w-4 h-4 text-green-600" />
                                <span className="text-sm font-semibold">Section C: Coding</span>
                                <Badge variant="secondary" className="ml-2">
                                    {codingProgress.answered}/{codingProgress.total}
                                </Badge>
                            </div>
                            <Progress value={(codingProgress.answered / codingProgress.total) * 100} className="h-2" />
                        </div>
                    </div>
                </div>

                {/* Question Card */}
                {currentQuestion && (
                    <Card className="mb-6">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline">
                                        {currentSection === 'mcq' && 'MCQ'}
                                        {currentSection === 'subjective' && 'Subjective'}
                                        {currentSection === 'coding' && 'Coding'}
                                    </Badge>
                                    <span className="text-sm text-gray-500">
                                        Question {currentQuestionIndex + 1} of {getQuestionsBySection(currentSection).length}
                                    </span>
                                </div>
                                <div className="text-sm font-medium text-gray-700">
                                    {currentQuestion.marks} marks
                                </div>
                            </div>

                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    {currentQuestion.content.question || currentQuestion.content.problem_statement}
                                </h3>

                                {/* MCQ */}
                                {currentQuestion.type === 'mcq' && (
                                    <RadioGroup
                                        value={answers[currentQuestion.id]?.response?.selected_option?.toString() || ''}
                                        onValueChange={(value) => updateAnswer(currentQuestion.id, {
                                            selected_option: parseInt(value)
                                        })}
                                    >
                                        {currentQuestion.content.options?.map((option: string, idx: number) => (
                                            <div key={idx} className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200">
                                                <RadioGroupItem value={idx.toString()} id={`option-${idx}`} />
                                                <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer">
                                                    {option}
                                                </Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                )}

                                {/* Subjective */}
                                {currentQuestion.type === 'subjective' && (
                                    <div className="space-y-4">
                                        <Textarea
                                            placeholder="Type your answer here..."
                                            value={answers[currentQuestion.id]?.response?.text || ''}
                                            onChange={(e) => updateAnswer(currentQuestion.id, {
                                                text: e.target.value
                                            })}
                                            className="min-h-[200px]"
                                        />
                                        {currentQuestion.content.max_words && (
                                            <p className="text-sm text-gray-500">
                                                Maximum {currentQuestion.content.max_words} words
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Coding */}
                                {currentQuestion.type === 'coding' && (
                                    <div className="space-y-4">
                                        {currentQuestion.content.input_format && (
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <div className="text-sm font-semibold mb-2">Input Format:</div>
                                                <div className="text-sm text-gray-700 whitespace-pre-wrap">
                                                    {currentQuestion.content.input_format}
                                                </div>
                                            </div>
                                        )}
                                        {currentQuestion.content.output_format && (
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <div className="text-sm font-semibold mb-2">Output Format:</div>
                                                <div className="text-sm text-gray-700 whitespace-pre-wrap">
                                                    {currentQuestion.content.output_format}
                                                </div>
                                            </div>
                                        )}
                                        <div className="border rounded-lg overflow-hidden">
                                            <MonacoEditor
                                                height="400px"
                                                language="javascript"
                                                value={answers[currentQuestion.id]?.response?.code || currentQuestion.content.starter_code?.javascript || ''}
                                                onChange={(value) => updateAnswer(currentQuestion.id, {
                                                    code: value || '',
                                                    language: 'javascript'
                                                })}
                                                theme="vs-dark"
                                                options={{
                                                    minimap: { enabled: false },
                                                    fontSize: 14,
                                                    wordWrap: 'on'
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Navigation */}
                            <div className="flex items-center justify-between pt-4 border-t">
                                <Button
                                    variant="outline"
                                    onClick={handlePrev}
                                    disabled={currentQuestionIndex === 0 && currentSection === 'mcq'}
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Previous
                                </Button>
                                
                                {canSubmit() ? (
                                    <Button
                                        onClick={handleSubmit}
                                        className="bg-primary hover:bg-primary/90"
                                    >
                                        <Send className="w-4 h-4 mr-2" />
                                        Submit Assessment
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={handleNext}
                                        className="bg-primary hover:bg-primary/90"
                                    >
                                        Next
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
