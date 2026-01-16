'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'
import SortableDayList from '@/components/SortableDayList'

interface TemplateEditorProps {
  template: any
  hideHeader?: boolean
}

export default function TemplateEditor({ template, hideHeader = false }: TemplateEditorProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editingBasicInfo, setEditingBasicInfo] = useState(false)
  const [addingDay, setAddingDay] = useState(false)
  const [addingExercise, setAddingExercise] = useState<string | null>(null)

  // Edit states
  const [editingDay, setEditingDay] = useState<string | null>(null)
  const [editingExercise, setEditingExercise] = useState<string | null>(null)

  // Local days state for drag & drop
  const [localDays, setLocalDays] = useState(template.days)

  const [basicInfo, setBasicInfo] = useState({
    title: template.title,
    description: template.description || '',
    trainerNotes: template.trainerNotes || '',
  })

  const [newDay, setNewDay] = useState({
    dayNumber: template.days.length + 1,
    name: '',
    description: '',
  })

  const [newExercise, setNewExercise] = useState({
    name: '',
    description: '',
    videoUrl: '',
    trainerComment: '',
    sets: [{ setNumber: 1, minReps: 8, maxReps: 12, restSeconds: 90 }],
  })

  // Edit form states
  const [editDayForm, setEditDayForm] = useState({
    name: '',
    description: '',
  })

  const [editExerciseForm, setEditExerciseForm] = useState({
    name: '',
    description: '',
    videoUrl: '',
    trainerComment: '',
    sets: [{ setNumber: 1, minReps: 8, maxReps: 12, restSeconds: 90 }],
  })

  const handleUpdateBasicInfo = async () => {
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`/api/admin/training-templates/${template.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(basicInfo),
      })

      if (response.ok) {
        setEditingBasicInfo(false)
        router.refresh()
      } else {
        const data = await response.json()
        setError(data.error || 'Error al actualizar')
      }
    } catch (error) {
      setError('Error al actualizar')
    } finally {
      setLoading(false)
    }
  }

  const handleAddDay = async () => {
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`/api/admin/training-templates/${template.id}/days`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newDay,
          order: newDay.dayNumber,
        }),
      })

      if (response.ok) {
        setAddingDay(false)
        setNewDay({
          dayNumber: template.days.length + 2,
          name: '',
          description: '',
        })
        router.refresh()
      } else {
        const data = await response.json()
        setError(data.error || 'Error al agregar día')
      }
    } catch (error) {
      setError('Error al agregar día')
    } finally {
      setLoading(false)
    }
  }

  const handleAddExercise = async (dayId: string) => {
    setError('')
    setLoading(true)

    try {
      const response = await fetch(
        `/api/admin/training-templates/${template.id}/days/${dayId}/exercises`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newExercise),
        }
      )

      if (response.ok) {
        setAddingExercise(null)
        setNewExercise({
          name: '',
          description: '',
          videoUrl: '',
          trainerComment: '',
          sets: [{ setNumber: 1, minReps: 8, maxReps: 12, restSeconds: 90 }],
        })
        router.refresh()
      } else {
        const data = await response.json()
        setError(data.error || 'Error al agregar ejercicio')
      }
    } catch (error) {
      setError('Error al agregar ejercicio')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteExercise = async (exerciseId: string) => {
    if (!confirm('¿Seguro que quieres eliminar este ejercicio?')) return

    try {
      const response = await fetch(`/api/admin/exercises/${exerciseId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.refresh()
      } else {
        const data = await response.json()
        alert(data.error || 'Error al eliminar')
      }
    } catch (error) {
      alert('Error al eliminar ejercicio')
    }
  }

  const addSetToNewExercise = () => {
    setNewExercise({
      ...newExercise,
      sets: [
        ...newExercise.sets,
        {
          setNumber: newExercise.sets.length + 1,
          minReps: 8,
          maxReps: 12,
          restSeconds: 90,
        },
      ],
    })
  }

  // Edit day handlers
  const handleUpdateDay = async (dayId: string) => {
    setError('')
    setLoading(true)

    try {
      const response = await fetch(
        `/api/admin/training-templates/${template.id}/days/${dayId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: editDayForm.name,
            description: editDayForm.description,
          }),
        }
      )

      if (response.ok) {
        setEditingDay(null)
        router.refresh()
      } else {
        const data = await response.json()
        setError(data.error || 'Error al actualizar día')
      }
    } catch (error) {
      setError('Error al actualizar día')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDay = async (dayId: string) => {
    if (!confirm('¿Seguro que quieres eliminar este día? Se eliminarán todos sus ejercicios.')) return

    try {
      const response = await fetch(
        `/api/admin/training-templates/${template.id}/days/${dayId}`,
        {
          method: 'DELETE',
        }
      )

      if (response.ok) {
        router.refresh()
      } else {
        const data = await response.json()
        alert(data.error || 'Error al eliminar día')
      }
    } catch (error) {
      alert('Error al eliminar día')
    }
  }

  // Edit exercise handlers
  const handleUpdateExercise = async (exerciseId: string) => {
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`/api/admin/exercises/${exerciseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editExerciseForm.name,
          description: editExerciseForm.description,
          videoUrl: editExerciseForm.videoUrl,
          trainerComment: editExerciseForm.trainerComment,
          sets: editExerciseForm.sets,
        }),
      })

      if (response.ok) {
        setEditingExercise(null)
        router.refresh()
      } else {
        const data = await response.json()
        setError(data.error || 'Error al actualizar ejercicio')
      }
    } catch (error) {
      setError('Error al actualizar ejercicio')
    } finally {
      setLoading(false)
    }
  }

  const addSetToEditExercise = () => {
    setEditExerciseForm({
      ...editExerciseForm,
      sets: [
        ...editExerciseForm.sets,
        {
          setNumber: editExerciseForm.sets.length + 1,
          minReps: 8,
          maxReps: 12,
          restSeconds: 90,
        },
      ],
    })
  }

  const removeSetFromEditExercise = (index: number) => {
    if (editExerciseForm.sets.length <= 1) {
      alert('Debe haber al menos una serie')
      return
    }
    const updatedSets = editExerciseForm.sets.filter((_, i) => i !== index)
    const renumbered = updatedSets.map((set, idx) => ({
      ...set,
      setNumber: idx + 1,
    }))
    setEditExerciseForm({ ...editExerciseForm, sets: renumbered })
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      {!hideHeader && (
        <>
          <div className="mb-8 flex items-center justify-between">
            <div>
              <Link href="/admin/training-templates" className="text-blue-600 hover:underline text-sm mb-2 block">
                ← Volver a Plantillas
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">{template.title}</h1>
              <p className="mt-2 text-gray-600">
                {template.numberOfDays} días por semana • {template.days.length} días configurados
              </p>
            </div>
          </div>

          {/* Active Mesocycles Warning */}
          {template.mesocycles && template.mesocycles.length > 0 && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-900">
                <strong>⚠️ Atención:</strong> Esta plantilla está asignada a {template.mesocycles.length} cliente(s) activos. Los cambios se reflejarán inmediatamente en sus planes.
              </p>
              <div className="mt-2 space-y-1">
                {template.mesocycles.map((m: any) => (
                  <p key={m.id} className="text-xs text-yellow-800">
                    • {m.client.name} ({m.client.email})
                  </p>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Basic Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Información Básica</CardTitle>
            {!editingBasicInfo && (
              <Button variant="outline" size="sm" onClick={() => setEditingBasicInfo(true)}>
                Editar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editingBasicInfo ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Nombre</Label>
                <Input
                  id="title"
                  value={basicInfo.title}
                  onChange={(e) => setBasicInfo({ ...basicInfo, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={basicInfo.description}
                  onChange={(e) => setBasicInfo({ ...basicInfo, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="trainerNotes">Notas del Entrenador</Label>
                <Textarea
                  id="trainerNotes"
                  value={basicInfo.trainerNotes}
                  onChange={(e) => setBasicInfo({ ...basicInfo, trainerNotes: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEditingBasicInfo(false)}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button onClick={handleUpdateBasicInfo} disabled={loading}>
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">{template.description || 'Sin descripción'}</p>
              {template.trainerNotes && (
                <div className="mt-3 p-3 bg-gray-50 rounded">
                  <p className="text-xs font-medium text-gray-700">Notas:</p>
                  <p className="text-sm text-gray-600">{template.trainerNotes}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Days Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Días de la Semana</h2>
          {template.days.length < template.numberOfDays && (
            <Button onClick={() => setAddingDay(true)}>
              + Agregar Día
            </Button>
          )}
        </div>

        {/* Add Day Form */}
        {addingDay && (
          <Card className="border-blue-500">
            <CardHeader>
              <CardTitle>Nuevo Día</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Número de Día</Label>
                  <Input
                    type="number"
                    min={1}
                    max={template.numberOfDays}
                    value={newDay.dayNumber}
                    onChange={(e) => setNewDay({ ...newDay, dayNumber: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Nombre del Día *</Label>
                  <Input
                    value={newDay.name}
                    onChange={(e) => setNewDay({ ...newDay, name: e.target.value })}
                    placeholder="Ej: Día 1 - Pecho y Tríceps"
                  />
                </div>
                <div>
                  <Label>Descripción</Label>
                  <Textarea
                    value={newDay.description}
                    onChange={(e) => setNewDay({ ...newDay, description: e.target.value })}
                    placeholder="Descripción del enfoque del día..."
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setAddingDay(false)} disabled={loading}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddDay} disabled={loading || !newDay.name}>
                    {loading ? 'Agregando...' : 'Agregar Día'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Days List with Drag & Drop */}
        <SortableDayList
          days={localDays}
          templateId={template.id}
          editingDay={editingDay}
          editDayForm={editDayForm}
          loading={loading}
          addingExercise={addingExercise}
          editingExercise={editingExercise}
          editExerciseForm={editExerciseForm}
          newExercise={newExercise}
          onEditDay={(day) => {
            setEditDayForm({
              name: day.name,
              description: day.description || '',
            })
            setEditingDay(day.id)
          }}
          onUpdateDay={handleUpdateDay}
          onCancelEditDay={() => setEditingDay(null)}
          onDeleteDay={handleDeleteDay}
          onAddExercise={(dayId) => setAddingExercise(dayId)}
          onCancelAddExercise={() => setAddingExercise(null)}
          onSubmitAddExercise={handleAddExercise}
          onEditExercise={(exercise) => {
            setEditExerciseForm({
              name: exercise.name,
              description: exercise.description || '',
              videoUrl: exercise.videoUrl || '',
              trainerComment: exercise.trainerComment || '',
              sets: exercise.sets.map((s: any) => ({
                setNumber: s.setNumber,
                minReps: s.minReps,
                maxReps: s.maxReps,
                restSeconds: s.restSeconds || 90,
              })),
            })
            setEditingExercise(exercise.id)
          }}
          onUpdateExercise={handleUpdateExercise}
          onCancelEditExercise={() => setEditingExercise(null)}
          onDeleteExercise={handleDeleteExercise}
          onReorder={setLocalDays}
          setEditDayForm={setEditDayForm}
          setNewExercise={setNewExercise}
          setEditExerciseForm={setEditExerciseForm}
          addSetToNewExercise={addSetToNewExercise}
          addSetToEditExercise={addSetToEditExercise}
          removeSetFromEditExercise={removeSetFromEditExercise}
        />
        {/* Old Days List - REMOVED, now using SortableDayList above */}
        {false && template.days.map((day: any) => (
          <Card key={day.id} className="border-l-4 border-l-blue-500">
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
                    <Button
                      variant="outline"
                      onClick={() => setEditingDay(null)}
                      disabled={loading}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={() => handleUpdateDay(day.id)}
                      disabled={loading || !editDayForm.name}
                    >
                      {loading ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle>{day.name}</CardTitle>
                      {day.description && (
                        <CardDescription>{day.description}</CardDescription>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditDayForm({
                            name: day.name,
                            description: day.description || '',
                          })
                          setEditingDay(day.id)
                        }}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteDay(day.id)}
                      >
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
                                onChange={(e) => setEditExerciseForm({ ...editExerciseForm, name: e.target.value })}
                                placeholder="Ej: Press de Banca"
                              />
                            </div>
                            <div>
                              <Label>Descripción Técnica</Label>
                              <Textarea
                                value={editExerciseForm.description}
                                onChange={(e) => setEditExerciseForm({ ...editExerciseForm, description: e.target.value })}
                                placeholder="Explicación de la ejecución correcta..."
                                rows={2}
                              />
                            </div>
                            <div>
                              <Label>URL del Vídeo (YouTube)</Label>
                              <Input
                                value={editExerciseForm.videoUrl}
                                onChange={(e) => setEditExerciseForm({ ...editExerciseForm, videoUrl: e.target.value })}
                                placeholder="https://youtube.com/watch?v=..."
                              />
                            </div>
                            <div>
                              <Label>Comentario del Entrenador</Label>
                              <Input
                                value={editExerciseForm.trainerComment}
                                onChange={(e) => setEditExerciseForm({ ...editExerciseForm, trainerComment: e.target.value })}
                                placeholder="Puntos clave, enfoque..."
                              />
                            </div>
                            <div>
                              <Label className="mb-2 block">Series</Label>
                              {editExerciseForm.sets.map((set, setIdx) => (
                                <div key={setIdx} className="flex gap-2 mb-2">
                                  <Input
                                    type="number"
                                    placeholder="Min reps"
                                    value={set.minReps}
                                    onChange={(e) => {
                                      const updated = [...editExerciseForm.sets]
                                      updated[setIdx].minReps = parseInt(e.target.value) || 0
                                      setEditExerciseForm({ ...editExerciseForm, sets: updated })
                                    }}
                                    className="w-24"
                                  />
                                  <Input
                                    type="number"
                                    placeholder="Max reps"
                                    value={set.maxReps}
                                    onChange={(e) => {
                                      const updated = [...editExerciseForm.sets]
                                      updated[setIdx].maxReps = parseInt(e.target.value) || 0
                                      setEditExerciseForm({ ...editExerciseForm, sets: updated })
                                    }}
                                    className="w-24"
                                  />
                                  <Input
                                    type="number"
                                    placeholder="Descanso (s)"
                                    value={set.restSeconds}
                                    onChange={(e) => {
                                      const updated = [...editExerciseForm.sets]
                                      updated[setIdx].restSeconds = parseInt(e.target.value) || 0
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
                              <Button
                                variant="outline"
                                onClick={() => setEditingExercise(null)}
                                disabled={loading}
                              >
                                Cancelar
                              </Button>
                              <Button
                                onClick={() => handleUpdateExercise(exercise.id)}
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
                                <p className="text-sm text-blue-600 mt-1 italic">💬 {exercise.trainerComment}</p>
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
                                    <span className="font-medium">Serie {set.setNumber}:</span>{' '}
                                    de {set.minReps} a {set.maxReps} reps
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
                                onClick={() => {
                                  setEditExerciseForm({
                                    name: exercise.name,
                                    description: exercise.description || '',
                                    videoUrl: exercise.videoUrl || '',
                                    trainerComment: exercise.trainerComment || '',
                                    sets: exercise.sets.map((s: any) => ({
                                      setNumber: s.setNumber,
                                      minReps: s.minReps,
                                      maxReps: s.maxReps,
                                      restSeconds: s.restSeconds || 90,
                                    })),
                                  })
                                  setEditingExercise(exercise.id)
                                }}
                              >
                                Editar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteExercise(exercise.id)}
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
                          onChange={(e) => setNewExercise({ ...newExercise, trainerComment: e.target.value })}
                          placeholder="Puntos clave, enfoque..."
                        />
                      </div>

                      {/* Sets Configuration */}
                      <div>
                        <Label className="mb-2 block">Series</Label>
                        {newExercise.sets.map((set, idx) => (
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

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          onClick={() => setAddingExercise(null)}
                          disabled={loading}
                        >
                          Cancelar
                        </Button>
                        <Button
                          onClick={() => handleAddExercise(day.id)}
                          disabled={loading || !newExercise.name}
                        >
                          {loading ? 'Agregando...' : 'Agregar Ejercicio'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setAddingExercise(day.id)}
                    className="w-full"
                  >
                    + Agregar Ejercicio
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
