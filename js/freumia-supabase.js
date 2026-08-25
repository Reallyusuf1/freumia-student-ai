/**
 * ============================================================
 * FREUMIA / OMNORA STUDENT AI
 * File: omnora-supabase.js
 * Purpose: Supabase Service Layer
 *
 * Responsibility:
 * - Supabase communication
 * - RPC calls
 * - Database reads/writes
 * - Quiz data transport
 *
 * Must NOT:
 * - Render UI
 * - Control quiz navigation
 * - Manage timers
 * - Calculate quiz UI state
 * - Manipulate DOM
 * ============================================================
 */

const OmnoraSupabase = {

    /* ========================================================
     * Supabase Client
     * ========================================================
     */

    get client() {

        if (!window.supabaseClient) {

            throw new Error(
                "Supabase client is not initialized."
            );

        }

        return window.supabaseClient;

    },


    /* ========================================================
     * Student
     * ========================================================
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


    /* ========================================================
     * Quiz Eligibility
     * ========================================================
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


    /* ========================================================
     * Start Quiz Session
     *
     * Subject is intentionally session-level only.
     *
     * Actual questions are selected independently
     * according to the student's class.
     * ========================================================
     */

    async startQuiz(payload = {}) {

        const profileId =
            payload.profileId ??
            payload.profile_id;

        const classLevel =
            payload.classLevel ??
            payload.class_level;

        const mode =
            payload.mode ??
            "student";

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


        /*
         * Mixed means the attempt can contain
         * questions from multiple subjects.
         *
         * We do NOT use "general".
         */

        const sessionSubject =
            payload.subject ||
            "Mixed";


        const { data, error } =
            await this.client.rpc(
                "start_quiz",
                {
                    p_profile_id: profileId,
                    p_class_level: classLevel,
                    p_subject: sessionSubject,
                    p_mode: mode
                }
            );

        if (error) {

            throw error;

        }


        return {

            id: data,

            attemptId: data,

            profileId,

            classLevel,

            subject: sessionSubject,

            mode

        };

    },


    /* ========================================================
     * Get Quiz Questions
     *
     * IMPORTANT:
     * Subject is NOT required here.
     *
     * Database selects active/unanswered questions
     * belonging to the student's class.
     * ========================================================
     */

    async getQuizQuestions({

        profileId,

        classLevel,

        limit = 20

    } = {}) {

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


        const safeLimit =
            Math.min(
                Math.max(
                    Number(limit) || 20,
                    1
                ),
                20
            );


        const { data, error } =
            await this.client.rpc(
                "get_quiz_questions",
                {
                    p_profile_id:
                        profileId,

                    p_class_level:
                        classLevel,

                    /*
                     * Current production RPC accepts
                     * these parameters, but its body does
                     * not use them for filtering.
                     */
                    p_subject:
                        null,

                    p_difficulty:
                        null,

                    p_limit:
                        safeLimit
                }
            );

        if (error) {

            throw error;

        }


        return Array.isArray(data)
            ? data
            : [];

    },


    /* ========================================================
     * Submit Answer
     * ========================================================
     */

    async submitQuizAnswer(payload = {}) {

        const attemptId =
            payload.attemptId ??
            payload.attempt_id;

        const profileId =
            payload.profileId ??
            payload.profile_id;

        const questionId =
            payload.questionId ??
            payload.question_id;

        const selectedAnswer =
            payload.selectedAnswer ??
            payload.selected_answer;


        if (!attemptId) {

            throw new Error(
                "Attempt ID is required."
            );

        }

        if (!profileId) {

            throw new Error(
                "Profile ID is required."
            );

        }

        if (!questionId) {

            throw new Error(
                "Question ID is required."
            );

        }

        if (!selectedAnswer) {

            throw new Error(
                "Selected answer is required."
            );

        }


        const { data, error } =
            await this.client.rpc(
                "submit_quiz_answer",
                {
                    p_attempt_id:
                        attemptId,

                    p_profile_id:
                        profileId,

                    p_question_id:
                        questionId,

                    p_selected_answer:
                        selectedAnswer
                }
            );

        if (error) {

            throw error;

        }


        return data;

    },


    /* ========================================================
     * Finish Quiz
     * ========================================================
     */

    async finishQuiz(payload = {}) {

        const attemptId =
            payload.attemptId ??
            payload.attempt_id;

        if (!attemptId) {

            throw new Error(
                "Attempt ID is required."
            );

        }


        const { data, error } =
            await this.client.rpc(
                "finish_quiz",
                {
                    p_attempt_id:
                        attemptId
                }
            );

        if (error) {

            throw error;

        }


        return data;

    },


    /* ========================================================
     * Student Profile Update
     *
     * NOTE:
     * Quiz completion statistics should remain
     * database-owned where triggers/RPCs already
     * handle them.
     * ========================================================
     */

    async updateStudentProfile(payload = {}) {

        if (!payload.profileId) {

            throw new Error(
                "Profile ID is required."
            );

        }

        const { data, error } =
            await this.client
                .from("profiles")
                .update({
                    total_quizzes:
                        payload.totalQuizzes,

                    total_points:
                        payload.totalPoints,

                    average_score:
                        payload.averageScore,

                    best_score:
                        payload.bestScore,

                    last_quiz_date:
                        new Date().toISOString()
                })
                .eq(
                    "id",
                    payload.profileId
                )
                .select()
                .single();

        if (error) {

            throw error;

        }


        return data;

    },


    /* ========================================================
     * Leaderboard
     *
     * Database owns leaderboard calculations.
     * ========================================================
     */

    async updateLeaderboard() {

        return {

            success: true

        };

    }

};


/* ============================================================
 * Global Export
 * ============================================================
 */

window.OmnoraSupabase =
    OmnoraSupabase;
