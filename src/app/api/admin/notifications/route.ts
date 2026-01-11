import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role === 'CLIENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, title, message, scheduledFor } = body

    if (!userId || !title || !message) {
      return NextResponse.json(
        { error: 'Usuario, título y mensaje son requeridos' },
        { status: 400 }
      )
    }

    // Verificar que el cliente pertenece al trainer
    const client = await prisma.user.findFirst({
      where: {
        id: userId,
        role: 'CLIENT',
      },
    })

    if (!client) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type: 'message',
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        sentAt: scheduledFor ? null : new Date(),
      },
    })

    return NextResponse.json(notification)
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { error: 'Error al crear notificación' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role === 'CLIENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Si es admin/trainer, obtener TODAS las notificaciones del sistema
    // con información del cliente destinatario
    const notifications = await prisma.notification.findMany({
      where: {
        user: {
          role: 'CLIENT',
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // Limitar a las últimas 100 notificaciones
    })

    return NextResponse.json(notifications)
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Error al obtener notificaciones' },
      { status: 500 }
    )
  }
}
