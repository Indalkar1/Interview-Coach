import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from .env
const MODEL = "claude-sonnet-5-5";

export async function askJSON(system, user, schema) {
  let lastError;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await client.messages.create({
        model: MODEL,
        max_tokens: 1500,
        system: system + "\nRespond with ONLY valid JSON, no markdown, no commentary.",
        messages: [{ role: "user", content: user }],
      });
      const text = res.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("");
      const json = JSON.parse(text.replace(/```json|```/g, "").trim());
      return schema.parse(json);
    } catch (err) {
      lastError = err;
      console.error(`LLM attempt ${attempt + 1} failed:`, err.message);
    }
  }
  throw lastError;
}