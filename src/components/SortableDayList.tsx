'use client'

import { useState, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface TemplateDay {
  id: string
  name: string
  description: string | null
  order: number
  exercises: any[]
}

interface SortableDayItemProps {
  day: TemplateDay
  index: number
  templateId: string
  editingDay: string | null
  editDayForm: { name: string; description: string }
  loading: boolean
  addingExercise: string | null
  editingExercise: string | null
  editExerciseForm: any
  newExercise: any
  onEditDay: (day: TemplateDay) => void
  onUpdateDay: (dayId: string) => void
  onCancelEditDay: () => void
  onDeleteDay: (dayId: string) => void
  onAddExercise: (dayId: string) => void
  onCancelAddExercise: () => void
  onSubmitAddExercise: (dayId: string) => void
  onEditExercise: (exercise: any) => void
  onUpdateExercise: (exerciseId: string) => void
  onCancelEditExercise: () => void
  onDeleteExercise: (exerciseId: string) => void
  setEditDayForm: (form: any) => void
  setNewExercise: (exercise: any) => void
  setEditExerciseForm: (form: any) => void
  addSetToNewExercise: () => void
  addSetToEditExercise: () => void
  removeSetFromEditExercise: (index: number) => void
}

function SortableDayItem({
  day,
  index,
  templateId,
  editingDay,
  editDayForm,
  loading,
  addingExercise,
  editingExercise,
  editExerciseForm,
  newExercise,
  onEditDay,
  onUpdateDay,
  onCancelEditDay,
  onDeleteDay,
  onAddExercise,
  onCancelAddExercise,
  onSubmitAddExercise,
  onEditExercise,
  onUpdateExercise,
  onCancelEditExercise,
  onDeleteExercise,
  setEditDayForm,
  setNewExercise,
  setEditExerciseForm,
  addSetToNewExercise,
  addSetToEditExercise,
  removeSetFromEditExercise,
}: SortableDayItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: day.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          {editingDay === day.id ? (
            <div className="space-y-4">
              <CardTitle>Editar Día</CardTitle>
              <div>
                <Label>Nombre del Día *</Label>
                <Input
                  value={editDayForm.name}
                  onChange={(e) => setEditDayForm({ ...editDayForm, name: e.target.value })}
                  placeholder="Ej: Día 1 - Pecho y Tríceps"
                />
              </div>
              <div>
                <Label>Descripción</Label>
                <Textarea
                  value={editDayForm.description}
                  onChange={(e) => setEditDayForm({ ...editDayForm, description: e.target.value })}
                  placeholder="Descripción del enfoque del día..."
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onCancelEditDay} disabled={loading}>
                  Cancelar
                </Button>
                <Button onClick={() => onUpdateDay(day.id)} disabled={loading || !editDayForm.name}>
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <span
                    {...attributes}
                    {...listeners}
                    className="cursor-move text-gray-400 hover:text-gray-600 select-none text-xl"
                    title="Arrastra para reordenar"
                  >
                    ☰
                  </span>
                  <div className="flex-1">
                    <CardTitle>{day.name}</CardTitle>
                    {day.description && <CardDescription>{day.description}</CardDescription>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => onEditDay(day)}>
                    Editar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onDeleteDay(day.id)}>
                    Eliminar
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Exercises List */}
            {day.exercises.length > 0 ? (
              <div className="space-y-3">
                {day.exercises.map((exercise: any, idx: number) => (
                  <div key={exercise.id} className="border rounded-lg p-4">
                    {editingExercise === exercise.id ? (
                      <div className="space-y-3">
                        <h5 className="font-medium">Editar Ejercicio</h5>
                        <div>
                          <Label>Nombre del Ejercicio *</Label>
                          <Input
                            value={editExerciseForm.name}
                            onChange={(e) =>
                              setEditExerciseForm({ ...editExerciseForm, name: e.target.value })
                            }
                            placeholder="Ej: Press de Banca"
                          />
                        </div>
                        <div>
                          <Label>Descripción Técnica</Label>
                          <Textarea
                            value={editExerciseForm.description}
                            onChange={(e) =>
                              setEditExerciseForm({ ...editExerciseForm, description: e.target.value })
                            }
                            placeholder="Explicación de la ejecución correcta..."
                            rows={2}
                          />
                        </div>
                        <div>
                          <Label>URL del Vídeo (YouTube)</Label>
                          <Input
                            value={editExerciseForm.videoUrl}
                            onChange={(e) =>
                              setEditExerciseForm({ ...editExerciseForm, videoUrl: e.target.value })
                            }
                            placeholder="https://youtube.com/watch?v=..."
                          />
                        </div>
                        <div>
                          <Label>Comentario del Entrenador</Label>
                          <Input
                            value={editExerciseForm.trainerComment}
                            onChange={(e) =>
                              setEditExerciseForm({ ...editExerciseForm, trainerComment: e.target.value })
                            }
                            placeholder="Puntos clave, enfoque..."
                          />
                        </div>
                        <div>
                          <Label className="mb-2 block">Series</Label>
                          {editExerciseForm.sets.map((set: any, setIdx: number) => (
                            <div key={setIdx} className="flex gap-2 mb-2">
                              <Input
                                type="number"
                                min="1"
                                placeholder="Min reps"
                                value={set.minReps}
                                onChange={(e) => {
                                  const updated = [...editExerciseForm.sets]
                                  const val = parseInt(e.target.value, 10)
                                  updated[setIdx].minReps = isNaN(val) ? 1 : Math.max(1, val)
                                  setEditExerciseForm({ ...editExerciseForm, sets: updated })
                                }}
                                className="w-24"
                              />
                              <Input
                                type="number"
                                min="1"
                                placeholder="Max reps"
                                value={set.maxReps}
                                onChange={(e) => {
                                  const updated = [...editExerciseForm.sets]
                                  const val = parseInt(e.target.value, 10)
                                  updated[setIdx].maxReps = isNaN(val) ? 1 : Math.max(1, val)
                                  setEditExerciseForm({ ...editExerciseForm, sets: updated })
                                }}
                                className="w-24"
                              />
                              <Input
                                type="number"
                                min="0"
                                placeholder="Descanso (s)"
                                value={set.restSeconds}
                                onChange={(e) => {
                                  const updated = [...editExerciseForm.sets]
                                  const val = parseInt(e.target.value, 10)
                                  updated[setIdx].restSeconds = isNaN(val) ? 0 : Math.max(0, val)
                                  setEditExerciseForm({ ...editExerciseForm, sets: updated })
                                }}
                                className="w-32"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeSetFromEditExercise(setIdx)}
                                className="text-red-600"
                              >
                                ✕
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addSetToEditExercise}
                            className="mt-2"
                          >
                            + Agregar Serie
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={onCancelEditExercise} disabled={loading}>
                            Cancelar
                          </Button>
                          <Button
                            onClick={() => onUpdateExercise(exercise.id)}
                            disabled={loading || !editExerciseForm.name}
                          >
                            {loading ? 'Guardando...' : 'Guardar Cambios'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {idx + 1}. {exercise.name}
                          </h4>
                          {exercise.description && (
                            <p className="text-sm text-gray-600 mt-1">{exercise.description}</p>
                          )}
                          {exercise.trainerComment && (
                            <p className="text-sm text-blue-600 mt-1 italic">
                              💬 {exercise.trainerComment}
                            </p>
                          )}
                          {exercise.videoUrl && (
                            <p className="text-sm text-purple-600 mt-1">
                              🎥{' '}
                              <a
                                href={exercise.videoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline hover:text-purple-700"
                              >
                                Ver vídeo de ejemplo
                              </a>
                            </p>
                          )}
                          <div className="mt-2 space-y-1">
                            {exercise.sets.map((set: any) => (
                              <div key={set.id} className="text-sm text-gray-700">
                                <span className="font-medium">Serie {set.setNumber}:</span> de{' '}
                                {set.minReps} a {set.maxReps} reps
                                {set.restSeconds && (
                                  <span className="text-gray-500"> y {set.restSeconds}s de descanso</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEditExercise(exercise)}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDeleteExercise(exercise.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">Sin ejercicios aún</p>
            )}

            {/* Add Exercise Button/Form */}
            {addingExercise === day.id ? (
              <div className="border-2 border-dashed border-blue-300 rounded-lg p-4">
                <h5 className="font-medium mb-4">Nuevo Ejercicio</h5>
                <div className="space-y-3">
                  <div>
                    <Label>Nombre del Ejercicio *</Label>
                    <Input
                      value={newExercise.name}
                      onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                      placeholder="Ej: Press de Banca"
                    />
                  </div>
                  <div>
                    <Label>Descripción Técnica</Label>
                    <Textarea
                      value={newExercise.description}
                      onChange={(e) => setNewExercise({ ...newExercise, description: e.target.value })}
                      placeholder="Explicación de la ejecución correcta..."
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label>URL del Vídeo (YouTube)</Label>
                    <Input
                      value={newExercise.videoUrl}
                      onChange={(e) => setNewExercise({ ...newExercise, videoUrl: e.target.value })}
                      placeholder="https://youtube.com/watch?v=..."
                    />
                  </div>
                  <div>
                    <Label>Comentario del Entrenador</Label>
                    <Input
                      value={newExercise.trainerComment}
                      onChange={(e) =>
                        setNewExercise({ ...newExercise, trainerComment: e.target.value })
                      }
                      placeholder="Puntos clave, enfoque..."
                    />
                  </div>

                  {/* Sets Configuration */}
                  <div>
                    <Label className="mb-2 block">Series</Label>
                    {newExercise.sets.map((set: any, idx: number) => (
                      <div key={idx} className="flex gap-2 mb-2">
                        <Input
                          type="number"
                          placeholder="Min reps"
                          value={set.minReps}
                          onChange={(e) => {
                            const updated = [...newExercise.sets]
                            updated[idx].minReps = parseInt(e.target.value) || 0
                            setNewExercise({ ...newExercise, sets: updated })
                          }}
                          className="w-24"
                        />
                        <Input
                          type="number"
                          placeholder="Max reps"
                          value={set.maxReps}
                          onChange={(e) => {
                            const updated = [...newExercise.sets]
                            updated[idx].maxReps = parseInt(e.target.value) || 0
                            setNewExercise({ ...newExercise, sets: updated })
                          }}
                          className="w-24"
                        />
                        <Input
                          type="number"
                          placeholder="Descanso (s)"
                          value={set.restSeconds}
                          onChange={(e) => {
                            const updated = [...newExercise.sets]
                            updated[idx].restSeconds = parseInt(e.target.value) || 0
                            setNewExercise({ ...newExercise, sets: updated })
                          }}
                          className="w-32"
                        />
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addSetToNewExercise}
                      className="mt-2"
                    >
                      + Agregar Serie
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={onCancelAddExercise} disabled={loading}>
                      Cancelar
                    </Button>
                    <Button
                      onClick={() => onSubmitAddExercise(day.id)}
                      disabled={loading || !newExercise.name}
                    >
                      {loading ? 'Agregando...' : 'Agregar Ejercicio'}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <Button variant="outline" onClick={() => onAddExercise(day.id)} className="w-full">
                + Agregar Ejercicio
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface SortableDayListProps {
  days: TemplateDay[]
  templateId: string
  editingDay: string | null
  editDayForm: { name: string; description: string }
  loading: boolean
  addingExercise: string | null
  editingExercise: string | null
  editExerciseForm: any
  newExercise: any
  onEditDay: (day: TemplateDay) => void
  onUpdateDay: (dayId: string) => void
  onCancelEditDay: () => void
  onDeleteDay: (dayId: string) => void
  onAddExercise: (dayId: string) => void
  onCancelAddExercise: () => void
  onSubmitAddExercise: (dayId: string) => void
  onEditExercise: (exercise: any) => void
  onUpdateExercise: (exerciseId: string) => void
  onCancelEditExercise: () => void
  onDeleteExercise: (exerciseId: string) => void
  onReorder: (days: TemplateDay[]) => void
  setEditDayForm: (form: any) => void
  setNewExercise: (exercise: any) => void
  setEditExerciseForm: (form: any) => void
  addSetToNewExercise: () => void
  addSetToEditExercise: () => void
  removeSetFromEditExercise: (index: number) => void
}

export default function SortableDayList({
  days,
  templateId,
  editingDay,
  editDayForm,
  loading,
  addingExercise,
  editingExercise,
  editExerciseForm,
  newExercise,
  onEditDay,
  onUpdateDay,
  onCancelEditDay,
  onDeleteDay,
  onAddExercise,
  onCancelAddExercise,
  onSubmitAddExercise,
  onEditExercise,
  onUpdateExercise,
  onCancelEditExercise,
  onDeleteExercise,
  onReorder,
  setEditDayForm,
  setNewExercise,
  setEditExerciseForm,
  addSetToNewExercise,
  addSetToEditExercise,
  removeSetFromEditExercise,
}: SortableDayListProps) {
  const [localDays, setLocalDays] = useState(days)

  // Sincronizar estado local cuando las props cambian (después de router.refresh())
  useEffect(() => {
    setLocalDays(days)
  }, [days])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const oldIndex = localDays.findIndex((d) => d.id === active.id)
    const newIndex = localDays.findIndex((d) => d.id === over.id)

    const newOrder = arrayMove(localDays, oldIndex, newIndex)
    setLocalDays(newOrder)
    onReorder(newOrder)

    // Persistir en backend
    try {
      await fetch(`/api/admin/training-templates/${templateId}/days/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayOrders: newOrder.map((d, idx) => ({ id: d.id, order: idx + 1 })),
        }),
      })
    } catch (error) {
      console.error('Error reordering days:', error)
      // Revertir en caso de error
      setLocalDays(days)
      onReorder(days)
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={localDays.map((d) => d.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-6">
          {localDays.map((day, index) => (
            <SortableDayItem
              key={day.id}
              day={day}
              index={index}
              templateId={templateId}
              editingDay={editingDay}
              editDayForm={editDayForm}
              loading={loading}
              addingExercise={addingExercise}
              editingExercise={editingExercise}
              editExerciseForm={editExerciseForm}
              newExercise={newExercise}
              onEditDay={onEditDay}
              onUpdateDay={onUpdateDay}
              onCancelEditDay={onCancelEditDay}
              onDeleteDay={onDeleteDay}
              onAddExercise={onAddExercise}
              onCancelAddExercise={onCancelAddExercise}
              onSubmitAddExercise={onSubmitAddExercise}
              onEditExercise={onEditExercise}
              onUpdateExercise={onUpdateExercise}
              onCancelEditExercise={onCancelEditExercise}
              onDeleteExercise={onDeleteExercise}
              setEditDayForm={setEditDayForm}
              setNewExercise={setNewExercise}
              setEditExerciseForm={setEditExerciseForm}
              addSetToNewExercise={addSetToNewExercise}
              addSetToEditExercise={addSetToEditExercise}
              removeSetFromEditExercise={removeSetFromEditExercise}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
