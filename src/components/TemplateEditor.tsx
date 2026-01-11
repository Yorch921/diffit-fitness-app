'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'

interface TemplateEditorProps {
  template: any
}

export default function TemplateEditor({ template }: TemplateEditorProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editingBasicInfo, setEditingBasicInfo] = useState(false)
  const [addingDay, setAddingDay] = useState(false)
  const [addingExercise, setAddingExercise] = useState<string | null>(null)

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

  return (
    <div className="px-4 py-6 sm:px-0">
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

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Active Mesocycles Warning */}
      {template.mesocycles.length > 0 && (
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

        {/* Days List */}
        {template.days.map((day: any) => (
          <Card key={day.id} className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle>{day.name}</CardTitle>
              {day.description && (
                <CardDescription>{day.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Exercises List */}
                {day.exercises.length > 0 ? (
                  <div className="space-y-3">
                    {day.exercises.map((exercise: any, idx: number) => (
                      <div key={exercise.id} className="border rounded-lg p-4">
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
                            <div className="mt-2 space-y-1">
                              {exercise.sets.map((set: any) => (
                                <div key={set.id} className="text-sm text-gray-700">
                                  <span className="font-medium">Serie {set.setNumber}:</span>{' '}
                                  {set.minReps === set.maxReps
                                    ? `${set.minReps} reps`
                                    : `${set.minReps}-${set.maxReps} reps`}
                                  {set.restSeconds && (
                                    <span className="text-gray-500"> • Descanso: {set.restSeconds}s</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
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
