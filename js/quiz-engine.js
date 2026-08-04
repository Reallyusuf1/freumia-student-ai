/**
 * =====================================================
 * OMNORA STUDENT AI V2
 * Quiz Engine
 * Phase 1 - Core Engine
 * =====================================================
 */

class QuizEngine {

    constructor() {

        this.profile = null;

        this.eligibility = null;

        this.attempt = null;

        this.questions = [];

        this.currentQuestionIndex = 0;

        this.answers = [];

        this.startedAt = null;

    }

    /**
     * ----------------------------------------
     * Initialize Engine
     * ----------------------------------------
     */

    async initialize(profile) {

        if (!profile) {
            throw new Error("Student profile is required.");
        }

        this.profile = profile;

        this.eligibility =
            await OmnoraSupabase.checkDailyQuizEligibility(
                profile.id
            );

        return this.eligibility;

    }

    /**
     * ----------------------------------------
     * Eligibility
     * ----------------------------------------
     */

    checkEligibility() {

        return this.eligibility;

    }

    /**
     * ----------------------------------------
     * Start Quiz Session
     * ----------------------------------------
     */

    async startNewQuiz({

        subject,

        difficulty = null,

        mode = "student"

    }) {

        if (!this.profile) {
            throw new Error("QuizEngine is not initialized.");
        }

        if (!this.eligibility) {
            throw new Error("Eligibility has not been checked.");
        }

        const attemptId =
            await OmnoraSupabase.startQuiz({

                profile_id: this.profile.id,

                class_level: this.profile.class_level,

                subject,

                mode

            });

        this.attempt = {

            id: attemptId,

            subject,

            difficulty,

            mode

        };

        this.startedAt = new Date();

        return this.attempt;

    }

    /**
     * ----------------------------------------
     * Resume Current Session
     * ----------------------------------------
     */

    async resumeQuiz() {

        return this.attempt;

    }

    /**
     * ----------------------------------------
     * Load Questions
     * ----------------------------------------
     */

    async loadQuestions() {

        if (!this.attempt) {
            throw new Error("Quiz session has not started.");
        }

        const questions =
            await OmnoraSupabase.getQuizQuestions({

                profileId:
                    this.profile.id,

                classLevel:
                    this.profile.class_level,

                subject:
                    this.attempt.subject,

                difficulty:
                    this.attempt.difficulty,

                limit: 20

            });

        if (!questions.length) {

            throw new Error(
                "No quiz questions available."
            );

        }

        this.questions = questions;

        this.currentQuestionIndex = 0;

        return this.questions;

}

/**
 * ----------------------------------------
 * Get Current Question
 * ----------------------------------------
 */
getCurrentQuestion() {

    if (!this.questions.length) {
        return null;
    }

    return this.questions[this.currentQuestionIndex];

}

/**
 * ----------------------------------------
 * Submit Answer
 * ----------------------------------------
 */
async submitAnswer(selectedAnswer) {

    const question = this.getCurrentQuestion();

    if (!question) {
        throw new Error("No active question.");
    }

    const result =
        await OmnoraSupabase.submitQuizAnswer({

            attemptId: this.attempt.id,

            profileId: this.profile.id,

            questionId: question.id,

            selectedAnswer

        });

    this.answers.push({

        questionId: question.id,

        selectedAnswer,

        result

    });

    return result;

}

/**
 * ----------------------------------------
 * Next Question
 * ----------------------------------------
 */
nextQuestion() {

    if (
        this.currentQuestionIndex >=
        this.questions.length - 1
    ) {
        return null;
    }

    this.currentQuestionIndex++;

    return this.getCurrentQuestion();

}

/**
 * ----------------------------------------
 * Save Progress
 * ----------------------------------------
 */
saveProgress() {

    return {
        attemptId: this.attempt?.id ?? null,
        currentQuestionIndex: this.currentQuestionIndex,
        answered: this.answers.length
    };

}

/**
 * ----------------------------------------
 * Restore Progress
 * ----------------------------------------
 */
restoreProgress(progress) {

    if (!progress) {
        return;
    }

    this.currentQuestionIndex =
        progress.currentQuestionIndex ?? 0;

}

/**
 * ----------------------------------------
 * Finish Quiz
 * ----------------------------------------
 */
async finishQuiz() {

    if (!this.attempt) {
        throw new Error("No active quiz attempt.");
    }

    const summary =
        await OmnoraSupabase.finishQuiz({
            attemptId: this.attempt.id
        });

    await OmnoraSupabase.updateLeaderboard();

    this.completedAt = new Date();

    return summary;

}

/**
 * ----------------------------------------
 * Reset Engine
 * ----------------------------------------
 */
reset() {

    this.attempt = null;

    this.questions = [];

    this.answers = [];

    this.currentQuestionIndex = 0;

    this.startedAt = null;

    this.completedAt = null;

}
    
}

window.QuizEngine = QuizEngine;
