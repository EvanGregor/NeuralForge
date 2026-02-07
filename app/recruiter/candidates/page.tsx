"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
    Users,
    Search,
    Filter,
    CheckCircle,
    XCircle,
    Clock,
    AlertTriangle,
    FileText,
    TrendingUp,
    Eye,
    Download,
    ArrowUpDown,
    ArrowUp,
    ArrowDown
} from "lucide-react"
import { getAllSubmissions, updateSubmissionStatus, getSubmissionStats } from "@/lib/submissionService"
import { CandidateSubmission } from "@/lib/submissionService"
import { toast } from "sonner"
import { debugSubmissions } from "@/lib/submissionDebug"

type StatusFilter = 'all' | 'pending' | 'evaluated' | 'shortlisted' | 'rejected'
type SortField = 'name' | 'score' | 'date' | 'assessment'
type SortOrder = 'asc' | 'desc'

export default function CandidatesPage() {
    const [submissions, setSubmissions] = useState<CandidateSubmission[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
    const [assessmentFilter, setAssessmentFilter] = useState<string>('all')
    const [sortField, setSortField] = useState<SortField>('date')
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
    const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set())

    useEffect(() => {
        // First, try to migrate any existing submissions from sessionStorage
        const { migrateSubmissionsFromSessionStorage } = require('@/lib/submissionService')
        const migrated = migrateSubmissionsFromSessionStorage()
        if (migrated > 0) {
            console.log(`Migrated ${migrated} submission(s) from sessionStorage`)
        }
        
        loadSubmissions()
        
        // Listen for new submissions
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'recruiter_submissions') {
                loadSubmissions()
            }
        }
        
        const handleCustomStorage = () => {
            loadSubmissions()
        }
        
        window.addEventListener('storage', handleStorageChange)
        window.addEventListener('submissionUpdated', handleCustomStorage)
        
        return () => {
            window.removeEventListener('storage', handleStorageChange)
            window.removeEventListener('submissionUpdated', handleCustomStorage)
        }
    }, [])

    const loadSubmissions = async () => {
        try {
            const allSubmissions = await getAllSubmissions()
            console.log('Loaded submissions:', allSubmissions.length)
            console.log('Submissions data:', allSubmissions)
            setSubmissions(allSubmissions)
        } catch (error) {
            console.error('Error loading submissions:', error)
        } finally {
            setLoading(false)
        }
    }

    const [stats, setStats] = useState({ total: 0, pending: 0, evaluated: 0, shortlisted: 0, rejected: 0, averageScore: 0 })
    
    useEffect(() => {
        const loadStats = async () => {
            const statsData = await getSubmissionStats()
            setStats(statsData)
        }
        loadStats()
    }, [submissions])

    // Get unique assessments for filter
    const assessments = useMemo(() => {
        const unique = new Map<string, { id: string; title: string; company: string }>()
        submissions.forEach(s => {
            if (!unique.has(s.assessmentId)) {
                unique.set(s.assessmentId, {
                    id: s.assessmentId,
                    title: s.jobTitle,
                    company: s.company
                })
            }
        })
        return Array.from(unique.values())
    }, [submissions])

    // Filter and sort candidates
    const filteredAndSorted = useMemo(() => {
        let filtered = [...submissions]

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter(s =>
                s.candidateInfo.name.toLowerCase().includes(query) ||
                s.candidateInfo.email.toLowerCase().includes(query) ||
                s.jobTitle.toLowerCase().includes(query) ||
                s.company.toLowerCase().includes(query)
            )
        }

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(s => s.status === statusFilter)
        }

        // Assessment filter
        if (assessmentFilter !== 'all') {
            filtered = filtered.filter(s => s.assessmentId === assessmentFilter)
        }

        // Sort
        filtered.sort((a, b) => {
            let aValue: any, bValue: any

            switch (sortField) {
                case 'name':
                    aValue = a.candidateInfo.name.toLowerCase()
                    bValue = b.candidateInfo.name.toLowerCase()
                    break
                case 'score':
                    aValue = a.scores?.percentage || 0
                    bValue = b.scores?.percentage || 0
                    break
                case 'date':
                    aValue = new Date(a.submittedAt).getTime()
                    bValue = new Date(b.submittedAt).getTime()
                    break
                case 'assessment':
                    aValue = a.jobTitle.toLowerCase()
                    bValue = b.jobTitle.toLowerCase()
                    break
                default:
                    return 0
            }

            if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
            if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
            return 0
        })

        return filtered
    }, [submissions, searchQuery, statusFilter, assessmentFilter, sortField, sortOrder])

    const handleStatusChange = async (submissionId: string, newStatus: 'shortlisted' | 'rejected' | 'evaluated') => {
        const updated = await updateSubmissionStatus(submissionId, newStatus)
        if (updated) {
            loadSubmissions()
            toast.success(`Candidate ${newStatus === 'shortlisted' ? 'shortlisted' : newStatus === 'rejected' ? 'rejected' : 'marked as evaluated'}`)
        }
    }

    const exportToCSV = () => {
        const headers = ['Name', 'Email', 'Assessment', 'Company', 'Score %', 'Total Score', 'Status', 'Submitted At', 'Tab Switches', 'Copy/Paste Detected']
        const rows = filteredAndSorted.map(s => [
            s.candidateInfo.name,
            s.candidateInfo.email,
            s.jobTitle,
            s.company,
            s.scores?.percentage || 'N/A',
            s.scores ? `${s.scores.totalScore}/${s.scores.totalPossible}` : 'N/A',
            s.status,
            new Date(s.submittedAt).toLocaleString(),
            s.antiCheatData.tab_switches.toString(),
            s.antiCheatData.copy_paste_detected ? 'Yes' : 'No'
        ])

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `candidates_export_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        toast.success('CSV exported successfully!')
    }

    const handleBulkStatusChange = async (newStatus: 'shortlisted' | 'rejected') => {
        let updated = 0
        for (const id of selectedCandidates) {
            const result = await updateSubmissionStatus(id, newStatus)
            if (result) {
                updated++
            }
        }
        if (updated > 0) {
            loadSubmissions()
            setSelectedCandidates(new Set())
            toast.success(`${updated} candidate(s) ${newStatus === 'shortlisted' ? 'shortlisted' : 'rejected'}`)
        }
    }

    const toggleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortOrder('desc')
        }
    }

    const getStatusBadge = (status: string) => {
        const styles = {
            pending: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
            evaluated: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
            shortlisted: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
            rejected: 'bg-red-500/10 text-red-600 border-red-500/20'
        }
        return styles[status as keyof typeof styles] || styles.pending
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Candidates</h1>
                    <p className="text-gray-600 mt-1">Manage and review candidate submissions</p>
                </div>
                {selectedCandidates.size > 0 && (
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleBulkStatusChange('shortlisted')}
                        >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Shortlist ({selectedCandidates.size})
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleBulkStatusChange('rejected')}
                        >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject ({selectedCandidates.size})
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedCandidates(new Set())}
                        >
                            Clear Selection
                        </Button>
                    </div>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600">Total Candidates</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
                        <p className="text-xs text-gray-500 mt-1">Across all assessments</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600">Pending Review</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-amber-600">{stats.pending}</div>
                        <p className="text-xs text-gray-500 mt-1">Awaiting evaluation</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600">Shortlisted</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-emerald-600">{stats.shortlisted}</div>
                        <p className="text-xs text-gray-500 mt-1">Selected candidates</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600">Average Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-600">
                            {stats.averageScore > 0 ? Math.round(stats.averageScore) : 0}%
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Across all submissions</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters and Search */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                placeholder="Search by name, email, or assessment..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="flex gap-2">
                            {(['all', 'pending', 'evaluated', 'shortlisted', 'rejected'] as StatusFilter[]).map((status) => (
                                <Button
                                    key={status}
                                    variant={statusFilter === status ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setStatusFilter(status)}
                                    className="capitalize"
                                >
                                    {status}
                                </Button>
                            ))}
                        </div>

                        {/* Assessment Filter */}
                        {assessments.length > 0 && (
                            <select
                                value={assessmentFilter}
                                onChange={(e) => setAssessmentFilter(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="all">All Assessments</option>
                                {assessments.map(assessment => (
                                    <option key={assessment.id} value={assessment.id}>
                                        {assessment.title} - {assessment.company}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Candidates Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Candidates ({filteredAndSorted.length})</CardTitle>
                            <CardDescription>Click on a candidate to view detailed report</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                    const { migrateSubmissionsFromSessionStorage } = require('@/lib/submissionService')
                                    const migrated = migrateSubmissionsFromSessionStorage()
                                    if (migrated > 0) {
                                        toast.success(`Migrated ${migrated} submission(s) from sessionStorage`)
                                        loadSubmissions()
                                    } else {
                                        toast.info('No new submissions to migrate')
                                    }
                                }}
                                title="Collect submissions from sessionStorage"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Sync Submissions
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                    debugSubmissions()
                                    toast.info('Check browser console for debug info')
                                }}
                                title="Debug submission data"
                            >
                                Debug
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={exportToCSV}
                                disabled={filteredAndSorted.length === 0}
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Export CSV
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {filteredAndSorted.length === 0 ? (
                        <div className="py-16 text-center">
                            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No candidates found</h3>
                            <p className="text-gray-500">
                                {searchQuery || statusFilter !== 'all' || assessmentFilter !== 'all'
                                    ? 'Try adjusting your filters'
                                    : 'No submissions yet. Candidates will appear here after they complete assessments.'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            <input
                                                type="checkbox"
                                                checked={selectedCandidates.size === filteredAndSorted.length && filteredAndSorted.length > 0}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedCandidates(new Set(filteredAndSorted.map(s => s.id)))
                                                    } else {
                                                        setSelectedCandidates(new Set())
                                                    }
                                                }}
                                                className="rounded border-gray-300"
                                            />
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            <button
                                                onClick={() => toggleSort('name')}
                                                className="flex items-center gap-1 hover:text-gray-900"
                                            >
                                                Candidate
                                                {sortField === 'name' && (
                                                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                                )}
                                            </button>
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            <button
                                                onClick={() => toggleSort('assessment')}
                                                className="flex items-center gap-1 hover:text-gray-900"
                                            >
                                                Assessment
                                                {sortField === 'assessment' && (
                                                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                                )}
                                            </button>
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            <button
                                                onClick={() => toggleSort('score')}
                                                className="flex items-center gap-1 hover:text-gray-900"
                                            >
                                                Score
                                                {sortField === 'score' && (
                                                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                                )}
                                            </button>
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            <button
                                                onClick={() => toggleSort('date')}
                                                className="flex items-center gap-1 hover:text-gray-900"
                                            >
                                                Submitted
                                                {sortField === 'date' && (
                                                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                                )}
                                            </button>
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredAndSorted.map((submission) => {
                                        const hasFlags = submission.antiCheatData.tab_switches > 0 || submission.antiCheatData.copy_paste_detected
                                        return (
                                            <tr key={submission.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedCandidates.has(submission.id)}
                                                        onChange={(e) => {
                                                            const newSet = new Set(selectedCandidates)
                                                            if (e.target.checked) {
                                                                newSet.add(submission.id)
                                                            } else {
                                                                newSet.delete(submission.id)
                                                            }
                                                            setSelectedCandidates(newSet)
                                                        }}
                                                        className="rounded border-gray-300"
                                                    />
                                                </td>
                                                <td className="px-4 py-4">
                                                    <Link href={`/recruiter/candidates/${encodeURIComponent(submission.id)}`}>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                                                                {submission.candidateInfo.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <div className="font-medium text-gray-900 flex items-center gap-2">
                                                                    {submission.candidateInfo.name}
                                                                    {hasFlags && (
                                                                        <AlertTriangle className="w-4 h-4 text-amber-500" title="Anti-cheat flags detected" />
                                                                    )}
                                                                </div>
                                                                <div className="text-sm text-gray-500">{submission.candidateInfo.email}</div>
                                                            </div>
                                                        </div>
                                                    </Link>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div>
                                                        <div className="font-medium text-gray-900">{submission.jobTitle}</div>
                                                        <div className="text-sm text-gray-500">{submission.company}</div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    {submission.scores ? (
                                                        <div>
                                                            <div className="font-semibold text-gray-900">
                                                                {submission.scores.percentage}%
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {submission.scores.totalScore}/{submission.scores.totalPossible} pts
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 text-sm">Not evaluated</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <Badge className={getStatusBadge(submission.status)}>
                                                        {submission.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-4 text-sm text-gray-500">
                                                    {formatDate(submission.submittedAt)}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-2">
                                                        {submission.status === 'pending' || submission.status === 'evaluated' ? (
                                                            <>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => handleStatusChange(submission.id, 'shortlisted')}
                                                                    className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                                >
                                                                    <CheckCircle className="w-4 h-4" />
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => handleStatusChange(submission.id, 'rejected')}
                                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                >
                                                                    <XCircle className="w-4 h-4" />
                                                                </Button>
                                                            </>
                                                        ) : null}
                                                        <Link href={`/recruiter/candidates/${encodeURIComponent(submission.id)}`}>
                                                            <Button size="sm" variant="outline">
                                                                <Eye className="w-4 h-4 mr-1" />
                                                                View
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
