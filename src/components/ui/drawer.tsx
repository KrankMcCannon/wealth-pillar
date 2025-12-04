"use client";

import * as React from "react";
import { Dialog, DialogPortal, DialogOverlay, DialogContent, DialogTitle, DialogDescription, DialogClose, DialogTrigger } from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import { cn } from '@/src/lib';
import { drawerStyles } from "@/styles/system";

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
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn(
          drawerStyles.content,
          className
        )}
      >
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
    className={cn(drawerStyles.header, className)}
    {...props}
  />
);
DrawerHeader.displayName = "DrawerHeader";

const DrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(drawerStyles.footer, className)}
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
