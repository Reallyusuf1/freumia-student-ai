/**
 * =====================================================
 * OMNORA STUDENT AI V2
 * Omnora Supabase Service Layer
 * Commit 9A
 * =====================================================
 */

const OmnoraSupabase = {

    get client() {

        if (!window.supabaseClient) {
            throw new Error("Supabase client is not initialized.");
        }

        return window.supabaseClient;

    },

    transformQuestion(question) {

        if (!question || typeof question !== "object") {
            throw new Error("Invalid quiz question.");
        }

        if (!Array.isArray(question.options) || question.options.length < 4) {
            throw new Error("Quiz question must contain four options.");
        }

        return {
            class_level: question.level,
            subject: question.subject,
            difficulty: question.difficulty,
            question: question.question,
            option_a: question.options[0],
            option_b: question.options[1],
            option_c: question.options[2],
            option_d: question.options[3],
            correct_answer: question.answer
        };

    },

        async insertQuizQuestions(batch) {

        if (!Array.isArray(batch) || batch.length === 0) {
            throw new Error("Question batch must be a non-empty array.");
        }

        const transformed = batch.map((question) =>
            this.transformQuestion(question)
        );

        const { error } = await this.client
            .from("quiz_questions")
            .insert(transformed);

        if (error) {
            throw error;
        }

        return {
            success: true,
            inserted: transformed.length
        };
    },

    async getQuizQuestions({ classLevel, subject, limit = 20 } = {}) {
    if (!classLevel || typeof classLevel !== "string") {
        throw new Error("Quiz class level is required.");
    }

    if (!subject || typeof subject !== "string") {
        throw new Error("Quiz subject is required.");
    }

    const safeLimit = Math.min(
        Math.max(Number(limit) || 20, 1),
        20
    );

    const { data, error } = await this.client
        .from("quiz_questions")
        .select(`
            id,
            class_level,
            subject,
            difficulty,
            question,
            option_a,
            option_b,
            option_c,
            option_d,
            correct_answer
        `)
        .eq("class_level", classLevel)
        .eq("subject", subject)
        .limit(safeLimit);

    if (error) {
        throw error;
    }

    return Array.isArray(data) ? data : [];
},

    async loadQuizQuestions({ classLevel, subject, limit = 20 } = {}) {
    const questions = await this.getQuizQuestions({
        classLevel,
        subject,
        limit
    });

    return {
        success: true,
        classLevel,
        subject,
        questions,
        count: questions.length
    };
},

    async getStudentProfile(userId) {

    const { data, error } = await this.client
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

    if (error) {
        throw error;
    }

    return data;

},

    async finishQuiz(payload) {

    const { data, error } =
        await this.client.rpc(
            "finish_quiz",
            {
                p_attempt_id: payload.attemptId
            }
        );

    if (error) {
        throw error;
    }

    return data;

},

    async startQuiz(payload) {
    const { data, error } = await this.client.rpc(
        "start_quiz",
        {
            p_profile_id: payload.profile_id,
            p_class_level: payload.class_level,
            p_subject: payload.subject,
            p_mode: payload.mode
        }
    );

    if (error) {
        throw error;
    }

    return data;
},

    async getQuizQuestions({
    profileId,
    classLevel,
    subject,
    difficulty = null,
    limit = 20
}) {

    const { data, error } =
        await this.client.rpc(
            "get_quiz_questions",
            {
                p_profile_id: profileId,
                p_class_level: classLevel,
                p_subject: subject,
                p_difficulty: difficulty,
                p_limit: limit
            }
        );

    if (error) {
        throw error;
    }

    return data || [];
},

    async updateStudentProfile(payload) {
    const { data, error } = await this.client
        .from("profiles")
        .update({
            total_quizzes: payload.totalQuizzes,
            total_points: payload.totalPoints,
            average_score: payload.averageScore,
            best_score: payload.bestScore,
            last_quiz_date: new Date().toISOString()
        })
        .eq("id", payload.profileId)
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;

},

async checkDailyQuizEligibility(profileId) {

    const { data, error } = await this.client.rpc(
        "can_start_daily_quiz",
        {
            p_profile_id: profileId
        }
    );

    if (error) {
        throw error;
    }

    return data;
},

async submitQuizAnswer(payload) {

    const { data, error } =
        await this.client.rpc(
            "submit_quiz_answer",
            {
                p_attempt_id: payload.attemptId,
                p_profile_id: payload.profileId,
                p_question_id: payload.questionId,
                p_selected_answer: payload.selectedAnswer
            }
        );

    if (error) {
        throw error;
    }

    return data;

},

async updateLeaderboard() {

    // Leaderboard is a database VIEW generated from profiles.
    // It refreshes automatically when the profiles table is updated.

    return {
        success: true
    };

}

};

window.OmnoraSupabase = OmnoraSupabase;

