/**
 * =====================================================
 * OMNORA STUDENT AI V2
 * Supabase Service Layer
 * B-002.1 — Production Service Contract
 * =====================================================
 */

const OmnoraSupabase = {

    /**
     * -------------------------------------------------
     * Supabase Client
     * -------------------------------------------------
     */
    get client() {

        if (!window.supabaseClient) {
            throw new Error(
                "Supabase client is not initialized."
            );
        }

        return window.supabaseClient;
    },


    /**
     * -------------------------------------------------
     * Student Profile
     * -------------------------------------------------
     */
    async getStudentProfile(userId) {

        if (!userId) {
            throw new Error(
                "User ID is required."
            );
        }

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


    /**
     * -------------------------------------------------
     * Daily Quiz Eligibility
     * -------------------------------------------------
     */
    async checkDailyQuizEligibility(profileId) {

        if (!profileId) {
            throw new Error(
                "Profile ID is required."
            );
        }

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


    /**
     * -------------------------------------------------
     * Start Quiz
     * -------------------------------------------------
     */
    async startQuiz(payload) {

        if (!payload?.profile_id) {
            throw new Error(
                "Profile ID is required."
            );
        }

        if (!payload?.class_level) {
            throw new Error(
                "Class level is required."
            );
        }

        if (!payload?.subject) {
            throw new Error(
                "Quiz subject is required."
            );
        }

        const { data, error } =
            await this.client.rpc(
                "start_quiz",
                {
                    p_profile_id: payload.profile_id,
                    p_class_level: payload.class_level,
                    p_subject: payload.subject,
                    p_mode: payload.mode || "student"
                }
            );

        if (error) {
            throw error;
        }

        return data;
    },


    /**
     * -------------------------------------------------
     * Get Quiz Questions
     * -------------------------------------------------
     */
    async getQuizQuestions({
        profileId,
        classLevel,
        subject,
        difficulty = null,
        limit = 20
    }) {

        if (!profileId) {
            throw new Error(
                "Profile ID is required."
            );
        }

        if (!classLevel) {
            throw new Error(
                "Class level is required."
            );
        }

        if (!subject) {
            throw new Error(
                "Quiz subject is required."
            );
        }

        const safeLimit =
            Number.isInteger(limit) && limit > 0
                ? Math.min(limit, 50)
                : 20;

        const { data, error } =
            await this.client.rpc(
                "get_quiz_questions",
                {
                    p_profile_id: profileId,
                    p_class_level: classLevel,
                    p_subject: subject,
                    p_difficulty: difficulty,
                    p_limit: safeLimit
                }
            );

        if (error) {
            throw error;
        }

        return Array.isArray(data)
            ? data
            : [];
    },


    /**
     * -------------------------------------------------
     * Submit Quiz Answer
     * -------------------------------------------------
     */
    async submitQuizAnswer(payload) {

        if (!payload?.attemptId) {
            throw new Error(
                "Attempt ID is required."
            );
        }

        if (!payload?.profileId) {
            throw new Error(
                "Profile ID is required."
            );
        }

        if (!payload?.questionId) {
            throw new Error(
                "Question ID is required."
            );
        }

        if (
            payload.selectedAnswer === undefined ||
            payload.selectedAnswer === null
        ) {
            throw new Error(
                "Selected answer is required."
            );
        }

        const { data, error } =
            await this.client.rpc(
                "submit_quiz_answer",
                {
                    p_attempt_id: payload.attemptId,
                    p_profile_id: payload.profileId,
                    p_question_id: payload.questionId,
                    p_selected_answer:
                        payload.selectedAnswer
                }
            );

        if (error) {
            throw error;
        }

        return data;
    },


    /**
     * -------------------------------------------------
     * Finish Quiz
     * -------------------------------------------------
     */
    async finishQuiz(payload) {

        if (!payload?.attemptId) {
            throw new Error(
                "Attempt ID is required."
            );
        }

        const { data, error } =
            await this.client.rpc(
                "finish_quiz",
                {
                    p_attempt_id:
                        payload.attemptId
                }
            );

        if (error) {
            throw error;
        }

        return data;
    }

};


/**
 * -----------------------------------------------------
 * Public API
 * -----------------------------------------------------
 */
window.OmnoraSupabase = OmnoraSupabase;
