/**
 * ==========================================
 * OMNORA STUDENT AI V2
 * Quiz Engine
 * Business Logic Layer
 * ==========================================
 */

class QuizEngine {
    constructor() {
        this.profile = null;
        this.attempt = null;
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.answers = [];
        this.startedAt = null;
    }

    // Entry Point
    async initialize(profile) {
    this.profile = profile;

    this.eligibility =
        await OmnoraSupabase.checkDailyQuizEligibility(profile.id);

    return this.eligibility;
    }

    // Eligibility
    async checkEligibility() {}

    // Session
    async startNewQuiz() {
    const attempt = await OmnoraSupabase.startQuiz({
        profile_id: this.profile.id,
        class_level: this.profile.class_level,
        subject: "general",
        mode: "student"
    });

    this.attempt = attempt;

    return this.attempt;
    }
        async resumeQuiz() {

    if (
        !this.eligibility ||
        !this.eligibility.attempt
    ) {
        return null;
    }

    this.attempt = this.eligibility.attempt;

    return this.attempt;
        }
    
    async saveProgress() {}
    async restoreProgress() {}

    // Questions
    async loadQuestions() {

    try {

        const questions =
            await OmnoraSupabase.getQuizQuestions({
                profileId: this.profile.id,
                classLevel: this.profile.class_level,
                subject: "general",
                difficulty: "easy"
            });

        if (questions && questions.length > 0) {

            this.questions = questions;
            return this.questions;

        }

    } catch (error) {

        console.warn(
            "Supabase questions unavailable. Using local question bank.",
            error
        );

    }

    // Fallback

const filteredQuestions = [...window.quizQuestions]
    .filter(question =>
        question.level === this.profile.class_level &&
        question.subject === "general" &&
        question.difficulty === "easy"
    )
    .sort(() => Math.random() - 0.5)
    .slice(0, 10);

this.questions = filteredQuestions;

return this.questions;
    
    getCurrentQuestion() {}
    async submitAnswer(answer) {}
    async nextQuestion() {}

    // Completion
    async finishQuiz() {}
    reset() {}
}

window.QuizEngine = QuizEngine;
