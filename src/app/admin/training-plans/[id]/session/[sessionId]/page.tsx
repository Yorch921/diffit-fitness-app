'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import ExerciseSetEditor, { ExerciseSet } from '@/components/ExerciseSetEditor'
import SortableExerciseList from '@/components/SortableExerciseList'

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

      {/* Lista de ejercicios con drag & drop */}
      <SortableExerciseList
        exercises={exercises}
        sessionId={params.sessionId}
        onReorder={setExercises}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  )
}
