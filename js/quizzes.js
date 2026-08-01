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
this.cacheQuizElements();
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
    started: false,

    attemptId: null,
    classLevel: null,
    subject: null,
    difficulty: null,
    timer: null
}

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

if (typeof this.startTimer === "function") {

    this.startTimer();

}

    },

        if (window.DEBUG_MODE) {
    console.log(result);
        }

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
/* ============================================================
 * Commit 3
 * Quiz UI Integration
 * ============================================================
 */

    cacheQuizElements() {

        this.elements.question =
            document.getElementById("questionText");

        this.elements.answers =
            document.getElementById("answersContainer");

        this.elements.progress =
            document.getElementById("quizProgress");

        this.elements.score =
            document.getElementById("quizScore");

        this.elements.timer =
            document.getElementById("quizTimer");

        this.elements.nextButton =
            document.getElementById("nextQuestionButton");

    },

    renderCurrentQuestion() {

        const question =
            this.quiz.questions[this.quiz.currentIndex];

        if (!question) return;

        if (this.elements.question) {

            this.elements.question.textContent =
                question.question;

        }

        if (this.elements.answers) {

            this.elements.answers.innerHTML = "";

            question.options.forEach(option => {

                const button =
                    document.createElement("button");

                button.type = "button";

                button.className =
                    "quiz-answer";

                button.textContent = option;

                button.addEventListener(
                    "click",
                    () => this.submitAnswer(option)
                );

                this.elements.answers.appendChild(button);

            });

        }

        this.updateProgress();

    },

    updateProgress() {

        if (this.elements.progress) {

            this.elements.progress.textContent =
                `${this.quiz.currentIndex + 1} / ${this.quiz.questions.length}`;

        }

        if (this.elements.score) {

            this.elements.score.textContent =
                this.quiz.score;

        }

    },

    startTimer() {

        clearInterval(this.quiz.timer);

        let remaining = 30;

        if (this.elements.timer) {

            this.elements.timer.textContent =
                remaining;

        }

        this.quiz.timer = setInterval(() => {

            remaining--;

            if (this.elements.timer) {

                this.elements.timer.textContent =
                    remaining;

            }

            if (remaining <= 0) {

                clearInterval(this.quiz.timer);

                this.submitAnswer(null);

            }

        }, 1000);

    },

        if (answer === question.correctAnswer) {

            this.quiz.score++;

        }

        this.nextQuestion();

    },

    finishQuiz() {

        clearInterval(this.quiz.timer);

        const result = {

            student: this.student,
            score: this.quiz.score,
            total: this.quiz.questions.length,
            answers: this.quiz.answers,
            completedAt: new Date().toISOString()

        };

        if (this.elements.score) {

            this.elements.score.textContent =
                this.quiz.score;

        }

        if (typeof window.showQuizResult === "function") {

            window.showQuizResult(result);

        } else {

            alert(
                `Quiz completed!\n\nScore: ${this.quiz.score}/${this.quiz.questions.length}`
            );

        }

    },
document.addEventListener(

    "DOMContentLoaded",

    () => QuizApp.init()

);
