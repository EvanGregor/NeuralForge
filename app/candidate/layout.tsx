"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Brain, Search, FileText, User, LogOut, Bell, Briefcase } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

const sidebarItems = [
    {
        title: "Find Jobs",
        href: "/candidate/dashboard",
        icon: Search
    },
    {
        title: "My Applications",
        href: "/candidate/achievements", // Reusing this route for now, but keeping professional name
        icon: Briefcase
    },
    {
        title: "My Profile",
        href: "/candidate/profile",
        icon: User
    }
]

export default function CandidateLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const { signOut } = useAuth()

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* ========== PROFESSIONAL SIDEBAR ========== */}
            <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 z-50 flex flex-col shadow-sm">

                {/* Brand */}
                <div className="h-16 flex items-center px-6 border-b border-gray-100">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-indigo-600 flex items-center justify-center text-white">
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
                        Main
                    </div>
                    {sidebarItems.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                        const Icon = item.icon

                        return (
                            <Link key={item.href} href={item.href}>
                                <div className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-indigo-50 text-indigo-700"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                )}>
                                    <Icon className={cn("w-5 h-5", isActive ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-500")} />
                                    <span>{item.title}</span>
                                </div>
                            </Link>
                        )
                    })}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 bg-gray-50/50">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => signOut()}
                        className="w-full justify-start gap-3 text-gray-600 border-gray-300 hover:bg-white hover:text-red-600 transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </Button>
                </div>
            </aside>

            {/* ========== MAIN CONTENT ========== */}
            <main className="flex-1 ml-64 min-h-screen">
                {/* Top Header */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-40">
                    <h2 className="text-lg font-semibold text-gray-800">
                        Candidate Portal
                    </h2>
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="text-gray-400 relative">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white" />
                        </Button>
                        <div className="w-8 h-8 rounded-full bg-gray-200 border border-gray-300 overflow-hidden">
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" alt="User" />
                        </div>
                    </div>
                </header>

                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    )
}
