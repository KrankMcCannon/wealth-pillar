"use client";

import * as React from "react";
import { Dialog, DialogPortal, DialogOverlay, DialogContent, DialogTitle, DialogDescription, DialogClose, DialogTrigger } from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const Drawer = Dialog;
const DrawerTrigger = DialogTrigger;
const DrawerClose = DialogClose;
const DrawerTitle = DialogTitle;
const DrawerDescription = DialogDescription;

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DialogContent>,
  React.ComponentPropsWithoutRef<typeof DialogContent>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay asChild>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60"
      />
    </DialogOverlay>
    <DialogContent
      ref={ref}
      asChild
      {...props}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-3xl border border-primary/20 bg-card/95 liquid-glass-strong",
          className
        )}
      >
        <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-primary/40" />
        {children}
      </motion.div>
    </DialogContent>
  </DialogPortal>
));
DrawerContent.displayName = "DrawerContent";

const DrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("grid gap-1.5 p-4 text-center sm:text-left", className)}
    {...props}
  />
);
DrawerHeader.displayName = "DrawerHeader";

const DrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("mt-auto flex flex-col gap-2 p-4", className)}
    {...props}
  />
);
DrawerFooter.displayName = "DrawerFooter";

export {
  Drawer,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
};
