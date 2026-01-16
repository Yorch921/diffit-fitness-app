import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  calculateExerciseProgress,
  calculateGlobalProgress,
  calculateMuscleGroupProgress,
  type VolumeCriterion,
} from '@/lib/progress-calculations'

/**
 * GET /api/client/progress/history
 *
 * Retorna progreso histórico de todas las semanas consecutivas con datos en el mesociclo activo
 *
 * Parámetros query:
 * - clientId: ID del cliente (requerido para trainers)
 * - criterion: 'balanced' | 'weight_focused' | 'reps_focused' (opcional, por defecto 'balanced')
 *
 * Retorna array de progreso por semana:
 * - weekNumber: número de semana
 * - comparedWith: número de semana anterior comparada
 * - exercisesProgress: progreso de cada ejercicio
 * - muscleGroupsProgress: progreso por grupo muscular
 * - globalProgress: progreso global
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const criterion = (searchParams.get('criterion') as VolumeCriterion) || 'balanced'

    // Determinar ID del cliente
    let clientId: string
    if (session.user.role === 'TRAINER') {
      const clientIdParam = searchParams.get('clientId')
      if (!clientIdParam) {
        return NextResponse.json(
          { error: 'clientId requerido para trainers' },
          { status: 400 }
        )
      }

      const client = await prisma.user.findFirst({
        where: { id: clientIdParam, trainerId: session.user.id },
      })
      if (!client) {
        return NextResponse.json(
          { error: 'Cliente no encontrado' },
          { status: 404 }
        )
      }
      clientId = clientIdParam
    } else {
      clientId = session.user.id
    }

    // Obtener mesociclo activo
    const activeMesocycle = await prisma.clientMesocycle.findFirst({
      where: { clientId, isActive: true },
      include: {
        microcycles: {
          orderBy: { weekNumber: 'asc' },
          include: {
            workoutDayLogs: {
              include: {
                exerciseLogs: {
                  include: {
                    exercise: {
                      select: {
                        id: true,
                        name: true,
                        muscleGroup: true,
                      },
                    },
                    setLogs: {
                      select: {
                        weight: true,
                        reps: true,
                      },
                      orderBy: { setNumber: 'asc' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!activeMesocycle) {
      return NextResponse.json(
        { error: 'No hay mesociclo activo' },
        { status: 404 }
      )
    }

    // Filtrar solo semanas con datos
    const weeksWithData = activeMesocycle.microcycles.filter(
      (m) => m.workoutDayLogs.length > 0
    )

    if (weeksWithData.length < 2) {
      return NextResponse.json(
        { error: 'Se necesitan al menos 2 semanas con datos' },
        { status: 404 }
      )
    }

    // Calcular progreso semana a semana
    const progressHistory = []

    for (let i = 1; i < weeksWithData.length; i++) {
      const currentWeek = weeksWithData[i]
      const previousWeek = weeksWithData[i - 1]

      // Agrupar ejercicios por ID
      const currentWeekExercises = new Map<string, any>()
      const previousWeekExercises = new Map<string, any>()

      // Procesar semana actual
      currentWeek.workoutDayLogs.forEach((log) => {
        log.exerciseLogs.forEach((exLog) => {
          const exerciseId = exLog.exercise.id
          if (!currentWeekExercises.has(exerciseId)) {
            currentWeekExercises.set(exerciseId, {
              id: exLog.id,
              exerciseId,
              exerciseName: exLog.exercise.name,
              muscleGroup: exLog.exercise.muscleGroup,
              sets: [],
            })
          }
          const exerciseData = currentWeekExercises.get(exerciseId)!
          exerciseData.sets.push(
            ...exLog.setLogs.map((s) => ({
              weight: s.weight,
              reps: s.reps,
            }))
          )
        })
      })

      // Procesar semana previa
      previousWeek.workoutDayLogs.forEach((log) => {
        log.exerciseLogs.forEach((exLog) => {
          const exerciseId = exLog.exercise.id
          if (!previousWeekExercises.has(exerciseId)) {
            previousWeekExercises.set(exerciseId, {
              id: exLog.id,
              exerciseId,
              exerciseName: exLog.exercise.name,
              muscleGroup: exLog.exercise.muscleGroup,
              sets: [],
            })
          }
          const exerciseData = previousWeekExercises.get(exerciseId)!
          exerciseData.sets.push(
            ...exLog.setLogs.map((s) => ({
              weight: s.weight,
              reps: s.reps,
            }))
          )
        })
      })

      // Calcular progreso solo para ejercicios comunes
      const exercisesProgress = []
      for (const [exerciseId, currentData] of currentWeekExercises) {
        const previousData = previousWeekExercises.get(exerciseId)
        if (previousData) {
          const progress = calculateExerciseProgress(
            exerciseId,
            currentData.exerciseName,
            currentData.muscleGroup,
            currentData.sets,
            previousData.sets,
            criterion
          )
          exercisesProgress.push(progress)
        }
      }

      if (exercisesProgress.length > 0) {
        const muscleGroupsProgress = calculateMuscleGroupProgress(exercisesProgress)
        const globalProgress = calculateGlobalProgress(exercisesProgress)

        progressHistory.push({
          weekNumber: currentWeek.weekNumber,
          comparedWith: previousWeek.weekNumber,
          startDate: currentWeek.startDate,
          endDate: currentWeek.endDate,
          exercisesProgress,
          muscleGroupsProgress,
          globalProgress,
        })
      }
    }

    return NextResponse.json({
      clientId,
      mesocycleId: activeMesocycle.id,
      criterion,
      progressHistory,
    })
  } catch (error) {
    console.error('Error fetching progress history:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
