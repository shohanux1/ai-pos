'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

interface PageHeaderProps {
  title: string
  backUrl?: string
  actions?: React.ReactNode
}

export function PageHeader({ title, backUrl, actions }: PageHeaderProps) {
  const router = useRouter()
  
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        {backUrl && (
          <button 
            className="btn btn-ghost btn-sm p-2"
            onClick={() => router.push(backUrl)}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <h1 className="text-3xl font-bold">{title}</h1>
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  )
}