import React, { useState, useEffect } from 'react';
import { Lead } from '@/types';
import { SaveIcon, PhoneIcon, ClockIcon, TrashIcon } from './icons';

interface LeadDetailProps {
  lead: Lead;
  onUpdate: (id: string, fields: Partial<Lead>) => Promise<void>;
  onAddNote: (id: string, note: string, repName: string) => Promise<void>;
  onUpdateReminder: (id: string, reminder: { dateTime: string; note: string } | null) => Promise<void>;
}

export default function LeadDetail({ lead, onUpdate, onAddNote, onUpdateReminder }: LeadDetailProps) {
  const [formData, setFormData] = useState<Lead>(lead);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [reminderDateTime, setReminderDateTime] = useState('');
  const [reminderNote, setReminderNote] = useState('');
  const [savingReminder, setSavingReminder] = useState(false);

  useEffect(() => {
    setFormData(lead);
    setNoteText('');
    setReminderDateTime(lead.ReminderDateTime || '');
    setReminderNote(lead.ReminderNote || '');
  }, [lead]);

  const handleDebouncedUpdate = (field: keyof Lead, value: any) => {
    onUpdate(lead.LeadID, { [field]: value });
  };
  
  const handleChange = (field: keyof Lead, value: any) => {
      setFormData(prev => ({ ...prev, [field]: value }));
      handleDebouncedUpdate(field, value);
  };

  const handleNoteSubmit = async () => {
    if (!noteText.trim()) return;
    setSavingNote(true);
    await onAddNote(lead.LeadID, noteText, formData.RepName || 'Rep');
    setNoteText('');
    setSavingNote(false);
  };

  const handleReminderSave = async () => {
    if (!reminderDateTime) {
        alert('Please select a date and time for the reminder.');
        return;
    }
    setSavingReminder(true);
    await onUpdateReminder(lead.LeadID, { dateTime: reminderDateTime, note: reminderNote });
    setSavingReminder(false);
  };

  const handleReminderClear = async () => {
      setSavingReminder(true);
      await onUpdateReminder(lead.LeadID, null);
      setReminderDateTime('');
      setReminderNote('');
      setSavingReminder(false);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-y-auto">
      <div className="bg-white p-6 border-b shadow-sm sticky top-0 md:top-auto z-10">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">{formData.LeadName}</h2>
            <div className="flex gap-2">
                <a href={`tel:${formData.ContactNumber}`} className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors">
                    <PhoneIcon size={20} />
                </a>
            </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">Status</label>
                <select 
                    className="w-full mt-1 border-gray-300 rounded-md shadow-sm p-2 text-gray-900 focus:ring-2 focus:ring-blue-500"
                    value={formData.LeadStatus}
                    onChange={(e) => handleChange('LeadStatus', e.target.value)}
                >
                    <option value="New">New</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Callback">Callback</option>
                    <option value="Closed">Closed</option>
                    <option value="Not Interested">Not Interested</option>
                </select>
            </div>
            <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">Called?</label>
                <div className="mt-2 flex items-center h-10">
                    <input 
                        type="checkbox" 
                        id="called-checkbox"
                        className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        checked={formData.Called}
                        onChange={(e) => handleChange('Called', e.target.checked)}
                    />
                    <label htmlFor="called-checkbox" className="ml-2 text-sm text-gray-700 select-none">{formData.Called ? 'Yes' : 'No'}</label>
                </div>
            </div>
             <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">Renter/Owner</label>
                <select 
                    className="w-full mt-1 border-gray-300 rounded-md shadow-sm p-2 text-gray-900 focus:ring-2 focus:ring-blue-500"
                    value={formData.RenterOwner}
                    onChange={(e) => handleChange('RenterOwner', e.target.value)}
                >
                    <option value="">Select...</option>
                    <option value="Owner">Owner</option>
                    <option value="Renter">Renter</option>
                </select>
            </div>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="font-semibold text-gray-700 mb-3 border-b pb-2">Contact Info</h3>
                <div className="space-y-3">
                    <InputField label="Name" value={formData.LeadName} onChange={e => handleChange('LeadName', e.target.value)} />
                    <InputField label="Address" value={formData.Address} onChange={e => handleChange('Address', e.target.value)} />
                    <InputField label="Phone" value={formData.ContactNumber} onChange={e => handleChange('ContactNumber', e.target.value)} />
                    <InputField label="Rep Name" value={formData.RepName} onChange={e => handleChange('RepName', e.target.value)} />
                </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="font-semibold text-gray-700 mb-3 border-b pb-2">Call Details</h3>
                <div className="space-y-3">
                     <div>
                        <label className="text-xs text-gray-500 font-medium">Call Result</label>
                        <select 
                            className="w-full border rounded-md p-2 text-gray-900 bg-white border-gray-300 focus:ring-2 focus:ring-blue-500"
                            value={formData.CallResult}
                            onChange={(e) => handleChange('CallResult', e.target.value)}
                        >
                            <option value="">Select result...</option>
                            <option value="No Answer">No Answer</option>
                            <option value="Left Voicemail">Left Voicemail</option>
                            <option value="Booked Appointment">Booked Appointment</option>
                            <option value="Follow-up Required">Follow-up Required</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 font-medium">Last Call Time</label>
                        <input 
                            type="datetime-local"
                            className="w-full border rounded-md p-2 text-gray-900 bg-white border-gray-300 focus:ring-2 focus:ring-blue-500"
                            value={formData.CallTimestamp ? formData.CallTimestamp.replace(' ', 'T').substring(0, 16) : ''}
                            onChange={(e) => {
                                const val = e.target.value.replace('T', ' ');
                                handleChange('CallTimestamp', val);
                            }}
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="font-semibold text-gray-700 mb-3 border-b pb-2">Set Reminder</h3>
                <div className="space-y-3">
                    <div>
                        <label className="text-xs text-gray-500 font-medium">Date & Time</label>
                        <input 
                            type="datetime-local"
                            className="w-full border rounded-md p-2 text-gray-900 bg-white border-gray-300 focus:ring-2 focus:ring-blue-500"
                            value={reminderDateTime}
                            onChange={(e) => setReminderDateTime(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 font-medium">Note (optional)</label>
                        <input 
                            type="text"
                            className="w-full border rounded-md p-2 text-gray-900 bg-white border-gray-300 focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Follow up about pricing"
                            value={reminderNote}
                            onChange={(e) => setReminderNote(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button
                            onClick={handleReminderSave}
                            disabled={savingReminder || !reminderDateTime}
                            className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50 flex justify-center items-center gap-2 transition-colors"
                        >
                            <ClockIcon size={16} />
                            {savingReminder ? 'Saving...' : 'Save Reminder'}
                        </button>
                        {(lead.ReminderDateTime || reminderDateTime) && (
                            <button
                                onClick={handleReminderClear}
                                disabled={savingReminder}
                                className="bg-red-500 text-white py-2 px-4 rounded-md font-medium hover:bg-red-600 disabled:opacity-50 flex justify-center items-center gap-2 transition-colors"
                            >
                                <TrashIcon size={16} />
                                Clear
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>

        <div className="flex flex-col h-[500px]">
            <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col h-full">
                <h3 className="font-semibold text-gray-700 mb-3">Communication Log</h3>
                
                <div className="flex-1 bg-gray-100 border rounded-md p-4 overflow-y-auto mb-4 whitespace-pre-wrap text-sm text-gray-800">
                    {formData.Notes || <span className="text-gray-400 italic">No notes yet...</span>}
                </div>

                <div className="mt-auto">
                    <textarea 
                        className="w-full border rounded-md p-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                        rows={3}
                        placeholder="Type new note here..."
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                    />
                    <button 
                        onClick={handleNoteSubmit}
                        disabled={savingNote || !noteText}
                        className="mt-2 w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 flex justify-center items-center gap-2 transition-colors"
                    >
                        <SaveIcon size={16} />
                        {savingNote ? 'Adding...' : 'Add Note'}
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

const InputField = ({ label, value, onChange }: { label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; }) => (
    <div>
        <label className="text-xs text-gray-500 font-medium">{label}</label>
        <input 
            className="w-full border rounded-md p-2 text-gray-900 bg-white border-gray-300 focus:ring-2 focus:ring-blue-500"
            value={value}
            onChange={onChange}
        />
    </div>
);