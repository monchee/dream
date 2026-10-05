import React, { useState } from 'react';
import { Button } from '../../../../components/ui';
import { Trash2 } from 'lucide-react';
import { deleteResult } from '../services/ResearchService';
import { toast } from 'sonner';

interface ResearchDeleteDialogProps {
  recordId: string;
  onDeleted: () => void;
}

/**
 * Inline confirm-delete control for a research record (plan 003 / F1).
 * Owns the deleting/confirm/error state and the delete call; the parent
 * removes the record from its list via onDeleted.
 */
const ResearchDeleteDialog: React.FC<ResearchDeleteDialogProps> = ({ recordId, onDeleted }) => {
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteResult(recordId);
      toast.success('Research record deleted');
      onDeleted();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete record.';
      setDeleteError(message);
      toast.error('Failed to delete record', { description: message, duration: 8000 });
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1 pt-1">
      {deleteError && (
        <p className="text-xs text-destructive">{deleteError}</p>
      )}
      {confirmDelete ? (
        <div className="flex items-center gap-2">
          <span className="text-xs text-destructive">Delete this record?</span>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-none text-xs h-7 px-2.5 btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {deleting ? 'Deleting…' : 'Confirm delete'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmDelete(false)}
            className="rounded-none text-xs h-7 px-2.5 btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          className="rounded-none text-xs h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10 btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete record
        </Button>
      )}
    </div>
  );
};

export default ResearchDeleteDialog;
