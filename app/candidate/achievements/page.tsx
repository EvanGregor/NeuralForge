"use client"

import { Button } from "@/components/ui/button"
import { Award, Download, CheckCircle, Lock } from "lucide-react"

export default function AchievementsPage() {
    const certifications = [
        {
            id: 1,
            title: "Frontend Engineering Professional",
            issuer: "AssessAI Assessment",
            date: "Feb 1, 2024",
            status: "Certified",
            score: "92%"
        },
        {
            id: 2,
            title: "React.js Advanced Concepts",
            issuer: "AssessAI Assessment",
            date: "Feb 5, 2024",
            status: "Certified",
            score: "88%"
        }
    ]

    const pending = [
        {
            id: 3,
            title: "System Design Fundamentals",
            issuer: "AssessAI Assessment",
            status: "In Progress",
            progress: 45
        },
        {
            id: 4,
            title: "Backend Architecture",
            issuer: "AssessAI Assessment",
            status: "Locked",
            progress: 0
        }
    ]

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex justify-between items-end border-b border-gray-200 pb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Certifications</h1>
                    <p className="text-gray-500 mt-1">Manage and view your earned credentials.</p>
                </div>
                <Button variant="outline">Share Profile</Button>
            </div>

            <div className="space-y-6">
                <h2 className="text-lg font-bold text-gray-900">Earned Certifications</h2>
                <div className="grid gap-4">
                    {certifications.map((cert) => (
                        <div key={cert.id} className="bg-white border border-gray-200 rounded-lg p-6 flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                                    <Award className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{cert.title}</h3>
                                    <p className="text-sm text-gray-500">Issued by {cert.issuer} &bull; {cert.date}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right hidden sm:block">
                                    <div className="text-sm font-semibold text-gray-900">Score: {cert.score}</div>
                                    <div className="text-xs text-green-600 flex items-center justify-end gap-1">
                                        <CheckCircle className="w-3 h-3" /> Verified
                                    </div>
                                </div>
                                <Button variant="outline" size="sm" className="gap-2">
                                    <Download className="w-4 h-4" /> Download
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-6">
                <h2 className="text-lg font-bold text-gray-900">In Progress</h2>
                <div className="grid md:grid-cols-2 gap-4">
                    {pending.map((item) => (
                        <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-6 opacity-80 hover:opacity-100 transition-opacity">
                            <div className="flex items-start gap-4 mb-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.status === 'Locked' ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-primary'}`}>
                                    {item.status === 'Locked' ? <Lock className="w-5 h-5" /> : <Award className="w-5 h-5" />}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">{item.title}</h3>
                                    <p className="text-sm text-gray-500">{item.issuer}</p>
                                </div>
                            </div>
                            {item.status !== 'Locked' && (
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                    <div className="bg-primary h-2 rounded-full" style={{ width: `${item.progress}%` }} />
                                </div>
                            )}
                            {item.status === 'Locked' && (
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <Lock className="w-4 h-4" /> Complete previous level to unlock
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
