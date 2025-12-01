import React from 'react';
import { Lead } from '../types';
import { formatDistanceToNow } from '../utils';
import { ClockIcon } from './icons';

interface LeadListProps {
  leads: Lead[];
  selectedLeadId: string | null;
  onSelect: (lead: Lead) => void;
}

export default function LeadList({ leads, selectedLeadId, onSelect }: LeadListProps) {
  const sortedLeads = [...leads].sort((a, b) => {
    const dateA = a.LastUpdated ? new Date(a.LastUpdated).getTime() : 0;
    const dateB = b.LastUpdated ? new Date(b.LastUpdated).getTime() : 0;
    return dateB - dateA;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-green-100 text-green-800';
      case 'Closed': return 'bg-gray-200 text-gray-800';
      case 'Not Interested': return 'bg-red-100 text-red-800';
      case 'Callback': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 overflow-y-auto">
      {sortedLeads.map((lead) => {
        const reminderDate = lead.ReminderDateTime ? new Date(lead.ReminderDateTime) : null;
        const isReminderOverdue = reminderDate && reminderDate < new Date();
        
        return (
          <div
            key={lead.LeadID}
            onClick={() => onSelect(lead)}
            className={`
              p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors
              ${selectedLeadId === lead.LeadID ? "bg-blue-50 border-l-4 border-l-blue-500" : "border-l-4 border-l-transparent"}
            `}
          >
            <div className="flex justify-between items-start mb-1">
              <h3 className="font-bold text-gray-900 truncate pr-2">{lead.LeadName || 'Unnamed Lead'}</h3>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatusColor(lead.LeadStatus)}`}>
                {lead.LeadStatus}
              </span>
            </div>
            <p className="text-sm text-gray-600 truncate">{lead.Address}</p>
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-gray-500 flex items-center gap-1.5">
                {lead.ReminderDateTime && (
                  <ClockIcon size={12} className={isReminderOverdue ? 'text-red-500' : 'text-amber-500'} />
                )}
                {lead.ContactNumber}
              </p>
              <p className="text-xs text-gray-400">
                {formatDistanceToNow(lead.LastUpdated)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
