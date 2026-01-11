'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface MesocycleAssignModalProps {
  templateId?: string
  templateTitle?: string
  clientId?: string
  clients?: Array<{ id: string; name: string; email: string }>
  onClose: () => void
  onSuccess?: () => void
}

export default function MesocycleAssignModal({
  templateId: initialTemplateId,
  templateTitle: initialTemplateTitle,
  clientId,
  clients,
  onClose,
  onSuccess,
}: MesocycleAssignModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [templates, setTemplates] = useState<Array<{ id: string; title: string; numberOfDays: number }>>([])
  const [loadingTemplates, setLoadingTemplates] = useState(!initialTemplateId)
  const [formData, setFormData] = useState({
    templateId: initialTemplateId || '',
    clientId: clientId || '',
    startDate: new Date().toISOString().split('T')[0],
    durationWeeks: 20,
    trainerNotes: '',
  })

  useEffect(() => {
    if (!initialTemplateId) {
      fetchTemplates()
    }
  }, [initialTemplateId])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/admin/training-templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoadingTemplates(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!formData.clientId) {
      setError('Debes seleccionar un cliente')
      setLoading(false)
      return
    }

    if (!formData.templateId) {
      setError('Debes seleccionar una plantilla')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/admin/mesocycles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: formData.templateId,
          clientId: formData.clientId,
          startDate: new Date(formData.startDate).toISOString(),
          durationWeeks: formData.durationWeeks,
          trainerNotes: formData.trainerNotes,
        }),
      })

      if (response.ok) {
        router.refresh()
        if (onSuccess) onSuccess()
        onClose()
      } else {
        const data = await response.json()
        setError(data.error || 'Error al asignar el plan')
      }
    } catch (error) {
      setError('Error al asignar el plan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Asignar Plan de Entrenamiento</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={loading}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {initialTemplateTitle && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Plantilla:</strong> {initialTemplateTitle}
              </p>
            </div>
          )}

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!initialTemplateId && (
              <div>
                <Label htmlFor="templateId">Plantilla *</Label>
                {loadingTemplates ? (
                  <p className="text-sm text-gray-500">Cargando plantillas...</p>
                ) : (
                  <select
                    id="templateId"
                    value={formData.templateId}
                    onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    required
                  >
                    <option value="">Selecciona una plantilla...</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.title} ({template.numberOfDays} días/semana)
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {!clientId && clients && (
              <div>
                <Label htmlFor="clientId">Cliente *</Label>
                <select
                  id="clientId"
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  required
                >
                  <option value="">Selecciona un cliente...</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} ({client.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <Label htmlFor="startDate">Fecha de Inicio *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="durationWeeks">Duración (semanas) *</Label>
              <Input
                id="durationWeeks"
                type="number"
                min={1}
                max={52}
                value={formData.durationWeeks}
                onChange={(e) => setFormData({ ...formData, durationWeeks: parseInt(e.target.value) })}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Se crearán {formData.durationWeeks} microciclos automáticamente
              </p>
            </div>

            <div>
              <Label htmlFor="trainerNotes">Notas del Entrenador</Label>
              <Textarea
                id="trainerNotes"
                value={formData.trainerNotes}
                onChange={(e) => setFormData({ ...formData, trainerNotes: e.target.value })}
                placeholder="Notas específicas para este cliente sobre el plan..."
                rows={3}
              />
            </div>

            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-900">
                <strong>Nota:</strong> Si el cliente ya tiene un mesociclo activo, se desactivará automáticamente.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
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
                {loading ? 'Asignando...' : 'Asignar Plan'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
