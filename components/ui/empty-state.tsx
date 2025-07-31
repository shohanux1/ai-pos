import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  message: string
  action?: React.ReactNode
}

export function EmptyState({ icon: Icon, message, action }: EmptyStateProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-8">
      <div className="text-center">
        <Icon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-500">{message}</p>
        {action && <div className="mt-4">{action}</div>}
      </div>
    </div>
  )
}