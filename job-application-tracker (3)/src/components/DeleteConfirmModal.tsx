import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  companyName: string;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  companyName,
  onClose,
  onConfirm,
  isDeleting = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div 
        id="delete-modal-content"
        className="bg-[#FCFCFA] rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-[#E5E5E1]"
      >
        <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-5 h-5" />
        </div>

        <h3 className="font-serif text-lg font-bold text-[#1A1A1A] text-center">Delete Application?</h3>
        <p className="text-xs text-[#737373] text-center mt-2 leading-relaxed">
          Are you sure you want to remove your record for <strong className="text-[#1A1A1A]">{companyName}</strong>? This will permanently delete associated interview rounds and notes.
        </p>

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-[#E5E5E1] text-xs font-medium text-[#525252] hover:bg-[#F0F0EC] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            id="btn-confirm-delete-application"
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className="flex-1 py-2 rounded-lg bg-[#991B1B] hover:bg-[#7F1D1D] text-[#FCFCFA] text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isDeleting ? 'Deleting...' : 'Confirm Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};
