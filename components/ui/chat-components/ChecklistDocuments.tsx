import React from 'react';
import { FileText, CheckCircle, Circle, AlertCircle } from 'lucide-react';

interface DocumentItem {
  id: string;
  name: string;
  status: 'pending' | 'completed' | 'missing';
  description?: string;
}

interface ChecklistDocumentsProps {
  title: string;
  documents: DocumentItem[];
}

export function ChecklistDocuments({ title, documents }: ChecklistDocumentsProps) {
  const getStatusIcon = (status: DocumentItem['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'missing':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: DocumentItem['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-700 dark:text-green-400';
      case 'missing':
        return 'text-red-700 dark:text-red-400';
      default:
        return 'text-gray-700 dark:text-gray-300';
    }
  };

  const completedCount = documents.filter(doc => doc.status === 'completed').length;
  const totalCount = documents.length;

  return (
    <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
            <FileText className="h-5 w-5" />
            {title}
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {completedCount}/{totalCount}
          </span>
        </div>
      </div>
      <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
        {documents.map((doc) => (
          <div key={doc.id} className="flex items-start gap-3 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700">
            {getStatusIcon(doc.status)}
            <div className="flex-1 min-w-0">
              <div className={`font-medium text-sm ${getStatusColor(doc.status)}`}>
                {doc.name}
              </div>
              {doc.description && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {doc.description}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="px-4 pb-4">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(completedCount / totalCount) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}