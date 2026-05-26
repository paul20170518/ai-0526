import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI } from "@google/genai";

// ── System prompt (shared for both providers) ──────────────────────────────
const SYSTEM_INSTRUCTION = `
你是一位極為專業、精準的會議記錄秘書與高級翻譯官。
你的任務是根據使用者提供的會議逐字稿（或重點筆記），生成一份結構清晰、重點突出且專業的會議記錄（Meeting Minutes），並根據設定同時提供指定語言的完整翻譯。

請遵循以下【輸出規範與格式結構】，必須使用 **繁體中文 (台灣，zh-TW)** 作為主要撰寫語言（除了翻譯段落）：

1. **會議基本資訊 (Meeting Info)**
   - 主題：(若逐字稿中有提及，請自動擷取；若無，請根據內容推導出一個合適的主題)
   - 估計時間或日期：(若逐字稿中有提及則標記，無則寫依內容判斷)
   - 關鍵發言人：(列出會議中主要發言的人士)

2. **會議主題與摘要 (Executive Summary)**
   - 請以 3-5 句精簡、流暢的繁體中文，概括本次會議的核心目的與最終共識。

3. **關鍵議題與詳細討論內容 (Key Discussion Points & Decisions)**
   - 請分點說明會議中討論到的 2 至 5 個主要议题或維度。
   - 每個分點須包含：
     - **[議題名稱]**
     - 討論要點：精準呈現各方觀點。
     - 決議事項：標註最終決定的結果。

4. **行動清單與待辦事項 (Action Items & Assignees)**
   - 格式必須使用 Markdown 的代辦清單格式（例如 \`- [ ] 項目內容\`）。
   - 請清楚列出待辦任務、負責人（指派對象）及對應時限（若內容有提到）。

5. **會議記錄翻譯區 (Meeting Minutes Translation)**
   - 請將上述所有記錄內容「完整、自然、流暢地翻譯」為使用者指定的目標語言（若未指定，則翻譯為英文）。
   - 翻譯必須保持高度專業的商務語氣，不能使用低質量的機器硬翻。

【注意事項】：
- 請分析輸入內容的上下文，剔除無意義的閒聊、口頭禪或重複句。
- 資訊必須 100% 根據使用者輸入的「會議逐字稿」推導，千萬不可捏造無關的事件或數據。
- 請保持排版的整潔。善用 Markdown 的標題、粗體、列表等語法，使用戶能在前端清楚閱讀。
`;

// ── Build the user prompt ───────────────────────────────────────────────────
function buildUserPrompt(body: {
  transcript: string;
  optionLength?: string;
  optionTone?: string;
  targetLanguage?: string;
  customFocus?: string;
}): string {
  let prompt = `【會議逐字稿／重點筆記內容】：\n"""\n${body.transcript}\n"""\n\n`;
  prompt += `【客製化要求】：\n`;
  prompt += `- 記錄詳細程度：${body.optionLength || "標準"}\n`;
  prompt += `- 記錄語氣風格：${body.optionTone || "專業商務"}\n`;
  prompt += `- 翻譯目標語言：${body.targetLanguage || "英文 (English)"}\n`;
  if (body.customFocus && body.customFocus.trim() !== "") {
    prompt += `- 重點關注焦點：${body.customFocus}\n`;
  }
  prompt += `\n請現在幫我生成完整的會議記錄與對應翻譯：`;
  return prompt;
}

// ── Gemini handler ──────────────────────────────────────────────────────────
async function callGemini(userPrompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("伺服器未設定 GEMINI_API_KEY。");

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite-preview-06-17",
    contents: userPrompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.3,
    },
  });
  return response.text ?? "";
}

// ── NVIDIA handler ──────────────────────────────────────────────────────────
async function callNvidia(userPrompt: string): Promise<string> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) throw new Error("伺服器未設定 NVIDIA_API_KEY。");

  const response = await fetch(
    "https://integrate.api.nvidia.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "nvidia/nemotron-mini-4b-instruct",
        messages: [
          { role: "system", content: SYSTEM_INSTRUCTION },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 4096,
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`NVIDIA API 錯誤 (${response.status}): ${errText}`);
  }

  const data = (await response.json()) as {
    choices: { message: { content: string } }[];
  };
  return data.choices?.[0]?.message?.content ?? "";
}

// ── Main handler ────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { provider, transcript, optionLength, optionTone, targetLanguage, customFocus } =
    req.body ?? {};

  // Validate transcript
  if (!transcript || String(transcript).trim() === "") {
    return res.status(400).json({ error: "請提供會議逐字稿或會議筆記內容。" });
  }

  const userPrompt = buildUserPrompt({
    transcript,
    optionLength,
    optionTone,
    targetLanguage,
    customFocus,
  });

  try {
    let result: string;

    if (provider === "nvidia") {
      result = await callNvidia(userPrompt);
    } else {
      // Default → Gemini
      result = await callGemini(userPrompt);
    }

    return res.status(200).json({ result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "未知錯誤";
    console.error("[/api/generate] Error:", message);
    return res.status(500).json({ error: message });
  }
}
