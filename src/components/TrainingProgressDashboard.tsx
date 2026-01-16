'use client'

import { useState, useMemo } from 'react'
import { MuscleGroup } from '@prisma/client'
import {
  type ExerciseProgress,
  type MuscleGroupProgress,
  type GlobalProgress,
  type VolumeCriterion,
  type TrafficLightStatus,
  formatVolume,
  formatPercentChange,
  getMuscleGroupName,
  getTrafficLightMessage,
  filterByStatus,
  filterByMuscleGroup,
} from '@/lib/progress-calculations'
import ProgressChartModal from './ProgressChartModal'

// ============================================================================
// TIPOS
// ============================================================================

interface TrainingProgressDashboardProps {
  clientId: string
  clientName: string
  templateTitle: string
  currentWeekNumber: number
  previousWeekNumber: number
  totalWeeks: number
  criterion: VolumeCriterion
  exercisesProgress: ExerciseProgress[]
  muscleGroupsProgress: MuscleGroupProgress[]
  globalProgress: GlobalProgress
  isAdmin: boolean
  onCriterionChange?: (criterion: VolumeCriterion) => void
}

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

function StatCard({
  title,
  value,
  change,
  changePercent,
  isPositiveGood = true,
  size = 'normal',
  onClick,
}: {
  title: string
  value: string
  change: number
  changePercent: number
  isPositiveGood?: boolean
  size?: 'normal' | 'large'
  onClick?: () => void
}) {
  const isImproving = isPositiveGood
    ? changePercent > 2
    : changePercent < -2
  const isMaintaining = Math.abs(changePercent) <= 2
  const isWorsening = isPositiveGood
    ? changePercent < -2
    : changePercent > 2

  const bgColor = isImproving
    ? 'bg-green-50 border-green-200'
    : isMaintaining
    ? 'bg-yellow-50 border-yellow-200'
    : 'bg-red-50 border-red-200'

  const textColor = isImproving
    ? 'text-green-700'
    : isMaintaining
    ? 'text-yellow-700'
    : 'text-red-700'

  const iconColor = isImproving
    ? 'text-green-500'
    : isMaintaining
    ? 'text-yellow-500'
    : 'text-red-500'

  return (
    <div
      className={`rounded-lg border-2 p-6 ${bgColor} ${
        size === 'large' ? 'col-span-2' : ''
      } ${onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
      onClick={onClick}
    >
      <h3 className="text-sm font-medium text-gray-600 mb-2">
        {title} {onClick && <span className="text-xs">📊</span>}
      </h3>
      <div className={`${size === 'large' ? 'text-4xl' : 'text-3xl'} font-bold ${textColor} mb-1`}>
        {value}
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-sm font-semibold ${iconColor}`}>
          {changePercent > 0 ? '↑' : changePercent < 0 ? '↓' : '→'}
        </span>
        <span className={`text-sm font-medium ${textColor}`}>
          {formatPercentChange(changePercent)}
        </span>
      </div>
    </div>
  )
}

function ExerciseRow({
  exercise,
  isAdmin,
  onClick,
}: {
  exercise: ExerciseProgress
  isAdmin: boolean
  onClick?: () => void
}) {
  const statusColors = {
    improving: 'bg-green-100 text-green-800',
    maintaining: 'bg-yellow-100 text-yellow-800',
    declining: 'bg-red-100 text-red-800',
  }

  const statusIcons = {
    improving: '↑',
    maintaining: '→',
    declining: '↓',
  }

  return (
    <div
      className={`flex items-center justify-between p-4 border-b border-gray-200 hover:bg-gray-50 ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex-1">
        <div className="font-medium text-gray-900">{exercise.exerciseName}</div>
        <div className="text-sm text-gray-500">
          {getMuscleGroupName(exercise.muscleGroup)}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-sm font-medium text-gray-900">
            Volumen: {formatVolume(exercise.currentWeekVolume)}
          </div>
          {isAdmin && (
            <div className="text-xs text-gray-500">
              {formatPercentChange(exercise.volumeChangePercent)}
            </div>
          )}
        </div>

        <div
          className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
            statusColors[exercise.status]
          }`}
        >
          <span>{statusIcons[exercise.status]}</span>
          <span>{getTrafficLightMessage(exercise.status, isAdmin)}</span>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function TrainingProgressDashboard({
  clientId,
  clientName,
  templateTitle,
  currentWeekNumber,
  previousWeekNumber,
  totalWeeks,
  criterion,
  exercisesProgress,
  muscleGroupsProgress,
  globalProgress,
  isAdmin,
  onCriterionChange,
}: TrainingProgressDashboardProps) {
  const [statusFilter, setStatusFilter] = useState<TrafficLightStatus | 'all'>(
    'all'
  )
  const [muscleGroupFilter, setMuscleGroupFilter] = useState<
    MuscleGroup | 'all'
  >('all')

  // Estado para el modal de gráficas
  const [chartModal, setChartModal] = useState<{
    isOpen: boolean
    title: string
    exerciseId?: string
    metricType?: 'global' | 'upper_body' | 'lower_body' | 'best_set'
  }>({
    isOpen: false,
    title: '',
  })

  // Filtrar ejercicios
  const filteredExercises = useMemo(() => {
    let filtered = exercisesProgress
    filtered = filterByStatus(filtered, statusFilter)
    filtered = filterByMuscleGroup(filtered, muscleGroupFilter)
    return filtered
  }, [exercisesProgress, statusFilter, muscleGroupFilter])

  // Contar ejercicios por estado
  const improvingCount = exercisesProgress.filter(
    (ex) => ex.status === 'improving'
  ).length
  const decliningCount = exercisesProgress.filter(
    (ex) => ex.status === 'declining'
  ).length

  return (
    <div className="space-y-6">
      {/* 1. CONTEXTO DE COMPARACIÓN */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{clientName}</h2>
            <p className="text-sm text-gray-600 mt-1">
              Plan: {templateTitle} • Semana {currentWeekNumber} de {totalWeeks}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Comparando: Semana {currentWeekNumber} vs Semana{' '}
              {previousWeekNumber}
            </p>
          </div>

          {/* Selector de criterio (solo para admin) */}
          {isAdmin && onCriterionChange && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                Criterio:
              </label>
              <select
                value={criterion}
                onChange={(e) =>
                  onCriterionChange(e.target.value as VolumeCriterion)
                }
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="balanced">Balanceado</option>
                <option value="weight_focused">Enfocado en Peso</option>
                <option value="reps_focused">Enfocado en Reps</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* 2. RESUMEN GLOBAL EN BLOQUES GRANDES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Progreso Global */}
        <StatCard
          title="Progreso Global"
          value={formatVolume(globalProgress.totalVolume)}
          change={globalProgress.totalVolumeChange}
          changePercent={globalProgress.totalVolumeChangePercent}
          size="normal"
          onClick={() =>
            setChartModal({
              isOpen: true,
              title: 'Progreso Global',
              metricType: 'global',
            })
          }
        />

        {/* Mejor Serie */}
        <StatCard
          title="Mejor Serie"
          value={formatVolume(globalProgress.bestSet)}
          change={globalProgress.bestSetChange}
          changePercent={globalProgress.bestSetChangePercent}
          size="normal"
          onClick={() =>
            setChartModal({
              isOpen: true,
              title: 'Mejor Serie',
              metricType: 'best_set',
            })
          }
        />

        {/* Tren Superior */}
        <StatCard
          title="Tren Superior"
          value={formatVolume(globalProgress.upperBodyVolume)}
          change={globalProgress.upperBodyChange}
          changePercent={globalProgress.upperBodyChangePercent}
          size="normal"
          onClick={() =>
            setChartModal({
              isOpen: true,
              title: 'Tren Superior',
              metricType: 'upper_body',
            })
          }
        />

        {/* Tren Inferior */}
        <StatCard
          title="Tren Inferior"
          value={formatVolume(globalProgress.lowerBodyVolume)}
          change={globalProgress.lowerBodyChange}
          changePercent={globalProgress.lowerBodyChangePercent}
          size="normal"
          onClick={() =>
            setChartModal({
              isOpen: true,
              title: 'Tren Inferior',
              metricType: 'lower_body',
            })
          }
        />
      </div>

      {/* 3. FILTROS RÁPIDOS */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Filtrar:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todos ({exercisesProgress.length})
              </button>
              <button
                onClick={() => setStatusFilter('improving')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  statusFilter === 'improving'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ↑ Mejorando ({improvingCount})
              </button>
              <button
                onClick={() => setStatusFilter('declining')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  statusFilter === 'declining'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ↓ Declinando ({decliningCount})
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Grupo:</span>
            <select
              value={muscleGroupFilter}
              onChange={(e) =>
                setMuscleGroupFilter(e.target.value as MuscleGroup | 'all')
              }
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos</option>
              <option value={MuscleGroup.UPPER_BODY}>Tren Superior</option>
              <option value={MuscleGroup.LOWER_BODY}>Tren Inferior</option>
              <option value={MuscleGroup.CORE}>Core</option>
              <option value={MuscleGroup.FULL_BODY}>Cuerpo Completo</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. LISTA DE EJERCICIOS CON SEMÁFORO */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Análisis por Ejercicio
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {filteredExercises.length} ejercicio(s)
          </p>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredExercises.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No hay ejercicios que coincidan con los filtros seleccionados
            </div>
          ) : (
            filteredExercises.map((exercise) => (
              <ExerciseRow
                key={exercise.exerciseId}
                exercise={exercise}
                isAdmin={isAdmin}
                onClick={() =>
                  setChartModal({
                    isOpen: true,
                    title: exercise.exerciseName,
                    exerciseId: exercise.exerciseId,
                  })
                }
              />
            ))
          )}
        </div>
      </div>

      {/* 5. DETALLE POR GRUPOS MUSCULARES (solo para admin) */}
      {isAdmin && muscleGroupsProgress.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Progreso por Grupo Muscular
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {muscleGroupsProgress.map((group) => (
              <div
                key={group.muscleGroup}
                className="border border-gray-200 rounded-lg p-4"
              >
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  {getMuscleGroupName(group.muscleGroup)}
                </h4>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {formatVolume(group.currentWeekVolume)}
                </div>
                <div className="text-sm text-gray-600">
                  {formatPercentChange(group.volumeChangePercent)}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  {group.exerciseCount} ejercicio(s)
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de gráficas */}
      <ProgressChartModal
        isOpen={chartModal.isOpen}
        onClose={() => setChartModal({ isOpen: false, title: '' })}
        title={chartModal.title}
        clientId={clientId}
        criterion={criterion}
        exerciseId={chartModal.exerciseId}
        metricType={chartModal.metricType}
      />
    </div>
  )
}
