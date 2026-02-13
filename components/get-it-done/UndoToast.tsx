"use client";

import { useEffect } from "react";

interface UndoToastProps {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
}

export function UndoToast({ message, onUndo, onDismiss }: UndoToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className="fixed bottom-20 left-4 right-4 z-20 mx-auto max-w-[600px] rounded-xl bg-[#1A1A1A] px-4 py-3 shadow-lg flex items-center justify-between gap-3"
      role="alert"
      aria-live="assertive"
    >
      <span className="text-sm font-medium text-white">{message}</span>
      <button
        onClick={onUndo}
        className="min-h-[46px] min-w-[46px] rounded-lg px-3 text-sm font-bold text-[#60A5FA] transition-colors active:text-[#93C5FD] focus:outline-none focus:ring-2 focus:ring-[#60A5FA] focus:ring-offset-2 focus:ring-offset-[#1A1A1A]"
      >
        Undo
      </button>
    </div>
  );
}
