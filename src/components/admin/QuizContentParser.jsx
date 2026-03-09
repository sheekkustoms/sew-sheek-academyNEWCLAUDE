import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wand2, Loader2, AlertCircle, CheckCircle2, Copy } from "lucide-react";

export default function QuizContentParser({ quizId, onQuestionsGenerated }) {
  const [content, setContent] = useState("");
  const [bulkInput, setBulkInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [bulkQuestions, setBulkQuestions] = useState([]);

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

  const handleSaveQuestions = async (questionsToSave) => {
    if (!quizId || questionsToSave.length === 0) return;

    try {
      setIsLoading(true);
      
      // Get current max order
      const existingQuestions = await base44.entities.QuizQuestion.filter({ quiz_id: quizId });
      const maxOrder = Math.max(0, ...existingQuestions.map(q => q.order || 0));

      // Create all questions
      await Promise.all(
        questionsToSave.map((q, idx) =>
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
      setBulkInput("");
      setBulkQuestions([]);
      
      if (onQuestionsGenerated) {
        onQuestionsGenerated();
      }
    } catch (err) {
      setError(`Error saving questions: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const parseBulkQuestions = () => {
    if (!bulkInput.trim()) {
      setError("Please paste questions and answers");
      return;
    }

    try {
      setError("");
      // Parse format: Q: Question text\nA: Answer1\nA: Answer2\nCorrect: Answer1\n\nQ: Next question...
      const blocks = bulkInput.split(/\n\n+/);
      const parsed = [];

      blocks.forEach(block => {
        const lines = block.split('\n').map(l => l.trim()).filter(l => l);
        if (lines.length < 2) return;

        const questionLine = lines.find(l => l.match(/^(Q:|Question:)/i));
        const answerLines = lines.filter(l => l.match(/^(A:|Answer:)/i));
        const correctLine = lines.find(l => l.match(/^(Correct|Right Answer):/i));

        if (!questionLine || answerLines.length < 2) return;

        const questionText = questionLine.replace(/^(Q:|Question:)\s*/i, '').trim();
        const options = answerLines.map(a => a.replace(/^(A:|Answer:)\s*/i, '').trim());
        const correctAnswer = correctLine ? correctLine.replace(/^(Correct|Right Answer):\s*/i, '').trim() : options[0];
        const correctIdx = options.findIndex(o => o.toLowerCase() === correctAnswer.toLowerCase());

        if (questionText && options.length >= 2 && correctIdx >= 0) {
          parsed.push({
            question_text: questionText,
            options,
            correct_answer_index: correctIdx,
            points: 100
          });
        }
      });

      if (parsed.length === 0) {
        setError("Could not parse any valid questions. Use format:\nQ: Question?\nA: Option 1\nA: Option 2\nCorrect: Option 1");
        return;
      }

      setBulkQuestions(parsed);
      setSuccess(`Parsed ${parsed.length} questions!`);
    } catch (err) {
      setError(`Error parsing: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4 border border-amber-200 bg-amber-50 rounded-lg p-4">
      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
        <Wand2 className="w-4 h-4 text-amber-600" />
        Add Questions
      </h3>

      <Tabs defaultValue="ai" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-amber-100">
          <TabsTrigger value="ai">AI Generate</TabsTrigger>
          <TabsTrigger value="bulk">Paste Questions</TabsTrigger>
        </TabsList>

        <TabsContent value="ai" className="space-y-4 mt-4">

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
                onClick={() => handleSaveQuestions(generatedQuestions)}
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
        </TabsContent>

        <TabsContent value="bulk" className="space-y-4 mt-4">
          <div className="text-xs text-gray-600 bg-white p-3 rounded-lg border border-amber-200 space-y-1">
            <p className="font-semibold">Format:</p>
            <p>Q: What is 2+2?</p>
            <p>A: 3</p>
            <p>A: 4</p>
            <p>A: 5</p>
            <p>Correct: 4</p>
            <p></p>
            <p>Q: Next question?</p>
            <p>A: Option 1</p>
            <p>A: Option 2</p>
            <p>Correct: Option 1</p>
          </div>

          <Textarea
            placeholder="Paste questions and answers in the format shown above..."
            value={bulkInput}
            onChange={(e) => setBulkInput(e.target.value)}
            className="min-h-[200px] border-amber-300 font-mono text-xs"
            disabled={isLoading}
          />

          <Button
            onClick={parseBulkQuestions}
            disabled={isLoading || !bulkInput.trim()}
            className="bg-amber-600 hover:bg-amber-700 text-white w-full"
          >
            <Copy className="w-4 h-4 mr-2" />
            Parse Questions
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

          {bulkQuestions.length > 0 && (
            <div className="space-y-3 border-t border-amber-200 pt-4">
              <h4 className="font-medium text-gray-900">Parsed ({bulkQuestions.length} questions)</h4>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {bulkQuestions.map((q, idx) => (
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
                onClick={() => handleSaveQuestions(bulkQuestions)}
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
        </TabsContent>
      </Tabs>
    </div>
  );
}