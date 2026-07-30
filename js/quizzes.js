/**
 * ============================================================
 * Omnora Student AI
 * File: js/quizzes.js
 * Commit 1
 * Purpose: Quiz Authentication & Session Guard
 * ============================================================
 */

const QuizApp = {

    elements: {},

    student: null,

    async init() {

        this.cacheElements();

        this.bindEvents();

        await this.checkAuthentication();

    },

    cacheElements() {

        this.elements.form =
            document.getElementById("quizVerificationForm");

        this.elements.omsId =
            document.getElementById("omsId");

        this.elements.password =
            document.getElementById("password");

        this.elements.submitButton =
            document.getElementById("verifyQuizButton");

        this.elements.verificationCard =
            document.getElementById("quizVerificationCard");

        this.elements.quizContainer =
            document.getElementById("quizContainer");

    },

    bindEvents() {

        if (this.elements.form) {

            this.elements.form.addEventListener(
                "submit",
                this.handleVerification.bind(this)
            );

        }

    },

    async checkAuthentication() {

        try {

            if (
                typeof OmnoraAuth === "undefined" ||
                !OmnoraAuth.getCurrentSession
            ) {

                console.warn("OmnoraAuth unavailable.");

                this.showVerification();

                return;

            }

            const session =
                await OmnoraAuth.getCurrentSession();

            if (!session) {

                this.showVerification();

                return;

            }

            this.student =
                await OmnoraAuth.getCurrentUser();

            this.prefillStudent();

            this.openQuiz();

        } catch (error) {

            console.error(
                "Authentication check failed:",
                error
            );

            this.showVerification();

        }

    },

    prefillStudent() {

        if (
            !this.student ||
            !this.elements.omsId
        ) {

            return;

        }

        this.elements.omsId.value =
            this.student.oms_id || "";

        this.elements.omsId.readOnly = true;

    },

    async handleVerification(event) {

        event.preventDefault();

        const omsId =
            this.elements.omsId.value.trim();

        const password =
            this.elements.password.value;

        if (!omsId || !password) {

            return this.showError(
                "Please enter OMS-ID and password."
            );

        }

        this.setLoading(true);

        try {

            const result =
                await OmnoraAuth.loginStudent({

                    omsId,
                    password

                });

            if (!result.success) {

                return this.showError(
                    result.message ||
                    "Verification failed."
                );

            }

            this.student =
                await OmnoraAuth.getCurrentUser();

            this.prefillStudent();

            this.showSuccess(
                "Verification successful."
            );

            this.openQuiz();

        } catch (error) {

            console.error(error);

            this.showError(
                "Unable to verify student."
            );

        } finally {

            this.setLoading(false);

        }

    },

    openQuiz() {

        if (this.elements.verificationCard) {

            this.elements.verificationCard.hidden = true;

        }

        if (this.elements.quizContainer) {

            this.elements.quizContainer.hidden = false;

        }

        if (typeof this.initializeQuiz === "function") {

            this.initializeQuiz();

        }

    },

    showVerification() {

        if (this.elements.verificationCard) {

            this.elements.verificationCard.hidden = false;

        }

        if (this.elements.quizContainer) {

            this.elements.quizContainer.hidden = true;

        }

    },

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

    showSuccess(message) {

        console.log(message);

    },

    showError(message) {

        alert(message);

    }

};

document.addEventListener(

    "DOMContentLoaded",

    () => QuizApp.init()

);
/* ============================================================
 * Commit 2
 * Quiz Engine
 * ============================================================
 */

    quiz: {
        questions: [],
        currentIndex: 0,
        score: 0,
        answers: [],
        started: false
    },

    initializeQuiz() {

        this.quiz.currentIndex = 0;
        this.quiz.score = 0;
        this.quiz.answers = [];
        this.quiz.started = false;

        if (typeof window.quizQuestions !== "undefined") {

            this.quiz.questions = [...window.quizQuestions];

        }

        this.startQuiz();

    },

    startQuiz() {

        this.quiz.started = true;

        this.renderCurrentQuestion();

        if (typeof this.startTimer === "function") {

            this.startTimer();

        }

    },

    renderCurrentQuestion() {

        if (!this.quiz.questions.length) {

            console.warn("No quiz questions found.");

            return;

        }

        const question =
            this.quiz.questions[
                this.quiz.currentIndex
            ];

        if (
            typeof window.renderQuestion ===
            "function"
        ) {

            window.renderQuestion(question);

        }

    },

    submitAnswer(answer) {

        const question =
            this.quiz.questions[
                this.quiz.currentIndex
            ];

        if (!question) return;

        this.quiz.answers.push({

            questionId:
                question.id ??
                this.quiz.currentIndex,

            answer

        });

        if (answer === question.correctAnswer) {

            this.quiz.score++;

        }

        this.nextQuestion();

    },

    nextQuestion() {

        this.quiz.currentIndex++;

        if (
            this.quiz.currentIndex >=
            this.quiz.questions.length
        ) {

            this.finishQuiz();

            return;

        }

        this.renderCurrentQuestion();

    },

    finishQuiz() {

        const result = {

            student:
                this.student,

            score:
                this.quiz.score,

            total:
                this.quiz.questions.length,

            answers:
                this.quiz.answers,

            completedAt:
                new Date().toISOString()

        };

        console.log(
            "Quiz Completed",
            result
        );

        if (
            typeof window.showQuizResult ===
            "function"
        ) {

            window.showQuizResult(result);

        }

    },

    resetQuiz() {

        this.quiz.currentIndex = 0;
        this.quiz.score = 0;
        this.quiz.answers = [];
        this.quiz.started = false;

    },
