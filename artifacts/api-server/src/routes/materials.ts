import { Router, type IRouter } from "express";
import OpenAI from "openai";
import pdfParse from "pdf-parse/lib/pdf-parse.js";

const router: IRouter = Router();
const MAX_INPUT_BYTES = 8 * 1024 * 1024;
const MAX_TEXT_CHARS = 120_000;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type MaterialKind = "syllabus" | "lecture";

type Analysis = {
  kind: MaterialKind;
  filename: string;
  summary: string;
  courseSuggestion?: { name: string; code: string; instructor?: string };
  topics: Array<{ title: string; description: string; confidence: number; evidence: string }>;
  deadlines: Array<{ title: string; type: string; dueDate: string; confidence: number; evidence: string }>;
  studySuggestions: Array<{ title: string; reason: string; estimatedMinutes: number }>;
  warnings: string[];
  sourceTextChars: number;
};

const asText = (value: unknown, fallback = "") =>
  typeof value === "string" ? value.trim() : fallback;

const asNumber = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

function normalizeAnalysis(raw: unknown, kind: MaterialKind, filename: string, sourceTextChars: number): Analysis {
  const object = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  const course = object.courseSuggestion && typeof object.courseSuggestion === "object"
    ? object.courseSuggestion as Record<string, unknown>
    : undefined;
  const list = (key: string) => Array.isArray(object[key]) ? object[key] : [];

  return {
    kind,
    filename,
    summary: asText(object.summary, "StudyPilot found academic information to review."),
    courseSuggestion: course && asText(course.name)
      ? { name: asText(course.name), code: asText(course.code, "UNKNOWN"), ...(asText(course.instructor) ? { instructor: asText(course.instructor) } : {}) }
      : undefined,
    topics: list("topics").map((item) => {
      const topic = item && typeof item === "object" ? item as Record<string, unknown> : {};
      return { title: asText(topic.title, "Untitled topic"), description: asText(topic.description, "Review this topic."), confidence: Math.max(0, Math.min(1, asNumber(topic.confidence, 0.5))), evidence: asText(topic.evidence, "Detected by the academic material parser.") };
    }).slice(0, 80),
    deadlines: list("deadlines").map((item) => {
      const deadline = item && typeof item === "object" ? item as Record<string, unknown> : {};
      return { title: asText(deadline.title, "Untitled deadline"), type: asText(deadline.type, "deadline"), dueDate: asText(deadline.dueDate, "Needs confirmation"), confidence: Math.max(0, Math.min(1, asNumber(deadline.confidence, 0.5))), evidence: asText(deadline.evidence, "Detected by the academic material parser.") };
    }).slice(0, 80),
    studySuggestions: list("studySuggestions").map((item) => {
      const suggestion = item && typeof item === "object" ? item as Record<string, unknown> : {};
      return { title: asText(suggestion.title, "Review this material"), reason: asText(suggestion.reason, "This material may be useful for your study plan."), estimatedMinutes: Math.max(10, Math.min(180, Math.round(asNumber(suggestion.estimatedMinutes, 45)))) };
    }).slice(0, 40),
    warnings: list("warnings").map((warning) => asText(warning)).filter(Boolean).slice(0, 30),
    sourceTextChars,
  };
}

router.post("/ai/analyze-material", async (req, res) => {
  const kind = req.body?.kind as MaterialKind;
  const filename = asText(req.body?.filename, "academic-material.pdf");
  const courseName = asText(req.body?.courseName);
  const encoded = asText(req.body?.contentBase64);
  const providedText = asText(req.body?.text);

  if (!["syllabus", "lecture"].includes(kind)) {
    res.status(400).json({ error: "kind must be syllabus or lecture" });
    return;
  }
  if (!filename.toLowerCase().endsWith(".pdf")) {
    res.status(400).json({ error: "Only PDF materials are supported." });
    return;
  }
  if (!encoded && !providedText) {
    res.status(400).json({ error: "Provide contentBase64 or text." });
    return;
  }
  if (encoded && encoded.length > MAX_INPUT_BYTES * 1.4) {
    res.status(413).json({ error: "PDF is too large. Choose a file under 8 MB." });
    return;
  }
  if (!process.env.OPENAI_API_KEY) {
    res.status(503).json({ error: "AI analysis is not configured on the server." });
    return;
  }

  try {
    let sourceText = providedText;
    if (!sourceText && encoded) {
      const buffer = Buffer.from(encoded, "base64");
      if (buffer.byteLength > MAX_INPUT_BYTES) {
        res.status(413).json({ error: "PDF is too large. Choose a file under 8 MB." });
        return;
      }
      const parsed = await pdfParse(buffer);
      sourceText = parsed.text?.trim() ?? "";
    }
    if (!sourceText) {
      res.status(422).json({ error: "StudyPilot could not find readable text in this PDF." });
      return;
    }

    const clippedText = sourceText.slice(0, MAX_TEXT_CHARS);
    const prompt = `You are StudyPilot's academic material parser. Analyze the provided ${kind} PDF text and return ONLY valid JSON matching the requested structure.

Rules:
- Extract facts, not guesses. For uncertain information, lower confidence and add a warning.
- Never say a student mastered a topic because it appears in a document.
- For dates, preserve the date exactly as written when a year is missing and use "Needs confirmation" when no reliable date is available.
- A syllabus should emphasize course details, topics, assessments, required readings, and important dates.
- A lecture should emphasize concepts, sections, relationships to course topics, and actionable study suggestions.
- Every deadline must include evidence from the source.
- Keep the output concise and reviewable by a student.

Return JSON with:
summary (string), courseSuggestion ({name, code, instructor} or null), topics (array of {title, description, confidence, evidence}), deadlines (array of {title, type, dueDate, confidence, evidence}), studySuggestions (array of {title, reason, estimatedMinutes}), warnings (array of strings).

Course context: ${courseName || "not provided"}
Filename: ${filename}

PDF TEXT:
${clippedText}`;

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      max_completion_tokens: 8192,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You return structured JSON only. You do not invent academic deadlines." },
        { role: "user", content: prompt },
      ],
    });
    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("The AI returned an empty analysis.");
    const normalized = normalizeAnalysis(JSON.parse(content), kind, filename, sourceText.length);
    res.json(normalized);
  } catch (error) {
    req.log.error({ err: error, filename, kind }, "Academic material analysis failed");
    res.status(502).json({ error: "StudyPilot could not analyze this file right now. Try again or add the information manually." });
  }
});

export default router;