import { MuscleGroup } from '@prisma/client'

// ============================================================================
// TIPOS
// ============================================================================

export type VolumeCriterion = 'balanced' | 'weight_focused' | 'reps_focused'

export type TrafficLightStatus = 'improving' | 'maintaining' | 'declining'

export interface SetLogData {
  weight: number
  reps: number
}

export interface ExerciseLogData {
  id: string
  exerciseId: string
  exerciseName: string
  muscleGroup: MuscleGroup
  sets: SetLogData[]
}

export interface WeekData {
  weekNumber: number
  exercises: ExerciseLogData[]
}

export interface ExerciseProgress {
  exerciseId: string
  exerciseName: string
  muscleGroup: MuscleGroup
  currentWeekVolume: number
  previousWeekVolume: number
  volumeChange: number
  volumeChangePercent: number
  currentWeekBestSet: number
  previousWeekBestSet: number
  bestSetChange: number
  bestSetChangePercent: number
  status: TrafficLightStatus
}

export interface MuscleGroupProgress {
  muscleGroup: MuscleGroup
  currentWeekVolume: number
  previousWeekVolume: number
  volumeChange: number
  volumeChangePercent: number
  exerciseCount: number
}

export interface GlobalProgress {
  totalVolume: number
  previousTotalVolume: number
  totalVolumeChange: number
  totalVolumeChangePercent: number
  bestSet: number
  previousBestSet: number
  bestSetChange: number
  bestSetChangePercent: number
  upperBodyVolume: number
  previousUpperBodyVolume: number
  upperBodyChange: number
  upperBodyChangePercent: number
  lowerBodyVolume: number
  previousLowerBodyVolume: number
  lowerBodyChange: number
  lowerBodyChangePercent: number
}

// ============================================================================
// FUNCIONES DE CÁLCULO DE VOLUMEN
// ============================================================================

/**
 * Calcula el volumen de una serie según el criterio especificado
 */
export function calculateSetVolume(
  weight: number,
  reps: number,
  criterion: VolumeCriterion = 'balanced'
): number {
  switch (criterion) {
    case 'balanced':
      // Volumen balanceado: peso × reps
      return weight * reps

    case 'weight_focused':
      // Enfocado en peso: peso^1.3 × reps^0.7
      return Math.pow(weight, 1.3) * Math.pow(reps, 0.7)

    case 'reps_focused':
      // Enfocado en reps: peso^0.7 × reps^1.3
      return Math.pow(weight, 0.7) * Math.pow(reps, 1.3)

    default:
      return weight * reps
  }
}

/**
 * Calcula el volumen total de un ejercicio (suma de todas las series)
 */
export function calculateExerciseVolume(
  sets: SetLogData[],
  criterion: VolumeCriterion = 'balanced'
): number {
  return sets.reduce((total, set) => {
    return total + calculateSetVolume(set.weight, set.reps, criterion)
  }, 0)
}

/**
 * Calcula la mejor serie de un ejercicio (mayor volumen en una sola serie)
 */
export function calculateBestSet(
  sets: SetLogData[],
  criterion: VolumeCriterion = 'balanced'
): number {
  if (sets.length === 0) return 0

  return Math.max(
    ...sets.map((set) => calculateSetVolume(set.weight, set.reps, criterion))
  )
}

// ============================================================================
// FUNCIONES DE COMPARACIÓN Y CLASIFICACIÓN
// ============================================================================

/**
 * Calcula el porcentaje de cambio entre dos valores
 */
export function calculatePercentChange(
  currentValue: number,
  previousValue: number
): number {
  if (previousValue === 0) {
    return currentValue > 0 ? 100 : 0
  }
  return ((currentValue - previousValue) / previousValue) * 100
}

/**
 * Determina el estado del semáforo según el porcentaje de cambio
 * - Verde (improving): > 2%
 * - Amarillo (maintaining): -2% a 2%
 * - Rojo (declining): < -2%
 */
export function getTrafficLightStatus(percentChange: number): TrafficLightStatus {
  if (percentChange > 2) return 'improving'
  if (percentChange < -2) return 'declining'
  return 'maintaining'
}

/**
 * Obtiene un mensaje legible para el estado del semáforo
 */
export function getTrafficLightMessage(
  status: TrafficLightStatus,
  isAdmin: boolean
): string {
  if (isAdmin) {
    // Mensajes técnicos para admin
    switch (status) {
      case 'improving':
        return 'Mejorando'
      case 'maintaining':
        return 'Manteniendo'
      case 'declining':
        return 'Declinando'
    }
  } else {
    // Mensajes simples para cliente
    switch (status) {
      case 'improving':
        return 'Vas bien'
      case 'maintaining':
        return 'Estable'
      case 'declining':
        return 'Revisa esto'
    }
  }
}

// ============================================================================
// FUNCIONES DE ANÁLISIS DE PROGRESO
// ============================================================================

/**
 * Calcula el progreso de un ejercicio entre dos semanas
 */
export function calculateExerciseProgress(
  exerciseId: string,
  exerciseName: string,
  muscleGroup: MuscleGroup,
  currentWeekSets: SetLogData[],
  previousWeekSets: SetLogData[],
  criterion: VolumeCriterion = 'balanced'
): ExerciseProgress {
  // Calcular volúmenes
  const currentWeekVolume = calculateExerciseVolume(currentWeekSets, criterion)
  const previousWeekVolume = calculateExerciseVolume(previousWeekSets, criterion)
  const volumeChange = currentWeekVolume - previousWeekVolume
  const volumeChangePercent = calculatePercentChange(
    currentWeekVolume,
    previousWeekVolume
  )

  // Calcular mejores series
  const currentWeekBestSet = calculateBestSet(currentWeekSets, criterion)
  const previousWeekBestSet = calculateBestSet(previousWeekSets, criterion)
  const bestSetChange = currentWeekBestSet - previousWeekBestSet
  const bestSetChangePercent = calculatePercentChange(
    currentWeekBestSet,
    previousWeekBestSet
  )

  // Determinar estado (usamos el cambio de volumen como criterio principal)
  const status = getTrafficLightStatus(volumeChangePercent)

  return {
    exerciseId,
    exerciseName,
    muscleGroup,
    currentWeekVolume,
    previousWeekVolume,
    volumeChange,
    volumeChangePercent,
    currentWeekBestSet,
    previousWeekBestSet,
    bestSetChange,
    bestSetChangePercent,
    status,
  }
}

/**
 * Agrupa ejercicios por grupo muscular y calcula progreso por grupo
 */
export function calculateMuscleGroupProgress(
  exercisesProgress: ExerciseProgress[]
): MuscleGroupProgress[] {
  // Agrupar por grupo muscular
  const groupedByMuscle = exercisesProgress.reduce((acc, exercise) => {
    if (!acc[exercise.muscleGroup]) {
      acc[exercise.muscleGroup] = []
    }
    acc[exercise.muscleGroup].push(exercise)
    return acc
  }, {} as Record<MuscleGroup, ExerciseProgress[]>)

  // Calcular progreso por grupo
  return Object.entries(groupedByMuscle).map(([muscleGroup, exercises]) => {
    const currentWeekVolume = exercises.reduce(
      (sum, ex) => sum + ex.currentWeekVolume,
      0
    )
    const previousWeekVolume = exercises.reduce(
      (sum, ex) => sum + ex.previousWeekVolume,
      0
    )
    const volumeChange = currentWeekVolume - previousWeekVolume
    const volumeChangePercent = calculatePercentChange(
      currentWeekVolume,
      previousWeekVolume
    )

    return {
      muscleGroup: muscleGroup as MuscleGroup,
      currentWeekVolume,
      previousWeekVolume,
      volumeChange,
      volumeChangePercent,
      exerciseCount: exercises.length,
    }
  })
}

/**
 * Calcula el progreso global y por grupos musculares principales
 */
export function calculateGlobalProgress(
  exercisesProgress: ExerciseProgress[]
): GlobalProgress {
  // Volumen total
  const totalVolume = exercisesProgress.reduce(
    (sum, ex) => sum + ex.currentWeekVolume,
    0
  )
  const previousTotalVolume = exercisesProgress.reduce(
    (sum, ex) => sum + ex.previousWeekVolume,
    0
  )
  const totalVolumeChange = totalVolume - previousTotalVolume
  const totalVolumeChangePercent = calculatePercentChange(
    totalVolume,
    previousTotalVolume
  )

  // Mejor serie global
  const bestSet = Math.max(
    ...exercisesProgress.map((ex) => ex.currentWeekBestSet),
    0
  )
  const previousBestSet = Math.max(
    ...exercisesProgress.map((ex) => ex.previousWeekBestSet),
    0
  )
  const bestSetChange = bestSet - previousBestSet
  const bestSetChangePercent = calculatePercentChange(bestSet, previousBestSet)

  // Tren superior
  const upperBodyExercises = exercisesProgress.filter(
    (ex) => ex.muscleGroup === MuscleGroup.UPPER_BODY
  )
  const upperBodyVolume = upperBodyExercises.reduce(
    (sum, ex) => sum + ex.currentWeekVolume,
    0
  )
  const previousUpperBodyVolume = upperBodyExercises.reduce(
    (sum, ex) => sum + ex.previousWeekVolume,
    0
  )
  const upperBodyChange = upperBodyVolume - previousUpperBodyVolume
  const upperBodyChangePercent = calculatePercentChange(
    upperBodyVolume,
    previousUpperBodyVolume
  )

  // Tren inferior
  const lowerBodyExercises = exercisesProgress.filter(
    (ex) => ex.muscleGroup === MuscleGroup.LOWER_BODY
  )
  const lowerBodyVolume = lowerBodyExercises.reduce(
    (sum, ex) => sum + ex.currentWeekVolume,
    0
  )
  const previousLowerBodyVolume = lowerBodyExercises.reduce(
    (sum, ex) => sum + ex.previousWeekVolume,
    0
  )
  const lowerBodyChange = lowerBodyVolume - previousLowerBodyVolume
  const lowerBodyChangePercent = calculatePercentChange(
    lowerBodyVolume,
    previousLowerBodyVolume
  )

  return {
    totalVolume,
    previousTotalVolume,
    totalVolumeChange,
    totalVolumeChangePercent,
    bestSet,
    previousBestSet,
    bestSetChange,
    bestSetChangePercent,
    upperBodyVolume,
    previousUpperBodyVolume,
    upperBodyChange,
    upperBodyChangePercent,
    lowerBodyVolume,
    previousLowerBodyVolume,
    lowerBodyChange,
    lowerBodyChangePercent,
  }
}

// ============================================================================
// FUNCIONES DE FILTRADO
// ============================================================================

/**
 * Filtra ejercicios por estado del semáforo
 */
export function filterByStatus(
  exercises: ExerciseProgress[],
  status: TrafficLightStatus | 'all'
): ExerciseProgress[] {
  if (status === 'all') return exercises
  return exercises.filter((ex) => ex.status === status)
}

/**
 * Filtra ejercicios por grupo muscular
 */
export function filterByMuscleGroup(
  exercises: ExerciseProgress[],
  muscleGroup: MuscleGroup | 'all'
): ExerciseProgress[] {
  if (muscleGroup === 'all') return exercises
  return exercises.filter((ex) => ex.muscleGroup === muscleGroup)
}

// ============================================================================
// FUNCIONES DE FORMATO
// ============================================================================

/**
 * Formatea un número de volumen para mostrar
 */
export function formatVolume(volume: number): string {
  return Math.round(volume).toLocaleString('es-ES')
}

/**
 * Formatea un porcentaje con signo
 */
export function formatPercentChange(percent: number): string {
  const sign = percent > 0 ? '+' : ''
  return `${sign}${percent.toFixed(1)}%`
}

/**
 * Obtiene el nombre legible del grupo muscular
 */
export function getMuscleGroupName(muscleGroup: MuscleGroup): string {
  switch (muscleGroup) {
    case MuscleGroup.UPPER_BODY:
      return 'Tren Superior'
    case MuscleGroup.LOWER_BODY:
      return 'Tren Inferior'
    case MuscleGroup.CORE:
      return 'Core'
    case MuscleGroup.FULL_BODY:
      return 'Cuerpo Completo'
  }
}
