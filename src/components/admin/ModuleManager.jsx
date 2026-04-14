import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Edit2, ChevronDown, ChevronRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ModuleManager({ courseId }) {
  const queryClient = useQueryClient();
  const [editingModuleId, setEditingModuleId] = useState(null);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [expandedModuleId, setExpandedModuleId] = useState(null);

  const { data: modules = [] } = useQuery({
    queryKey: ["modules", courseId],
    queryFn: () => base44.entities.Module.filter({ course_id: courseId }),
    enabled: !!courseId,
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ["lessons", courseId],
    queryFn: () => base44.entities.Lesson.filter({ course_id: courseId }),
    enabled: !!courseId,
  });

  const createModuleMutation = useMutation({
    mutationFn: (title) => base44.entities.Module.create({
      course_id: courseId,
      title,
      order: modules.length,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules", courseId] });
      setNewModuleTitle("");
    },
  });

  const updateModuleMutation = useMutation({
    mutationFn: ({ id, title }) => base44.entities.Module.update(id, { title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules", courseId] });
      setEditingModuleId(null);
    },
  });

  const deleteModuleMutation = useMutation({
    mutationFn: (id) => base44.entities.Module.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules", courseId] });
    },
  });

  const assignLessonMutation = useMutation({
    mutationFn: ({ lessonId, moduleId }) => 
      base44.entities.Lesson.update(lessonId, { module_id: moduleId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons", courseId] });
    },
  });

  const unassignLessonMutation = useMutation({
    mutationFn: (lessonId) => 
      base44.entities.Lesson.update(lessonId, { module_id: null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons", courseId] });
    },
  });

  const sortedModules = [...modules].sort((a, b) => (a.order || 0) - (b.order || 0));
  const unassignedLessons = lessons.filter(l => !l.module_id);

  return (
    <div className="space-y-6">
      {/* Create new module */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4">
        <div className="flex gap-2">
          <Input
            placeholder="Module title (e.g., Day 1: Basics)"
            value={newModuleTitle}
            onChange={(e) => setNewModuleTitle(e.target.value)}
            className="flex-1"
          />
          <Button
            onClick={() => createModuleMutation.mutate(newModuleTitle)}
            disabled={!newModuleTitle.trim() || createModuleMutation.isPending}
            className="bg-violet-600 hover:bg-violet-700 text-white gap-2"
          >
            <Plus className="w-4 h-4" /> Add Module
          </Button>
        </div>
      </div>

      {/* Modules list */}
      <div className="space-y-3">
        {sortedModules.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center text-gray-400">
            <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>No modules yet. Create one to start assigning videos.</p>
          </div>
        ) : (
          sortedModules.map((mod) => {
            const modLessons = lessons.filter(l => l.module_id === mod.id);
            const isExpanded = expandedModuleId === mod.id;
            return (
              <div key={mod.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                <div className="flex items-center gap-3 p-4 bg-gray-50 border-b border-gray-100">
                  <button
                    onClick={() => setExpandedModuleId(isExpanded ? null : mod.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </button>
                  {editingModuleId === mod.id ? (
                    <Input
                      autoFocus
                      value={newModuleTitle}
                      onChange={(e) => setNewModuleTitle(e.target.value)}
                      onBlur={() => {
                        if (newModuleTitle.trim()) {
                          updateModuleMutation.mutate({ id: mod.id, title: newModuleTitle });
                        } else {
                          setEditingModuleId(null);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          if (newModuleTitle.trim()) {
                            updateModuleMutation.mutate({ id: mod.id, title: newModuleTitle });
                          }
                        }
                      }}
                      className="flex-1"
                    />
                  ) : (
                    <h3 className="flex-1 font-bold text-gray-800">{mod.title}</h3>
                  )}
                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full font-semibold">
                    {modLessons.length} video{modLessons.length !== 1 ? "s" : ""}
                  </span>
                  <button
                    onClick={() => {
                      setEditingModuleId(editingModuleId === mod.id ? null : mod.id);
                      setNewModuleTitle(mod.title);
                    }}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteModuleMutation.mutate(mod.id)}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {isExpanded && (
                  <div className="p-4 space-y-2">
                    {modLessons.length === 0 ? (
                      <p className="text-sm text-gray-400 py-4">No videos assigned yet</p>
                    ) : (
                      modLessons.map((lesson) => (
                        <div key={lesson.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg text-sm">
                          <span className="font-medium text-gray-700 truncate">{lesson.title}</span>
                          <button
                            onClick={() => unassignLessonMutation.mutate(lesson.id)}
                            disabled={unassignLessonMutation.isPending}
                            className="text-xs text-red-600 hover:text-red-700 font-semibold"
                          >
                            Remove
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Unassigned lessons */}
      {unassignedLessons.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <h3 className="font-bold text-amber-900 mb-3">Unassigned Videos ({unassignedLessons.length})</h3>
          <div className="space-y-2">
            {unassignedLessons.map((lesson) => (
              <div key={lesson.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                <span className="text-sm font-medium text-gray-700 flex-1 truncate">{lesson.title}</span>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      assignLessonMutation.mutate({ lessonId: lesson.id, moduleId: e.target.value });
                    }
                  }}
                  className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg bg-white cursor-pointer hover:border-violet-300"
                >
                  <option value="">Assign to module...</option>
                  {sortedModules.map((mod) => (
                    <option key={mod.id} value={mod.id}>{mod.title}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}