"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Brain, Upload, Target, CheckCircle } from "lucide-react"

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const router = useRouter()

  const steps = [
    { id: 1, title: "Welcome", description: "Let's get you started" },
    { id: 2, title: "Skills Assessment", description: "Tell us about your skills" },
    { id: 3, title: "Upload Resume", description: "Upload your resume for analysis" },
    { id: 4, title: "Learning Path", description: "Your personalized path is ready" },
  ]

  const skills = [
    "JavaScript",
    "Python",
    "Java",
    "React",
    "Node.js",
    "SQL",
    "HTML/CSS",
    "Data Analysis",
    "Machine Learning",
    "UI/UX Design",
    "Project Management",
    "Communication",
    "Problem Solving",
    "Leadership",
    "Teamwork",
  ]

  const handleSkillToggle = (skill: string) => {
    setSelectedSkills((prev) => (prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]))
  }

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    } else {
      router.push("/dashboard")
    }
  }

  const handleSkip = () => {
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              AssessAI
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">
              Step {currentStep} of {steps.length}
            </span>
            <span className="text-sm text-gray-600">{Math.round((currentStep / steps.length) * 100)}% Complete</span>
          </div>
          <Progress value={(currentStep / steps.length) * 100} className="h-2" />
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-800">{steps[currentStep - 1].title}</CardTitle>
            <CardDescription className="text-gray-600">{steps[currentStep - 1].description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentStep === 1 && (
              <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center mx-auto">
                  <Target className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Welcome to AssessAI!</h3>
                  <p className="text-gray-600 mb-6">
                    We'll help you create a personalized learning path to achieve your career goals. This quick setup
                    will take just 2-3 minutes.
                  </p>
                </div>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-white font-bold">1</span>
                    </div>
                    <p className="font-medium">Assess Skills</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-white font-bold">2</span>
                    </div>
                    <p className="font-medium">Upload Resume</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-white font-bold">3</span>
                    </div>
                    <p className="font-medium">Start Learning</p>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-2">Select Your Current Skills</h3>
                  <p className="text-gray-600">
                    Choose the skills you're comfortable with. This helps us create your personalized learning path.
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {skills.map((skill) => (
                    <Badge
                      key={skill}
                      variant={selectedSkills.includes(skill) ? "default" : "outline"}
                      className={`cursor-pointer p-3 text-center justify-center transition-colors ${
                        selectedSkills.includes(skill)
                          ? "bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                          : "hover:bg-gray-100"
                      }`}
                      onClick={() => handleSkillToggle(skill)}
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-gray-500 text-center">Selected {selectedSkills.length} skills</p>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-2">Upload Your Resume</h3>
                  <p className="text-gray-600">
                    Upload your resume for AI-powered analysis and personalized recommendations.
                  </p>
                </div>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-700 mb-2">Drag and drop your resume here</p>
                  <p className="text-sm text-gray-500 mb-4">or click to browse files</p>
                  <Button variant="outline">Choose File</Button>
                  <p className="text-xs text-gray-400 mt-2">Supports PDF, DOC, DOCX (Max 5MB)</p>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">You're All Set! 🎉</h3>
                  <p className="text-gray-600 mb-6">
                    Your personalized learning path has been created based on your profile and goals.
                  </p>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg">
                  <h4 className="font-semibold mb-3">Your Learning Path Includes:</h4>
                  <div className="grid md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Aptitude Practice Tests</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Coding Challenges</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Interview Preparation</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Resume Optimization</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-6">
              <Button variant="ghost" onClick={handleSkip}>
                Skip for now
              </Button>
              <Button
                onClick={handleNext}
                className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
              >
                {currentStep === steps.length ? "Go to Dashboard" : "Continue"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
