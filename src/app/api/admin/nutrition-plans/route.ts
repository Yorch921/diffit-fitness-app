import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role === 'CLIENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const clientId = formData.get('clientId') as string
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const startDate = formData.get('startDate') as string
    const endDate = formData.get('endDate') as string
    const file = formData.get('file') as File

    // Nuevos campos de macros
    const goal = formData.get('goal') as string
    const calories = formData.get('calories') as string
    const protein = formData.get('protein') as string
    const carbs = formData.get('carbs') as string
    const fats = formData.get('fats') as string
    const observations = formData.get('observations') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó archivo' },
        { status: 400 }
      )
    }

    // Verificar que el cliente pertenece al trainer
    const client = await prisma.user.findFirst({
      where: {
        id: clientId,
        trainerId: session.user.id,
      },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    // Crear directorio de uploads si no existe
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'nutrition')
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }

    // Guardar el archivo
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const filepath = path.join(uploadsDir, filename)
    await writeFile(filepath, buffer)

    const pdfUrl = `/uploads/nutrition/${filename}`

    // Desactivar planes anteriores
    await prisma.nutritionPlan.updateMany({
      where: {
        userId: clientId,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    })

    // Crear el plan nutricional
    const plan = await prisma.nutritionPlan.create({
      data: {
        userId: clientId,
        title,
        description: description || null,
        pdfUrl,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        isActive: true,
        // Campos de macros
        goal: goal as any || null,
        calories: calories ? parseInt(calories) : null,
        protein: protein ? parseFloat(protein) : null,
        carbs: carbs ? parseFloat(carbs) : null,
        fats: fats ? parseFloat(fats) : null,
        observations: observations || null,
      },
    })

    return NextResponse.json(plan)
  } catch (error) {
    console.error('Error creating nutrition plan:', error)
    return NextResponse.json(
      { error: 'Error al crear plan nutricional' },
      { status: 500 }
    )
  }
}
