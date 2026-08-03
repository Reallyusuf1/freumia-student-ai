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

    async getQuizQuestions(
    classLevel,
    subject,
    difficulty = null
) {
    let query = this.client
    .from("quiz_questions")
    .select("*")
    .eq("class_level", classLevel)
    .eq("subject", subject)
    .eq("is_active", true);

if (difficulty) {
    query = query.eq("difficulty", difficulty);
}

const { data, error } = await query.order(
    "question_code",
    { ascending: true }
);

    if (error) {
        throw error;
    }

    return data.map(question => ({
    ...question,

    options: [
        question.option_a,
        question.option_b,
        question.option_c,
        question.option_d
    ],

    answer: question.correct_answer
}));
},

    async updateLeaderboard() {
    // Leaderboard is a database VIEW generated from profiles.
    // It refreshes automatically when the profiles table is updated.
    return {
        success: true
    };
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

    // TODO:
    // Commit 4
    // Check whether the student has already completed
    // today's daily quiz.

    throw new Error("Not implemented");

},

window.OmnoraSupabase = OmnoraSupabase;
