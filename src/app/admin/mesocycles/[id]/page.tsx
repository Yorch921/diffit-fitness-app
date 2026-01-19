import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import MesocycleEditor from '@/components/MesocycleEditor'

export default async function MesocycleDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'TRAINER') {
    redirect('/login')
  }

  const mesocycle = await prisma.clientMesocycle.findFirst({
    where: {
      id: params.id,
      trainerId: session.user.id,
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
        include: {
          days: {
            orderBy: { order: 'asc' },
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
          },
        },
      },
      // Incluir clientDays para soportar fork-on-write
      clientDays: {
        orderBy: { order: 'asc' },
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
      },
      microcycles: {
        orderBy: { weekNumber: 'asc' },
      },
    },
  })

  if (!mesocycle) {
    notFound()
  }

  // Serializar fechas y manejar casos donde template puede ser null (isForked = true)
  const serializedMesocycle = {
    ...mesocycle,
    startDate: mesocycle.startDate.toISOString(),
    endDate: mesocycle.endDate.toISOString(),
    completedAt: mesocycle.completedAt?.toISOString() || null,
    createdAt: mesocycle.createdAt.toISOString(),
    updatedAt: mesocycle.updatedAt.toISOString(),
    // Template puede ser null cuando isForked = true
    template: mesocycle.template ? {
      ...mesocycle.template,
      createdAt: mesocycle.template.createdAt.toISOString(),
      updatedAt: mesocycle.template.updatedAt.toISOString(),
      days: mesocycle.template.days.map((day) => ({
        ...day,
        createdAt: day.createdAt.toISOString(),
        updatedAt: day.updatedAt.toISOString(),
        exercises: day.exercises.map((exercise) => ({
          ...exercise,
          createdAt: exercise.createdAt.toISOString(),
          updatedAt: exercise.updatedAt.toISOString(),
          sets: exercise.sets.map((set) => ({
            ...set,
            createdAt: set.createdAt.toISOString(),
            updatedAt: set.updatedAt.toISOString(),
          })),
        })),
      })),
    } : null,
    // Serializar clientDays para fork-on-write
    clientDays: mesocycle.clientDays.map((day) => ({
      ...day,
      createdAt: day.createdAt.toISOString(),
      updatedAt: day.updatedAt.toISOString(),
      exercises: day.exercises.map((exercise) => ({
        ...exercise,
        createdAt: exercise.createdAt.toISOString(),
        updatedAt: exercise.updatedAt.toISOString(),
        sets: exercise.sets.map((set) => ({
          ...set,
          createdAt: set.createdAt.toISOString(),
          updatedAt: set.updatedAt.toISOString(),
        })),
      })),
    })),
    microcycles: mesocycle.microcycles.map((m) => ({
      ...m,
      startDate: m.startDate.toISOString(),
      endDate: m.endDate.toISOString(),
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
    })),
  }

  return <MesocycleEditor mesocycle={serializedMesocycle} />
}
