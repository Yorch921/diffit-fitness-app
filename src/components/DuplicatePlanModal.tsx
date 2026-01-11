'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Client {
  id: string
  name: string | null
  email: string
}

interface DuplicatePlanModalProps {
  planId: string
  planTitle: string
  clients: Client[]
  onClose: () => void
  onSuccess: () => void
}

export default function DuplicatePlanModal({
  planId,
  planTitle,
  clients,
  onClose,
  onSuccess,
}: DuplicatePlanModalProps) {
  const [formData, setFormData] = useState({
    clientId: '',
    title: `${planTitle} (Copia)`,
    startDate: new Date().toISOString().split('T')[0],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.clientId) {
      setError('Debes seleccionar un cliente')
      return
    }

    if (!formData.title.trim()) {
      setError('El título es obligatorio')
      return
    }

    if (!formData.startDate) {
      setError('La fecha de inicio es obligatoria')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/admin/training-plans/${planId}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        onSuccess()
        onClose()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Error al duplicar el plan')
      }
    } catch (error) {
      console.error('Error duplicating plan:', error)
      setError('Error al duplicar el plan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Duplicar Plan de Entrenamiento</CardTitle>
          <CardDescription>
            Crea una copia de &quot;{planTitle}&quot; para otro cliente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="clientId">Cliente Destino *</Label>
              <select
                id="clientId"
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Seleccionar cliente...</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name || client.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Título del Nuevo Plan *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ej: Plan de Hipertrofia - Abril 2024"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Fecha de Inicio *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
              <p className="text-xs text-gray-500">
                El plan será marcado como activo y desactivará otros planes del cliente
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Duplicando...' : 'Duplicar Plan'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
