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
    const { userId, date, weight, chest, waist, hips, arms, legs, notes } = body

    if (!userId || !date) {
      return NextResponse.json(
        { error: 'Usuario y fecha son requeridos' },
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

    const measurement = await prisma.bodyMeasurement.create({
      data: {
        userId,
        date: new Date(date),
        weight: weight ? parseFloat(weight) : null,
        chest: chest ? parseFloat(chest) : null,
        waist: waist ? parseFloat(waist) : null,
        hips: hips ? parseFloat(hips) : null,
        arms: arms ? parseFloat(arms) : null,
        legs: legs ? parseFloat(legs) : null,
        notes: notes || null,
      },
    })

    return NextResponse.json(measurement)
  } catch (error) {
    console.error('Error creating body measurement:', error)
    return NextResponse.json(
      { error: 'Error al registrar medida' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId es requerido' },
        { status: 400 }
      )
    }

    const measurements = await prisma.bodyMeasurement.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json(measurements)
  } catch (error) {
    console.error('Error fetching body measurements:', error)
    return NextResponse.json(
      { error: 'Error al obtener medidas' },
      { status: 500 }
    )
  }
}
