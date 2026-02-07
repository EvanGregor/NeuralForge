"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle, Smartphone, Zap, Shield, Globe } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ========== HEADER ========== */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">AssessAI</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#solutions" className="hover:text-primary transition-colors">Solutions</a>
            <a href="#pricing" className="hover:text-primary transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="font-semibold text-gray-600 hover:text-primary">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button className="font-semibold shadow-sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ========== HERO SECTION ========== */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-6 text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-primary text-xs font-semibold mb-6 border border-blue-100">
            <span className="flex h-2 w-2 rounded-full bg-primary"></span>
            New: AI-Powered Candidate Ranking
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 tracking-tight mb-6 leading-tight">
            The Intelligent Way to <br />
            <span className="text-primary">Hire Top Talent</span>
          </h1>

          <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            Streamline your recruitment process with AI-driven assessments.
            Evaluate skills objectively and find the perfect match faster than ever.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="h-12 px-8 text-base shadow-md hover:shadow-lg transition-all">
                Start Hiring Now <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button variant="outline" size="lg" className="h-12 px-8 text-base bg-white">
                Request Demo
              </Button>
            </Link>
          </div>

          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10 h-20 bottom-0" />
            {/* Abstract UI Mockup Placeholder */}
            <div className="rounded-xl border border-gray-200 shadow-2xl overflow-hidden bg-white mx-auto max-w-5xl aspect-[16/9] flex items-center justify-center bg-gray-50">
              <span className="text-gray-400 font-medium">Platform Dashboard Preview</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========== LOGOS ========== */}
      <section className="py-10 border-y border-gray-100 bg-white">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">Trusted by industry leaders</p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale">
            <div className="text-xl font-bold text-gray-800">ACME Corp</div>
            <div className="text-xl font-bold text-gray-800">Globex</div>
            <div className="text-xl font-bold text-gray-800">Soylent</div>
            <div className="text-xl font-bold text-gray-800">Initech</div>
            <div className="text-xl font-bold text-gray-800">Umbrella</div>
          </div>
        </div>
      </section>

      {/* ========== FEATURES ========== */}
      <section className="py-24 bg-gray-50" id="features">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything you need to hire confidenty</h2>
            <p className="text-lg text-gray-500">From parsing resumes to generating custom coding challenges, AssessAI brings the power of AI to your hiring pipeline.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Smart Screening",
                desc: "Automatically parse and rank resumes based on job descriptions using advanced NLP.",
                icon: Shield
              },
              {
                title: "AI Assessments",
                desc: "Generate role-specific technical questions and coding challenges in seconds.",
                icon: Zap
              },
              {
                title: "Global Reach",
                desc: "Conduct remote assessments with built-in proctoring and fraud detection.",
                icon: Globe
              }
            ].map((feature, i) => (
              <div key={i} className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-primary mb-6">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== CTA ========== */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="bg-primary rounded-2xl p-12 md:p-16 text-center text-white relative overflow-hidden">
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to transform your hiring?</h2>
              <p className="text-blue-100 text-lg mb-8">Join thousands of recruiters who are saving time and hiring better talent with AssessAI.</p>
              <Link href="/signup">
                <Button size="lg" className="bg-white text-primary hover:bg-gray-100 border-none h-12 px-8 font-semibold">
                  Get Started for Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="bg-gray-50 border-t border-gray-200 py-12">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-300 rounded" />
            <span className="font-bold text-gray-700">AssessAI</span>
          </div>
          <div className="text-sm text-gray-500">
            © 2024 AssessAI Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
