import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Initialize the Gemini client using the recommended @google/genai SDK
// and User-Agent header for AI Studio
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Defined system instruction to guide the AI formatting and structured output.
// The AI will generate a highly professional, well-structured multi-section output in Traditional Chinese
// and provide translation where requested.
const UTILS_SYSTEM_INSTRUCTION = `
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
   - 例：\`- [ ] 負責人 A 負責在週五前提交設計稿\`

5. **會議記錄翻譯區 (Meeting Minutes Translation)**
   - 請將上述所有記錄內容（包含摘要、關鍵議題、代辦事項）「完整、自然、流暢地翻譯」為使用者指定的目標語言（若未指定，則翻譯為英文）。
   - 翻譯必須保持高度專業的商務語氣，名詞翻譯需符合該語言的常用商業情境，不能使用低質量的機器硬翻。

【注意事項】：
- 請分析輸入內容的上下文，剔除無意義的閒聊、口頭禪或重複句。
- 資訊必須 100% 根據使用者輸入的「會議逐字稿」推導，千萬不可捏造無關的事件或數據。
- 請保持排版的整潔。善用 Markdown 的標題、粗體、列表等語法，使用戶能在前端清楚閱讀。
`;

// API endpoint for summarizing and translating
app.post("/api/summarize", async (req, res) => {
  try {
    const { transcript, optionLength, optionTone, targetLanguage, customFocus } = req.body;

    if (!transcript || transcript.trim() === "") {
       res.status(400).json({ error: "請提供會議逐字稿或會議筆記內容。" });
       return;
    }

    if (!process.env.GEMINI_API_KEY) {
       res.status(500).json({ error: "伺服器未設定 GEMINI_API_KEY。請在 Settings > Secrets 中設定。" });
       return;
    }

    // Dynamic prompt modifying according to optional adjustments user made on the frontend
    let userPrompt = `【會議逐字稿／重點筆記內容】：\n"""\n${transcript}\n"""\n\n`;
    userPrompt += `【客製化要求】：\n`;
    userPrompt += `- 記錄詳細程度：${optionLength || "標準"}\n`;
    userPrompt += `- 記錄語氣風格：${optionTone || "專業商務"}\n`;
    userPrompt += `- 翻譯目標語言：${targetLanguage || "英文 (English)"}\n`;
    
    if (customFocus && customFocus.trim() !== "") {
      userPrompt += `- 重點關注焦點：${customFocus}\n`;
    }

    userPrompt += `\n請現在幫我生成完整的會議記錄與對應翻譯：`;

    // Call Gemini 3.5 Flash for the summarization and translation task.
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: UTILS_SYSTEM_INSTRUCTION,
        temperature: 0.3, // Consistent and structured text outputs benefit from lower temperature
      },
    });

    res.json({ result: response.text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: error.message || "處理會議記錄時發生 AI API 錯誤。" });
  }
});

// API endpoint to return current configuration status (for diagnostics/UI warnings)
app.get("/api/config-status", (req, res) => {
  res.json({
    hasApiKey: !!process.env.GEMINI_API_KEY,
  });
});

async function startServer() {
  // Vite dev server middleware in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Running on http://localhost:${PORT} under NODE_ENV=${process.env.NODE_ENV || "development"}`);
  });
}

startServer();
