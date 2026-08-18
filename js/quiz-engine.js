/**
 * ============================================================
 * OMNORA STUDENT AI V2
 * File: quiz-engine.js
 * Purpose: Daily Quiz Business Logic Layer
 *
 * B-002.6B — Production Question Loading Contract
 *
 * Responsibilities:
 * - Maintain quiz session state
 * - Start quiz attempts
 * - Load questions through OmnoraSupabase
 * - Submit answers through OmnoraSupabase
 * - Move between questions
 * - Finish quiz through OmnoraSupabase
 *
 * Must NOT:
 * - Query Supabase tables directly
 * - Read question-bank.js in production
 * - Use window.quizQuestions as fallback
 * - Render UI
 * - Manipulate DOM
 * ============================================================
 */


/* ============================================================
 * Configuration
 * ============================================================
 */

const QUIZ_ENGINE_CONFIG = Object.freeze({

    DEFAULT_DIFFICULTY: "easy",

    QUESTION_LIMIT: 20,

    DEFAULT_MODE: "student"

});


/* ============================================================
 * Quiz Engine
 * ============================================================
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


    /* ========================================================
     * Initialize Engine
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
            await OmnoraSupabase.checkDailyQuizEligibility(
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
     * ========================================================
     */

    async startNewQuiz({

        subject,

        difficulty =
            QUIZ_ENGINE_CONFIG.DEFAULT_DIFFICULTY,

        mode =
            QUIZ_ENGINE_CONFIG.DEFAULT_MODE

    } = {}) {

        if (!this.profile?.id) {

            throw new Error(
                "QuizEngine is not initialized."
            );

        }


        if (!this.checkEligibility()) {

            throw new Error(
                "Daily quiz is not available."
            );

        }


        if (
            typeof subject !== "string" ||
            !subject.trim()
        ) {

            throw new Error(
                "Quiz subject is required."
            );

        }


        const normalizedSubject =
            subject.trim();


        const normalizedDifficulty =
            this.normalizeDifficulty(
                difficulty
            );


        const normalizedMode =
            this.normalizeMode(
                mode
            );


        /*
         * ----------------------------------------------------
         * Database session creation
         * ----------------------------------------------------
         *
         * start_quiz() is responsible for:
         * - daily eligibility enforcement
         * - creating quiz_attempts record
         * - assigning class level
         * - assigning subject
         * ----------------------------------------------------
         */

        const attemptId =
            await OmnoraSupabase.startQuiz({

                profile_id:
                    this.profile.id,

                class_level:
                    this.profile.class_level,

                subject:
                    normalizedSubject,

                mode:
                    normalizedMode

            });


        if (!attemptId) {

            throw new Error(
                "Quiz attempt could not be created."
            );

        }


        this.attempt = {

            id:
                attemptId,

            subject:
                normalizedSubject,

            difficulty:
                normalizedDifficulty,

            mode:
                normalizedMode,

            classLevel:
                this.profile.class_level

        };


        this.startedAt =
            new Date();


        this.questions =
            [];

        this.currentQuestionIndex =
            0;

        this.answers =
            [];


        return this.attempt;

    }


    /* ========================================================
     * Resume Current Session
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
     * ========================================================
     */

    async loadQuestions() {

        if (!this.profile?.id) {

            throw new Error(
                "QuizEngine is not initialized."
            );

        }


        if (!this.attempt?.id) {

            throw new Error(
                "Quiz session has not started."
            );

        }


        if (!this.attempt.classLevel) {

            throw new Error(
                "Quiz class level is missing."
            );

        }


        if (!this.attempt.subject) {

            throw new Error(
                "Quiz subject is missing."
            );

        }


        const difficulty =
            this.normalizeDifficulty(
                this.attempt.difficulty
            );


        /*
         * ----------------------------------------------------
         * IMPORTANT
         * ----------------------------------------------------
         *
         * Questions MUST come from Supabase.
         *
         * No:
         *
         * window.quizQuestions
         *
         * No:
         *
         * question-bank.js
         *
         * No direct:
         *
         * .from("quiz_questions")
         *
         *
         * The Service Layer owns database access.
         * ----------------------------------------------------
         */

        const questions =
            await OmnoraSupabase.getQuizQuestions({

                profileId:
                    this.profile.id,

                classLevel:
                    this.attempt.classLevel,

                subject:
                    this.attempt.subject,

                difficulty,

                limit:
                    QUIZ_ENGINE_CONFIG.QUESTION_LIMIT

            });


        if (
            !Array.isArray(questions) ||
            questions.length === 0
        ) {

            throw new Error(
                "No quiz questions are available for your class and subject."
            );

        }


        /*
         * ----------------------------------------------------
         * Validate the returned question set.
         * ----------------------------------------------------
         */

        const validQuestions =
            questions.filter(
                (question) =>
                    this.isValidQuestion(
                        question
                    )
            );


        if (
            validQuestions.length === 0
        ) {

            throw new Error(
                "Quiz questions returned from the database are invalid."
            );

        }


        this.questions =
            validQuestions;


        this.currentQuestionIndex =
            0;


        this.answers =
            [];


        return this.questions;

    }


    /* ========================================================
     * Question Validation
     * ========================================================
     */

    isValidQuestion(question) {

        if (!question) {

            return false;

        }


        if (
            question.id === undefined ||
            question.id === null
        ) {

            return false;

        }


        if (
            typeof question.question !==
            "string" ||
            !question.question.trim()
        ) {

            return false;

        }


        /*
         * Database rows normally contain
         * option_a → option_d.
         *
         * Service-layer responses may also
         * provide an options array.
         */

        const options =
            Array.isArray(
                question.options
            )
                ? question.options
                : [

                    question.option_a,

                    question.option_b,

                    question.option_c,

                    question.option_d

                ];


        const validOptions =
            options.filter(
                (option) =>
                    typeof option === "string" &&
                    option.trim()
            );


        return (
            validOptions.length === 4
        );

    }


    /* ========================================================
     * Get Current Question
     * ========================================================
     */

    getCurrentQuestion() {

        if (
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

        if (
            !this.attempt?.id
        ) {

            throw new Error(
                "Quiz session has not started."
            );

        }


        const question =
            this.getCurrentQuestion();


        if (!question) {

            throw new Error(
                "No active question."
            );

        }


        const normalizedAnswer =
            this.normalizeAnswer(
                selectedAnswer
            );


        if (!normalizedAnswer) {

            throw new Error(
                "A valid answer is required."
            );

        }


        /*
         * Prevent the same question from
         * being submitted twice in the
         * same engine session.
         */

        const alreadyAnswered =
            this.answers.some(
                (answer) =>
                    answer.questionId ===
                    question.id
            );


        if (alreadyAnswered) {

            throw new Error(
                "This question has already been answered."
            );

        }


        const result =
            await OmnoraSupabase.submitQuizAnswer({

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
     * Save Progress
     * ========================================================
     */

    saveProgress() {

        return {

            attemptId:
                this.attempt?.id ||
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


        if (
            progress.attemptId &&
            this.attempt?.id &&
            progress.attemptId !==
                this.attempt.id
        ) {

            return;

        }


        const index =
            Number(
                progress.currentQuestionIndex
            );


        if (
            Number.isInteger(index) &&
            index >= 0 &&
            index < this.questions.length
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

        if (
            !this.attempt?.id
        ) {

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


    /* ========================================================
     * Normalize Difficulty
     * ========================================================
     */

    normalizeDifficulty(
        difficulty
    ) {

        const value =
            typeof difficulty === "string"
                ? difficulty.trim().toLowerCase()
                : "";


        if (!value) {

            return (
                QUIZ_ENGINE_CONFIG
                    .DEFAULT_DIFFICULTY
            );

        }


        const allowed = [
            "easy",
            "medium",
            "hard"
        ];


        if (
            !allowed.includes(value)
        ) {

            throw new Error(
                `Unsupported quiz difficulty: ${difficulty}`
            );

        }


        return value;

    }


    /* ========================================================
     * Normalize Mode
     * ========================================================
     */

    normalizeMode(mode) {

        const value =
            typeof mode === "string"
                ? mode.trim().toLowerCase()
                : "";


        if (!value) {

            return (
                QUIZ_ENGINE_CONFIG
                    .DEFAULT_MODE
            );

        }


        return value;

    }


    /* ========================================================
     * Normalize Answer
     * ========================================================
     */

    normalizeAnswer(answer) {

        if (
            typeof answer !== "string"
        ) {

            return null;

        }


        const normalized =
            answer
                .split(".")[0]
                .trim()
                .toUpperCase();


        if (
            ![
                "A",
                "B",
                "C",
                "D"
            ].includes(
                normalized
            )
        ) {

            return null;

        }


        return normalized;

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
