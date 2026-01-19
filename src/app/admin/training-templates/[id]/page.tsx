import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import TemplateEditor from '@/components/TemplateEditor'

export default async function TemplateDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'TRAINER') {
    redirect('/login')
  }

  const template = await prisma.trainingTemplate.findFirst({
    where: {
      id: params.id,
      trainerId: session.user.id,
    },
    include: {
      days: {
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
      mesocycles: {
        where: {
          isActive: true,
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
        },
      },
    },
  })

  if (!template) {
    notFound()
  }

  // Serializar fechas
  const serializedTemplate = {
    ...template,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
    days: template.days.map((day) => ({
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
    mesocycles: template.mesocycles.map((m) => ({
      ...m,
      startDate: m.startDate.toISOString(),
      endDate: m.endDate.toISOString(),
      completedAt: m.completedAt?.toISOString() || null,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
    })),
  }

  return <TemplateEditor template={serializedTemplate} />
}
