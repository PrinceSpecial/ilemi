import React from 'react';
import { Phone, Mail, Building } from 'lucide-react';

interface ContactCardProps {
  name: string;
  phone?: string;
  email?: string;
}

export function ContactCard({ name, phone, email }: ContactCardProps) {
  return (
    <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
          <Building className="h-5 w-5" />
          {name}
        </h3>
      </div>
      <div className="p-4 space-y-3">
        {phone && (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <span className="text-sm text-gray-700 dark:text-gray-300">{phone}</span>
          </div>
        )}
        {email && (
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <span className="text-sm text-gray-700 dark:text-gray-300">{email}</span>
          </div>
        )}
      </div>
    </div>
  );
}