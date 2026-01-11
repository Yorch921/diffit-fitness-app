'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import ExerciseSetEditor, { ExerciseSet } from '@/components/ExerciseSetEditor'

interface Exercise {
  id: string
  name: string
  description: string | null
  videoUrl: string | null
  targetSets: string | null
  trainerComment: string | null
  order: number
  sets: ExerciseSet[]
}

interface ExerciseFormData {
  name: string
  description: string
  videoUrl: string
  trainerComment: string
  sets: ExerciseSet[]
}

export default function SessionExercisesPage({
  params,
}: {
  params: { id: string; sessionId: string }
}) {
  const router = useRouter()
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingExercise, setEditingExercise] = useState<string | null>(null)
  const [formData, setFormData] = useState<ExerciseFormData>({
    name: '',
    description: '',
    videoUrl: '',
    trainerComment: '',
    sets: [
      { setNumber: 1, minReps: 8, maxReps: 12 },
      { setNumber: 2, minReps: 8, maxReps: 12 },
      { setNumber: 3, minReps: 8, maxReps: 12 },
    ],
  })

  useEffect(() => {
    fetchExercises()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchExercises = async () => {
    try {
      const response = await fetch(`/api/admin/training-sessions/${params.sessionId}/exercises`)
      const data = await response.json()

      if (Array.isArray(data)) {
        setExercises(data)
      }
    } catch (error) {
      console.error('Error fetching exercises:', error)
    }
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      alert('El nombre del ejercicio es obligatorio')
      return false
    }
    if (!formData.description.trim()) {
      alert('La explicación técnica es obligatoria')
      return false
    }
    if (!formData.trainerComment.trim()) {
      alert('El comentario del entrenador es obligatorio')
      return false
    }
    if (formData.sets.length === 0) {
      alert('Debe definir al menos una serie')
      return false
    }
    return true
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      videoUrl: '',
      trainerComment: '',
      sets: [
        { setNumber: 1, minReps: 8, maxReps: 12 },
        { setNumber: 2, minReps: 8, maxReps: 12 },
        { setNumber: 3, minReps: 8, maxReps: 12 },
      ],
    })
    setEditingExercise(null)
    setShowForm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)

    try {
      const url = editingExercise
        ? `/api/admin/exercises/${editingExercise}`
        : `/api/admin/training-sessions/${params.sessionId}/exercises`

      const method = editingExercise ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          order: editingExercise ? undefined : exercises.length + 1,
        }),
      })

      if (response.ok) {
        resetForm()
        fetchExercises()
      } else {
        const error = await response.json()
        alert(error.error || 'Error al guardar ejercicio')
      }
    } catch (error) {
      console.error('Error saving exercise:', error)
      alert('Error al guardar ejercicio')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (exercise: Exercise) => {
    setEditingExercise(exercise.id)
    setFormData({
      name: exercise.name,
      description: exercise.description || '',
      videoUrl: exercise.videoUrl || '',
      trainerComment: exercise.trainerComment || '',
      sets: exercise.sets && exercise.sets.length > 0
        ? exercise.sets
        : [
            { setNumber: 1, minReps: 8, maxReps: 12 },
            { setNumber: 2, minReps: 8, maxReps: 12 },
            { setNumber: 3, minReps: 8, maxReps: 12 },
          ],
    })
    setShowForm(true)
  }

  const handleDelete = async (exerciseId: string) => {
    if (!confirm('¿Estás seguro de eliminar este ejercicio? Esta acción no se puede deshacer.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/exercises/${exerciseId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchExercises()
      } else {
        alert('Error al eliminar ejercicio')
      }
    } catch (error) {
      console.error('Error deleting exercise:', error)
      alert('Error al eliminar ejercicio')
    }
  }

  return (
    <div className="px-4 py-6 sm:px-0 max-w-5xl mx-auto">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.push(`/admin/training-plans/${params.id}`)}>
          ← Volver al Plan
        </Button>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Ejercicios de la Sesión</h1>
        <p className="mt-2 text-gray-600">
          Define los ejercicios del plan (solo información del entrenador - ESTÁTICO)
        </p>
      </div>

      {/* Botón para agregar ejercicio */}
      {!showForm && (
        <Button onClick={() => setShowForm(true)} className="mb-6">
          + Agregar Ejercicio
        </Button>
      )}

      {/* Formulario para agregar/editar ejercicio */}
      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editingExercise ? 'Editar Ejercicio' : 'Nuevo Ejercicio'}</CardTitle>
            <CardDescription>
              Define la información del ejercicio (plan del entrenador - SOLO LECTURA para el cliente)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Ejercicio *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Press de banca"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Explicación Técnica de Ejecución *</Label>
                <textarea
                  id="description"
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe cómo ejecutar correctamente el ejercicio..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="videoUrl">Enlace a Vídeo (opcional)</Label>
                <Input
                  id="videoUrl"
                  type="url"
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  placeholder="https://youtube.com/..."
                />
              </div>

              {/* Componente de Series Estructuradas */}
              <ExerciseSetEditor
                sets={formData.sets}
                onChange={(sets) => setFormData({ ...formData, sets })}
              />

              <div className="space-y-2">
                <Label htmlFor="trainerComment">Comentario del Entrenador *</Label>
                <textarea
                  id="trainerComment"
                  className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.trainerComment}
                  onChange={(e) => setFormData({ ...formData, trainerComment: e.target.value })}
                  placeholder="Notas adicionales, precauciones, consejos..."
                  required
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Guardando...' : (editingExercise ? 'Actualizar Ejercicio' : 'Guardar Ejercicio')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de ejercicios */}
      <div className="space-y-4">
        {exercises.length === 0 ? (
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
        ) : (
          exercises.map((exercise, index) => (
            <Card key={exercise.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
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
                      onClick={() => handleEdit(exercise)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(exercise.id)}
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
          ))
        )}
      </div>
    </div>
  )
}
