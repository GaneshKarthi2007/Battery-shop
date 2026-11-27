interface MinimalConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Minimalistic confirmation modal for unsaved-changes / go-back prompts.
 */
export function MinimalConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Leave",
  cancelLabel = "Stay",
  tone = "danger",
  onConfirm,
  onCancel,
}: MinimalConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        onClick={onCancel}
      />
      <div
        data-testid="minimal-confirm-dialog"
        className="relative z-10 w-full max-w-xs bg-white dark:bg-[#0D1B2A] border border-gray-200 dark:border-[#2E3B55] rounded-2xl p-5 shadow-xl space-y-4"
      >
        <div className="space-y-1">
          <h3 className="text-sm font-black text-gray-900 dark:text-white tracking-tight">
            {title}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            {message}
          </p>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-[#161D30] hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold text-white transition-colors ${
              tone === "primary"
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
