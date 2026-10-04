import portfolioJson from "@/data/portfolio.json";
import { normalizePortfolio } from "@/lib/portfolio";
import { getAssistantActions } from "@/lib/ai/tools";
import { LocalPortfolioProvider, OpenAIProvider } from "@/lib/ai/providers";
import type { ChatMessage } from "@/types/portfolio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const portfolio = normalizePortfolio(portfolioJson);

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { question?: unknown; history?: unknown };
    if (typeof body.question !== "string" || !body.question.trim()) {
      return Response.json({ error: "A question is required." }, { status: 400 });
    }

    const question = body.question.trim().slice(0, 1400);
    const history: ChatMessage[] = Array.isArray(body.history)
      ? body.history.flatMap((value) => {
          if (!value || typeof value !== "object") return [];
          const item = value as Record<string, unknown>;
          if ((item.role !== "user" && item.role !== "assistant") || typeof item.content !== "string") return [];
          return [{ role: item.role, content: item.content.slice(0, 1400) } as ChatMessage];
        }).slice(-10)
      : [];

    let answer: string;
    let providerName = "local";
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      try {
        const provider = new OpenAIProvider(apiKey, process.env.OPENAI_MODEL || "gpt-4o-mini");
        answer = await provider.generate({ question, history, portfolio });
        providerName = "openai";
      } catch (error) {
        console.error("OpenAI provider failed; using local portfolio mode.", error);
        const provider = new LocalPortfolioProvider();
        answer = await provider.generate({ question, history, portfolio });
      }
    } else {
      const provider = new LocalPortfolioProvider();
      answer = await provider.generate({ question, history, portfolio });
    }

    const actions = getAssistantActions(question, history, portfolio);
    return Response.json({ answer, provider: providerName, actions }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "The assistant could not process that request." }, { status: 500 });
  }
}
