import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'TRAINER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { dayOrders } = await req.json()

    // Validar que el template pertenece al trainer
    const template = await prisma.trainingTemplate.findFirst({
      where: {
        id: params.id,
        trainerId: session.user.id,
      },
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Actualizar orden de cada día
    await Promise.all(
      dayOrders.map((item: { id: string; order: number }) =>
        prisma.templateDay.update({
          where: { id: item.id },
          data: { order: item.order },
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reordering days:', error)
    return NextResponse.json(
      { error: 'Error reordering days' },
      { status: 500 }
    )
  }
}
