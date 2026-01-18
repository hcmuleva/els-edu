import React from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Trash2, X } from "lucide-react";

/**
 * A reusable modal for deleting items with a confirmation prompt.
 *
 * @param {boolean} isOpen - Whether the modal is open
 * @param {function} onClose - Function to call when closing the modal (cancel)
 * @param {function} onConfirm - Function to call when confirming deletion
 * @param {string} title - Title of the modal (e.g. "Delete Classroom")
 * @param {string} message - Message to display (e.g. "Are you sure you want to delete this classroom?")
 * @param {string} itemName - Optional name of the item being deleted to show in bold
 * @param {boolean} isDeleting - Whether the delete operation is in progress (shows loader)
 */
const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Item",
  message = "Are you sure you want to delete this item? This action cannot be undone.",
  itemName,
  isDeleting = false,
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-0">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={!isDeleting ? onClose : undefined}
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 flex items-start gap-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-full shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
            <div className="text-gray-500 text-sm leading-relaxed">
              <p>{message}</p>
              {itemName && (
                <p className="mt-2 font-medium text-gray-800 bg-gray-50 p-2 rounded-lg border border-gray-100 break-all">
                  "{itemName}"
                </p>
              )}
            </div>
          </div>
          <button
            onClick={!isDeleting ? onClose : undefined}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-bold text-gray-700 hover:text-gray-900 hover:bg-gray-200/50 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default DeleteConfirmationModal;
