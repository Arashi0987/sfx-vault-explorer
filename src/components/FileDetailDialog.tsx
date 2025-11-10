import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Music, 
  Clock, 
  FolderOpen, 
  FileText, 
  Calendar,
  Hash,
  X,
  Plus,
  Save
} from "lucide-react";
import type { SFXFile } from "@/lib/api";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface FileDetailDialogProps {
  file: SFXFile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function FileDetailDialog({ 
  file, 
  open, 
  onOpenChange,
  onUpdate 
}: FileDetailDialogProps) {
  const [notes, setNotes] = useState(file?.notes || "");
  const [newTag, setNewTag] = useState("");
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!file) return null;

  const handleSaveNotes = async () => {
    setIsSaving(true);
    try {
      await api.updateNotes(file.id, notes);
      toast.success("Notes updated successfully");
      setIsEditingNotes(false);
      onUpdate();
    } catch (error) {
      toast.error("Failed to update notes");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTag = async () => {
    if (!newTag.trim()) return;
    
    try {
      await api.addTags(file.id, [newTag.trim()]);
      toast.success(`Tag "${newTag}" added`);
      setNewTag("");
      onUpdate();
    } catch (error) {
      toast.error("Failed to add tag");
    }
  };

  const handleRemoveTag = async (tag: string) => {
    try {
      await api.removeTags(file.id, [tag]);
      toast.success(`Tag "${tag}" removed`);
      onUpdate();
    } catch (error) {
      toast.error("Failed to remove tag");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="h-5 w-5 text-primary" />
            {file.filename}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-8rem)] pr-4">
          <div className="space-y-6">
            {/* File Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Duration
                </Label>
                <p className="text-sm font-medium">{file.length}</p>
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <FolderOpen className="h-3 w-3" />
                  Project
                </Label>
                <p className="text-sm font-medium">{file.project}</p>
              </div>
              
              <div className="space-y-1 col-span-2">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  File Path
                </Label>
                <p className="text-xs font-mono break-all text-muted-foreground">
                  {file.filepath}
                </p>
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Created
                </Label>
                <p className="text-xs">
                  {new Date(file.created_at).toLocaleDateString()}
                </p>
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  Checksum
                </Label>
                <p className="text-xs font-mono truncate" title={file.checksum}>
                  {file.checksum.slice(0, 12)}...
                </p>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Tags</Label>
              <div className="flex flex-wrap gap-2">
                {file.tags.map((tag) => (
                  <Badge 
                    key={tag} 
                    variant="secondary"
                    className="gap-1 pr-1"
                  >
                    {tag}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-4 w-4 hover:bg-destructive/20"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Add new tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                />
                <Button 
                  onClick={handleAddTag}
                  size="icon"
                  disabled={!newTag.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Notes</Label>
                {!isEditingNotes && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsEditingNotes(true);
                      setNotes(file.notes || "");
                    }}
                  >
                    Edit
                  </Button>
                )}
              </div>
              
              {isEditingNotes ? (
                <div className="space-y-2">
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes or attribution..."
                    rows={4}
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsEditingNotes(false);
                        setNotes(file.notes || "");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveNotes}
                      disabled={isSaving}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {file.notes || "No notes added"}
                </p>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
