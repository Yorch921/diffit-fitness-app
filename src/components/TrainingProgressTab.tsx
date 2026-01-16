'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import TrainingProgressDashboard from './TrainingProgressDashboard'
import type { VolumeCriterion } from '@/lib/progress-calculations'

interface TrainingProgressTabProps {
  clientId: string
}

export default function TrainingProgressTab({ clientId }: TrainingProgressTabProps) {
  const { data: session } = useSession()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [criterion, setCriterion] = useState<VolumeCriterion>('balanced')
  const [currentWeek, setCurrentWeek] = useState<number | null>(null)
  const [previousWeek, setPreviousWeek] = useState<number | null>(null)
  const [availableWeeks, setAvailableWeeks] = useState<number[]>([])

  const isAdmin = session?.user?.role === 'TRAINER'

  // Cargar semanas disponibles (todas las semanas, no solo desde la 2)
  useEffect(() => {
    async function fetchAvailableWeeks() {
      try {
        const res = await fetch(`/api/client/progress/weeks?clientId=${clientId}&includeAll=true`)
        if (res.ok) {
          const weeks = await res.json()
          setAvailableWeeks(weeks)
        }
      } catch (err) {
        console.error('Error fetching available weeks:', err)
      }
    }

    if (clientId) {
      fetchAvailableWeeks()
    }
  }, [clientId])

  useEffect(() => {
    async function fetchProgress() {
      try {
        setLoading(true)
        setError(null)

        const params = new URLSearchParams({
          clientId,
          criterion,
        })

        if (currentWeek && previousWeek) {
          params.append('currentWeek', currentWeek.toString())
          params.append('previousWeek', previousWeek.toString())
        }

        const res = await fetch(`/api/client/progress?${params}`)

        if (!res.ok) {
          const errorData = await res.json()
          throw new Error(errorData.error || 'Error al cargar el progreso')
        }

        const progressData = await res.json()
        setData(progressData)
      } catch (err) {
        console.error('Error fetching progress:', err)
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    if (clientId) {
      fetchProgress()
    }
  }, [clientId, criterion, currentWeek, previousWeek])

  // Cambiar criterio y recargar datos
  const handleCriterionChange = (newCriterion: VolumeCriterion) => {
    setCriterion(newCriterion)
  }

  // Estados de carga
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Cargando análisis de progreso...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <svg
            className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <h3 className="text-lg font-semibold text-red-900 mb-1">
              No se pudo cargar el progreso
            </h3>
            <p className="text-sm text-red-700">{error}</p>
            <p className="text-xs text-red-600 mt-2">
              Asegúrate de que el cliente tenga al menos 2 semanas de datos de
              entrenamiento registrados.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <p className="text-gray-600 text-center">No hay datos disponibles</p>
      </div>
    )
  }

  // Renderizar dashboard con datos
  return (
    <div className="space-y-4">
      {/* Selector de semanas para comparar */}
      {availableWeeks.length >= 2 && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <label className="text-sm font-medium text-gray-700">
                Comparar semanas:
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={previousWeek || ''}
                  onChange={(e) => setPreviousWeek(e.target.value ? parseInt(e.target.value) : null)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Semana anterior</option>
                  {availableWeeks.map((week) => (
                    <option key={week} value={week} disabled={currentWeek !== null && week >= currentWeek}>
                      Semana {week}
                    </option>
                  ))}
                </select>
                <span className="text-gray-500">vs</span>
                <select
                  value={currentWeek || ''}
                  onChange={(e) => setCurrentWeek(e.target.value ? parseInt(e.target.value) : null)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Semana actual</option>
                  {availableWeeks.map((week) => (
                    <option key={week} value={week} disabled={previousWeek !== null && week <= previousWeek}>
                      Semana {week}
                    </option>
                  ))}
                </select>
              </div>
              {currentWeek && previousWeek && (
                <button
                  onClick={() => {
                    setCurrentWeek(null)
                    setPreviousWeek(null)
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Restaurar automático
                </button>
              )}
            </div>
            {!currentWeek && !previousWeek && (
              <p className="text-xs text-gray-500">
                Por defecto se comparan las dos últimas semanas con datos
              </p>
            )}
          </div>
        </div>
      )}

      <TrainingProgressDashboard
        clientId={clientId}
        clientName={data.clientInfo.name}
        templateTitle={data.mesocycleInfo.templateTitle}
        currentWeekNumber={data.currentWeekNumber}
        previousWeekNumber={data.previousWeekNumber}
        totalWeeks={data.mesocycleInfo.durationWeeks}
        criterion={criterion}
        exercisesProgress={data.exercisesProgress}
        muscleGroupsProgress={data.muscleGroupsProgress}
        globalProgress={data.globalProgress}
        isAdmin={isAdmin}
        onCriterionChange={isAdmin ? handleCriterionChange : undefined}
      />
    </div>
  )
}
