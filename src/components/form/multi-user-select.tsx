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
}: MultiUserSelectProps) {
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
    <div className={cn("space-y-2 border border-border rounded-lg p-3", className)}>
      {users.map((user) => (
        <label
          key={user.id}
          className={cn(
            "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
            "hover:bg-muted/50",
            value.includes(user.id) && "bg-primary/5"
          )}
        >
          <Checkbox
            checked={value.includes(user.id)}
            onCheckedChange={() => handleToggle(user.id)}
          />
          <div className="flex items-center gap-2 flex-1">
            {/* User avatar */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white"
              style={{ backgroundColor: user.theme_color }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>

            {/* User name */}
            <span className="text-sm font-medium">
              {user.name}
            </span>

            {/* Current user indicator */}
            {user.id === currentUserId && (
              <span className="text-xs text-muted-foreground">(Tu)</span>
            )}
          </div>
        </label>
      ))}
    </div>
  );
}
