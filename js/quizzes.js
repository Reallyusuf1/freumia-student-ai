/**
 * ============================================================
 * Omnora Student AI
 * File: js/quizzes.js
 * Commit 1
 * Purpose: Quiz Authentication & Session Guard
 * ============================================================
 */
const QUIZ_CONFIG = Object.freeze({
    TIME_LIMIT: 30,
    PASSING_SCORE: 50
});

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
    async loadQuizQuestions() {

    let questions = [];

    if (typeof window.questionBank === "undefined") {
        throw new Error("Question bank not loaded.");
    }

    const classLevel =
        this.student?.class_level ?? null;

    if (classLevel) {

        questions = window.questionBank.filter(
            question => question.level === classLevel
        );

    } else {

        questions = [...window.questionBank];

    }

    questions.sort(() => Math.random() - 0.5);

    this.quiz.questions = questions.slice(0, 20);

    if (this.quiz.questions.length === 0) {

        throw new Error(
            "No quiz questions available."
        );

    }

    }

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

    async openQuiz() {

        if (this.elements.verificationCard) {

            this.elements.verificationCard.hidden = true;

        }

        if (this.elements.quizContainer) {

            this.elements.quizContainer.hidden = false;

        }

        if (typeof this.initializeQuiz === "function") {

            await this.initializeQuiz();

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

showToast(message, type = "error") {
    console[type === "error" ? "error" : "log"](message);

    // TODO:
    // Replace with Omnora UI Toast component.
},

showError(message) {
    this.showToast(message, "error");
},

showSuccess(message) {
    this.showToast(message, "success");
},
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
},

    async initializeQuiz() {

    this.quiz.currentIndex = 0;
    this.quiz.score = 0;
    this.quiz.answers = [];
    this.quiz.started = false;

    await this.loadQuizQuestions();

    // TODO:
    // Replace window.quizQuestions with
    // OmnoraSupabase.getQuizQuestions()

    this.startQuiz();

},

    startQuiz() {

        this.quiz.started = true;

        this.renderCurrentQuestion();

        if (typeof this.startTimer === "function") {

            this.startTimer();

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

            // TODO:
// Score will be verified by Supabase RPC.
            

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

        let remaining = QUIZ_CONFIG.TIME_LIMIT;

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

    finishQuiz() {

        clearInterval(this.quiz.timer);
        this.quiz.timer = null;

        // TODO:
// Replace local result with finish_quiz() RPC response.

        // TODO:
// await OmnoraSupabase.finishQuiz(...)

        // TODO Commit 8.3:
// Replace local scoring with RPC response.

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

            this.showToast(
    `Quiz completed! Score: ${this.quiz.score}/${this.quiz.questions.length}`,
    "success"
);

        }

    },
};
document.addEventListener(

    "DOMContentLoaded",

    () => QuizApp.init()

);
