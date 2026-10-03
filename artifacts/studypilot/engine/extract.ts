import type { AnalyzeMaterialOutput } from '@workspace/api-client-react';

const DATE = /\b(\d{4}-\d{2}-\d{2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2}(?:, \d{4})?)\b/gi;
const HEADING = /^(?:week\s*\d+|chapter\s*\d+|topic\s*\d+|assignment|exam|quiz|project|midterm|final)[:\s].+$/gim;

export function heuristicMaterialAnalysis(kind: 'syllabus' | 'lecture', filename: string, text: string, courseName?: string): AnalyzeMaterialOutput {
  const lines = text.split(/\n+/).map((line) => line.trim()).filter((line) => line.length > 3);
  const headingLines = lines.filter((line) => HEADING.test(line) || (line.length < 80 && /^[A-Z][A-Za-z0-9 ,:/()-]{8,}$/.test(line))).slice(0, 12);
  const topics = headingLines.slice(0, 8).map((title) => ({
    title: title.replace(/^[:\-\s]+/, '').slice(0, 80),
    description: kind === 'lecture' ? 'Potential study topic detected from headings. Uploading does not mean this is mastered.' : 'Possible syllabus topic. Confirm before tracking it.',
    confidence: 0.45,
    evidence: title.slice(0, 140),
  }));
  const deadlineMatches = [...text.matchAll(DATE)].slice(0, 8).map((match, index) => ({
    title: `Possible date ${index + 1}`,
    type: /exam|midterm|final/i.test(text.slice(Math.max(0, (match.index ?? 0) - 40), (match.index ?? 0) + 40)) ? 'exam' : 'deadline',
    dueDate: 'Needs confirmation',
    confidence: 0.3,
    evidence: match[0],
  }));
  return {
    kind,
    filename,
    summary: topics.length
      ? `Heuristic parser found ${topics.length} possible topics in ${courseName || filename}. Confirm every item.`
      : 'No confident structure was found. Add topics and dates manually.',
    topics,
    deadlines: deadlineMatches,
    studySuggestions: topics.slice(0, 3).map((topic) => ({ title: `Review ${topic.title}`, reason: 'Detected in the uploaded material.', estimatedMinutes: 35 })),
    warnings: ['This pass used a conservative parser. Uncertain dates were not converted into calendar days.', 'StudyPilot never marks a topic as mastered because it appeared in a PDF.'],
    sourceTextChars: text.length,
  };
}
