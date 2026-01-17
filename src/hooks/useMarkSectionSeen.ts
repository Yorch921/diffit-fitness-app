'use client'

import { useEffect } from 'react'

type Section = 'notifications' | 'reviews' | 'nutrition' | 'training'

export function useMarkSectionSeen(section: Section) {
  useEffect(() => {
    const markAsSeen = async () => {
      try {
        await fetch('/api/client/updates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ section }),
        })
      } catch (error) {
        console.error('Error marking section as seen:', error)
      }
    }

    markAsSeen()
  }, [section])
}
