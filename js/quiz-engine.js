/**
 * ==========================================
 * OMNORA STUDENT AI V2
 * Quiz Engine
 * B-002.2 — Database Question Flow
 * ==========================================
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
        this.completedAt = null;
    }


    /**
     * ----------------------------------------
     * Initialize Engine
     * ----------------------------------------
     */

    async initialize(profile) {

        if (!profile) {
            throw new Error(
                "Student profile is required."
            );
        }

        this.profile = profile;

        this.eligibility =
            await OmnoraSupabase
                .checkDailyQuizEligibility(
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
     * Start New Quiz
     * ----------------------------------------
     */

    async startNewQuiz({
        subject,
        difficulty = null,
        mode = "student"
    } = {}) {

        if (!this.profile) {
            throw new Error(
                "QuizEngine is not initialized."
            );
        }

        if (!subject) {
            throw new Error(
                "Quiz subject is required."
            );
        }

        const attempt =
            await OmnoraSupabase.startQuiz({

                profile_id:
                    this.profile.id,

                class_level:
                    this.profile.class_level,

                subject,

                mode
            });

        this.attempt = {
            id:
                attempt?.id ??
                attempt?.attempt_id ??
                attempt,

            subject,

            difficulty,

            mode
        };

        this.questions = [];
        this.currentQuestionIndex = 0;
        this.answers = [];

        this.startedAt = new Date();

        return this.attempt;
    }


    /**
     * ----------------------------------------
     * Resume Current Session
     * ----------------------------------------
     */

    async resumeQuiz() {

        if (
            !this.eligibility ||
            !this.eligibility.attempt
        ) {
            return null;
        }

        this.attempt =
            this.eligibility.attempt;

        return this.attempt;
    }


    /**
     * ----------------------------------------
     * Load Questions
     * ----------------------------------------
     */

    async loadQuestions() {

        if (!this.profile) {
            throw new Error(
                "QuizEngine is not initialized."
            );
        }

        if (!this.attempt) {
            throw new Error(
                "Quiz session has not started."
            );
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

        if (!Array.isArray(questions)) {
            throw new Error(
                "Invalid quiz question response."
            );
        }

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

        return this.questions[
            this.currentQuestionIndex
        ];
    }


    /**
     * ----------------------------------------
     * Submit Answer
     * ----------------------------------------
     */

    async submitAnswer(selectedAnswer) {

        const question =
            this.getCurrentQuestion();

        if (!question) {
            throw new Error(
                "No active question."
            );
        }

        if (!this.attempt?.id) {
            throw new Error(
                "Quiz attempt is not available."
            );
        }

        const result =
            await OmnoraSupabase
                .submitQuizAnswer({

                    attemptId:
                        this.attempt.id,

                    profileId:
                        this.profile.id,

                    questionId:
                        question.id,

                    selectedAnswer
                });

        this.answers.push({

            questionId:
                question.id,

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

            attemptId:
                this.attempt?.id ?? null,

            currentQuestionIndex:
                this.currentQuestionIndex,

            answered:
                this.answers.length
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

        if (!this.attempt?.id) {
            throw new Error(
                "No active quiz attempt."
            );
        }

        const summary =
            await OmnoraSupabase.finishQuiz({

                attemptId:
                    this.attempt.id
            });

        this.completedAt =
            new Date();

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
