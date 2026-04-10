import { GoogleGenAI, Type } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set. Please ensure it is configured in the environment.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export type QuestionType = 'multiple-choice' | 'open' | 'true-false' | 'matching' | 'completion';

export interface Question {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[]; // For multiple-choice, matching
  correctAnswer: any; // index for MCQ, string for open/completion, boolean for T/F
  explanation: string;
  hint?: string;
  solutionSteps?: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  topic?: string;
}

export interface QuizData {
  title: string;
  summary: string;
  questions: Question[];
}

export async function generateQuiz(
  content: string,
  options: {
    subject: string;
    numQuestions: number;
    difficulty: 'easy' | 'medium' | 'hard';
    level: string;
    questionTypes: QuestionType[];
    topic?: string;
  }
): Promise<QuizData> {
  // Limit content to prevent huge token usage
  const truncatedContent = content.slice(0, 8000);
  
  const prompt = `
    Generate a quiz in Hebrew for subject: ${options.subject}.
    Grade/Level: ${options.level}.
    Difficulty: ${options.difficulty}.
    Questions: ${options.numQuestions}.
    Types: ${options.questionTypes.join(', ')}.
    ${options.topic ? `Topic: ${options.topic}` : ''}
    
    Content: ${truncatedContent}
    
    Guidelines:
    - Math/Science: Include hints and solution steps.
    - Language/Lit: Focus on analysis and grammar.
    - History: Focus on events and chronology.
    - English: Focus on vocab and grammar.
    
    Format:
    - Multiple-choice: 4 options, correctAnswer is index (0-3).
    - Open/Completion: correctAnswer is a string.
    - True/False: correctAnswer is boolean.
  `;

  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          summary: { type: Type.STRING },
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                type: { type: Type.STRING, enum: ["multiple-choice", "open", "true-false", "matching", "completion"] },
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswer: { type: Type.STRING },
                explanation: { type: Type.STRING },
                hint: { type: Type.STRING },
                solutionSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
                difficulty: { type: Type.STRING, enum: ["easy", "medium", "hard"] },
              },
              required: ["id", "type", "question", "correctAnswer", "explanation", "difficulty"],
            },
          },
        },
        required: ["title", "summary", "questions"],
      },
    },
  });

  return JSON.parse(response.text);
}

export async function evaluateOpenAnswer(
  question: string,
  modelAnswer: string,
  userAnswer: string
): Promise<{ score: number; feedback: string; improvements: string }> {
  const prompt = `
    Evaluate the user's answer to the following question based on the model answer.
    Question: ${question}
    Model Answer: ${modelAnswer}
    User Answer: ${userAnswer}
    
    Provide:
    1. A score from 0 to 100.
    2. Detailed feedback in Hebrew.
    3. Suggestions for improvement in Hebrew.
  `;

  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          feedback: { type: Type.STRING },
          improvements: { type: Type.STRING },
        },
        required: ["score", "feedback", "improvements"],
      },
    },
  });

  return JSON.parse(response.text);
}

export async function extractTopics(content: string): Promise<string[]> {
  const truncatedContent = content.slice(0, 5000);
  const prompt = `
    Extract 3-6 main topics or chapters from this text in Hebrew.
    Content: ${truncatedContent}
  `;

  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          topics: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["topics"]
      }
    }
  });

  const data = JSON.parse(response.text);
  return data.topics;
}
