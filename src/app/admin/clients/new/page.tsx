'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function NewClientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    // Campos básicos
    name: '',
    email: '',
    password: '',

    // Campos nuevos - Datos personales
    age: '',
    gender: 'MALE',
    height: '',
    initialWeight: '',
    goal: '',
    clinicalNotes: '',
    nextReviewDate: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Preparar datos para enviar
      const dataToSend = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        age: formData.age ? parseInt(formData.age) : null,
        gender: formData.gender || null,
        height: formData.height ? parseFloat(formData.height) : null,
        initialWeight: formData.initialWeight ? parseFloat(formData.initialWeight) : null,
        goal: formData.goal || null,
        clinicalNotes: formData.clinicalNotes || null,
        nextReviewDate: formData.nextReviewDate ? new Date(formData.nextReviewDate).toISOString() : null,
      }

      const response = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear cliente')
      }

      router.push('/admin/clients')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4 py-6 sm:px-0 max-w-3xl mx-auto">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()}>
          ← Volver
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Añadir Nuevo Cliente</CardTitle>
          <CardDescription>
            Crea un perfil completo para tu nuevo cliente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sección: Datos de Cuenta */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Datos de Cuenta</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre Completo *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Juan Pérez"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="juan@ejemplo.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Mínimo 8 caracteres"
                    minLength={8}
                    required
                  />
                  <p className="text-sm text-gray-500">
                    El cliente podrá cambiar su contraseña después del primer inicio de sesión
                  </p>
                </div>
              </div>
            </div>

            {/* Sección: Datos Personales */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Datos Personales</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Edad</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    placeholder="30"
                    min="1"
                    max="120"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Sexo</Label>
                  <select
                    id="gender"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="MALE">Masculino</option>
                    <option value="FEMALE">Femenino</option>
                    <option value="OTHER">Otro</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="height">Altura (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    step="0.1"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                    placeholder="175"
                    min="50"
                    max="250"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="initialWeight">Peso Inicial (kg)</Label>
                  <Input
                    id="initialWeight"
                    type="number"
                    step="0.1"
                    value={formData.initialWeight}
                    onChange={(e) => setFormData({ ...formData, initialWeight: e.target.value })}
                    placeholder="70"
                    min="20"
                    max="300"
                  />
                </div>
              </div>
            </div>

            {/* Sección: Objetivo y Observaciones */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Objetivo y Observaciones</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="goal">Objetivo</Label>
                  <textarea
                    id="goal"
                    value={formData.goal}
                    onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                    placeholder="Describe el objetivo principal del cliente (ej: perder 10kg, ganar masa muscular, mejorar condición física...)"
                    className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clinicalNotes">Observaciones Clínicas</Label>
                  <textarea
                    id="clinicalNotes"
                    value={formData.clinicalNotes}
                    onChange={(e) => setFormData({ ...formData, clinicalNotes: e.target.value })}
                    placeholder="Intolerancias alimentarias, alergias, patologías, lesiones, medicación..."
                    className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                  <p className="text-sm text-gray-500">
                    Información médica relevante para el plan nutricional y de entrenamiento
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nextReviewDate">Fecha de Próxima Revisión</Label>
                  <Input
                    id="nextReviewDate"
                    type="date"
                    value={formData.nextReviewDate}
                    onChange={(e) => setFormData({ ...formData, nextReviewDate: e.target.value })}
                  />
                  <p className="text-sm text-gray-500">
                    Programa una fecha para la primera revisión del cliente
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creando...' : 'Crear Cliente'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
