import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@goal-tracker/ui/components/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@goal-tracker/ui/components/drawer';
import type { ReactNode } from 'react';

import { useDesktopLayout } from './use-desktop-layout';

export function ResponsiveOverlay({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description: ReactNode;
  children: ReactNode;
  footer: ReactNode;
}) {
  const desktop = useDesktopLayout();
  if (desktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="max-h-[90dvh] max-w-[480px] overflow-y-auto"
          showCloseButton={false}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          {children}
          <DialogFooter>{footer}</DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-h-[92dvh] max-w-[390px] rounded-t-[22px] border-border bg-raised shadow-sheet">
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        {children}
        <DrawerFooter>{footer}</DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
