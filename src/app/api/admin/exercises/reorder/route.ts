import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/admin/exercises/reorder - Reordenar ejercicios
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TRAINER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { templateDayId, exerciseOrders } = body

    // exerciseOrders: [{ id: string, order: number }]

    if (!templateDayId || !exerciseOrders || !Array.isArray(exerciseOrders)) {
      return NextResponse.json(
        { error: 'Datos inválidos' },
        { status: 400 }
      )
    }

    // Verificar que el día pertenece al trainer
    const templateDay = await prisma.templateDay.findFirst({
      where: {
        id: templateDayId,
        template: {
          trainerId: session.user.id,
        },
      },
    })

    if (!templateDay) {
      return NextResponse.json(
        { error: 'Template day not found' },
        { status: 404 }
      )
    }

    // Actualizar el orden de cada ejercicio
    await Promise.all(
      exerciseOrders.map((item: { id: string; order: number }) =>
        prisma.exercise.update({
          where: { id: item.id },
          data: { order: item.order },
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reordering exercises:', error)
    return NextResponse.json(
      { error: 'Error reordering exercises' },
      { status: 500 }
    )
  }
}
