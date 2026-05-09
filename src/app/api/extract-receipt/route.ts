import Anthropic from "@anthropic-ai/sdk";
import { currentUser } from "@clerk/nextjs/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { imageUrl } = await req.json();
  if (!imageUrl) return Response.json({ error: "No image URL" }, { status: 400 });

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "url", url: imageUrl },
          },
          {
            type: "text",
            text: `Extract data from this receipt or invoice. Return JSON only, no explanation:
{
  "vendor": "vendor name or null",
  "total": "total amount as number string or null",
  "lineItems": [
    { "name": "item name", "quantity": "number or null", "unitPrice": "number or null" }
  ]
}`,
          },
        ],
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const json = text.replace(/```json|```/g, "").trim();

  try {
    const data = JSON.parse(json);
    return Response.json(data);
  } catch {
    return Response.json({ error: "Failed to parse receipt", raw: text }, { status: 422 });
  }
}
