import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import WorkoutDayLogForm from '@/components/WorkoutDayLogForm'

export default async function WorkoutDayLogPage({
  searchParams,
}: {
  searchParams: { microcycleId?: string; dayId?: string; edit?: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'CLIENT') {
    redirect('/login')
  }

  const { microcycleId, dayId, edit } = searchParams

  if (!microcycleId || !dayId) {
    notFound()
  }

  // Obtener microciclo con template day
  const microcycle = await prisma.microcycle.findFirst({
    where: {
      id: microcycleId,
      mesocycle: {
        clientId: session.user.id,
      },
    },
    include: {
      mesocycle: {
        select: {
          id: true,
          template: {
            select: {
              title: true,
            },
          },
        },
      },
    },
  })

  if (!microcycle) {
    notFound()
  }

  // Obtener día del template con ejercicios y series
  const templateDay = await prisma.templateDay.findFirst({
    where: {
      id: dayId,
    },
    include: {
      exercises: {
        orderBy: { order: 'asc' },
        include: {
          sets: {
            orderBy: { setNumber: 'asc' },
          },
        },
      },
    },
  })

  if (!templateDay) {
    notFound()
  }

  // Si estamos editando, obtener el log existente
  let existingLog = null
  if (edit) {
    existingLog = await prisma.workoutDayLog.findFirst({
      where: {
        id: edit,
        microcycleId: microcycle.id,
      },
      include: {
        exerciseLogs: {
          include: {
            exercise: true,
            setLogs: {
              orderBy: { setNumber: 'asc' },
            },
          },
        },
      },
    })
  }

  // Serializar datos
  const serializedData = {
    microcycle: {
      ...microcycle,
      startDate: microcycle.startDate.toISOString(),
      endDate: microcycle.endDate.toISOString(),
      createdAt: microcycle.createdAt.toISOString(),
      updatedAt: microcycle.updatedAt.toISOString(),
    },
    templateDay: {
      ...templateDay,
      createdAt: templateDay.createdAt.toISOString(),
      updatedAt: templateDay.updatedAt.toISOString(),
      exercises: templateDay.exercises.map((exercise) => ({
        ...exercise,
        createdAt: exercise.createdAt.toISOString(),
        updatedAt: exercise.updatedAt.toISOString(),
        sets: exercise.sets.map((set) => ({
          ...set,
          createdAt: set.createdAt.toISOString(),
          updatedAt: set.updatedAt.toISOString(),
        })),
      })),
    },
    existingLog: existingLog
      ? {
          ...existingLog,
          completedDate: existingLog.completedDate.toISOString(),
          createdAt: existingLog.createdAt.toISOString(),
          updatedAt: existingLog.updatedAt.toISOString(),
          exerciseLogs: existingLog.exerciseLogs.map((exLog: any) => ({
            ...exLog,
            createdAt: exLog.createdAt.toISOString(),
            updatedAt: exLog.updatedAt.toISOString(),
            exercise: {
              ...exLog.exercise,
              createdAt: exLog.exercise.createdAt.toISOString(),
              updatedAt: exLog.exercise.updatedAt.toISOString(),
            },
            setLogs: exLog.setLogs.map((setLog: any) => ({
              ...setLog,
              createdAt: setLog.createdAt.toISOString(),
              updatedAt: setLog.updatedAt.toISOString(),
            })),
          })),
        }
      : null,
  }

  return <WorkoutDayLogForm data={serializedData} />
}
