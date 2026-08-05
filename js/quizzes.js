/**
 * ============================================================
 * Omnora Student AI
 * File: quizzes.js
 * Purpose: Daily Quiz Controller
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

class QuizRepository {

    async loadQuestions(classLevel, subject) {

    const { data, error } =
        await OmnoraSupabase.client
            .from("quiz_questions")
            .select("*")
            .eq("class_level", classLevel)
            .eq("subject", subject)
            .limit(20);

    if (error) {
        throw error;
    }

    return data || [];

    }
}

/* ============================================================
 * Quiz Controller
 * ============================================================
 */

const QuizApp = {

    /* ============================================================
 * State
 * ============================================================
 */

    elements: {},

    student: null,

    engine: null,

    /* ============================================================
 * Initialization
 * ============================================================
 */

    async init() {

        this.cacheElements();
this.cacheQuizElements();
this.bindEvents();
this.engine = new QuizEngine();
this.repository = new QuizRepository();

        
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

        if (this.elements.finishButton) {

    this.elements.finishButton.addEventListener(
    "click",
    () => {

        this.elements.finishButton.disabled = true;

        window.location.href =
            "index.html";

    }
);

        }

        if (this.elements.form) {

            this.elements.form.addEventListener(
                "submit",
                this.handleVerification.bind(this)
            );

        }

    },

    /* ============================================================
 * Authentication
 * ============================================================
 */

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

            const authUser = await OmnoraAuth.getCurrentUser();
this.student = await OmnoraSupabase.getStudentProfile(authUser.id);
            await this.engine.initialize(this.student);

            this.prefillStudent();

const eligibility =
    await OmnoraSupabase.checkDailyQuizEligibility(
        this.student.id
    );

if (!eligibility) {
    this.showError("Unable to verify daily quiz.");
    return;
}

this.quizEligibility = eligibility;

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

            const authUser =
    await OmnoraAuth.getCurrentUser();

this.student =
    await OmnoraSupabase.getStudentProfile(authUser.id);
            await this.engine.initialize(this.student);

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

    /* ============================================================
 * Quiz Flow
 * ============================================================
 */
    

    async openQuiz() {

        if (this.elements.verificationCard) {

            this.elements.verificationCard.hidden = true;

        }

        if (this.elements.quizContainer) {

            this.elements.quizContainer.hidden = false;

        }

        this.quiz.classLevel = this.student.class_level;

await this.engine.startNewQuiz({
    subject: this.quiz.subject,
    difficulty: this.quiz.difficulty,
    mode: this.quiz.mode
});
        
        const questions =
    await this.repository.loadQuestions(
        this.quiz.classLevel,
        this.quiz.subject
    );

this.quiz.questions = questions;
this.engine.questions = questions;

this.quiz.attemptId = this.engine.attempt.id;

this.quiz.started = true;

this.renderCurrentQuestion();

if (typeof this.startTimer === "function") {
    this.startTimer();
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

    /* ============================================================
 * Helpers
 * ============================================================
 */
    

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

    async submitAnswer(answer) {

    const selectedAnswer =
        typeof answer === "string"
            ? answer.split(".")[0].trim()
            : null;

    try {

        const result =
            await this.engine.submitAnswer(selectedAnswer);

        this.quiz.answers = [...this.engine.answers];

        if (result.is_correct) {
            this.quiz.score++;
        }

        this.updateProgress();

        setTimeout(() => {
            this.nextQuestion();
        }, 300);

    } catch (error) {

        console.error(error);

        this.showError(
            error.message || "Unable to submit answer."
        );

    }

},

    nextQuestion() {

    const question = this.engine.nextQuestion();

    if (!question) {
        this.finishQuiz();
        return;
    }

    this.quiz.currentIndex =
        this.engine.currentQuestionIndex;

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

        this.elements.resultSection =
    document.getElementById("quizResult");

this.elements.resultScore =
    document.getElementById("resultScore");

this.elements.resultTotal =
    document.getElementById("resultTotal");

this.elements.resultPercentage =
    document.getElementById("resultPercentage");

this.elements.resultStatus =
    document.getElementById("resultStatus");

        this.elements.earnedPoints =
    document.getElementById("earnedPoints");

this.elements.finishButton =
    document.getElementById("finishQuizButton");

    },

    /* ============================================================
 * UI Rendering
 * ============================================================
 */
    

    renderCurrentQuestion() {

        const question =
    this.engine.getCurrentQuestion();

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

                button.addEventListener("click", () => {

    if (button.disabled) return;

    const buttons =
        this.elements.answers.querySelectorAll(".quiz-answer");

    buttons.forEach(btn => {
        btn.disabled = true;
        btn.classList.remove("selected");
    });

    button.classList.add("selected");

    setTimeout(() => {
        this.submitAnswer(option);
    }, 800);

});

                this.elements.answers.appendChild(button);

            });

        }

        this.updateProgress();

    },

    updateProgress() {

    const current =
        this.quiz.currentIndex + 1;

    const total =
        this.quiz.questions.length;

    if (this.elements.progress) {

        this.elements.progress.textContent =
            `Question ${current} of ${total}`;

    }

    if (this.elements.score) {

        this.elements.score.textContent =
            `Score: ${this.quiz.score}`;

    }

    const progressFill =
        document.getElementById("progressFill");

    if (progressFill) {

        progressFill.style.width =
            `${(current / total) * 100}%`;

    }

},

    formatTime(seconds) {

    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

},
    
    startTimer() {

        clearInterval(this.quiz.timer);

        let remaining = QUIZ_CONFIG.TIME_LIMIT;

        if (this.elements.timer) {

            this.elements.timer.textContent =
    this.formatTime(remaining);

        }

        this.quiz.timer = setInterval(() => {

            remaining--;

            if (this.elements.timer) {

                this.elements.timer.textContent =
    this.formatTime(remaining);

            }

            if (remaining <= 0) {

                clearInterval(this.quiz.timer);

                this.submitAnswer(null);

            }

        }, 1000);

    },

    // TODO:
    // Commit 8B
    // return await OmnoraSupabase.finishQuiz(result);

        // TODO Commit 8B:
// OmnoraSupabase.finishQuiz()

// TODO Commit 8C:
// Leaderboard update

// TODO Commit 8D:
// Student XP update

    async saveQuizAttempt() {

    if (!this.quiz.attemptId) {
        throw new Error("Quiz attempt not found.");
    }

    const response =
        await OmnoraSupabase.finishQuiz(
            this.quiz.attemptId
        );

    return {
        success: true,
        data: response
    };

},

    async updateLeaderboard(result) {

    // TODO:
    // Commit 8C
    // Replace with:
    // await OmnoraSupabase.updateLeaderboard(result);

    return {
        success: true
    };

},

    async updateStudentProfile(result) {

    // TODO:
    // Commit 8D
    // Replace with:
    // await OmnoraSupabase.updateStudentProfile(result);

    return {
        success: true
    };

},

    async finishQuiz() {

        clearInterval(this.quiz.timer);
if (this.elements.timer) {

    this.elements.timer.textContent =
        "Completed";

}
        
        this.quiz.timer = null;

        const result = await this.engine.finishQuiz();

        if (this.elements.score) {

            this.elements.score.textContent =
    result.score;
            
        }
        
        await OmnoraSupabase.updateStudentProfile({
    profileId: this.student.id,
    totalQuizzes: result.total_quizzes,
    totalPoints: result.total_points,
    averageScore: result.average_score,
    bestScore: result.best_score
});

        await OmnoraSupabase.updateLeaderboard();

this.showQuizResult(result);

},

    showQuizResult(result) {

        if (
    !this.elements.resultSection ||
    !this.elements.resultScore ||
    !this.elements.resultTotal
) {
    return;
        }

    if (this.elements.quizContainer) {
        this.elements.quizContainer.hidden = true;
    }

    if (this.elements.resultSection) {
    this.elements.resultSection.hidden = false;
    }
        this.elements.resultSection.setAttribute(
    "tabindex",
    "-1"
);

this.elements.resultSection.focus();

    const percentage =
        Math.round(
            (result.score / result.total) * 100
        );

    this.elements.resultScore.textContent =
        result.score;

    this.elements.resultTotal.textContent =
        result.total;

    this.elements.resultPercentage.textContent =
        `${percentage}%`;

    const passed =
        percentage >= QUIZ_CONFIG.PASSING_SCORE;

    this.elements.resultStatus.textContent =
        passed ? "PASSED" : "FAILED";

    this.elements.resultStatus.className =
        passed
            ? "result-status passed"
            : "result-status failed";

        this.elements.resultStatus.setAttribute(
    "aria-live",
    "polite"
);
        
        if (this.elements.earnedPoints) {

    this.elements.earnedPoints.textContent =
    `${result.xp} XP`;

    }
        
    }
};

document.addEventListener(

    "DOMContentLoaded",

    () => QuizApp.init()

);
