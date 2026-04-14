import React, { useState } from "react";
import { ChevronRight, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const QUESTIONS = [
  {
    id: 1,
    text: "Have you ever used a sewing machine?",
    type: "experience",
    answers: ["Never", "Once or twice", "Yes regularly", "Yes and I teach others"],
  },
  {
    id: 2,
    text: "Can you thread a sewing machine without help right now?",
    type: "experience",
    answers: ["No", "I think so but not sure", "Yes confidently", "N/A"],
  },
  {
    id: 3,
    text: "Have you ever finished a complete sewing project?",
    type: "experience",
    answers: ["Never", "I started one but didn't finish", "Yes one or two", "Yes multiple"],
  },
  {
    id: 4,
    text: "Do you know what seam allowance is and how to use it?",
    type: "experience",
    answers: ["No idea", "I've heard of it", "Yes I understand it", "I use it automatically"],
  },
  {
    id: 5,
    text: "Have you ever worked with a sewing pattern?",
    type: "experience",
    answers: ["Never", "Tried once, got confused", "Yes a few times", "Yes comfortably"],
  },
  {
    id: 6,
    text: "Why are you joining Oh Sew Sheek Academy?",
    type: "goal",
    answers: ["I want to learn a new skill", "I want to make things for myself and family", "I want to sell what I make", "All of the above"],
  },
  {
    id: 7,
    text: "What do you most want to create?",
    type: "goal",
    answers: ["Clothes and garments", "Bags and accessories", "Sublimation products", "Home decor", "A mix of everything"],
  },
  {
    id: 8,
    text: "How much time can you commit each week?",
    type: "goal",
    answers: ["1 to 2 hours", "3 to 5 hours", "6 or more hours"],
  },
  {
    id: 9,
    text: "Have you tried to learn sewing before and stopped?",
    type: "goal",
    answers: ["No this is my first time", "Yes I tried YouTube and got lost", "Yes I tried another course and quit", "Yes multiple times"],
  },
  {
    id: 10,
    text: "How do you feel right now about sitting at a sewing machine?",
    type: "goal",
    answers: ["Terrified", "A little nervous", "Neutral", "Ready let's go"],
  },
];

export default function PlacementQuiz({ onComplete }) {
  const [screen, setScreen] = useState("welcome");
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  const handleAnswer = (answerIndex) => {
    setSelectedAnswer(answerIndex);
    const newAnswers = { ...answers, [currentQuestion]: answerIndex };
    setAnswers(newAnswers);

    if (currentQuestion < 10) {
      setTimeout(() => {
        setSelectedAnswer(null);
        setCurrentQuestion(currentQuestion + 1);
      }, 300);
    } else {
      // Question 10 - complete the quiz
      setTimeout(() => {
        console.log("[PlacementQuiz] Completing with answers:", newAnswers);
        const experienceScore = [1, 2, 3, 4, 5].reduce((sum, id) => {
          const answerIndex = newAnswers[id];
          return sum + (answerIndex !== undefined ? answerIndex + 1 : 0);
        }, 0);
        console.log("[PlacementQuiz] Experience score:", experienceScore);
        onComplete({ answers: newAnswers, experienceScore });
      }, 300);
    }
  };

  if (screen === "welcome") {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-16 bg-gradient-to-br from-[#6B3FA0]/5 to-purple-50">
        <div className="max-w-md text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-[#D4AF37]/20 flex items-center justify-center mx-auto">
            <Zap className="w-8 h-8 text-[#D4AF37]" />
          </div>
          <h1 className="text-3xl font-extrabold text-[#111] leading-tight">
            Before we build your path — let's find out where you are.
          </h1>
          <p className="text-sm text-[#666] leading-relaxed">
            This takes about 3 minutes. Answer honestly — there are no wrong answers. This determines where you start so you are never bored and never lost.
          </p>
          <button
            onClick={() => setScreen("quiz")}
            className="w-full bg-[#D4AF37] text-black font-bold px-6 py-4 rounded-xl hover:bg-[#F0D060] transition-all shadow-lg shadow-[#D4AF37]/20 flex items-center justify-center gap-2"
          >
            Let's Find My Starting Point
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  const question = QUESTIONS.find(q => q.id === currentQuestion);
  const progress = (currentQuestion / 10) * 100;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#6B3FA0]/5 to-purple-50 py-8 px-6">
      <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full">
        <Progress value={progress} className="mb-8 h-2" />

        <div className="mb-8">
          <p className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest mb-2">
            Question {currentQuestion} of 10
          </p>
          <h2 className="text-2xl font-extrabold text-[#111]">{question?.text}</h2>
        </div>

        <div className="space-y-3">
          {question?.answers.map((answer, idx) => (
            <button
              key={idx}
              onClick={() => handleAnswer(idx)}
              disabled={selectedAnswer !== null}
              className={`w-full border-2 rounded-xl px-5 py-4 text-left font-semibold transition-all active:scale-95 ${
                selectedAnswer === idx
                  ? "bg-[#D4AF37] border-[#D4AF37] text-black"
                  : "bg-white border-[#EEEEEE] text-[#333] hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 disabled:opacity-60"
              }`}
            >
              {answer}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}