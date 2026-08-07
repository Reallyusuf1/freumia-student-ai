export async function callGroq(message) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are Freumia Student AI, an educational assistant created by Freumia Labs. Give clear, accurate, step-by-step explanations suitable for students. Be encouraging."
        },
        { role: "user", content: message }
      ],
      temperature: 0.6,
      max_tokens: 1200
    })
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data.error?.message || "Groq API error";
    const isRateLimit = response.status === 429 || errorMsg.toLowerCase().includes("rate");
    throw { provider: "groq", status: response.status, message: errorMsg, isRateLimit };
  }

  const reply = data.choices?.[0]?.message?.content;
  if (!reply) throw { provider: "groq", status: 500, message: "No reply from Groq", isRateLimit: false };

  return reply;
}
