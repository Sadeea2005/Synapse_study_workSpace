import { z } from 'zod';

export const FlashcardSchema = z.object({
  id: z.string().min(1, 'Flashcard ID is required'),
  front: z.string().min(3, 'Flashcard front prompt must be at least 3 characters'),
  back: z.string().min(3, 'Flashcard back explanation must be at least 3 characters'),
  category: z.string().default('General'),
  difficulty: z.enum(['easy', 'medium', 'hard']).catch('medium'),
  hint: z.string().optional(),
});

export const QuizQuestionSchema = z.object({
  id: z.string().min(1, 'Quiz ID is required'),
  question: z.string().min(5, 'Question text is too short'),
  options: z
    .array(z.string().min(1, 'Option cannot be empty'))
    .min(2, 'At least 2 options are required')
    .max(6, 'At most 6 options are allowed'),
  correctIndex: z.number().int().min(0, 'correctIndex must be non-negative'),
  explanation: z.string().min(3, 'Explanation is required'),
  topic: z.string().default('Core Concept'),
}).refine((q) => q.correctIndex < q.options.length, {
  message: 'correctIndex is out of bounds for the provided options array',
  path: ['correctIndex'],
});

export const StudySetSchema = z.object({
  title: z.string().min(2, 'Study set title is required'),
  summary: z.string().min(10, 'Summary must be at least 10 characters'),
  keyConcepts: z.array(z.string()).default([]),
  flashcards: z.array(FlashcardSchema).min(1, 'At least 1 valid flashcard is required'),
  quiz: z.array(QuizQuestionSchema).min(1, 'At least 1 valid quiz question is required'),
});

export type Flashcard = z.infer<typeof FlashcardSchema>;
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;
export type StudySet = z.infer<typeof StudySetSchema>;

export type SimulateFaultMode =
  | 'normal'
  | 'malformed_json'
  | 'wrong_shape'
  | 'empty_output'
  | 'slow_response'
  | 'server_error';

export interface ValidationFailureDetails {
  kind: 'empty_output' | 'malformed_json' | 'schema_validation' | 'network_error';
  title: string;
  message: string;
  issues?: string[];
  rawSnippet?: string;
}

/**
 * Strips accidental markdown code blocks (e.g., ```json ... ```) if an LLM wraps its JSON response,
 * then strictly parses JSON and validates the data shape with Zod.
 */
export function parseAndValidateStudySet(
  rawOutput: unknown
): { success: true; data: StudySet } | { success: false; error: ValidationFailureDetails } {
  if (typeof rawOutput !== 'string' || rawOutput.trim().length === 0) {
    return {
      success: false,
      error: {
        kind: 'empty_output',
        title: 'Empty AI Response',
        message: 'The language model returned an empty payload without any study content.',
      },
    };
  }

  const cleaned = rawOutput
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(cleaned);
  } catch (err: any) {
    return {
      success: false,
      error: {
        kind: 'malformed_json',
        title: 'Malformed JSON Output',
        message: `The AI returned invalid JSON syntax that could not be parsed (${err?.message || 'SyntaxError'}).`,
        rawSnippet: cleaned.slice(0, 260),
      },
    };
  }

  const result = StudySetSchema.safeParse(parsedJson);
  if (!result.success) {
    const issues = result.error.issues.map(
      (issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`
    );
    return {
      success: false,
      error: {
        kind: 'schema_validation',
        title: 'AI Output Schema Mismatch (Zod Validation Failed)',
        message:
          'The AI returned valid JSON, but its structure did not satisfy the strict StudySet schema contract.',
        issues,
        rawSnippet: JSON.stringify(parsedJson, null, 2).slice(0, 320),
      },
    };
  }

  return {
    success: true,
    data: result.data,
  };
}
