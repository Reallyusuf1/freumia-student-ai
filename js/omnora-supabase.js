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
                payload
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
    }

};

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
},

window.OmnoraSupabase = OmnoraSupabase;
