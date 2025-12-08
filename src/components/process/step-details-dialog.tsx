'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ProcessStep } from '@/types/process';

type StepDetailsDialogProps = {
  step: ProcessStep;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (stepId: string, updates: any) => Promise<void>;
};

export function StepDetailsDialog({
  step,
  isOpen,
  onClose,
  onUpdate,
}: StepDetailsDialogProps) {
  const [title, setTitle] = useState(step.title);
  const [description, setDescription] = useState(step.description || '');
  const [owner, setOwner] = useState(step.owner || '');
  const [frequency, setFrequency] = useState(step.frequency || '');
  const [duration, setDuration] = useState(step.duration || '');
  const [inputsText, setInputsText] = useState(step.inputs.join(', '));
  const [outputsText, setOutputsText] = useState(step.outputs.join(', '));
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setTitle(step.title);
    setDescription(step.description || '');
    setOwner(step.owner || '');
    setFrequency(step.frequency || '');
    setDuration(step.duration || '');
    setInputsText(step.inputs.join(', '));
    setOutputsText(step.outputs.join(', '));
  }, [step]);

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const updates = {
        title,
        description: description || undefined,
        owner: owner || undefined,
        frequency: frequency || undefined,
        duration: duration || undefined,
        inputs: inputsText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        outputs: outputsText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      };

      await onUpdate(step.id, updates);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Step</DialogTitle>
          <DialogDescription>
            Update the details of this process step
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Step Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Receive invoice by email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What happens in this step?"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="owner">Owner / Role</Label>
              <Input
                id="owner"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="e.g., Accounts Payable"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Input
                id="frequency"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                placeholder="e.g., Daily, Weekly"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration</Label>
            <Input
              id="duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="e.g., 5 minutes, 2 hours"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="inputs">Inputs (comma-separated)</Label>
            <Input
              id="inputs"
              value={inputsText}
              onChange={(e) => setInputsText(e.target.value)}
              placeholder="e.g., Email notification, PDF attachment"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="outputs">Outputs (comma-separated)</Label>
            <Input
              id="outputs"
              value={outputsText}
              onChange={(e) => setOutputsText(e.target.value)}
              placeholder="e.g., Updated spreadsheet, Approval request"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
