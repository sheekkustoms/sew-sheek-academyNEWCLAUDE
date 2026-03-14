import React, { useState } from "react";
import { BookOpen, CheckCircle2, Circle, Clock, ChevronDown, ChevronRight, Lock, PlayCircle } from "lucide-react";

function LessonItem({ lesson, globalIndex, isActive, isCompleted, isLocked, onSelect }) {
  const status = isCompleted ? "completed" : isActive ? "active" : isLocked ? "locked" : "available";

  return (
    <button
      onClick={() => !isLocked && onSelect(lesson)}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all border-b border-gray-50 last:border-0 ${
        isActive ? "bg-gray-50 border-l-2 border-l-gray-900" :
        isLocked ? "opacity-50 cursor-not-allowed" :
        "hover:bg-gray-50 cursor-pointer"
      }`}
    >
      <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
        isCompleted ? "bg-emerald-100 text-emerald-600" :
        isActive ? "bg-gray-900 text-white" :
        isLocked ? "bg-gray-100 text-gray-400" :
        "bg-gray-100 text-gray-500"
      }`}>
        {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> :
         isLocked ? <Lock className="w-3 h-3" /> :
         isActive ? <PlayCircle className="w-3.5 h-3.5" /> :
         <span className="text-[10px] font-bold">{globalIndex + 1}</span>}
      </span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate leading-snug ${isActive ? "text-gray-900" : "text-gray-600"}`}>
          {lesson.title}
        </p>
        {lesson.duration_minutes > 0 && (
          <span className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
            <Clock className="w-3 h-3" />{lesson.duration_minutes}m
          </span>
        )}
      </div>
    </button>
  );
}

function ModuleSection({ module, lessons, allLessons, activeLesson, enrollment, isLessonCompleted, onSelectLesson }) {
  const [open, setOpen] = useState(true);
  const completed = lessons.filter(l => isLessonCompleted(l.id)).length;

  return (
    <div>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-100 text-left hover:bg-gray-100 transition-colors"
      >
        <BookOpen className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        <span className="flex-1 text-xs font-semibold text-gray-600 uppercase tracking-wide truncate">{module.title}</span>
        <span className="text-[10px] text-gray-400 shrink-0">{completed}/{lessons.length}</span>
        {open ? <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
      </button>
      {open && lessons.map(lesson => {
        const globalIndex = allLessons.indexOf(lesson);
        const isLocked = !enrollment && globalIndex > 0;
        return (
          <LessonItem
            key={lesson.id}
            lesson={lesson}
            globalIndex={globalIndex}
            isActive={activeLesson?.id === lesson.id}
            isCompleted={isLessonCompleted(lesson.id)}
            isLocked={isLocked}
            onSelect={onSelectLesson}
          />
        );
      })}
    </div>
  );
}

export default function LessonSidebar({ modules, lessons, activeLesson, enrollment, isLessonCompleted, onSelectLesson }) {
  const standaloneLesson = lessons.filter(l => !l.module_id);

  if (lessons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400 text-sm gap-2">
        <BookOpen className="w-8 h-8 text-gray-200" />
        <p>No lessons yet</p>
      </div>
    );
  }

  return (
    <div>
      <div className="px-4 py-2.5 border-b border-gray-100 bg-white sticky top-0 z-10">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Course Content</p>
      </div>

      {modules.map(module => {
        const modLessons = lessons.filter(l => l.module_id === module.id);
        if (!modLessons.length) return null;
        return (
          <ModuleSection
            key={module.id}
            module={module}
            lessons={modLessons}
            allLessons={lessons}
            activeLesson={activeLesson}
            enrollment={enrollment}
            isLessonCompleted={isLessonCompleted}
            onSelectLesson={onSelectLesson}
          />
        );
      })}

      {standaloneLesson.map(lesson => {
        const globalIndex = lessons.indexOf(lesson);
        const isLocked = !enrollment && globalIndex > 0;
        return (
          <LessonItem
            key={lesson.id}
            lesson={lesson}
            globalIndex={globalIndex}
            isActive={activeLesson?.id === lesson.id}
            isCompleted={isLessonCompleted(lesson.id)}
            isLocked={isLocked}
            onSelect={onSelectLesson}
          />
        );
      })}
    </div>
  );
}