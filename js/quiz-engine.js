/**
 * ==========================================
 * OMNORA STUDENT AI V2
 * Quiz Engine
 * ==========================================
 */

class QuizEngine {
    constructor() {
        this.attempt = null;
        this.questions = [];
        this.currentIndex = 0;
        this.answers = [];
        this.profile = null;
    }

    async initialize() {}

    async checkEligibility() {}

    async resumeQuiz() {}

    async startNewQuiz() {}

    async loadQuestions() {}

    async submitAnswer() {}

    async nextQuestion() {}

    async finishQuiz() {}

    async saveProgress() {}

    async restoreProgress() {}

    reset() {}
}

window.QuizEngine = QuizEngine;
