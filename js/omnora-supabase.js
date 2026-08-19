/**
 * =====================================================
 * OMNORA STUDENT AI V2
 * Omnora Supabase Service Layer
 * =====================================================
 *
 * Responsibility:
 * - Supabase database access
 * - Quiz RPC communication
 * - Student profile access
 *
 * This file does NOT contain quiz UI/business logic.
 * =====================================================
 */

const OmnoraSupabase = {

    // =====================================================
    // Supabase Client
    // =====================================================

    get client() {

        if (!window.supabaseClient) {
            throw new Error(
                "Supabase client is not initialized."
            );
        }

        return window.supabaseClient;
    },


    // =====================================================
    // Student Profile
    // =====================================================

    async getStudentProfile(userId) {

        const { data, error } =
            await this.client
                .from("profiles")
                .select("*")
                .eq("id", userId)
                .single();

        if (error) {
            throw error;
        }

        return data;
    },


    // =====================================================
    // Daily Quiz Eligibility
    // =====================================================

    async checkDailyQuizEligibility(profileId) {

        const { data, error } =
            await this.client.rpc(
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


    // =====================================================
    // Start Quiz
    // =====================================================

    async startQuiz(payload) {

        const { data, error } =
            await this.client.rpc(
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


    // =====================================================
    // Get Quiz Questions
    // =====================================================

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


    // =====================================================
    // Submit Quiz Answer
    // =====================================================

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


    // =====================================================
    // Finish Quiz
    // =====================================================

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


    // =====================================================
    // Update Student Profile
    // =====================================================

    async updateStudentProfile(payload) {

        const { data, error } =
            await this.client
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


    // =====================================================
    // Leaderboard
    // =====================================================

    async updateLeaderboard() {

        // Leaderboard is database-driven.
        // No manual refresh is required here.

        return {
            success: true
        };
    }

};


// =====================================================
// Global Export
// =====================================================

window.OmnoraSupabase = OmnoraSupabase;
