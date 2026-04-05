import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit2, Save, X, Plus, ExternalLink, Trash2 } from "lucide-react";

export default function ShopNow() {
  const [isEditing, setIsEditing] = useState(false);
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({ title: "", url: "" });
  const queryClient = useQueryClient();

  // Fetch shop items from UserPoints (stored as metadata)
  const { data: userPoints } = useQuery({
    queryKey: ["myPoints"],
    queryFn: async () => {
      const user = await base44.auth.me();
      const points = await base44.entities.UserPoints.filter({ user_email: user.email });
      return points?.[0];
    },
  });

  useEffect(() => {
    if (userPoints?.shop_items) {
      const parsed = typeof userPoints.shop_items === "string" 
        ? JSON.parse(userPoints.shop_items) 
        : userPoints.shop_items;
      setItems(parsed);
    } else {
      // Default items if none exist
      setItems([
        { id: 1, title: "Purchase Fabric", url: "https://cash.app/$SIMPLISUNDAE" },
        { id: 2, title: "Book a 1 on 1", url: "https://cash.app/$SIMPLISUNDAE" }
      ]);
    }
  }, [userPoints]);

  const updateShopItems = useMutation({
    mutationFn: async (newItems) => {
      const user = await base44.auth.me();
      const points = await base44.entities.UserPoints.filter({ user_email: user.email });
      if (points?.[0]) {
        await base44.entities.UserPoints.update(points[0].id, { 
          shop_items: JSON.stringify(newItems) 
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myPoints"] });
    },
  });

  const handleAddItem = () => {
    if (newItem.title.trim() && newItem.url.trim()) {
      const updated = [...items, { ...newItem, id: Date.now() }];
      setItems(updated);
      updateShopItems.mutate(updated);
      setNewItem({ title: "", url: "" });
    }
  };

  const handleRemoveItem = (id) => {
    const updated = items.filter(item => item.id !== id);
    setItems(updated);
    updateShopItems.mutate(updated);
  };

  const handleSave = () => {
    updateShopItems.mutate(items);
    setIsEditing(false);
  };

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const isAdmin = user?.role === "admin";
  const isCurrentUser = user?.email === (userPoints?.user_email || user?.email);

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
         <h3 className="text-sm font-bold text-gray-900">🛍️ SHOP NOW</h3>
         {isAdmin && (
          <Button
            size="sm"
            variant={isEditing ? "outline" : "default"}
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className="gap-2 bg-amber-600 hover:bg-amber-700"
            disabled={updateShopItems.isPending}
          >
            {isEditing ? (
              <>
                <Save className="w-4 h-4" /> Save
              </>
            ) : (
              <>
                <Edit2 className="w-4 h-4" /> Edit
              </>
            )}
          </Button>
        )}
      </div>

      {isAdmin && isEditing ? (
        <div className="space-y-3">
          {items.length > 0 && (
            items.map((item) => (
              <div key={item.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-amber-200">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">{item.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{item.url}</p>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleRemoveItem(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}

          <div className="space-y-3 border-t border-amber-200 pt-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700">Item Name</label>
              <Input
                placeholder="e.g., Purchase Fabric"
                value={newItem.title}
                onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700">Link (Shopify or Custom)</label>
              <Input
                placeholder="https://..."
                value={newItem.url}
                onChange={(e) => setNewItem({ ...newItem, url: e.target.value })}
                className="text-sm"
              />
            </div>
            <Button
              onClick={handleAddItem}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white gap-2"
              size="sm"
            >
              <Plus className="w-4 h-4" /> Add Item
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="text-base font-semibold text-gray-700">Coming Soon! 🎉</p>
          <p className="text-xs text-gray-600 mt-1">Shop items will be available once activated</p>
        </div>
      )}

      {/* Payment Info */}
      <div className="border-t border-amber-200 pt-2">
        <p className="text-xs font-medium text-gray-700 mb-1">Payment Methods</p>
        <a 
          href="https://cash.app/$SIMPLISUNDAE" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-white px-3 py-1 rounded border border-amber-200 hover:bg-amber-50 transition-colors"
        >
          <span className="text-xs font-semibold text-gray-900">Cash App Pay</span>
          <ExternalLink className="w-3 h-3 text-gray-500" />
        </a>
      </div>
    </div>
  );
}