import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GripVertical } from 'lucide-react';

interface DraggableVerticalProps {
  side: 'left' | 'right';
  initialTopPx?: number; // e.g. 520
  minTopPx?: number; // minimum distance from top (e.g. 70px)
  maxBottomPx?: number; // minimum distance from bottom (e.g. 80px)
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  tooltip?: string;
  storageKey?: string;
}

export const DraggableVerticalFloat: React.FC<DraggableVerticalProps> = ({
  side,
  initialTopPx,
  minTopPx = 70,
  maxBottomPx = 90,
  children,
  onClick,
  className = '',
  tooltip,
  storageKey,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [topPos, setTopPos] = useState<number>(() => {
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const val = parseFloat(saved);
        if (!isNaN(val)) return val;
      }
    }
    if (initialTopPx !== undefined) return initialTopPx;
    // Default: around 72% down the screen
    return typeof window !== 'undefined' ? Math.min(window.innerHeight * 0.72, 540) : 520;
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragStartYRef = useRef<number>(0);
  const startTopPosRef = useRef<number>(topPos);
  const hasMovedRef = useRef<boolean>(false);

  // Clamp topPos within allowable vertical bounds of parent container / window
  const clampY = useCallback(
    (y: number) => {
      let parentHeight = window.innerHeight;
      if (containerRef.current?.parentElement) {
        parentHeight = containerRef.current.parentElement.clientHeight || window.innerHeight;
      }
      const maxY = Math.max(minTopPx, parentHeight - maxBottomPx);
      return Math.min(Math.max(y, minTopPx), maxY);
    },
    [minTopPx, maxBottomPx]
  );

  // Handle pointer down (both touch and mouse)
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only respond to main button / touch
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    dragStartYRef.current = e.clientY;
    startTopPosRef.current = topPos;
    hasMovedRef.current = false;
    setIsDragging(true);

    if (containerRef.current) {
      containerRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;

    const deltaY = e.clientY - dragStartYRef.current;
    if (Math.abs(deltaY) > 5) {
      hasMovedRef.current = true;
    }

    const newY = clampY(startTopPosRef.current + deltaY);
    setTopPos(newY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);

    try {
      if (containerRef.current && containerRef.current.hasPointerCapture(e.pointerId)) {
        containerRef.current.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore
    }

    // Save to localStorage if key provided
    if (storageKey) {
      localStorage.setItem(storageKey, topPos.toString());
    }

    // If movement was negligible, trigger click handler
    if (!hasMovedRef.current && onClick) {
      onClick();
    }
  };

  const handlePointerCancel = () => {
    setIsDragging(false);
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      style={{
        top: `${topPos}px`,
        touchAction: 'none',
      }}
      className={`absolute z-40 select-none ${
        side === 'left' ? 'left-3.5' : 'right-3.5'
      } ${
        isDragging ? 'cursor-grabbing scale-105 transition-none' : 'cursor-grab transition-transform duration-200'
      } ${className}`}
      title={tooltip}
    >
      <div className="relative group flex items-center">
        {/* Child button / orb */}
        {children}

        {/* Small vertical grip indicator pill */}
        <div
          className={`absolute ${
            side === 'left' ? '-right-2' : '-left-2'
          } top-1/2 -translate-y-1/2 flex flex-col items-center justify-center p-0.5 rounded-full bg-[#181d16]/70 text-white/90 shadow-xs border border-white/20 opacity-40 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none ${
            isDragging ? 'opacity-100 ring-2 ring-white/50 bg-[#181d16]' : ''
          }`}
        >
          <GripVertical className="w-2.5 h-2.5" />
        </div>
      </div>
    </div>
  );
};
