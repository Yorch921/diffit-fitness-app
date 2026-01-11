'use client'

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export interface ExerciseSet {
  setNumber: number
  minReps: number
  maxReps: number
}

export interface Exercise {
  id: string
  name: string
  description: string | null
  videoUrl: string | null
  targetSets: string | null
  trainerComment: string | null
  order: number
  sets: ExerciseSet[]
}

interface SortableExerciseItemProps {
  exercise: Exercise
  index: number
  onEdit: (exercise: Exercise) => void
  onDelete: (exerciseId: string) => void
}

function SortableExerciseItem({ exercise, index, onEdit, onDelete }: SortableExerciseItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: exercise.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                <span
                  {...attributes}
                  {...listeners}
                  className="cursor-move text-gray-400 hover:text-gray-600 select-none"
                  title="Arrastra para reordenar"
                >
                  ☰
                </span>
                <span className="text-gray-500">#{index + 1}</span>
                {exercise.name}
              </CardTitle>
              {/* Mostrar series estructuradas */}
              {exercise.sets && exercise.sets.length > 0 && (
                <CardDescription className="mt-2">
                  <strong>Series objetivo:</strong>
                  {exercise.sets.map((set) => (
                    <span key={set.setNumber} className="ml-2">
                      S{set.setNumber}: {set.minReps}-{set.maxReps} reps
                    </span>
                  ))}
                </CardDescription>
              )}
              {/* Fallback a targetSets si no hay sets estructurados */}
              {(!exercise.sets || exercise.sets.length === 0) && exercise.targetSets && (
                <CardDescription className="mt-2">
                  <strong>Series objetivo:</strong> {exercise.targetSets}
                </CardDescription>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(exercise)
                }}
              >
                Editar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(exercise.id)
                }}
              >
                Eliminar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {exercise.description && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">
                Explicación técnica:
              </h4>
              <p className="text-gray-600 text-sm whitespace-pre-wrap">
                {exercise.description}
              </p>
            </div>
          )}

          {exercise.videoUrl && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">
                Vídeo de referencia:
              </h4>
              <a
                href={exercise.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm underline"
              >
                {exercise.videoUrl}
              </a>
            </div>
          )}

          {exercise.trainerComment && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-1">
                💬 Comentario del entrenador:
              </h4>
              <p className="text-blue-700 text-sm whitespace-pre-wrap">
                {exercise.trainerComment}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

interface SortableExerciseListProps {
  exercises: Exercise[]
  sessionId: string
  onReorder: (exercises: Exercise[]) => void
  onEdit: (exercise: Exercise) => void
  onDelete: (exerciseId: string) => void
}

export default function SortableExerciseList({
  exercises,
  sessionId,
  onReorder,
  onEdit,
  onDelete,
}: SortableExerciseListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = exercises.findIndex((ex) => ex.id === active.id)
    const newIndex = exercises.findIndex((ex) => ex.id === over.id)

    const newOrder = arrayMove(exercises, oldIndex, newIndex)

    // Actualizar UI optimistamente
    onReorder(newOrder)

    // Persistir en el backend
    try {
      await fetch(`/api/admin/training-sessions/${sessionId}/exercises/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exerciseIds: newOrder.map((ex) => ex.id) }),
      })
    } catch (error) {
      console.error('Error reordering exercises:', error)
      // Revertir en caso de error
      onReorder(exercises)
    }
  }

  if (exercises.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💪</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay ejercicios en esta sesión
            </h3>
            <p className="text-gray-600">
              Agrega ejercicios para comenzar a construir el plan de entrenamiento
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={exercises.map((ex) => ex.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-4">
          {exercises.map((exercise, index) => (
            <SortableExerciseItem
              key={exercise.id}
              exercise={exercise}
              index={index}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
