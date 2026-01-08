'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Exercise {
  id?: string
  name: string
  description: string
  videoUrl: string
  order: number
}

export default function SessionExercisesPage({
  params,
}: {
  params: { id: string; sessionId: string }
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [sessionName, setSessionName] = useState('')
  const [exercises, setExercises] = useState<Exercise[]>([
    { name: '', description: '', videoUrl: '', order: 1 },
  ])

  useEffect(() => {
    fetchSession()
  }, [])

  const fetchSession = async () => {
    try {
      const response = await fetch(`/api/admin/sessions/${params.sessionId}`)
      const data = await response.json()
      setSessionName(data.name)
      if (data.exercises.length > 0) {
        setExercises(data.exercises)
      }
    } catch (error) {
      console.error('Error fetching session:', error)
    }
  }

  const addExercise = () => {
    setExercises([
      ...exercises,
      { name: '', description: '', videoUrl: '', order: exercises.length + 1 },
    ])
  }

  const removeExercise = (index: number) => {
    const newExercises = exercises.filter((_, i) => i !== index)
    setExercises(
      newExercises.map((ex, i) => ({ ...ex, order: i + 1 }))
    )
  }

  const updateExercise = (index: number, field: keyof Exercise, value: string) => {
    const newExercises = [...exercises]
    newExercises[index] = { ...newExercises[index], [field]: value }
    setExercises(newExercises)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/admin/sessions/${params.sessionId}/exercises`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ exercises }),
      })

      if (!response.ok) {
        throw new Error('Error al guardar ejercicios')
      }

      router.push(`/admin/training-plans/${params.id}`)
    } catch (error) {
      console.error('Error saving exercises:', error)
      alert('Error al guardar ejercicios')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4 py-6 sm:px-0 max-w-4xl mx-auto">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()}>
          ← Volver
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Gestionar Ejercicios - {sessionName}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {exercises.map((exercise, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">Ejercicio {index + 1}</h3>
                  {exercises.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeExercise(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Eliminar
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre del Ejercicio *</Label>
                    <Input
                      value={exercise.name}
                      onChange={(e) => updateExercise(index, 'name', e.target.value)}
                      placeholder="Ej: Press de Banca"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>URL del Video (opcional)</Label>
                    <Input
                      value={exercise.videoUrl}
                      onChange={(e) => updateExercise(index, 'videoUrl', e.target.value)}
                      placeholder="https://youtube.com/..."
                      type="url"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Descripción/Instrucciones</Label>
                  <textarea
                    className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2"
                    value={exercise.description}
                    onChange={(e) => updateExercise(index, 'description', e.target.value)}
                    placeholder="Instrucciones para realizar el ejercicio..."
                  />
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={addExercise}
              className="w-full"
            >
              + Añadir Ejercicio
            </Button>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar Ejercicios'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
