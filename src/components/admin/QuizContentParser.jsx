import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wand2, Loader2, AlertCircle, CheckCircle2, Copy } from "lucide-react";

export default function QuizContentParser({ quizId, onQuestionsGenerated }) {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [generatedQuestions, setGeneratedQuestions] = useState([]);

  const handleGenerateQuestions = async () => {
    if (!content.trim()) {
      setError("Please paste some content first");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      // Use LLM to generate questions from content
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a quiz creator. Based on the following content, generate 5 multiple choice quiz questions with 4 options each and one correct answer.

Content:
${content}

Return the response as a JSON array with this exact structure:
[
  {
    "question_text": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer_index": 0,
    "points": 100
  }
]

IMPORTANT: Return ONLY valid JSON, no markdown formatting, no code blocks.`,
        response_json_schema: {
          type: "object",
          properties: {
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question_text: { type: "string" },
                  options: { type: "array", items: { type: "string" } },
                  correct_answer_index: { type: "number" },
                  points: { type: "number" }
                }
              }
            }
          }
        }
      });

      const questions = response.data?.questions || [];
      
      if (questions.length === 0) {
        setError("No questions generated. Try different content.");
        setIsLoading(false);
        return;
      }

      setGeneratedQuestions(questions);
      setSuccess(`Generated ${questions.length} questions!`);
    } catch (err) {
      setError(`Error generating questions: ${err.message}`);
      console.error("LLM error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveQuestions = async () => {
    if (!quizId || generatedQuestions.length === 0) return;

    try {
      setIsLoading(true);
      
      // Get current max order
      const existingQuestions = await base44.entities.QuizQuestion.filter({ quiz_id: quizId });
      const maxOrder = Math.max(0, ...existingQuestions.map(q => q.order || 0));

      // Create all questions
      await Promise.all(
        generatedQuestions.map((q, idx) =>
          base44.entities.QuizQuestion.create({
            quiz_id: quizId,
            question_text: q.question_text,
            question_type: "multiple_choice",
            options: q.options,
            correct_answer_index: q.correct_answer_index,
            points: q.points || 100,
            order: maxOrder + idx + 1,
          })
        )
      );

      setSuccess("Questions saved to quiz!");
      setContent("");
      setGeneratedQuestions([]);
      
      if (onQuestionsGenerated) {
        onQuestionsGenerated();
      }
    } catch (err) {
      setError(`Error saving questions: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 border border-amber-200 bg-amber-50 rounded-lg p-4">
      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
        <Wand2 className="w-4 h-4 text-amber-600" />
        Auto-Generate Questions from Content
      </h3>

      <Textarea
        placeholder="Paste your course material, article, or notes here..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-[150px] border-amber-300"
        disabled={isLoading}
      />

      <Button
        onClick={handleGenerateQuestions}
        disabled={isLoading || !content.trim()}
        className="bg-amber-600 hover:bg-amber-700 text-white w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Generating...
          </>
        ) : (
          <>
            <Wand2 className="w-4 h-4 mr-2" />
            Generate Questions
          </>
        )}
      </Button>

      {error && (
        <div className="flex gap-2 p-3 rounded-lg bg-red-100 border border-red-300 text-red-800 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex gap-2 p-3 rounded-lg bg-green-100 border border-green-300 text-green-800 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          {success}
        </div>
      )}

      {generatedQuestions.length > 0 && (
        <div className="space-y-3 border-t border-amber-200 pt-4">
          <h4 className="font-medium text-gray-900">Preview ({generatedQuestions.length} questions)</h4>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {generatedQuestions.map((q, idx) => (
              <div key={idx} className="text-sm bg-white p-3 rounded-lg border border-amber-200">
                <p className="font-medium text-gray-900 mb-1">{idx + 1}. {q.question_text}</p>
                <ul className="space-y-1 ml-4 text-gray-700">
                  {q.options.map((opt, optIdx) => (
                    <li key={optIdx} className={optIdx === q.correct_answer_index ? "text-green-700 font-medium" : ""}>
                      {String.fromCharCode(65 + optIdx)}) {opt}
                      {optIdx === q.correct_answer_index && " ✓"}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <Button
            onClick={handleSaveQuestions}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700 text-white w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              "Save All Questions to Quiz"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}