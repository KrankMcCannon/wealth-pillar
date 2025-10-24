"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { cn } from '@/src/lib';

/**
 * Popover Component
 *
 * Floating content component built on Radix UI Popover primitive.
 * Provides accessible, dismissible overlays for contextual content.
 *
 * Features:
 * - Collision detection and auto-positioning
 * - Smooth animations (fade + zoom + slide)
 * - Keyboard accessible (Esc to close)
 * - Click outside to dismiss
 * - Focus management
 * - Portal rendering (prevents overflow issues)
 *
 * Best Practices:
 * - Use `collisionPadding` prop to ensure popover stays within viewport
 * - Wrap scrollable content in ScrollArea component for better UX
 * - Set explicit width on PopoverContent for consistent sizing
 * - Use `sideOffset` to add spacing between trigger and content
 *
 * @example
 * ```tsx
 * <Popover>
 *   <PopoverTrigger asChild>
 *     <Button>Open</Button>
 *   </PopoverTrigger>
 *   <PopoverContent className="w-80">
 *     <ScrollArea className="max-h-[300px]">
 *       Content here
 *     </ScrollArea>
 *   </PopoverContent>
 * </Popover>
 * ```
 */

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverAnchor = PopoverPrimitive.Anchor

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        // Base styles
        "z-50 rounded-2xl border border-primary/20 bg-popover text-popover-foreground shadow-lg outline-none",
        // Max dimensions to prevent overflow
        "max-w-[calc(100vw-2rem)] max-h-[calc(100vh-4rem)]",
        // Animations
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        // Slide animations based on side
        "data-[side=bottom]:slide-in-from-top-2",
        "data-[side=left]:slide-in-from-right-2",
        "data-[side=right]:slide-in-from-left-2",
        "data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor }
