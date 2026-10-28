"use client";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { HomeDesign } from "@/lib/design";
import { focusKindLabel, focusTitle } from "@/lib/focus";

export function PickDialog({
  design,
  targetKey,
  onOpenChange,
}: {
  design: HomeDesign;
  targetKey: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const title = targetKey ? focusTitle(design, targetKey) : "Seçim";
  const kind = targetKey ? focusKindLabel(targetKey) : "Öge";

  return (
    <Dialog open={targetKey !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {kind} onaylansın mı? Bu yalnızca önizlemedir. Google TV’deki
            uygulama buradan açılmaz.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Vazgeç
          </Button>
          <Button
            type="button"
            onClick={() => {
              toast.success(`${title} seçildi`, {
                description:
                  "Önizleme onaylandı. Google TV ana sayfası yerinde kaldı.",
              });
              onOpenChange(false);
            }}
          >
            Onayla
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
