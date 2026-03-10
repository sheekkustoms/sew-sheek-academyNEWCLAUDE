import React, { useRef, useState, useCallback } from "react";
import { Loader2 } from "lucide-react";

const THRESHOLD = 72; // px of pull needed to trigger refresh

export default function PullToRefresh({ onRefresh, children }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const containerRef = useRef(null);

  const handleTouchStart = useCallback((e) => {
    // Only activate when scrolled to top
    if (containerRef.current?.scrollTop > 0) return;
    startY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (startY.current === null || refreshing) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta <= 0) { setPullDistance(0); return; }
    // Only prevent default (block scroll) when pulling down from top
    if (containerRef.current?.scrollTop === 0 && delta > 0) {
      e.preventDefault();
    }
    setPullDistance(Math.min(delta * 0.5, THRESHOLD + 20));
  }, [refreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= THRESHOLD) {
      setRefreshing(true);
      setPullDistance(THRESHOLD);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
    startY.current = null;
  }, [pullDistance, onRefresh]);

  const progress = Math.min(pullDistance / THRESHOLD, 1);

  return (
    <div
      ref={containerRef}
      className="relative overflow-auto"
      style={{ overscrollBehaviorY: "contain" }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className="flex items-center justify-center transition-all duration-200 overflow-hidden"
        style={{ height: refreshing ? THRESHOLD : pullDistance }}
      >
        <div
          className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center"
          style={{ opacity: progress, transform: `scale(${0.5 + progress * 0.5}) rotate(${progress * 360}deg)` }}
        >
          {refreshing ? (
            <Loader2 className="w-4 h-4 text-pink-500 animate-spin" />
          ) : (
            <Loader2 className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>
      {children}
    </div>
  );
}