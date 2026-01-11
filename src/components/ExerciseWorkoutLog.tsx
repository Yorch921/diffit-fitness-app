'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface Exercise {
  id: string
  name: string
  description: string | null
  videoUrl: string | null
  targetSets: string | null
  trainerComment: string | null
}

interface WorkoutLog {
  id: string
  weekNumber: number
  setNumber: number
  reps: number | null
  weight: number | null
}

interface ExerciseWorkoutLogProps {
  exercise: Exercise
  currentWeekNumber: number
  maxSets: number // Número máximo de series (ej: 3)
}

// Componente para cada fila de serie
function SetRow({
  setNumber,
  initialReps,
  initialWeight,
  onSave,
  loading,
}: {
  setNumber: number
  initialReps: number | null
  initialWeight: number | null
  onSave: (setNumber: number, reps: number | null, weight: number | null) => Promise<void>
  loading: boolean
}) {
  const [reps, setReps] = useState(initialReps?.toString() || '')
  const [weight, setWeight] = useState(initialWeight?.toString() || '')

  useEffect(() => {
    setReps(initialReps?.toString() || '')
    setWeight(initialWeight?.toString() || '')
  }, [initialReps, initialWeight])

  const handleBlur = () => {
    onSave(
      setNumber,
      reps ? parseInt(reps) : null,
      weight ? parseFloat(weight) : null
    )
  }

  return (
    <tr>
      <td className="px-3 py-2 text-sm font-medium text-gray-900">{setNumber}</td>
      <td className="px-3 py-2">
        <Input
          type="number"
          min="0"
          placeholder="-"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          onBlur={handleBlur}
          disabled={loading}
          className="w-20 h-8 text-sm"
        />
      </td>
      <td className="px-3 py-2">
        <Input
          type="number"
          min="0"
          step="0.5"
          placeholder="-"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          onBlur={handleBlur}
          disabled={loading}
          className="w-20 h-8 text-sm"
        />
      </td>
    </tr>
  )
}

export default function ExerciseWorkoutLog({
  exercise,
  currentWeekNumber,
  maxSets = 3,
}: ExerciseWorkoutLogProps) {
  const [logs, setLogs] = useState<WorkoutLog[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchLogs()
  }, [currentWeekNumber])

  const fetchLogs = async () => {
    try {
      const response = await fetch(
        `/api/client/workout-log?exerciseId=${exercise.id}&weekNumber=${currentWeekNumber}`
      )
      const data = await response.json()

      if (Array.isArray(data)) {
        setLogs(data)
      }
    } catch (error) {
      console.error('Error fetching logs:', error)
    }
  }

  const handleSaveLog = async (setNumber: number, reps: number | null, weight: number | null) => {
    setLoading(true)
    try {
      const response = await fetch('/api/client/workout-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exerciseId: exercise.id,
          weekNumber: currentWeekNumber,
          setNumber,
          reps,
          weight,
        }),
      })

      if (response.ok) {
        fetchLogs()
      }
    } catch (error) {
      console.error('Error saving log:', error)
    } finally {
      setLoading(false)
    }
  }

  const getLogForSet = (setNumber: number) => {
    return logs.find((log) => log.setNumber === setNumber)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{exercise.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Información del plan del entrenador (SOLO LECTURA) */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
          <h4 className="text-sm font-semibold text-gray-700">📋 Plan del Entrenador</h4>

          {exercise.targetSets && (
            <div>
              <span className="text-xs font-medium text-gray-600">Series objetivo:</span>
              <p className="text-sm font-semibold text-gray-900">{exercise.targetSets}</p>
            </div>
          )}

          {exercise.description && (
            <div>
              <span className="text-xs font-medium text-gray-600">Explicación técnica:</span>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{exercise.description}</p>
            </div>
          )}

          {exercise.videoUrl && (
            <div>
              <span className="text-xs font-medium text-gray-600">Vídeo de referencia:</span>
              <a
                href={exercise.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 underline block"
              >
                Ver vídeo →
              </a>
            </div>
          )}

          {exercise.trainerComment && (
            <div className="bg-blue-50 p-3 rounded-md">
              <span className="text-xs font-medium text-blue-900">💬 Comentario:</span>
              <p className="text-sm text-blue-800 whitespace-pre-wrap">{exercise.trainerComment}</p>
            </div>
          )}
        </div>

        {/* Registro del cliente (EDITABLE) */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700">
            📝 Mi Registro - Semana {currentWeekNumber}
          </h4>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Serie</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Reps</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Peso (kg)</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {Array.from({ length: maxSets }).map((_, index) => {
                  const setNumber = index + 1
                  const log = getLogForSet(setNumber)

                  return (
                    <SetRow
                      key={setNumber}
                      setNumber={setNumber}
                      initialReps={log?.reps || null}
                      initialWeight={log?.weight || null}
                      onSave={handleSaveLog}
                      loading={loading}
                    />
                  )
                })}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-gray-500 italic">
            * Ingresa tus repeticiones y peso real por serie. Los cambios se guardan al presionar Tab o al salir del input
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
