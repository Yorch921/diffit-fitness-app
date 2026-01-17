import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/client/updates
 * Obtiene indicadores de novedades para el cliente
 * Devuelve contadores de items no vistos en cada seccion
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const clientId = session.user.id

    // Obtener el usuario con sus fechas de ultimo acceso
    const user = await prisma.user.findUnique({
      where: { id: clientId },
      select: {
        lastSeenNotifications: true,
        lastSeenReviews: true,
        lastSeenNutrition: true,
        lastSeenTraining: true,
      },
    })

    // Valores por defecto si no existen
    const lastSeenNotifications = user?.lastSeenNotifications || new Date(0)
    const lastSeenReviews = user?.lastSeenReviews || new Date(0)
    const lastSeenNutrition = user?.lastSeenNutrition || new Date(0)
    const lastSeenTraining = user?.lastSeenTraining || new Date(0)

    // Contar notificaciones no leidas
    const unreadNotifications = await prisma.notification.count({
      where: {
        userId: clientId,
        read: false,
      },
    })

    // Contar revisiones nuevas desde la ultima visita
    const newReviews = await prisma.review.count({
      where: {
        userId: clientId,
        createdAt: { gt: lastSeenReviews },
      },
    })

    // Verificar si hay cambios en el plan nutricional
    const nutritionPlanUpdated = await prisma.nutritionPlan.findFirst({
      where: {
        userId: clientId,
        isActive: true,
        updatedAt: { gt: lastSeenNutrition },
      },
    })

    // Verificar si hay cambios en el mesociclo/plan de entrenamiento
    const trainingUpdated = await prisma.clientMesocycle.findFirst({
      where: {
        clientId: clientId,
        isActive: true,
        updatedAt: { gt: lastSeenTraining },
      },
    })

    return NextResponse.json({
      notifications: unreadNotifications,
      reviews: newReviews,
      nutrition: nutritionPlanUpdated ? 1 : 0,
      training: trainingUpdated ? 1 : 0,
    })
  } catch (error) {
    console.error('Error fetching client updates:', error)
    return NextResponse.json(
      { error: 'Error al obtener novedades' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/client/updates
 * Marca una seccion como vista (actualiza lastSeen)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { section } = body

    if (!section) {
      return NextResponse.json({ error: 'Section is required' }, { status: 400 })
    }

    const updateData: any = {}
    const now = new Date()

    switch (section) {
      case 'notifications':
        updateData.lastSeenNotifications = now
        break
      case 'reviews':
        updateData.lastSeenReviews = now
        break
      case 'nutrition':
        updateData.lastSeenNutrition = now
        break
      case 'training':
        updateData.lastSeenTraining = now
        break
      default:
        return NextResponse.json({ error: 'Invalid section' }, { status: 400 })
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating last seen:', error)
    return NextResponse.json(
      { error: 'Error al actualizar' },
      { status: 500 }
    )
  }
}
