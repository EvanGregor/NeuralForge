/**
 * Evaluation Service
 * Calculates scores for candidate submissions
 */

import { Question, Answer } from './types'
import { CandidateSubmission } from './submissionService'

export interface EvaluationResult {
    totalScore: number
    totalPossible: number
    percentage: number
    sectionScores: {
        mcq: { score: number; total: number; correct: number; totalQuestions: number }
        subjective: { score: number; total: number; evaluated: number; totalQuestions: number }
        coding: { score: number; total: number; testCasesPassed: number; totalTestCases: number }
    }
    skillScores: Record<string, { score: number; total: number; percentage: number }>
    evaluatedAnswers: Array<{
        question_id: string
        type: string
        score: number
        max_score: number
        is_correct?: boolean
        feedback?: string
    }>
}

/**
 * Evaluate a submission and calculate scores
 */
export function evaluateSubmission(
    submission: CandidateSubmission,
    questions: Question[]
): EvaluationResult {
    let totalScore = 0
    let totalPossible = 0
    
    const sectionScores = {
        mcq: { score: 0, total: 0, correct: 0, totalQuestions: 0 },
        subjective: { score: 0, total: 0, evaluated: 0, totalQuestions: 0 },
        coding: { score: 0, total: 0, testCasesPassed: 0, totalTestCases: 0 }
    }
    
    const skillScores: Record<string, { score: number; total: number }> = {}
    const evaluatedAnswers: EvaluationResult['evaluatedAnswers'] = []

    // Evaluate each question
    for (const question of questions) {
        const answer = submission.answers[question.id]
        totalPossible += question.marks

        // Initialize skill tracking
        for (const skill of question.skill_tags || []) {
            if (!skillScores[skill]) {
                skillScores[skill] = { score: 0, total: 0 }
            }
            skillScores[skill].total += question.marks
        }

        if (question.type === 'mcq') {
            // MCQ - exact match with correct answer
            const isCorrect = answer?.response?.selected_option === question.content.correct_answer
            const score = isCorrect ? question.marks : 0
            totalScore += score
            sectionScores.mcq.score += score
            sectionScores.mcq.total += question.marks
            sectionScores.mcq.totalQuestions += 1
            if (isCorrect) sectionScores.mcq.correct += 1

            // Update skill scores
            for (const skill of question.skill_tags || []) {
                skillScores[skill].score += score
            }

            evaluatedAnswers.push({
                question_id: question.id,
                type: 'mcq',
                score,
                max_score: question.marks,
                is_correct: isCorrect,
                feedback: isCorrect 
                    ? 'Correct!' 
                    : `Incorrect. The correct answer was: ${question.content.options[question.content.correct_answer]}`
            })
        } else if (question.type === 'subjective') {
            // Subjective - simple heuristic scoring (can be enhanced with AI later)
            const answerText = answer?.response?.text || ''
            sectionScores.subjective.total += question.marks
            sectionScores.subjective.totalQuestions += 1

            let score = 0
            if (answerText.trim().length < 10) {
                score = 0
            } else if (answerText.trim().length < 50) {
                score = Math.round(question.marks * 0.3) // 30% for very short answers
            } else if (answerText.trim().length < 150) {
                score = Math.round(question.marks * 0.6) // 60% for medium answers
            } else {
                score = Math.round(question.marks * 0.8) // 80% for longer answers (can be enhanced with AI)
            }

            totalScore += score
            sectionScores.subjective.score += score
            sectionScores.subjective.evaluated += 1

            // Update skill scores
            for (const skill of question.skill_tags || []) {
                skillScores[skill].score += score
            }

            evaluatedAnswers.push({
                question_id: question.id,
                type: 'subjective',
                score,
                max_score: question.marks,
                feedback: answerText.trim().length < 10 
                    ? 'No answer provided or answer too short.' 
                    : 'Answer evaluated based on length and content. (AI evaluation can be added later)'
            })
        } else if (question.type === 'coding') {
            // Coding - check execution results if available
            sectionScores.coding.total += question.marks
            sectionScores.coding.totalQuestions += 1

            const code = answer?.response?.code || ''
            const executionResults = answer?.response?.execution_results || []
            
            let score = 0
            let testCasesPassed = 0
            const totalTestCases = question.content.test_cases?.length || 0

            if (code.trim().length < 20) {
                score = 0
            } else if (executionResults.length > 0) {
                // Use actual test case results
                testCasesPassed = executionResults.filter((r: any) => r.passed).length
                score = Math.round((testCasesPassed / totalTestCases) * question.marks)
                sectionScores.coding.testCasesPassed += testCasesPassed
                sectionScores.coding.totalTestCases += totalTestCases
            } else {
                // Fallback: give partial credit for code submission
                score = Math.round(question.marks * 0.3) // 30% for code submission without execution
            }

            totalScore += score
            sectionScores.coding.score += score

            // Update skill scores
            for (const skill of question.skill_tags || []) {
                skillScores[skill].score += score
            }

            evaluatedAnswers.push({
                question_id: question.id,
                type: 'coding',
                score,
                max_score: question.marks,
                feedback: code.trim().length < 20
                    ? 'No code submitted or code too short.'
                    : executionResults.length > 0
                        ? `${testCasesPassed}/${totalTestCases} test cases passed`
                        : 'Code submitted but not executed. (Execution can be added later)'
            })
        }
    }

    // Calculate percentages for skill scores
    const skillScoresWithPercentage: Record<string, { score: number; total: number; percentage: number }> = {}
    for (const [skill, data] of Object.entries(skillScores)) {
        skillScoresWithPercentage[skill] = {
            ...data,
            percentage: data.total > 0 ? Math.round((data.score / data.total) * 100) : 0
        }
    }

    const percentage = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0

    return {
        totalScore,
        totalPossible,
        percentage,
        sectionScores: {
            mcq: {
                score: sectionScores.mcq.score,
                total: sectionScores.mcq.total,
                correct: sectionScores.mcq.correct,
                totalQuestions: sectionScores.mcq.totalQuestions
            },
            subjective: {
                score: sectionScores.subjective.score,
                total: sectionScores.subjective.total,
                evaluated: sectionScores.subjective.evaluated,
                totalQuestions: sectionScores.subjective.totalQuestions
            },
            coding: {
                score: sectionScores.coding.score,
                total: sectionScores.coding.total,
                testCasesPassed: sectionScores.coding.testCasesPassed,
                totalTestCases: sectionScores.coding.totalTestCases
            }
        },
        skillScores: skillScoresWithPercentage,
        evaluatedAnswers
    }
}

/**
 * Evaluate and save scores to submission
 */
export async function evaluateAndSaveSubmission(
    submission: CandidateSubmission,
    questions: Question[]
): Promise<EvaluationResult> {
    const evaluation = evaluateSubmission(submission, questions)
    
    // Import here to avoid circular dependency
    const { updateSubmissionScores } = require('./submissionService')
    await updateSubmissionScores(submission.id, {
        totalScore: evaluation.totalScore,
        totalPossible: evaluation.totalPossible,
        percentage: evaluation.percentage,
        sectionScores: evaluation.sectionScores,
        skillScores: evaluation.skillScores
    })
    
    return evaluation
}
