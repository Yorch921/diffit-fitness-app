'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface TemplateCardActionsProps {
  templateId: string
  templateTitle: string
  hasAssignments: boolean
}

export default function TemplateCardActions({
  templateId,
  templateTitle,
  hasAssignments,
}: TemplateCardActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (
      !confirm(
        `¿Estás seguro de que quieres eliminar la plantilla "${templateTitle}"?\n\nEsta acción no se puede deshacer.`
      )
    ) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/training-templates/${templateId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.refresh()
      } else {
        const data = await response.json()
        alert(data.error || 'Error al eliminar la plantilla')
      }
    } catch (error) {
      alert('Error al eliminar la plantilla')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Link href={`/admin/training-templates/${templateId}`} className="flex-1">
        <Button variant="outline" className="w-full">
          Editar
        </Button>
      </Link>
      <Link href={`/admin/training-templates/${templateId}`} className="flex-1">
        <Button className="w-full">Ver Detalle</Button>
      </Link>
      {!hasAssignments && (
        <Button
          variant="outline"
          onClick={handleDelete}
          disabled={loading}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300"
          title="Eliminar plantilla"
        >
          {loading ? '...' : '🗑️'}
        </Button>
      )}
    </div>
  )
}
