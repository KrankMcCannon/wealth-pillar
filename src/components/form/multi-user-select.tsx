"use client";

/**
 * MultiUserSelect Component
 *
 * Allows selection of multiple users via checkboxes.
 * Each user is displayed with their avatar color and name.
 * Always maintains at least the current user selected.
 */

import type { User } from "@/lib/types";
import { Checkbox } from "@/components/ui";
import { cn } from "@/lib/utils";
import { formStyles, getMultiUserAvatarStyle } from "./theme/form-styles";

interface MultiUserSelectProps {
  /**
   * Array of selected user IDs
   */
  value: string[];

  /**
   * Callback when selection changes
   */
  onChange: (value: string[]) => void;

  /**
   * All available users to select from
   */
  users: User[];

  /**
   * Current user ID (always kept selected)
   */
  currentUserId: string;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * MultiUserSelect - Multi-user selection with checkboxes
 *
 * @example
 * ```tsx
 * <MultiUserSelect
 *   value={formData.user_ids}
 *   onChange={(value) => setFormData({ ...formData, user_ids: value })}
 *   users={groupUsers}
 *   currentUserId={currentUser.id}
 * />
 * ```
 */
export function MultiUserSelect({
  value,
  onChange,
  users,
  currentUserId,
  className,
}: Readonly<MultiUserSelectProps>) {
  /**
   * Toggle user selection
   * Always maintains at least the current user selected
   */
  const handleToggle = (userId: string) => {
    if (value.includes(userId)) {
      // Remove user
      const newValue = value.filter(id => id !== userId);

      // Keep at least current user selected
      if (newValue.length === 0) {
        onChange([currentUserId]);
      } else {
        onChange(newValue);
      }
    } else {
      // Add user
      onChange([...value, userId]);
    }
  };

  return (
    <div className={cn(formStyles.multiUser.container, className)}>
      {users.map((user) => (
        <label
          key={user.id}
          className={cn(
            formStyles.multiUser.row,
            value.includes(user.id) && formStyles.multiUser.rowActive
          )}
        >
          <Checkbox
            checked={value.includes(user.id)}
            onCheckedChange={() => handleToggle(user.id)}
          />
          <div className={formStyles.multiUser.userRow}>
            {/* User avatar */}
            <div
              className={formStyles.multiUser.avatar}
              style={getMultiUserAvatarStyle(user.theme_color || undefined)}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>

            {/* User name */}
            <span className={formStyles.multiUser.name}>
              {user.name}
            </span>

            {/* Current user indicator */}
            {user.id === currentUserId && (
              <span className={formStyles.multiUser.current}>(Tu)</span>
            )}
          </div>
        </label>
      ))}
    </div>
  );
}
