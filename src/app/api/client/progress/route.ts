import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  calculateExerciseProgress,
  calculateGlobalProgress,
  calculateMuscleGroupProgress,
  type VolumeCriterion,
  type ExerciseLogData,
  type SetLogData,
} from '@/lib/progress-calculations'

/**
 * GET /api/client/progress
 *
 * Parámetros query:
 * - clientId: ID del cliente (requerido para admin, ignorado para cliente)
 * - currentWeek: número de semana actual (opcional, por defecto usa la última semana con datos)
 * - previousWeek: número de semana a comparar (opcional, por defecto usa currentWeek - 1)
 * - criterion: 'balanced' | 'weight_focused' | 'reps_focused' (opcional, por defecto 'balanced')
 *
 * Comportamiento:
 * - Si se especifican currentWeek y previousWeek, compara esas dos semanas
 * - Si solo se especifica currentWeek, compara con currentWeek - 1
 * - Si no se especifica nada, usa las dos últimas semanas con datos
 *
 * Retorna:
 * - clientInfo: información básica del cliente
 * - mesocycleInfo: información del mesociclo activo
 * - currentWeekNumber: número de semana actual
 * - previousWeekNumber: número de semana anterior
 * - criterion: criterio de cálculo usado
 * - exercisesProgress: array de progreso por ejercicio
 * - muscleGroupsProgress: array de progreso por grupo muscular
 * - globalProgress: progreso global
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Verificar sesión
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // 2. Obtener parámetros
    const searchParams = req.nextUrl.searchParams
    const criterion = (searchParams.get('criterion') as VolumeCriterion) || 'balanced'
    const requestedWeek = searchParams.get('currentWeek')
      ? parseInt(searchParams.get('currentWeek')!)
      : null
    const requestedPreviousWeek = searchParams.get('previousWeek')
      ? parseInt(searchParams.get('previousWeek')!)
      : null

    // 3. Determinar ID del cliente
    let clientId: string
    if (session.user.role === 'TRAINER') {
      const clientIdParam = searchParams.get('clientId')
      if (!clientIdParam) {
        return NextResponse.json(
          { error: 'clientId requerido para trainers' },
          { status: 400 }
        )
      }
      // Verificar que el cliente pertenece al trainer
      const client = await prisma.user.findFirst({
        where: {
          id: clientIdParam,
          trainerId: session.user.id,
        },
      })
      if (!client) {
        return NextResponse.json(
          { error: 'Cliente no encontrado o no autorizado' },
          { status: 404 }
        )
      }
      clientId = clientIdParam
    } else {
      // Cliente solo puede ver su propio progreso
      clientId = session.user.id
    }

    // 4. Obtener mesociclo activo del cliente
    const activeMesocycle = await prisma.clientMesocycle.findFirst({
      where: {
        clientId,
        isActive: true,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        template: {
          select: {
            id: true,
            title: true,
          },
        },
        microcycles: {
          orderBy: {
            weekNumber: 'asc',
          },
        },
      },
    })

    if (!activeMesocycle) {
      return NextResponse.json(
        { error: 'No hay mesociclo activo para este cliente' },
        { status: 404 }
      )
    }

    // 5. Determinar semana actual y semana previa
    let currentWeekNumber: number
    let currentMicrocycle
    let previousMicrocycle

    if (requestedWeek && requestedPreviousWeek) {
      // Usuario especificó ambas semanas explícitamente
      if (requestedPreviousWeek >= requestedWeek) {
        return NextResponse.json(
          { error: 'La semana previa debe ser anterior a la semana actual' },
          { status: 400 }
        )
      }
      currentWeekNumber = requestedWeek
      currentMicrocycle = activeMesocycle.microcycles.find(
        (m) => m.weekNumber === currentWeekNumber
      )
      previousMicrocycle = activeMesocycle.microcycles.find(
        (m) => m.weekNumber === requestedPreviousWeek
      )
    } else if (requestedWeek) {
      // Usar semana solicitada y calcular la anterior automáticamente
      currentWeekNumber = requestedWeek
      currentMicrocycle = activeMesocycle.microcycles.find(
        (m) => m.weekNumber === currentWeekNumber
      )
      previousMicrocycle = activeMesocycle.microcycles.find(
        (m) => m.weekNumber === currentWeekNumber - 1
      )
    } else {
      // Determinar semana actual basada en fecha
      const now = new Date()
      currentMicrocycle = activeMesocycle.microcycles.find((m) => {
        const start = new Date(m.startDate)
        const end = new Date(m.endDate)
        return now >= start && now <= end
      })

      if (!currentMicrocycle) {
        // Si no hay semana activa, usar la última semana con datos
        const lastMicrocycleWithData = await prisma.microcycle.findFirst({
          where: {
            mesocycleId: activeMesocycle.id,
            workoutDayLogs: {
              some: {},
            },
          },
          orderBy: {
            weekNumber: 'desc',
          },
        })

        if (!lastMicrocycleWithData) {
          return NextResponse.json(
            { error: 'No hay datos de entrenamiento registrados' },
            { status: 404 }
          )
        }

        currentMicrocycle = lastMicrocycleWithData
      }

      currentWeekNumber = currentMicrocycle.weekNumber
      previousMicrocycle = activeMesocycle.microcycles.find(
        (m) => m.weekNumber === currentWeekNumber - 1
      )
    }

    // 6. Validar que existen ambas semanas
    if (!currentMicrocycle) {
      return NextResponse.json(
        { error: 'Semana actual no encontrada' },
        { status: 404 }
      )
    }

    // Si no hay semana previa (ej: estamos en semana 1), buscar el par de semanas consecutivas
    // más reciente con datos
    if (!previousMicrocycle || currentWeekNumber === 1) {
      // Buscar las dos últimas semanas con datos
      const weeksWithData = await prisma.microcycle.findMany({
        where: {
          mesocycleId: activeMesocycle.id,
          workoutDayLogs: {
            some: {},
          },
        },
        orderBy: {
          weekNumber: 'desc',
        },
        take: 2,
      })

      if (weeksWithData.length < 2) {
        return NextResponse.json(
          { error: 'No hay semana previa para comparar. El análisis de progreso requiere al menos 2 semanas de datos.' },
          { status: 404 }
        )
      }

      // Usar las dos últimas semanas con datos (en orden descendente)
      currentMicrocycle = weeksWithData[0]
      previousMicrocycle = weeksWithData[1]
      currentWeekNumber = currentMicrocycle.weekNumber
    }

    // 7. Obtener workout logs de ambas semanas con ejercicios y series
    const [currentWeekLogs, previousWeekLogs] = await Promise.all([
      prisma.workoutDayLog.findMany({
        where: {
          microcycleId: currentMicrocycle.id,
        },
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
                orderBy: {
                  setNumber: 'asc',
                },
              },
            },
          },
        },
      }),
      prisma.workoutDayLog.findMany({
        where: {
          microcycleId: previousMicrocycle.id,
        },
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
                orderBy: {
                  setNumber: 'asc',
                },
              },
            },
          },
        },
      }),
    ])

    // 8. Agrupar exercise logs por exerciseId
    const currentWeekExercises = new Map<string, ExerciseLogData>()
    const previousWeekExercises = new Map<string, ExerciseLogData>()

    // Procesar semana actual
    currentWeekLogs.forEach((workoutLog) => {
      workoutLog.exerciseLogs.forEach((exLog) => {
        const exerciseId = exLog.exercise.id
        if (!currentWeekExercises.has(exerciseId)) {
          currentWeekExercises.set(exerciseId, {
            id: exLog.id,
            exerciseId: exerciseId,
            exerciseName: exLog.exercise.name,
            muscleGroup: exLog.exercise.muscleGroup,
            sets: [],
          })
        }
        // Agregar sets
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
    previousWeekLogs.forEach((workoutLog) => {
      workoutLog.exerciseLogs.forEach((exLog) => {
        const exerciseId = exLog.exercise.id
        if (!previousWeekExercises.has(exerciseId)) {
          previousWeekExercises.set(exerciseId, {
            id: exLog.id,
            exerciseId: exerciseId,
            exerciseName: exLog.exercise.name,
            muscleGroup: exLog.exercise.muscleGroup,
            sets: [],
          })
        }
        // Agregar sets
        const exerciseData = previousWeekExercises.get(exerciseId)!
        exerciseData.sets.push(
          ...exLog.setLogs.map((s) => ({
            weight: s.weight,
            reps: s.reps,
          }))
        )
      })
    })

    // 9. Calcular progreso solo para ejercicios que aparecen en ambas semanas
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

    // Si no hay ejercicios comunes, retornar error
    if (exercisesProgress.length === 0) {
      return NextResponse.json(
        { error: 'No hay ejercicios comunes entre ambas semanas para comparar' },
        { status: 404 }
      )
    }

    // 10. Calcular progreso por grupos musculares
    const muscleGroupsProgress = calculateMuscleGroupProgress(exercisesProgress)

    // 11. Calcular progreso global
    const globalProgress = calculateGlobalProgress(exercisesProgress)

    // 12. Preparar respuesta
    return NextResponse.json({
      clientInfo: {
        id: activeMesocycle.client.id,
        name: activeMesocycle.client.name,
        email: activeMesocycle.client.email,
      },
      mesocycleInfo: {
        id: activeMesocycle.id,
        templateTitle: activeMesocycle.template.title,
        startDate: activeMesocycle.startDate,
        durationWeeks: activeMesocycle.durationWeeks,
      },
      currentWeekNumber,
      previousWeekNumber: previousMicrocycle.weekNumber,
      criterion,
      exercisesProgress,
      muscleGroupsProgress,
      globalProgress,
    })
  } catch (error) {
    console.error('Error fetching client progress:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
