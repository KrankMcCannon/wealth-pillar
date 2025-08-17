import { useState, useEffect, useCallback } from 'react';
import type { GroupWithMemberCount } from '../../../lib/supabase/services/groups.service';

/**
 * Hook that encapsulates the state and handlers for managing group settings.
 * It abstracts away the logic for editing a group's name/description, saving
 * changes, cancelling edits, and confirming deletion. Components using this
 * hook can focus purely on rendering the UI.
 */
export const useGroupSettings = (
  group: GroupWithMemberCount | null,
  onUpdateGroup: (updates: { name?: string; description?: string }) => void,
  onDeleteGroup: () => void
) => {
  // Whether the form is in editing mode
  const [isEditing, setIsEditing] = useState(false);
  // Form data for name and description
  const [formData, setFormData] = useState({
    name: group?.name || '',
    description: group?.description || '',
  });
  // Confirmation modal for deletion
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Sync formData when group changes
  useEffect(() => {
    if (group) {
      setFormData({
        name: group.name,
        description: group.description || '',
      });
    }
  }, [group]);

  /**
   * Persist changes to the group. Trims whitespace and only submits if name
   * is not empty. After saving, editing mode is disabled.
   */
  const handleSave = useCallback(() => {
    if (!formData.name.trim()) return;
    onUpdateGroup({
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
    });
    setIsEditing(false);
  }, [formData, onUpdateGroup]);

  /**
   * Reset form data to the group's current values and exit editing mode.
   */
  const handleCancel = useCallback(() => {
    setFormData({
      name: group?.name || '',
      description: group?.description || '',
    });
    setIsEditing(false);
  }, [group]);

  /**
   * Call the provided deletion handler and hide the delete confirmation modal.
   */
  const handleDelete = useCallback(() => {
    onDeleteGroup();
    setShowDeleteConfirm(false);
  }, [onDeleteGroup]);

  return {
    isEditing,
    setIsEditing,
    formData,
    setFormData,
    showDeleteConfirm,
    setShowDeleteConfirm,
    handleSave,
    handleCancel,
    handleDelete,
  };
};