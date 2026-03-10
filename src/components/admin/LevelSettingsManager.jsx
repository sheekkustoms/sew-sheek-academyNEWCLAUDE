import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Zap, Save } from "lucide-react";

const DEFAULT_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500, 7500, 10000];

export default function LevelSettingsManager() {
  const queryClient = useQueryClient();
  const [thresholds, setThresholds] = useState(DEFAULT_THRESHOLDS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const { data: settings = [] } = useQuery({
    queryKey: ["levelSettings"],
    queryFn: () => base44.entities.LevelSettings.filter({ label: "default" }),
  });

  useEffect(() => {
    if (settings.length > 0 && settings[0].thresholds?.length > 0) {
      setThresholds(settings[0].thresholds);
    }
  }, [settings]);

  const handleChange = (i, val) => {
    const updated = [...thresholds];
    updated[i] = Number(val);
    setThresholds(updated);
  };

  const handleEvenDistribution = () => {
    const total = thresholds.length;
    const maxXP = thresholds[total - 1] || 10000;
    const newThresholds = thresholds.map((_, i) => {
      if (i === 0) return 0;
      return Math.round((maxXP / (total - 1)) * i);
    });
    setThresholds(newThresholds);
  };

  const handleSave = async () => {
    // Validate: each threshold must be greater than the previous
    for (let i = 1; i < thresholds.length; i++) {
      if (thresholds[i] <= thresholds[i - 1]) {
        alert(`Level ${i + 1} threshold (${thresholds[i]}) must be greater than Level ${i} (${thresholds[i - 1]}). Please fix before saving.`);
        return;
      }
    }
    setSaving(true);
    if (settings.length > 0) {
      await base44.entities.LevelSettings.update(settings[0].id, { thresholds });
    } else {
      await base44.entities.LevelSettings.create({ label: "default", thresholds });
    }
    queryClient.invalidateQueries({ queryKey: ["levelSettings"] });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-2 font-semibold text-gray-800">
        <Zap className="w-4 h-4 text-fuchsia-500" /> Custom Level XP Thresholds
      </div>
      <p className="text-sm text-gray-500">Set how much XP is needed to reach each level. Level 1 always starts at 0.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {thresholds.map((val, i) => (
          <div key={i}>
            <label className="text-xs text-gray-400 mb-1 block">Level {i + 1}</label>
            <Input
              type="number"
              value={val}
              disabled={i === 0}
              onChange={e => handleChange(i, e.target.value)}
              className="text-sm"
            />
          </div>
        ))}
      </div>
      <div className="flex gap-3 flex-wrap">
      <Button variant="outline" onClick={handleEvenDistribution} className="gap-2 border-violet-300 text-violet-700 hover:bg-violet-50">
        ⚖️ Even Distribution
      </Button>
      <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-pink-500 to-violet-500 text-white gap-2">
        <Save className="w-4 h-4" /> {saving ? "Saving..." : saved ? "Saved ✓" : "Save Thresholds"}
      </Button>
      </div>
    </div>
  );
}