import { callGemini } from "./providers/gemini.js";
import { callGroq } from "./providers/groq.js";
import { callOpenRouter } from "./providers/openrouter.js";

const PROVIDERS = [
  { name: "gemini", fn: callGemini },
  { name: "groq", fn: callGroq },
  { name: "openrouter", fn: callOpenRouter }
];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body;
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return res.status(400).json({ error: "Valid message is required." });
    }

    // Limit message length for safety
    if (message.length > 3000) {
      return res.status(400).json({ error: "Message too long." });
    }

    let lastError = null;

    for (const provider of PROVIDERS) {
      try {
        console.log(`[Freumia AI] Trying provider: ${provider.name}`);
        const reply = await provider.fn(message.trim());
        
        console.log(`[Freumia AI] Success with: ${provider.name}`);
        return res.status(200).json({ 
          reply, 
          provider: provider.name 
        });
      } catch (err) {
        lastError = err;
        console.warn(`[Freumia AI] ${provider.name} failed:`, err.message);
        
        if (!err.isRateLimit) {
          // Non-rate-limit error → stop and return error
          break;
        }
        // Rate limit → try next provider
      }
    }

    // All providers failed
    return res.status(503).json({
      error: "All AI providers are temporarily busy. Please try again in a moment.",
      details: lastError?.message || "Service unavailable"
    });

  } catch (error) {
    console.error("[Freumia AI] Unexpected error:", error);
    return res.status(500).json({ error: "Internal server error. Please try again." });
  }
}
