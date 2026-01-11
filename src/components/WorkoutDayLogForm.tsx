'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface WorkoutDayLogFormProps {
  data: {
    microcycle: any
    templateDay: any
    existingLog: any | null
  }
}

interface SetLogData {
  setNumber: number
  reps: number
  weight: number
  rir: number | null
  notes: string
}

interface ExerciseLogData {
  exerciseId: string
  setLogs: SetLogData[]
}

export default function WorkoutDayLogForm({ data }: WorkoutDayLogFormProps) {
  const router = useRouter()
  const { microcycle, templateDay, existingLog } = data
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Initialize form data
  const [formData, setFormData] = useState({
    completedDate: existingLog
      ? new Date(existingLog.completedDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    durationMinutes: existingLog?.durationMinutes || '',
    rpe: existingLog?.rpe || '',
    fatigue: existingLog?.fatigue || '',
    emotionalState: existingLog?.emotionalState || 'NORMAL',
    clientNotes: existingLog?.clientNotes || '',
  })

  // Initialize exercise logs data
  const initializeExerciseLogs = (): ExerciseLogData[] => {
    if (existingLog) {
      return existingLog.exerciseLogs.map((exLog: any) => ({
        exerciseId: exLog.exerciseId,
        setLogs: exLog.setLogs.map((setLog: any) => ({
          setNumber: setLog.setNumber,
          reps: setLog.reps,
          weight: setLog.weight,
          rir: setLog.rir,
          notes: setLog.notes || '',
        })),
      }))
    }

    return templateDay.exercises.map((exercise: any) => ({
      exerciseId: exercise.id,
      setLogs: exercise.sets.map((set: any) => ({
        setNumber: set.setNumber,
        reps: set.minReps,
        weight: 0,
        rir: null,
        notes: '',
      })),
    }))
  }

  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLogData[]>(initializeExerciseLogs())

  const updateSetLog = (exerciseIdx: number, setIdx: number, field: string, value: any) => {
    const updated = [...exerciseLogs]
    ;(updated[exerciseIdx].setLogs[setIdx] as any)[field] = value
    setExerciseLogs(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const url = existingLog
        ? `/api/client/workout-day-logs/${existingLog.id}`
        : '/api/client/workout-day-logs'
      const method = existingLog ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          microcycleId: microcycle.id,
          templateDayId: templateDay.id,
          completedDate: new Date(formData.completedDate).toISOString(),
          durationMinutes: formData.durationMinutes ? parseInt(formData.durationMinutes) : null,
          rpe: formData.rpe ? parseInt(formData.rpe) : null,
          fatigue: formData.fatigue ? parseInt(formData.fatigue) : null,
          emotionalState: formData.emotionalState || null,
          clientNotes: formData.clientNotes || null,
          exerciseLogs,
        }),
      })

      if (response.ok) {
        router.push('/dashboard/training')
        router.refresh()
      } else {
        const data = await response.json()
        setError(data.error || 'Error al guardar el registro')
      }
    } catch (error) {
      setError('Error al guardar el registro')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('¿Seguro que quieres eliminar este registro?')) return

    setLoading(true)
    try {
      const response = await fetch(`/api/client/workout-day-logs/${existingLog.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/dashboard/training')
        router.refresh()
      } else {
        alert('Error al eliminar el registro')
      }
    } catch (error) {
      alert('Error al eliminar el registro')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4 py-6 sm:px-0 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href={`/dashboard/training/log/microcycle/${microcycle.weekNumber}`}>
          <Button variant="ghost">← Volver a Semana {microcycle.weekNumber}</Button>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {existingLog ? 'Editar' : 'Registrar'} Entrenamiento
        </h1>
        <p className="mt-2 text-gray-600">
          {microcycle.mesocycle.template.title} • Semana {microcycle.weekNumber} • {templateDay.name}
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Metadata de la Sesión */}
        <Card>
          <CardHeader>
            <CardTitle>Información de la Sesión</CardTitle>
            <CardDescription>Datos generales del entrenamiento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="completedDate">Fecha *</Label>
                <Input
                  id="completedDate"
                  type="date"
                  value={formData.completedDate}
                  onChange={(e) => setFormData({ ...formData, completedDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="durationMinutes">Duración (minutos)</Label>
                <Input
                  id="durationMinutes"
                  type="number"
                  min="1"
                  value={formData.durationMinutes}
                  onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                  placeholder="Ej: 60"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rpe">RPE (1-10)</Label>
                <Input
                  id="rpe"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.rpe}
                  onChange={(e) => setFormData({ ...formData, rpe: e.target.value })}
                  placeholder="Intensidad percibida"
                />
                <p className="text-xs text-gray-500 mt-1">1 = Muy fácil, 10 = Máximo esfuerzo</p>
              </div>
              <div>
                <Label htmlFor="fatigue">Fatiga (1-10)</Label>
                <Input
                  id="fatigue"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.fatigue}
                  onChange={(e) => setFormData({ ...formData, fatigue: e.target.value })}
                  placeholder="Nivel de cansancio"
                />
                <p className="text-xs text-gray-500 mt-1">1 = Fresco, 10 = Agotado</p>
              </div>
            </div>

            <div>
              <Label htmlFor="emotionalState">Estado Emocional</Label>
              <select
                id="emotionalState"
                value={formData.emotionalState}
                onChange={(e) => setFormData({ ...formData, emotionalState: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="VERY_GOOD">Muy bien</option>
                <option value="GOOD">Bien</option>
                <option value="NORMAL">Normal</option>
                <option value="BAD">Mal</option>
                <option value="VERY_BAD">Muy mal</option>
              </select>
            </div>

            <div>
              <Label htmlFor="clientNotes">Notas / Comentarios</Label>
              <Textarea
                id="clientNotes"
                value={formData.clientNotes}
                onChange={(e) => setFormData({ ...formData, clientNotes: e.target.value })}
                placeholder="Cómo te sentiste, dificultades, observaciones..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Ejercicios y Series */}
        {templateDay.exercises.map((exercise: any, exerciseIdx: number) => (
          <Card key={exercise.id} className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="text-lg">
                {exerciseIdx + 1}. {exercise.name}
              </CardTitle>
              {exercise.description && <CardDescription>{exercise.description}</CardDescription>}
              {exercise.trainerComment && (
                <p className="text-sm text-blue-600 italic mt-2">💬 {exercise.trainerComment}</p>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {exercise.sets.map((set: any, setIdx: number) => {
                  const logData = exerciseLogs[exerciseIdx]?.setLogs[setIdx]

                  return (
                    <div key={set.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium text-gray-900">Serie {set.setNumber}</h5>
                        <span className="text-sm text-gray-500">
                          Objetivo: {set.minReps === set.maxReps ? `${set.minReps} reps` : `${set.minReps}-${set.maxReps} reps`}
                          {set.restSeconds && ` • Descanso: ${set.restSeconds}s`}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <Label className="text-xs">Reps *</Label>
                          <Input
                            type="number"
                            min="0"
                            value={logData?.reps || ''}
                            onChange={(e) =>
                              updateSetLog(exerciseIdx, setIdx, 'reps', parseInt(e.target.value) || 0)
                            }
                            required
                            className="h-9"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Peso (kg) *</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.5"
                            value={logData?.weight || ''}
                            onChange={(e) =>
                              updateSetLog(exerciseIdx, setIdx, 'weight', parseFloat(e.target.value) || 0)
                            }
                            required
                            className="h-9"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">RIR</Label>
                          <Input
                            type="number"
                            min="0"
                            max="10"
                            value={logData?.rir || ''}
                            onChange={(e) =>
                              updateSetLog(exerciseIdx, setIdx, 'rir', parseInt(e.target.value) || null)
                            }
                            placeholder="0-10"
                            className="h-9"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Notas</Label>
                          <Input
                            value={logData?.notes || ''}
                            onChange={(e) => updateSetLog(exerciseIdx, setIdx, 'notes', e.target.value)}
                            placeholder="Opcional"
                            className="h-9"
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Botones de Acción */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Link href={`/dashboard/training/log/microcycle/${microcycle.weekNumber}`} className="flex-1">
                <Button type="button" variant="outline" className="w-full" disabled={loading}>
                  Cancelar
                </Button>
              </Link>
              {existingLog && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDelete}
                  disabled={loading}
                  className="text-red-600 hover:text-red-700"
                >
                  Eliminar
                </Button>
              )}
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Guardando...' : existingLog ? 'Actualizar Registro' : 'Guardar Entrenamiento'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
