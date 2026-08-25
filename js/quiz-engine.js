/**
 * ============================================================
 * OMNORA STUDENT AI
 * File: quiz-engine.js
 * Purpose: Quiz Business Logic
 *
 * Production Quiz Engine
 *
 * Responsibility:
 * - Quiz session state
 * - Daily eligibility
 * - Starting quiz attempts
 * - Loading quiz questions
 * - Answer submission
 * - Question navigation
 * - Quiz completion
 *
 * Must NOT:
 * - Manipulate DOM
 * - Render UI
 * - Manage timers
 * - Query Supabase directly
 * - Execute SQL
 * - Update leaderboard directly
 * ============================================================
 */

class QuizEngine {

    /* ========================================================
     * Constructor
     * ========================================================
     */

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


    /* ========================================================
     * Initialize
     * ========================================================
     */

    async initialize(profile) {

        if (!profile?.id) {

            throw new Error(
                "Student profile is required."
            );

        }

        if (!profile.class_level) {

            throw new Error(
                "Student class level is required."
            );

        }


        this.profile =
            profile;


        this.eligibility =
            await OmnoraSupabase
                .checkDailyQuizEligibility(
                    profile.id
                );


        return this.eligibility;

    }


    /* ========================================================
     * Eligibility
     * ========================================================
     */

    checkEligibility() {

        return this.eligibility === true;

    }


    /* ========================================================
     * Start New Quiz
     *
     * Quiz is mixed-subject.
     *
     * "Mixed" is only the attempt/session subject.
     * It is NOT used to filter questions.
     * ========================================================
     */

    async startNewQuiz({

        mode = "student"

    } = {}) {

        if (!this.profile?.id) {

            throw new Error(
                "QuizEngine is not initialized."
            );

        }


        if (!this.profile.class_level) {

            throw new Error(
                "Student class level is required."
            );

        }


        if (!this.checkEligibility()) {

            throw new Error(
                "Daily quiz is not available."
            );

        }


        /*
         * The database start_quiz RPC requires
         * a subject value.
         *
         * "Mixed" represents the entire quiz session.
         *
         * It does NOT determine which questions
         * are loaded.
         */

        const session =
            await OmnoraSupabase.startQuiz({

                profileId:
                    this.profile.id,

                classLevel:
                    this.profile.class_level,

                subject:
                    "Mixed",

                mode

            });


        if (!session?.id) {

            throw new Error(
                "Quiz attempt could not be created."
            );

        }


        this.attempt = {

            id:
                session.id,

            attemptId:
                session.attemptId ??
                session.id,

            profileId:
                this.profile.id,

            classLevel:
                this.profile.class_level,

            subject:
                "Mixed",

            mode

        };


        this.questions = [];

        this.currentQuestionIndex = 0;

        this.answers = [];

        this.startedAt =
            new Date();

        this.completedAt =
            null;


        return this.attempt;

    }


    /* ========================================================
     * Resume Current Quiz
     * ========================================================
     */

    async resumeQuiz() {

        if (!this.attempt) {

            return null;

        }


        return this.attempt;

    }


    /* ========================================================
     * Load Questions
     *
     * IMPORTANT:
     * Subject is intentionally NOT passed.
     *
     * The database determines the question pool
     * from the student's class level.
     * ========================================================
     */

    async loadQuestions() {

        if (!this.attempt) {

            throw new Error(
                "Quiz session has not started."
            );

        }


        if (!this.profile?.id) {

            throw new Error(
                "Student profile is unavailable."
            );

        }


        if (!this.profile.class_level) {

            throw new Error(
                "Student class level is unavailable."
            );

        }


        const questions =
            await OmnoraSupabase
                .getQuizQuestions({

                    profileId:
                        this.profile.id,

                    classLevel:
                        this.profile.class_level,

                    limit:
                        20

                });


        if (
            !Array.isArray(questions) ||
            questions.length === 0
        ) {

            throw new Error(
                "No quiz questions available for your class."
            );

        }


        this.questions =
            questions.slice(0, 20);


        this.currentQuestionIndex =
            0;


        return this.questions;

    }


    /* ========================================================
     * Get Current Question
     * ========================================================
     */

    getCurrentQuestion() {

        if (
            !Array.isArray(
                this.questions
            ) ||
            !this.questions.length
        ) {

            return null;

        }


        if (
            this.currentQuestionIndex < 0 ||
            this.currentQuestionIndex >=
                this.questions.length
        ) {

            return null;

        }


        return this.questions[
            this.currentQuestionIndex
        ];

    }


    /* ========================================================
     * Submit Answer
     * ========================================================
     */

    async submitAnswer(
        selectedAnswer
    ) {

        const question =
            this.getCurrentQuestion();


        if (!question) {

            throw new Error(
                "No active question."
            );

        }


        if (!this.attempt?.id) {

            throw new Error(
                "Quiz attempt is unavailable."
            );

        }


        if (!this.profile?.id) {

            throw new Error(
                "Student profile is unavailable."
            );

        }


        if (
            typeof selectedAnswer !==
            "string"
        ) {

            throw new Error(
                "Selected answer is required."
            );

        }


        const normalizedAnswer =
            selectedAnswer
                .split(".")[0]
                .trim()
                .toUpperCase();


        if (
            !["A", "B", "C", "D"]
                .includes(
                    normalizedAnswer
                )
        ) {

            throw new Error(
                "Invalid answer selected."
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

                    selectedAnswer:
                        normalizedAnswer

                });


        this.answers.push({

            questionId:
                question.id,

            selectedAnswer:
                normalizedAnswer,

            result

        });


        return result;

    }


    /* ========================================================
     * Next Question
     * ========================================================
     */

    nextQuestion() {

        if (
            !this.questions.length
        ) {

            return null;

        }


        if (
            this.currentQuestionIndex >=
            this.questions.length - 1
        ) {

            return null;

        }


        this.currentQuestionIndex++;


        return this.getCurrentQuestion();

    }


    /* ========================================================
     * Quiz Progress
     * ========================================================
     */

    getProgress() {

        const total =
            this.questions.length;


        const current =
            total > 0
                ? this.currentQuestionIndex + 1
                : 0;


        return {

            current,

            total,

            answered:
                this.answers.length,

            remaining:
                Math.max(
                    total -
                    this.answers.length,
                    0
                )

        };

    }


    /* ========================================================
     * Save Progress
     * ========================================================
     */

    saveProgress() {

        return {

            attemptId:
                this.attempt?.id ??
                null,

            currentQuestionIndex:
                this.currentQuestionIndex,

            answered:
                this.answers.length

        };

    }


    /* ========================================================
     * Restore Progress
     * ========================================================
     */

    restoreProgress(progress) {

        if (!progress) {

            return;

        }


        const index =
            Number(
                progress.currentQuestionIndex
            );


        if (
            Number.isInteger(index) &&
            index >= 0 &&
            index <
                this.questions.length
        ) {

            this.currentQuestionIndex =
                index;

        }

    }


    /* ========================================================
     * Finish Quiz
     * ========================================================
     */

    async finishQuiz() {

        if (!this.attempt?.id) {

            throw new Error(
                "No active quiz attempt."
            );

        }


        const summary =
            await OmnoraSupabase
                .finishQuiz({

                    attemptId:
                        this.attempt.id

                });


        this.completedAt =
            new Date();


        return summary;

    }


    /* ========================================================
     * Get Session State
     * ========================================================
     */

    getState() {

        return {

            profile:
                this.profile,

            eligibility:
                this.eligibility,

            attempt:
                this.attempt,

            questions:
                [...this.questions],

            currentQuestionIndex:
                this.currentQuestionIndex,

            answers:
                [...this.answers],

            startedAt:
                this.startedAt,

            completedAt:
                this.completedAt

        };

    }


    /* ========================================================
     * Reset Engine
     * ========================================================
     */

    reset() {

        this.profile =
            null;

        this.eligibility =
            null;

        this.attempt =
            null;

        this.questions =
            [];

        this.currentQuestionIndex =
            0;

        this.answers =
            [];

        this.startedAt =
            null;

        this.completedAt =
            null;

    }

}


/* ============================================================
 * Global Export
 * ============================================================
 */

window.QuizEngine =
    QuizEngine;
