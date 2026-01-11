'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function NewTrainingTemplatePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    numberOfDays: 5,
    trainerNotes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/admin/training-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const template = await response.json()
        router.push(`/admin/training-templates/${template.id}`)
      } else {
        const data = await response.json()
        setError(data.error || 'Error al crear la plantilla')
      }
    } catch (error) {
      setError('Error al crear la plantilla')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4 py-6 sm:px-0 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Nueva Plantilla de Entrenamiento</h1>
        <p className="mt-2 text-gray-600">
          Crea una plantilla reutilizable (semana tipo) para asignar a tus clientes
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información Básica</CardTitle>
          <CardDescription>
            Define el nombre y estructura de tu plantilla
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Nombre de la Plantilla *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ej: Fuerza General - 5 Días"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe el objetivo y enfoque de esta plantilla..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="numberOfDays">Días por Semana *</Label>
              <select
                id="numberOfDays"
                value={formData.numberOfDays}
                onChange={(e) => setFormData({ ...formData, numberOfDays: parseInt(e.target.value) })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              >
                <option value={3}>3 días</option>
                <option value={4}>4 días</option>
                <option value={5}>5 días</option>
              </select>
              <p className="text-xs text-gray-500">
                Selecciona cuántos días de entrenamiento tendrá esta semana tipo
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="trainerNotes">Notas del Entrenador</Label>
              <Textarea
                id="trainerNotes"
                value={formData.trainerNotes}
                onChange={(e) => setFormData({ ...formData, trainerNotes: e.target.value })}
                placeholder="Notas internas sobre metodología, progresión, etc..."
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Creando...' : 'Crear Plantilla'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          <strong>💡 Siguiente paso:</strong> Después de crear la plantilla, podrás agregar los días y ejercicios correspondientes.
        </p>
      </div>
    </div>
  )
}
