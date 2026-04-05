import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus } from "lucide-react";

export default function CategoryManager() {
  const queryClient = useQueryClient();
  const [newCategory, setNewCategory] = useState({ label: "", emoji: "" });

  const { data: settings = [] } = useQuery({
    queryKey: ["categorySettings"],
    queryFn: async () => {
      const list = await base44.entities.CategorySettings.list();
      // Initialize with default categories if none exist
      if (list.length === 0) {
        const defaults = {
          categories: [
            { id: "announcement", label: "Announcements", emoji: "📢" },
            { id: "discussion", label: "Discussion", emoji: "💬" },
          ]
        };
        await base44.entities.CategorySettings.create(defaults);
        return [defaults];
      }
      return list;
    },
  });

  const config = settings[0] || { categories: [] };

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.CategorySettings.update(config.id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categorySettings"] }),
  });

  const handleAddCategory = () => {
    if (!newCategory.label) return;
    const id = newCategory.label.toLowerCase().replace(/\s+/g, "_");
    const updated = [
      ...config.categories,
      { id, label: newCategory.label, emoji: newCategory.emoji || "📌" }
    ];
    updateMutation.mutate({ categories: updated });
    setNewCategory({ label: "", emoji: "" });
  };

  const handleRemoveCategory = (id) => {
    const updated = config.categories.filter(c => c.id !== id);
    updateMutation.mutate({ categories: updated });
  };

  const handleUpdateCategory = (id, field, value) => {
    const updated = config.categories.map(c =>
      c.id === id ? { ...c, [field]: value } : c
    );
    updateMutation.mutate({ categories: updated });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="font-semibold text-gray-800">Add New Category</h3>
        <div className="flex gap-3">
          <Input
            placeholder="Emoji"
            value={newCategory.emoji}
            onChange={(e) => setNewCategory({ ...newCategory, emoji: e.target.value })}
            maxLength="2"
            className="w-20"
          />
          <Input
            placeholder="Category name"
            value={newCategory.label}
            onChange={(e) => setNewCategory({ ...newCategory, label: e.target.value })}
            className="flex-1"
          />
          <Button
            onClick={handleAddCategory}
            disabled={!newCategory.label}
            className="bg-gradient-to-r from-pink-500 to-violet-500 text-white gap-2"
          >
            <Plus className="w-4 h-4" /> Add
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold text-gray-800 text-sm">Current Categories</h3>
        {config.categories.map((cat) => (
          <div
            key={cat.id}
            className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm"
          >
            <Input
              placeholder="Emoji"
              value={cat.emoji || ""}
              onChange={(e) => handleUpdateCategory(cat.id, "emoji", e.target.value)}
              maxLength="2"
              className="w-16"
            />
            <Input
              placeholder="Label"
              value={cat.label}
              onChange={(e) => handleUpdateCategory(cat.id, "label", e.target.value)}
              className="flex-1"
            />
            <Button
              size="icon"
              variant="ghost"
              className="text-red-400 hover:bg-red-50 w-8 h-8 shrink-0"
              onClick={() => handleRemoveCategory(cat.id)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}