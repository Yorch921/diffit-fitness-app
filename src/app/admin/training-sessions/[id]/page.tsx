'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Exercise {
  id: string
  name: string
  description: string | null
  videoUrl: string | null
  targetSets: string | null
  trainerComment: string | null
  order: number
}

export default function TrainingSessionPage() {
  const router = useRouter()
  const params = useParams()
  const sessionId = params.id as string

  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    videoUrl: '',
    targetSets: '',
    trainerComment: '',
  })

  useEffect(() => {
    fetchExercises()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchExercises = async () => {
    try {
      const response = await fetch(`/api/admin/training-sessions/${sessionId}/exercises`)
      const data = await response.json()

      if (Array.isArray(data)) {
        setExercises(data)
      }
    } catch (error) {
      console.error('Error fetching exercises:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/admin/training-sessions/${sessionId}/exercises`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          order: exercises.length + 1,
        }),
      })

      if (response.ok) {
        setFormData({
          name: '',
          description: '',
          videoUrl: '',
          targetSets: '',
          trainerComment: '',
        })
        setShowForm(false)
        fetchExercises()
      }
    } catch (error) {
      console.error('Error creating exercise:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4 py-6 sm:px-0 max-w-5xl mx-auto">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()}>
          ← Volver
        </Button>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Ejercicios de la Sesión</h1>
        <p className="mt-2 text-gray-600">
          Define los ejercicios del plan (solo información del entrenador)
        </p>
      </div>

      {/* Botón para agregar ejercicio */}
      {!showForm && (
        <Button onClick={() => setShowForm(true)} className="mb-6">
          + Agregar Ejercicio
        </Button>
      )}

      {/* Formulario para agregar ejercicio */}
      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Nuevo Ejercicio</CardTitle>
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
                <Label htmlFor="description">Explicación Técnica de Ejecución</Label>
                <textarea
                  id="description"
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe cómo ejecutar correctamente el ejercicio..."
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

              <div className="space-y-2">
                <Label htmlFor="targetSets">Series Objetivo (ej: &quot;3 x 12-10-8&quot;)</Label>
                <Input
                  id="targetSets"
                  value={formData.targetSets}
                  onChange={(e) => setFormData({ ...formData, targetSets: e.target.value })}
                  placeholder="3 x 12-10-8"
                />
                <p className="text-xs text-gray-500">
                  Indica las series y repeticiones objetivo para guiar al cliente
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="trainerComment">Comentario del Entrenador</Label>
                <textarea
                  id="trainerComment"
                  className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2"
                  value={formData.trainerComment}
                  onChange={(e) => setFormData({ ...formData, trainerComment: e.target.value })}
                  placeholder="Notas adicionales, precauciones, consejos..."
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
                    setFormData({
                      name: '',
                      description: '',
                      videoUrl: '',
                      targetSets: '',
                      trainerComment: '',
                    })
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Guardando...' : 'Guardar Ejercicio'}
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
                    {exercise.targetSets && (
                      <CardDescription className="mt-2">
                        <strong>Series objetivo:</strong> {exercise.targetSets}
                      </CardDescription>
                    )}
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
