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

    async updateLeaderboard(result) {

        // Commit 9B
        return {
            success: true,
            data: result
        };

    },

    async updateStudentProfile(result) {

        // Commit 9C
        return {
            success: true,
            data: result
        };

    }

};

window.OmnoraSupabase = OmnoraSupabase;
