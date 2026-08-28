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


const provider =
    session.user?.app_metadata?.provider ||
    session.user?.identities?.[0]?.provider ||
    "";


const isGoogleUser =
    provider === "google";


const profileCheck =
    this.validateQuizProfile(
        isGoogleUser
    );


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


        return this.student;

    },


    /* ========================================================
     * Profile Completeness
     * ========================================================
     *
     * Required before the Daily Quiz can open:
     * - FMS-ID
     * - Full Name
     * - Country
     * - Class Level
     *
     * This controller uses the existing profile service.
     * It does not query Supabase directly.
     * ========================================================
     */

    validateQuizProfile(isGoogleUser = false) {

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


    /*
     * Full Name is required for every user.
     */

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


    /*
     * Country is required for every user.
     */

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


    /*
     * Class Level is required for every user.
     */

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


    /*
     * FMS-ID is required ONLY for normal
     * FMS students.
     *
     * Google users do not need FMS-ID.
     */

    if (
        !isGoogleUser &&
        (
            !this.student.fms_id ||
            !String(
                this.student.fms_id
            ).trim()
        )
    ) {

        missing.push(
            "FMS-ID"
        );

    }


    const fieldMap = {

        "Full Name":
            "full-name",

        "Country":
            "country",

        "Class Level":
            "student-class",

        "FMS-ID":
            null

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

            "Your profile is incomplete. Please complete " +

            "the following information before starting " +

            "the quiz:\n\n" +

            fields +

            "\n\n" +

            "You will be taken to your profile to update it."

        );


        if (
            profileCheck.firstField
        ) {

            window.location.href =
                `student-profile.html#${profileCheck.firstField}`;

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

    async handleVerification(event) {

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
            this.elements.password?.value || "";


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


        const profileCheck =
    this.validateQuizProfile();


        if (!profileCheck.valid) {

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


        this.quiz.subject = null;


        try {

            this.setQuizLoading(true);


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


            if (!this.quiz.questions.length) {

                throw new Error(
                    "No quiz questions are available for your class and subject."
                );

            }


            this.quiz.attemptId =
                attempt?.id ||
                this.engine.attempt?.id ||
                null;


            if (!this.quiz.attemptId) {

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

            this.setQuizLoading(false);

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
            "You've already completed today's quiz. Please come back tomorrow for a new quiz."
        );


        window.location.href =
            "index.html";

    },


    /* ========================================================
     * Loading State
     * ========================================================
     */

    setLoading(isLoading) {

        if (!this.elements.submitButton) {

            return;

        }


        this.elements.submitButton.disabled =
            isLoading;


        this.elements.submitButton.textContent =
            isLoading
                ? "Verifying..."
                : "Verify & Start Quiz";

    },


    setQuizLoading(isLoading) {

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

    async submitAnswer(answer) {

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
            this.normalizeAnswer(answer);


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


            this.quiz.answers =
                [
                    ...this.engine.answers
                ];


            if (
                result?.is_correct === true
            ) {

                this.quiz.score++;

            }


            this.updateProgress();


            setTimeout(
                () => {

                    this.quiz.answerLocked =
                        false;

                    this.nextQuestion();

                },
                300
            );

        } catch (error) {

            console.error(
                "Answer submission failed:",
                error
            );


            this.quiz.answerLocked =
                false;


            this.showError(
                this.getErrorMessage(
                    error,
                    "Unable to submit answer."
                )
            );

        }

    },


    /* ========================================================
     * Answer Normalization
     * ========================================================
     */

    normalizeAnswer(answer) {

        if (
            typeof answer !==
            "string"
        ) {

            return null;

        }


        const normalized =
            answer
                .split(".")[0]
                .trim()
                .toUpperCase();


        if (
            !["A", "B", "C", "D"]
                .includes(normalized)
        ) {

            return null;

        }


        return normalized;

    },


    /* ========================================================
     * Next Question
     * ========================================================
     */

    nextQuestion() {

        if (
            !this.quiz.started
        ) {

            return;

        }


        const question =
            this.engine.nextQuestion();


        if (!question) {

            this.finishQuiz();

            return;

        }


        this.quiz.currentIndex =
            this.engine.currentQuestionIndex;


        this.renderCurrentQuestion();

        this.startTimer();

    },


    /* ========================================================
     * Render Current Question
     * ========================================================
     */

    renderCurrentQuestion() {

        const question =
            this.engine.getCurrentQuestion();


        if (!question) {

            this.showError(
                "Current quiz question is unavailable."
            );

            return;

        }


        if (
            this.elements.question
        ) {

            this.elements.question.textContent =
                question.question || "";

        }


        if (
            this.elements.answers
        ) {

            this.elements.answers.innerHTML =
                "";


            const options =
                Array.isArray(
                    question.options
                )
                    ? question.options
                    : this.buildOptions(question);


            options.forEach(
                (option) => {

                    const button =
                        document.createElement(
                            "button"
                        );


                    button.type =
                        "button";


                    button.className =
                        "quiz-answer";


                    button.textContent =
                        option;


                    button.addEventListener(
                        "click",
                        () => {

                            if (
                                this.quiz.answerLocked
                            ) {

                                return;

                            }


                            const buttons =
                                this.elements.answers
                                    .querySelectorAll(
                                        ".quiz-answer"
                                    );


                            buttons.forEach(
                                (btn) => {

                                    btn.disabled =
                                        true;

                                    btn.classList.remove(
                                        "selected"
                                    );

                                }
                            );


                            button.classList.add(
                                "selected"
                            );


                            setTimeout(
                                () => {

                                    this.submitAnswer(
                                        option
                                    );

                                },
                                300
                            );

                        }
                    );


                    this.elements.answers
                        .appendChild(
                            button
                        );

                }
            );

        }


        this.updateProgress();

    },


    /* ========================================================
     * Option Compatibility
     * ========================================================
     */

    buildOptions(question) {

        return [
            question.option_a,
            question.option_b,
            question.option_c,
            question.option_d
        ]
            .filter(
                (option) =>
                    typeof option === "string" &&
                    option.trim()
            );

    },


    /* ========================================================
     * Progress
     * ========================================================
     */

    updateProgress() {

        const current =
            this.quiz.currentIndex + 1;


        const total =
            this.quiz.questions.length;


        if (
            this.elements.progress
        ) {

            this.elements.progress.textContent =
                `Question ${current} of ${total}`;

        }


        if (
            this.elements.score
        ) {

            this.elements.score.textContent =
                `Score: ${this.quiz.score}`;

        }


        const progressFill =
            document.getElementById(
                "progressFill"
            );


        if (
            progressFill &&
            total > 0
        ) {

            progressFill.style.width =
                `${(current / total) * 100}%`;

        }

    },


    /* ========================================================
     * Timer
     * ========================================================
     */

    formatTime(seconds) {

        const minutes =
            Math.floor(seconds / 60);


        const secs =
            seconds % 60;


        return (
            `${String(minutes).padStart(2, "0")}:` +
            `${String(secs).padStart(2, "0")}`
        );

    },


    startTimer() {

        clearInterval(
            this.quiz.timer
        );


        let remaining =
            QUIZ_CONFIG.TIME_LIMIT;


        if (
            this.elements.timer
        ) {

            this.elements.timer.textContent =
                this.formatTime(
                    remaining
                );

        }


        this.quiz.timer =
            setInterval(
                () => {

                    remaining--;


                    if (
                        this.elements.timer
                    ) {

                        this.elements.timer.textContent =
                            this.formatTime(
                                remaining
                            );

                    }


                    if (
                        remaining <= 0
                    ) {

                        clearInterval(
                            this.quiz.timer
                        );


                        this.quiz.timer =
                            null;


                        /*
                         * Do not submit NULL.
                         *
                         * quiz_question_history requires
                         * selected_answer to be non-null.
                         *
                         * Timeout handling will be finalized
                         * in the QuizEngine/RPC layer.
                         */

                        this.handleTimeout();

                    }

                },
                1000
            );

    },


    /* ========================================================
     * Timeout
     * ========================================================
     */

    handleTimeout() {

        if (
            this.quiz.answerLocked
        ) {

            return;

        }


        this.quiz.answerLocked =
            true;


        this.showError(
            "Time is up."
        );


        /*
         * B-002.6A intentionally does not
         * submit NULL to the database.
         *
         * Proper timeout persistence belongs
         * to the Engine/RPC contract.
         */

        setTimeout(
            () => {

                this.quiz.answerLocked =
                    false;

                this.finishQuiz();

            },
            300
        );

    },
      /* ========================================================
     * Finish Quiz
     * ========================================================
     */

    async finishQuiz() {

        if (
            this.finishing
        ) {

            return;

        }


        this.finishing =
            true;


        clearInterval(
            this.quiz.timer
        );


        this.quiz.timer =
            null;


        if (
            this.elements.timer
        ) {

            this.elements.timer.textContent =
                "Completed";

        }


        try {

            const result =
                await this.engine.finishQuiz();


            this.quiz.started =
                false;


            this.quiz.attemptId =
                this.engine.attempt?.id ||
                this.quiz.attemptId;


            this.showQuizResult(
                result
            );

        } catch (error) {

            console.error(
                "Quiz completion failed:",
                error
            );


            this.showError(
                this.getErrorMessage(
                    error,
                    "Unable to complete quiz."
                )
            );

        } finally {

            this.finishing =
                false;

        }

    },


    /* ========================================================
     * Result
     * ========================================================
     */

    showQuizResult(result) {

        if (
            this.elements.quizContainer
        ) {

            this.elements.quizContainer.hidden =
                true;

        }


        if (
            !this.elements.resultSection
        ) {

            return;

        }


        this.elements.resultSection.hidden =
            false;


        this.elements.resultSection.setAttribute(
            "tabindex",
            "-1"
        );


        this.elements.resultSection.focus();


        const normalized =
            this.normalizeResult(
                result
            );


        if (
            this.elements.resultScore
        ) {

            this.elements.resultScore.textContent =
                normalized.score;

        }


        if (
            this.elements.resultTotal
        ) {

            this.elements.resultTotal.textContent =
                normalized.total;

        }


        if (
            this.elements.resultPercentage
        ) {

            this.elements.resultPercentage.textContent =
                `${normalized.percentage}%`;

        }


        if (
            this.elements.resultStatus
        ) {

            this.elements.resultStatus.textContent =
                normalized.passed
                    ? "PASSED"
                    : "FAILED";


            this.elements.resultStatus.className =
                normalized.passed
                    ? "result-status passed"
                    : "result-status failed";


            this.elements.resultStatus.setAttribute(
                "aria-live",
                "polite"
            );

        }


        if (
            this.elements.earnedPoints
        ) {

            this.elements.earnedPoints.textContent =
                `${normalized.points} XP`;

        }

    },


    /* ========================================================
     * Result Normalization
     * ========================================================
     */

    normalizeResult(result) {

        const raw =
            Array.isArray(result)
                ? result[0]
                : result;


        const score =
            Number(
                raw?.correct_answers ??
                raw?.score ??
                0
            );


        const total =
            Number(
                raw?.total_questions ??
                raw?.total ??
                this.quiz.questions.length ??
                0
            );


        const percentage =
            Number(
                raw?.score_percentage ??
                (
                    total > 0
                        ? (
                            score / total
                        ) * 100
                        : 0
                )
            );


        const points =
            Number(
                raw?.points_earned ??
                raw?.xp ??
                0
            );


        return {

            score,

            total,

            percentage:
                Math.round(
                    percentage
                ),

            points,

            passed:
                percentage >=
                QUIZ_CONFIG.PASSING_SCORE

        };

    },


    /* ========================================================
     * Helpers
     * ========================================================
     */

    showToast(
        message,
        type = "error"
    ) {

        if (
            type === "error"
        ) {

            console.error(
                message
            );

        } else {

            console.log(
                message
            );

        }


        /*
         * TODO:
         * Replace with the shared
         * Freumia UI Toast component.
         */

    },


    showError(message) {

        this.showToast(
            message,
            "error"
        );

    },


    showSuccess(message) {

        this.showToast(
            message,
            "success"
        );

    },


    getErrorMessage(
        error,
        fallback
    ) {

        if (
            error?.message &&
            typeof error.message ===
                "string"
        ) {

            return error.message;

        }


        return fallback;

    },


    /* ========================================================
     * Reset
     * ========================================================
     */

    resetQuizState() {

        clearInterval(
            this.quiz.timer
        );


        this.quiz.timer =
            null;


        this.quiz.questions =
            [];


        this.quiz.currentIndex =
            0;


        this.quiz.score =
            0;


        this.quiz.answers =
            [];


        this.quiz.started =
            false;


        this.quiz.attemptId =
            null;


        this.quiz.answerLocked =
            false;


        this.finishing =
            false;

    }

};


/* ============================================================
 * Application Bootstrap
 * ============================================================
 */

document.addEventListener(
    "DOMContentLoaded",
    () => QuizApp.init()
);

  
