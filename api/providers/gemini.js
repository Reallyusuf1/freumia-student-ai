export async function callGemini(message) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are Freumia Student AI, an educational assistant created by Freumia Labs. 
Give clear, accurate, step-by-step explanations suitable for students.
Be encouraging and helpful.

Student: ${message}`
          }]
        }]
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data.error?.message || "Gemini API error";
    const isRateLimit = response.status === 429 || 
                       errorMsg.toLowerCase().includes("quota") || 
                       errorMsg.toLowerCase().includes("rate limit");
    throw { provider: "gemini", status: response.status, message: errorMsg, isRateLimit };
  }

  const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!reply) throw { provider: "gemini", status: 500, message: "No reply from Gemini", isRateLimit: false };

  return reply;
}
