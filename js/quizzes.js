/**
 * ============================================================
 * Omnora Student AI
 * File: quizzes.js
 * Purpose: Daily Quiz Controller
 *
 * B-002.6A — Production Controller Refactor
 *
 * Responsibility:
 * - Authentication flow
 * - Quiz page flow
 * - UI state
 * - User interaction
 * - Timer events
 * - Rendering
 *
 * Must NOT:
 * - Query Supabase tables directly
 * - Execute SQL
 * - Contain database business logic
 * - Calculate database statistics
 * - Update leaderboard directly
 * ============================================================
 */


/* ============================================================
 * Configuration
 * ============================================================
 */

const QUIZ_CONFIG = Object.freeze({

    TIME_LIMIT: 30,

    PASSING_SCORE: 50

});


/* ============================================================
 * Quiz Controller
 * ============================================================
 */

const QuizApp = {

    /* ========================================================
     * State
     * ========================================================
     */

    elements: {},

    student: null,

    engine: null,

    quizEligibility: null,

    verificationInProgress: false,

    finishing: false,


    /* ========================================================
     * Quiz State
     * ========================================================
     */

    quiz: {

        questions: [],

        currentIndex: 0,

        score: 0,

        answers: [],

        started: false,

        attemptId: null,

        classLevel: null,

        subject: null,

        difficulty: null,

        mode: "student",

        timer: null,

        answerLocked: false

    },


    /* ========================================================
     * Initialization
     * ========================================================
     */

    async init() {

        try {

            this.cacheElements();

            this.cacheQuizElements();

            this.bindEvents();

            this.engine =
                new QuizEngine();

            await this.checkAuthentication();

        } catch (error) {

            console.error(
                "Quiz initialization failed:",
                error
            );

            this.showError(
                "Unable to initialize the quiz."
            );

            this.showVerification();

        }

    },


    /* ========================================================
     * DOM Elements
     * ========================================================
     */

    cacheElements() {

        this.elements.form =
            document.getElementById(
                "quizVerificationForm"
            );

        this.elements.fmsId =
            document.getElementById(
                "fmsId"
            );

        this.elements.password =
            document.getElementById(
                "password"
            );

        this.elements.submitButton =
            document.getElementById(
                "verifyQuizButton"
            );

        this.elements.verificationCard =
            document.getElementById(
                "quizVerificationCard"
            );

        this.elements.quizContainer =
            document.getElementById(
                "quizContainer"
            );

    },


    /* ========================================================
     * Quiz DOM Elements
     * ========================================================
     */

    cacheQuizElements() {

        this.elements.question =
            document.getElementById(
                "questionText"
            );

        this.elements.answers =
            document.getElementById(
                "answersContainer"
            );

        this.elements.progress =
            document.getElementById(
                "quizProgress"
            );

        this.elements.score =
            document.getElementById(
                "quizScore"
            );

        this.elements.timer =
            document.getElementById(
                "quizTimer"
            );

        this.elements.nextButton =
            document.getElementById(
                "nextQuestionButton"
            );

        this.elements.resultSection =
            document.getElementById(
                "quizResult"
            );

        this.elements.resultScore =
            document.getElementById(
                "resultScore"
            );

        this.elements.resultTotal =
            document.getElementById(
                "resultTotal"
            );

        this.elements.resultPercentage =
            document.getElementById(
                "resultPercentage"
            );

        this.elements.resultStatus =
            document.getElementById(
                "resultStatus"
            );

        this.elements.earnedPoints =
            document.getElementById(
                "earnedPoints"
            );

        this.elements.finishButton =
            document.getElementById(
                "finishQuizButton"
            );

    },


    /* ========================================================
     * Event Binding
     * ========================================================
     */

    bindEvents() {

        if (this.elements.form) {

            this.elements.form.addEventListener(
                "submit",
                this.handleVerification.bind(this)
            );

        }


        if (this.elements.finishButton) {

            this.elements.finishButton.addEventListener(
                "click",
                () => {

                    if (
                        this.elements.finishButton.disabled
                    ) {

                        return;

                    }

                    this.elements.finishButton.disabled =
                        true;

                    window.location.href =
                        "index.html";

                }
            );

        }

    },


    /* ========================================================
     * Authentication
     * ========================================================
     */

    async checkAuthentication() {

        try {

            if (
                typeof OmnoraAuth === "undefined" ||
                typeof OmnoraAuth.getCurrentSession !==
                    "function"
            ) {

                console.warn(
                    "OmnoraAuth unavailable."
                );

                this.showVerification();

                return;

            }


            const session =
                await OmnoraAuth.getCurrentSession();


            if (!session) {

                this.showVerification();

                return;

            }


            const authUser =
                await OmnoraAuth.getCurrentUser();


            if (!authUser?.id) {

                throw new Error(
                    "Authenticated user not found."
                );

            }


            await this.loadStudent(
                authUser.id
            );


            const profileCheck =
                this.validateQuizProfile();


            if (!profileCheck.valid) {

                this.showMissingProfileAlert(
                    profileCheck
                );

                return;

            }


            await this.initializeEngine();


            this.prefillStudent();


            await this.verifyDailyEligibility();


            if (
                this.quizEligibility !== true
            ) {

                this.showDailyQuizLocked();

                return;

            }


            await this.openQuiz();

        } catch (error) {

            console.error(
                "Authentication check failed:",
                error
            );

            this.showError(
                this.getErrorMessage(
                    error,
                    "Unable to verify student."
                )
            );

            this.showVerification();

        }

    },


    /* ========================================================
     * Student Loading
     * ========================================================
     */

    async loadStudent(userId) {

        this.student =
            await OmnoraSupabase.getStudentProfile(
                userId
            );


        if (!this.student?.id) {

            throw new Error(
                "Student profile not found."
            );

        }


        /*
         * Profile completeness is validated before
         * the quiz engine starts.
         *
         * loadStudent() remains responsible only
         * for loading the real student profile
         * through the existing Supabase service.
         */

        return this.student;

    },


    /* ========================================================
     * Profile Completeness
     * ========================================================
     */

    validateQuizProfile() {

        if (!this.student?.id) {

            return {

                valid: false,

                missing: [
                    "Student Profile"
                ],

                firstField: null

            };

        }


        const missing = [];


        if (
            !this.student.fms_id ||
            !String(
                this.student.fms_id
            ).trim()
        ) {

            missing.push(
                "FMS-ID"
            );

        }


        if (
            !this.student.full_name ||
            !String(
                this.student.full_name
            ).trim()
        ) {

            missing.push(
                "Full Name"
            );

        }


        if (
            !this.student.country ||
            !String(
                this.student.country
            ).trim()
        ) {

            missing.push(
                "Country"
            );

        }


        if (
            !this.student.class_level ||
            !String(
                this.student.class_level
            ).trim()
        ) {

            missing.push(
                "Class Level"
            );

        }


        const fieldMap = {

            "FMS-ID":
                null,

            "Full Name":
                "full-name",

            "Country":
                "country",

            "Class Level":
                "student-class"

        };


        return {

            valid:
                missing.length === 0,

            missing,

            firstField:
                fieldMap[
                    missing[0]
                ] || null

        };

    },


    /* ========================================================
     * Missing Profile Alert
     * ========================================================
     */

    showMissingProfileAlert(
        profileCheck
    ) {

        const fields =
            profileCheck.missing
                .map(
                    field =>
                        `• ${field}`
                )
                .join("\n");


        alert(

            "Profile Information Missing\n\n" +

            "Your profile is incomplete. " +

            "Please complete the following " +

            "information before starting " +

            "the quiz:\n\n" +

            fields +

            "\n\n" +

            "You will be taken to your profile " +

            "to update it."

        );


        const target =
            profileCheck.firstField;


        if (target) {

            window.location.href =
                `student-profile.html#${target}`;

        } else {

            window.location.href =
                "student-profile.html";

        }

    },


    /* ========================================================
     * Engine Initialization
     * ========================================================
     */

    async initializeEngine() {

        if (!this.engine) {

            this.engine =
                new QuizEngine();

        }


        await this.engine.initialize(
            this.student
        );

    },


    /* ========================================================
     * Daily Eligibility
     * ========================================================
     */

    async verifyDailyEligibility() {

        this.quizEligibility =
            this.engine.checkEligibility();


        if (
            typeof this.quizEligibility !==
            "boolean"
        ) {

            throw new Error(
                "Daily quiz eligibility could not be verified."
            );

        }


        return this.quizEligibility;

    },


    /* ========================================================
     * Student Prefill
     * ========================================================
     */

    prefillStudent() {

        if (
            !this.student ||
            !this.elements.fmsId
        ) {

            return;

        }


        this.elements.fmsId.value =
            this.student.fms_id || "";


        this.elements.fmsId.readOnly =
            true;

    },


    /* ========================================================
     * Manual Verification
     * ========================================================
     */

    async handleVerification(
        event
    ) {

        event.preventDefault();


        if (
            this.verificationInProgress
        ) {

            return;

        }


        const fmsId =
            this.elements.fmsId?.value
                ?.trim() || "";


        const password =
            this.elements.password?.value ||
            "";


        if (!fmsId || !password) {

            this.showError(
                "Please enter FMS-ID and password."
            );

            return;

        }


        this.verificationInProgress =
            true;


        this.setLoading(true);


        try {

            const result =
                await OmnoraAuth.loginStudent({

                    fmsId,

                    password

                });


            if (!result?.success) {

                throw new Error(
                    result?.message ||
                    "Verification failed."
                );

            }


            const authUser =
                await OmnoraAuth.getCurrentUser();


            if (!authUser?.id) {

                throw new Error(
                    "Authenticated student could not be found."
                );

            }


            await this.loadStudent(
                authUser.id
            );


            const profileCheck =
                this.validateQuizProfile();


            if (!profileCheck.valid) {

                this.showMissingProfileAlert(
                    profileCheck
                );

                return;

            }


            await this.initializeEngine();


            this.prefillStudent();


            await this.verifyDailyEligibility();


            if (
                this.quizEligibility !== true
            ) {

                this.showDailyQuizLocked();

                return;

            }


            this.showSuccess(
                "Verification successful."
            );


            await this.openQuiz();

        } catch (error) {

            console.error(
                "Student verification failed:",
                error
            );

            this.showError(
                this.getErrorMessage(
                    error,
                    "Unable to verify student."
                )
            );

        } finally {

            this.verificationInProgress =
                false;

            this.setLoading(false);

        }

    },


    /* ========================================================
     * Open Quiz
     * ========================================================
     */

    async openQuiz() {

        if (!this.student?.id) {

            this.showError(
                "Student profile not found."
            );

            return;

        }


        /*
         * Final safety gate.
         *
         * This protects the quiz even if openQuiz()
         * is called from another controller path.
         */

        if (!this.student.class_level) {

            const profileCheck =
                this.validateQuizProfile();


            this.showMissingProfileAlert(
                profileCheck
            );

            return;

        }


        if (
            this.quizEligibility !== true
        ) {

            this.showDailyQuizLocked();

            return;

        }


        this.quiz.classLevel =
            this.student.class_level;


        this.quiz.subject =
            null;


        try {

            this.setQuizLoading(
                true
            );


            /*
             * ------------------------------------------------
             * Start quiz through QuizEngine.
             *
             * QuizEngine owns the service/RPC interaction.
             * Controller does not query Supabase directly.
             * ------------------------------------------------
             */

            const attempt =
                await this.engine.startNewQuiz({

                    subject:
                        this.quiz.subject,

                    difficulty:
                        this.quiz.difficulty,

                    mode:
                        this.quiz.mode

                });


            /*
             * ------------------------------------------------
             * Questions are loaded by QuizEngine.
             * ------------------------------------------------
             */

            await this.engine.loadQuestions();


            this.quiz.questions =
                Array.isArray(
                    this.engine.questions
                )
                    ? [
                        ...this.engine.questions
                    ]
                    : [];


            if (
                !this.quiz.questions.length
            ) {

                throw new Error(
                    "No quiz questions are available for your class and subject."
                );

            }


            this.quiz.attemptId =
                attempt?.id ||
                this.engine.attempt?.id ||
                null;


            if (
                !this.quiz.attemptId
            ) {

                throw new Error(
                    "Quiz attempt could not be created."
                );

            }


            this.quiz.started =
                true;


            this.quiz.currentIndex =
                this.engine.currentQuestionIndex;


            this.quiz.score =
                0;


            this.quiz.answers =
                [];


            this.quiz.answerLocked =
                false;


            this.hideVerification();

            this.showQuizContainer();

            this.renderCurrentQuestion();

            this.startTimer();

        } catch (error) {

            console.error(
                "Quiz start failed:",
                error
            );


            this.quiz.started =
                false;


            this.showError(
                this.getErrorMessage(
                    error,
                    "Unable to start quiz."
                )
            );

        } finally {

            this.setQuizLoading(
                false
            );

        }

    },


    /* ========================================================
     * Verification / Quiz Visibility
     * ========================================================
     */

    showVerification() {

        if (
            this.elements.verificationCard
        ) {

            this.elements.verificationCard.hidden =
                false;

        }


        if (
            this.elements.quizContainer
        ) {

            this.elements.quizContainer.hidden =
                true;

        }

    },


    hideVerification() {

        if (
            this.elements.verificationCard
        ) {

            this.elements.verificationCard.hidden =
                true;

        }

    },


    showQuizContainer() {

        if (
            this.elements.quizContainer
        ) {

            this.elements.quizContainer.hidden =
                false;

        }

    },


    showDailyQuizLocked() {

        this.quiz.started =
            false;


        if (
            this.elements.quizContainer
        ) {

            this.elements.quizContainer.hidden =
                true;

        }


        if (
            this.elements.verificationCard
        ) {

            this.elements.verificationCard.hidden =
                false;

        }


        alert(

            "Daily Quiz Completed\n\n" +

            "You've already completed today's quiz. " +

            "Please come back tomorrow for a new quiz."

        );


        window.location.href =
            "index.html";

    },


    /* ========================================================
     * Loading State
     * ========================================================
     */

    setLoading(
        isLoading
    ) {

        if (
            !this.elements.submitButton
        ) {

            return;

        }


        this.elements.submitButton.disabled =
            isLoading;


        this.elements.submitButton.textContent =
            isLoading
                ? "Verifying..."
                : "Verify & Start Quiz";

    },


    setQuizLoading(
        isLoading
    ) {

        if (
            !this.elements.quizContainer
        ) {

            return;

        }


        this.elements.quizContainer
            .setAttribute(
                "aria-busy",
                String(isLoading)
            );

    },


    /* ========================================================
     * Quiz Answer
     * ========================================================
     */

    async submitAnswer(
        answer
    ) {

        if (
            !this.quiz.started ||
            !this.engine
        ) {

            return;

        }


        if (
            this.quiz.answerLocked
        ) {

            return;

        }


        const selectedAnswer =
            this.normalizeAnswer(
                answer
            );


        /*
         * Timeout is handled separately.
         * Database requires a non-null answer.
         */

        if (!selectedAnswer) {

            this.showError(
                "Please select an answer."
            );

            return;

        }


        this.quiz.answerLocked =
            true;


        try {

            const result =
                await this.engine.submitAnswer(
                    selectedAnswer
                );


            if (!result) {

                throw new Error(
                    "Answer submission failed."
                );

            }


            this.quiz.score =
                Number(
                    result.score ??
                    this.engine.score ??
                    this.quiz.score
                );


            this.quiz.answers.push({
                answer:
                    selectedAnswer,

                correct:
                    result.correct === true
            });


            this.renderScore();


            this.renderAnswerFeedback(
                result
            );


        } catch (error) {

            console.error(
                "Answer submission failed:",
                error
            );


            this.showError(
                this.getErrorMessage(
                    error,
                    "Unable to submit answer."
                )
            );


            this.quiz.answerLocked =
                false;

        }

    },


    /* ========================================================
     * Answer Normalization
     * ========================================================
     */

    normalizeAnswer(
        answer
    ) {

        if (
            answer === null ||
            answer === undefined
        ) {

            return null;

        }


        const normalized =
            String(answer)
                .trim()
                .toUpperCase();


        if (
            ["A", "B", "C", "D"]
                .includes(
                    normalized
                )
        ) {

            return normalized;

        }


        return null;

    },


    /* ========================================================
     * Error Handling
     * ========================================================
     */

    getErrorMessage(
        error,
        fallback
    ) {

        if (
            error instanceof Error &&
            error.message
        ) {

            return error.message;

        }


        if (
            typeof error === "string" &&
            error.trim()
        ) {

            return error;

        }


        return fallback;

    },


    showError(
        message
    ) {

        this.showToast(
            message,
            "error"
        );

    },


    showSuccess(
        message
    ) {

        this.showToast(
            message,
            "success"
        );

    },


    showToast(
        message,
        type = "info"
    ) {

        /*
         * Keep the existing toast mechanism.
         * Profile-specific blocking uses alert()
         * so the user cannot miss the required action.
         */

        console[type === "error"
            ? "error"
            : "log"](
            message
        );

    }

};


/* ============================================================
 * Initialize Quiz Application
 * ============================================================
 */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        QuizApp.init();

    }
);
