"use client"

export default function Loading() {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background Dots */}
            <div className="absolute inset-0 bg-dots opacity-30 pointer-events-none" />

            <div className="flex items-center gap-4 relative z-10">
                <div
                    className="w-8 h-8 rounded-full bg-primary border-2 border-black animate-bounce-hard"
                    style={{ animationDelay: '0s' }}
                />
                <div
                    className="w-8 h-8 rounded-full bg-secondary border-2 border-black animate-bounce-hard"
                    style={{ animationDelay: '0.1s' }}
                />
                <div
                    className="w-8 h-8 rounded-full bg-accent border-2 border-black animate-bounce-hard"
                    style={{ animationDelay: '0.2s' }}
                />
            </div>

            <h2 className="mt-8 text-2xl font-black uppercase tracking-widest animate-pulse">
                Loading...
            </h2>
        </div>
    )
}
