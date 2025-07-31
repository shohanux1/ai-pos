import { AlertCircle, X } from 'lucide-react';

interface ErrorAlertProps {
  errors: Array<{ message: string; path?: string[] }>;
  onClose?: () => void;
}

export function ErrorAlert({ errors, onClose }: ErrorAlertProps) {
  if (!errors || errors.length === 0) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <div className="flex items-start">
        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-900 mb-1">
            Validation Errors
          </h3>
          <ul className="text-sm text-red-700 space-y-1">
            {errors.map((error, index) => (
              <li key={index}>
                {error.path && error.path.length > 0 && (
                  <span className="font-medium">{error.path.join('.')}: </span>
                )}
                {error.message}
              </li>
            ))}
          </ul>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-3 text-red-600 hover:text-red-800"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}