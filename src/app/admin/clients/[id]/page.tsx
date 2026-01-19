import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import ClientDetailTabs from '@/components/ClientDetailTabs'

export default async function ClientDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)

  const isTrainerOrAdmin = session?.user.role === 'TRAINER' || session?.user.role === 'ADMIN'

  const client = await prisma.user.findFirst({
    where: isTrainerOrAdmin
      ? {
          id: params.id,
          trainerId: session!.user.id,
        }
      : {
          id: params.id,
          role: 'CLIENT',
        },
    include: {
      nutritionPlan: {
        orderBy: { createdAt: 'desc' },
      },
      clientMesocycles: {
        orderBy: { createdAt: 'desc' },
        include: {
          template: {
            include: {
              days: {
                include: {
                  exercises: true,
                },
              },
            },
          },
          clientDays: {
            orderBy: { dayNumber: 'asc' },
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
            include: {
              _count: {
                select: { workoutDayLogs: true },
              },
            },
          },
        },
      },
      weightEntry: {
        orderBy: { date: 'desc' },
      },
      files: {
        where: { type: 'IMAGE' },
        orderBy: { createdAt: 'desc' },
      },
      bodyMeasurements: {
        orderBy: { date: 'desc' },
      },
      nutritionistComments: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!client) {
    notFound()
  }

  // Serializar dates para pasar al Client Component
  const serializedClient = {
    ...client,
    createdAt: client.createdAt.toISOString(),
    updatedAt: client.updatedAt.toISOString(),
    nextReviewDate: client.nextReviewDate?.toISOString() || null,
    nutritionPlan: client.nutritionPlan.map((plan) => ({
      ...plan,
      startDate: plan.startDate.toISOString(),
      endDate: plan.endDate?.toISOString() || null,
      createdAt: plan.createdAt.toISOString(),
      updatedAt: plan.updatedAt.toISOString(),
    })),
    clientMesocycles: client.clientMesocycles.map((mesocycle) => ({
      ...mesocycle,
      startDate: mesocycle.startDate.toISOString(),
      endDate: mesocycle.endDate.toISOString(),
      completedAt: mesocycle.completedAt?.toISOString() || null,
      createdAt: mesocycle.createdAt.toISOString(),
      updatedAt: mesocycle.updatedAt.toISOString(),
      template: mesocycle.template
        ? {
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
              })),
            })),
          }
        : null,
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
      microcycles: mesocycle.microcycles.map((microcycle) => ({
        ...microcycle,
        startDate: microcycle.startDate.toISOString(),
        endDate: microcycle.endDate.toISOString(),
        createdAt: microcycle.createdAt.toISOString(),
        updatedAt: microcycle.updatedAt.toISOString(),
      })),
    })),
    weightEntry: client.weightEntry.map((entry) => ({
      ...entry,
      date: entry.date.toISOString(),
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString(),
    })),
    files: client.files.map((file) => ({
      ...file,
      createdAt: file.createdAt.toISOString(),
      updatedAt: file.updatedAt.toISOString(),
    })),
    bodyMeasurements: client.bodyMeasurements.map((measurement) => ({
      ...measurement,
      date: measurement.date.toISOString(),
      createdAt: measurement.createdAt.toISOString(),
    })),
    nutritionistComments: client.nutritionistComments.map((comment) => ({
      ...comment,
      createdAt: comment.createdAt.toISOString(),
    })),
  }

  return <ClientDetailTabs client={serializedClient} />
}
