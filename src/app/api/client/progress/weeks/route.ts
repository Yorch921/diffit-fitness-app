import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/client/progress/weeks
 *
 * Retorna lista de semanas con datos disponibles para análisis de progreso
 *
 * Parámetros:
 * - clientId: ID del cliente (requerido para trainers)
 * - includeAll: si es true, incluye todas las semanas (default: solo desde semana 2)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const includeAll = searchParams.get('includeAll') === 'true'
    let clientId: string

    if (session.user.role === 'TRAINER') {
      const clientIdParam = searchParams.get('clientId')
      if (!clientIdParam) {
        return NextResponse.json({ error: 'clientId requerido para trainers' }, { status: 400 })
      }

      const client = await prisma.user.findFirst({
        where: { id: clientIdParam, trainerId: session.user.id },
      })
      if (!client) {
        return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
      }
      clientId = clientIdParam
    } else {
      clientId = session.user.id
    }

    // Obtener mesociclo activo
    const activeMesocycle = await prisma.clientMesocycle.findFirst({
      where: { clientId, isActive: true },
    })

    if (!activeMesocycle) {
      return NextResponse.json([])
    }

    // Obtener todas las semanas con workout logs
    const whereClause: any = {
      mesocycleId: activeMesocycle.id,
      workoutDayLogs: { some: {} },
    }

    // Si no se incluyen todas, solo desde semana 2
    if (!includeAll) {
      whereClause.weekNumber = { gte: 2 }
    }

    const weeksWithData = await prisma.microcycle.findMany({
      where: whereClause,
      select: { weekNumber: true },
      orderBy: { weekNumber: 'asc' },
    })

    const weekNumbers = weeksWithData.map((w) => w.weekNumber)
    return NextResponse.json(weekNumbers)
  } catch (error) {
    console.error('Error fetching available weeks:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
