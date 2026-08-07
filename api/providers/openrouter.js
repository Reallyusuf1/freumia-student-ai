export async function callOpenRouter(message) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "deepseek/deepseek-chat-v3-0324:free",
      messages: [
        {
          role: "system",
          content: "You are Freumia Student AI, an educational assistant created by Freumia Labs. Give clear, accurate, step-by-step explanations suitable for students. Be encouraging and helpful."
        },
        {
          role: "user",
          content: message
        }
      ],
      temperature: 0.6,
      max_tokens: 1200
    })
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data.error?.message || "OpenRouter API error";
    const isRateLimit =
      response.status === 429 ||
      errorMsg.toLowerCase().includes("quota") ||
      errorMsg.toLowerCase().includes("rate limit");

    throw {
      provider: "openrouter",
      status: response.status,
      message: errorMsg,
      isRateLimit
    };
  }

  const reply = data.choices?.[0]?.message?.content;

  if (!reply) {
    throw {
      provider: "openrouter",
      status: 500,
      message: "No reply from OpenRouter",
      isRateLimit: false
    };
  }

  return reply;
}
