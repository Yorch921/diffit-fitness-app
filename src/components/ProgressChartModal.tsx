'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { type VolumeCriterion } from '@/lib/progress-calculations'

interface ProgressChartModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  clientId: string
  criterion: VolumeCriterion
  exerciseId?: string // Si se especifica, muestra gráfica de ejercicio específico
  metricType?: 'global' | 'upper_body' | 'lower_body' | 'best_set' // Si se especifica, muestra métrica global
}

interface HistoryDataPoint {
  weekNumber: number
  comparedWith: number
  value: number
  percentChange: number
}

export default function ProgressChartModal({
  isOpen,
  onClose,
  title,
  clientId,
  criterion,
  exerciseId,
  metricType,
}: ProgressChartModalProps) {
  const [chartData, setChartData] = useState<HistoryDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return

    async function fetchHistoryData() {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch(
          `/api/client/progress/history?clientId=${clientId}&criterion=${criterion}`
        )

        if (!res.ok) {
          throw new Error('Error al cargar datos históricos')
        }

        const data = await res.json()
        const history = data.progressHistory

        let processedData: HistoryDataPoint[] = []

        if (exerciseId) {
          // Gráfica de ejercicio específico
          processedData = history
            .map((week: any) => {
              const exercise = week.exercisesProgress.find(
                (ex: any) => ex.exerciseId === exerciseId
              )
              if (!exercise) return null

              return {
                weekNumber: week.weekNumber,
                comparedWith: week.comparedWith,
                value: exercise.currentWeekVolume,
                percentChange: exercise.volumeChangePercent ?? 0,
              }
            })
            .filter(Boolean)
        } else if (metricType) {
          // Gráfica de métrica global
          processedData = history.map((week: any) => {
            let value = 0
            let percentChange = 0

            switch (metricType) {
              case 'global':
                value = week.globalProgress.totalVolume
                percentChange = week.globalProgress.totalVolumeChangePercent ?? 0
                break
              case 'upper_body':
                const upperBody = week.muscleGroupsProgress.find(
                  (mg: any) => mg.muscleGroup === 'UPPER_BODY'
                )
                value = upperBody ? upperBody.currentWeekVolume : 0
                percentChange = upperBody ? (upperBody.volumeChangePercent ?? 0) : 0
                break
              case 'lower_body':
                const lowerBody = week.muscleGroupsProgress.find(
                  (mg: any) => mg.muscleGroup === 'LOWER_BODY'
                )
                value = lowerBody ? lowerBody.currentWeekVolume : 0
                percentChange = lowerBody ? (lowerBody.volumeChangePercent ?? 0) : 0
                break
              case 'best_set':
                value = week.globalProgress.bestSet ?? 0
                percentChange = week.globalProgress.bestSetChangePercent ?? 0
                break
            }

            return {
              weekNumber: week.weekNumber,
              comparedWith: week.comparedWith,
              value,
              percentChange,
            }
          })
        }

        setChartData(processedData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    fetchHistoryData()
  }, [isOpen, clientId, criterion, exerciseId, metricType])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-500 mt-1">
              Evolución a lo largo del mesociclo
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600">Cargando datos...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {!loading && !error && chartData.length > 0 && (
            <div>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="weekNumber"
                    label={{
                      value: 'Semana',
                      position: 'insideBottom',
                      offset: -5,
                    }}
                  />
                  <YAxis
                    label={{
                      value: 'Volumen',
                      angle: -90,
                      position: 'insideLeft',
                    }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length && payload[0]?.payload) {
                        const data = payload[0].payload as HistoryDataPoint
                        const pctChange = data.percentChange ?? 0
                        const vol = data.value ?? 0
                        return (
                          <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
                            <p className="font-semibold">
                              Semana {data.weekNumber}
                            </p>
                            <p className="text-sm text-gray-600">
                              vs Semana {data.comparedWith}
                            </p>
                            <p className="text-sm mt-1">
                              Volumen: {vol.toFixed(0)}
                            </p>
                            <p
                              className={`text-sm font-semibold ${
                                pctChange >= 0
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {pctChange >= 0 ? '+' : ''}
                              {pctChange.toFixed(1)}%
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Volumen"
                    dot={{ fill: '#3b82f6', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>

              {/* Estadísticas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Volumen inicial</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {chartData[0]?.value.toFixed(0)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Volumen actual</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {chartData[chartData.length - 1]?.value.toFixed(0)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Cambio total</p>
                  <p
                    className={`text-2xl font-bold ${
                      chartData[chartData.length - 1]?.value >=
                      chartData[0]?.value
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {chartData[0] && chartData[chartData.length - 1]
                      ? (
                          ((chartData[chartData.length - 1].value -
                            chartData[0].value) /
                            chartData[0].value) *
                          100
                        ).toFixed(1)
                      : '0'}
                    %
                  </p>
                </div>
              </div>
            </div>
          )}

          {!loading && !error && chartData.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600">
                No hay suficientes datos para mostrar la gráfica
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
