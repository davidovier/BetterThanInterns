'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GripVertical, Trash2, Plus, Check, X, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type ProcessStep = {
  id: string;
  title: string;
  owner?: string | null;
  positionX: number;
  positionY: number;
};

type EditableStepListProps = {
  processId: string;
  steps: ProcessStep[];
  onStepsUpdate: (steps: ProcessStep[]) => void;
};

function SortableStepItem({
  step,
  isEditing,
  editValue,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onEditValueChange,
}: {
  step: ProcessStep;
  isEditing: boolean;
  editValue: string;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onDelete: () => void;
  onEditValueChange: (value: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-3 bg-card border border-border rounded-lg hover:border-brand-300 transition-colors group"
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
      >
        <GripVertical className="h-5 w-5" />
      </div>

      {/* Step Content */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              value={editValue}
              onChange={(e) => onEditValueChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSaveEdit();
                if (e.key === 'Escape') onCancelEdit();
              }}
              className="h-8"
              autoFocus
            />
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={onSaveEdit}>
              <Check className="h-4 w-4 text-green-600" />
            </Button>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={onCancelEdit}>
              <X className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">{step.title}</span>
            {step.owner && (
              <span className="text-xs text-muted-foreground truncate">by {step.owner}</span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      {!isEditing && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={onStartEdit}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

export function EditableStepList({ processId, steps: initialSteps, onStepsUpdate }: EditableStepListProps) {
  const [steps, setSteps] = useState<ProcessStep[]>(initialSteps);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newStepTitle, setNewStepTitle] = useState('');
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = steps.findIndex((s) => s.id === active.id);
    const newIndex = steps.findIndex((s) => s.id === over.id);

    const reorderedSteps = arrayMove(steps, oldIndex, newIndex);
    setSteps(reorderedSteps);

    // Call API to persist reorder
    try {
      const response = await fetch(`/api/processes/${processId}/steps/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepIds: reorderedSteps.map((s) => s.id),
        }),
      });

      if (!response.ok) throw new Error('Failed to reorder');

      const result = await response.json();
      if (result.ok && result.data.process) {
        onStepsUpdate(result.data.process.steps);
        toast({
          title: 'Steps reordered',
          description: 'Step order updated successfully',
        });
      }
    } catch (error) {
      toast({
        title: 'Reorder failed',
        description: 'Could not update step order',
        variant: 'destructive',
      });
      // Revert on error
      setSteps(initialSteps);
    }
  };

  const handleStartEdit = (step: ProcessStep) => {
    setEditingStepId(step.id);
    setEditValue(step.title);
  };

  const handleCancelEdit = () => {
    setEditingStepId(null);
    setEditValue('');
  };

  const handleSaveEdit = async () => {
    if (!editingStepId || !editValue.trim()) return;

    try {
      const response = await fetch(`/api/processes/${processId}/steps/${editingStepId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editValue }),
      });

      if (!response.ok) throw new Error('Failed to update');

      const result = await response.json();
      const updatedSteps = steps.map((s) =>
        s.id === editingStepId ? { ...s, title: editValue } : s
      );
      setSteps(updatedSteps);
      onStepsUpdate(updatedSteps);
      setEditingStepId(null);
      setEditValue('');

      toast({
        title: 'Step updated',
        description: 'Step name updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Update failed',
        description: 'Could not update step name',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (stepId: string) => {
    if (!confirm('Are you sure you want to delete this step?')) return;

    try {
      const response = await fetch(`/api/processes/${processId}/steps/${stepId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      const updatedSteps = steps.filter((s) => s.id !== stepId);
      setSteps(updatedSteps);
      onStepsUpdate(updatedSteps);

      toast({
        title: 'Step deleted',
        description: 'Step removed successfully',
      });
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: 'Could not delete step',
        variant: 'destructive',
      });
    }
  };

  const handleAddNew = async () => {
    if (!newStepTitle.trim()) return;

    try {
      const response = await fetch(`/api/processes/${processId}/steps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newStepTitle,
          positionX: 300,
          positionY: steps.length * 150,
        }),
      });

      if (!response.ok) throw new Error('Failed to create');

      const result = await response.json();
      if (result.ok && result.data.step) {
        const updatedSteps = [...steps, result.data.step];
        setSteps(updatedSteps);
        onStepsUpdate(updatedSteps);
        setNewStepTitle('');
        setIsAddingNew(false);

        toast({
          title: 'Step added',
          description: 'New step created successfully',
        });
      }
    } catch (error) {
      toast({
        title: 'Add failed',
        description: 'Could not create new step',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground">Process Steps</h3>
        <span className="text-xs text-muted-foreground">{steps.length} steps</span>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={steps.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {steps.map((step) => (
              <SortableStepItem
                key={step.id}
                step={step}
                isEditing={editingStepId === step.id}
                editValue={editValue}
                onStartEdit={() => handleStartEdit(step)}
                onCancelEdit={handleCancelEdit}
                onSaveEdit={handleSaveEdit}
                onDelete={() => handleDelete(step.id)}
                onEditValueChange={setEditValue}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add New Step */}
      {isAddingNew ? (
        <div className="flex items-center gap-2 p-3 bg-muted/50 border border-dashed border-border rounded-lg">
          <Input
            value={newStepTitle}
            onChange={(e) => setNewStepTitle(e.target.value)}
            placeholder="Enter step name..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddNew();
              if (e.key === 'Escape') {
                setIsAddingNew(false);
                setNewStepTitle('');
              }
            }}
            className="h-8"
            autoFocus
          />
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={handleAddNew}>
            <Check className="h-4 w-4 text-green-600" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={() => {
              setIsAddingNew(false);
              setNewStepTitle('');
            }}
          >
            <X className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setIsAddingNew(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Step
        </Button>
      )}
    </div>
  );
}
