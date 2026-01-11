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
      trainingPlan: {
        orderBy: { createdAt: 'desc' },
        include: {
          weeks: {
            include: {
              sessions: true,
            },
          },
        },
      },
      workoutSessions: {
        orderBy: { completedAt: 'desc' },
        take: 10,
        include: {
          session: {
            include: {
              week: true,
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
    trainingPlan: client.trainingPlan.map((plan) => ({
      ...plan,
      startDate: plan.startDate.toISOString(),
      endDate: plan.endDate?.toISOString() || null,
      createdAt: plan.createdAt.toISOString(),
      updatedAt: plan.updatedAt.toISOString(),
      weeks: plan.weeks.map((week) => ({
        ...week,
        startDate: week.startDate.toISOString(),
        endDate: week.endDate.toISOString(),
        createdAt: week.createdAt.toISOString(),
        updatedAt: week.updatedAt.toISOString(),
        sessions: week.sessions.map((session) => ({
          ...session,
          createdAt: session.createdAt.toISOString(),
          updatedAt: session.updatedAt.toISOString(),
        })),
      })),
    })),
    workoutSessions: client.workoutSessions.map((workout) => ({
      ...workout,
      completedAt: workout.completedAt.toISOString(),
      session: {
        ...workout.session,
        createdAt: workout.session.createdAt.toISOString(),
        updatedAt: workout.session.updatedAt.toISOString(),
        week: {
          ...workout.session.week,
          startDate: workout.session.week.startDate.toISOString(),
          endDate: workout.session.week.endDate.toISOString(),
          createdAt: workout.session.week.createdAt.toISOString(),
          updatedAt: workout.session.week.updatedAt.toISOString(),
        },
      },
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
