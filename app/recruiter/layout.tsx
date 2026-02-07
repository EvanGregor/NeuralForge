"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Brain, LayoutDashboard, Plus, Users, FileText, BarChart3, LogOut, Settings } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

const sidebarItems = [
    {
        title: "Dashboard",
        href: "/recruiter/dashboard",
        icon: LayoutDashboard
    },
    {
        title: "Assessments",
        href: "/recruiter/jobs/new", // Pointing to jobs/new or jobs index for now
        icon: FileText
    },
    {
        title: "Candidates",
        href: "/recruiter/candidates",
        icon: Users
    },
    {
        title: "Analytics",
        href: "/recruiter/analytics",
        icon: BarChart3
    }
]

export default function RecruiterLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const router = useRouter()
    const { user, signOut, loading } = useAuth()

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!loading && !user) {
            router.push("/login")
        }
    }, [user, loading, router])

    // Show loading state while checking auth
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        )
    }

    // Don't render layout if user is not authenticated (will redirect)
    if (!user) {
        return null
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* ========== PROFESSIONAL SIDEBAR ========== */}
            <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 z-50 flex flex-col shadow-sm">

                {/* Brand */}
                <div className="h-16 flex items-center px-6 border-b border-gray-100">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white">
                            <Brain className="w-5 h-5" />
                        </div>
                        <span className="text-xl font-bold text-gray-900 tracking-tight">
                            AssessAI
                        </span>
                    </Link>
                </div>

                {/* Nav Items */}
                <nav className="flex-1 py-6 px-3 space-y-1">
                    <div className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Recruitment
                    </div>
                    {sidebarItems.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                        const Icon = item.icon

                        return (
                            <Link key={item.href} href={item.href}>
                                <div className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-blue-50 text-primary"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                )}>
                                    <Icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-gray-400 group-hover:text-gray-500")} />
                                    <span>{item.title}</span>
                                </div>
                            </Link>
                        )
                    })}
                </nav>

                {/* Footer User Profile */}
                <div className="p-4 border-t border-gray-200 bg-gray-50/50">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold border border-blue-200">
                            SZ
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-semibold text-gray-900 truncate">Recruiter</p>
                            <p className="text-xs text-gray-500 truncate">Workspace</p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                            await signOut()
                        }}
                        className="w-full justify-center gap-2 text-gray-600 border-gray-300 hover:bg-white hover:text-red-600 transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </Button>
                </div>
            </aside>

            {/* ========== MAIN CONTENT ========== */}
            <main className="flex-1 ml-64 min-h-screen">
                {/* Top Header (Breadcrumbs/Search could go here) */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-40">
                    <h2 className="text-lg font-semibold text-gray-800">
                        {pathname.split('/').pop()?.charAt(0).toUpperCase()}{pathname.split('/').pop()?.slice(1)}
                    </h2>
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600">
                            <Settings className="w-5 h-5" />
                        </Button>
                    </div>
                </header>

                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    )
}
