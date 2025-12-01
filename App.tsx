import React, { useState, useEffect, useCallback } from 'react';
import { Lead, OfflineAction } from './types';
import AuthScreen from './components/AuthScreen';
import LeadList from './components/LeadList';
import LeadDetail from './components/LeadDetail';
import { DownloadIcon, LogOutIcon, LoaderIcon, ClockIcon, WifiOffIcon } from './components/icons';
import { formatDistanceToNow } from './utils';

// --- Local Storage Helper Functions ---
const getFromStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error(`Failed to parse ${key} from localStorage`, e);
    return defaultValue;
  }
};
const setInStorage = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to set ${key} in localStorage`, e);
  }
};

export default function Home() {
  const [role, setRole] = useState<'guest' | 'rep' | 'admin'>('guest');
  const [leads, setLeads] = useState<Lead[]>(() => getFromStorage('leadAppLeads', []));
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // --- Offline/Online Status Handling ---
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  const getRemindersFromStorage = (): Record<string, { ReminderDateTime: string; ReminderNote: string }> => {
      return getFromStorage('leadAppReminders', {});
  };

  const combineLeadsWithReminders = (leadsData: Lead[]): Lead[] => {
    const reminders = getRemindersFromStorage();
    return leadsData.map(lead => ({
      ...lead,
      ...(reminders[lead.LeadID] || {}),
    }));
  };
  
  // --- Data Fetching & Syncing ---
  const fetchLeads = useCallback(async () => {
    if (role === 'guest' || !isOnline) return;
    setLoading(true);
    try {
      const res = await fetch('/api/leads');
      if (!res.ok) throw new Error('Failed to fetch leads');
      const data: Lead[] = await res.json();
      
      const leadsWithReminders = combineLeadsWithReminders(data);
      setLeads(leadsWithReminders);
      setInStorage('leadAppLeads', leadsWithReminders);
    } catch (error) {
      console.error(error);
      alert('Error loading leads. Showing cached data.');
    } finally {
      setLoading(false);
    }
  }, [role, isOnline]);
  
  const syncOfflineQueue = useCallback(async () => {
      const queue = getFromStorage<OfflineAction[]>('offlineQueue', []);
      if (queue.length === 0) return;

      setIsSyncing(true);
      
      for (const action of queue) {
          try {
              if (action.type === 'UPDATE_LEAD') {
                  await fetch(`/api/leads/${action.payload.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ fields: action.payload.fields }),
                  });
              } else if (action.type === 'ADD_NOTE') {
                  await fetch(`/api/leads/${action.payload.id}/notes`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(action.payload),
                  });
              }
          } catch (error) {
              console.error('Failed to sync action:', action, error);
              // If one fails, stop and retry later
              setIsSyncing(false);
              alert('An error occurred while syncing. Please try again later.');
              return;
          }
      }

      setInStorage('offlineQueue', []);
      setIsSyncing(false);
      await fetchLeads(); // Fetch latest state after successful sync
  }, [fetchLeads]);

  useEffect(() => {
    if (role !== 'guest') {
      // Load initial data from cache, then fetch if online
      const cachedLeads = getFromStorage<Lead[]>('leadAppLeads', []);
      const leadsWithReminders = combineLeadsWithReminders(cachedLeads);
      setLeads(leadsWithReminders);

      if (isOnline) {
          syncOfflineQueue().then(() => {
              if(!isSyncing) fetchLeads();
          });
      }
    }
  }, [role, isOnline, syncOfflineQueue, fetchLeads, isSyncing]);

  // --- Action Handlers (Update, Add Note, Reminders) ---
  const handleUpdateLead = async (id: string, fields: Partial<Lead>) => {
    // Optimistic UI update
    const updatedLeads = leads.map(l => (l.LeadID === id ? { ...l, ...fields } : l));
    setLeads(updatedLeads);
    if (selectedLead?.LeadID === id) {
      setSelectedLead(prev => (prev ? { ...prev, ...fields } : null));
    }

    if (isOnline) {
      try {
        const res = await fetch(`/api/leads/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields }),
        });
        if (!res.ok) throw new Error('Failed to save update');
        setInStorage('leadAppLeads', updatedLeads); // Cache successful update
      } catch (err) {
        console.error(err);
        alert('Failed to save update. Please check your connection.');
        // Revert handled by next fetch or page reload
      }
    } else {
      const queue = getFromStorage<OfflineAction[]>('offlineQueue', []);
      queue.push({ type: 'UPDATE_LEAD', payload: { id, fields } });
      setInStorage('offlineQueue', queue);
    }
  };

  const handleAddNote = async (id: string, noteText: string, repName: string) => {
    // Optimistic UI update
    const timestamp = new Date().toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const formattedNote = `${timestamp} - ${repName || 'Unknown Rep'}: ${noteText}`;
    const updatedNotes = `${formattedNote}\n\n${leads.find(l => l.LeadID === id)?.Notes || ''}`;
    
    const updatedLeads = leads.map(l => (l.LeadID === id ? { ...l, Notes: updatedNotes } : l));
    setLeads(updatedLeads);
    if (selectedLead?.LeadID === id) {
      setSelectedLead(prev => (prev ? { ...prev, Notes: updatedNotes } : null));
    }

    if (isOnline) {
      try {
        await fetch(`/api/leads/${id}/notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ noteText, repName }),
        });
        setInStorage('leadAppLeads', updatedLeads);
        setTimeout(fetchLeads, 1000); 
      } catch (err) {
        console.error(err);
        alert('Failed to add note. Please check your connection.');
      }
    } else {
      const queue = getFromStorage<OfflineAction[]>('offlineQueue', []);
      queue.push({ type: 'ADD_NOTE', payload: { id, noteText, repName } });
      setInStorage('offlineQueue', queue);
    }
  };

  const handleUpdateReminder = async (leadId: string, reminder: { dateTime: string; note: string } | null) => {
    const reminders = getRemindersFromStorage();
    if (reminder) {
      reminders[leadId] = { ReminderDateTime: reminder.dateTime, ReminderNote: reminder.note };
    } else {
      delete reminders[leadId];
    }
    setInStorage('leadAppReminders', reminders);

    const updatedLeads = leads.map(lead => {
        if (lead.LeadID === leadId) {
            return { ...lead, ReminderDateTime: reminder?.dateTime, ReminderNote: reminder?.note };
        }
        return lead;
    });
    setLeads(updatedLeads);

    if (selectedLead?.LeadID === leadId) {
      setSelectedLead(prev => prev ? { ...prev, ReminderDateTime: reminder?.dateTime, ReminderNote: reminder?.note } : null);
    }
  };
  
  // --- Auth & UI ---
  const handleLogout = () => {
    setRole('guest');
    setSelectedLead(null);
    setLeads([]);
  };

  if (role === 'guest') {
    return <AuthScreen onLogin={(r) => setRole(r)} />;
  }
  
  const now = new Date();
  const upcomingReminders = leads
      .filter(l => l.ReminderDateTime)
      .sort((a, b) => new Date(a.ReminderDateTime!).getTime() - new Date(b.ReminderDateTime!).getTime());

  return (
    <div className="flex flex-col h-screen bg-white font-sans">
      {isSyncing && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-md z-50">
            <LoaderIcon className="animate-spin text-blue-600" size={48} />
            <p className="mt-4 text-lg font-semibold text-gray-700">Syncing offline changes...</p>
            <p className="text-sm text-gray-500">Please wait, this may take a moment.</p>
        </div>
      )}
      <header className="bg-gray-900 text-white p-4 flex justify-between items-center shadow-md z-10">
        <h1 className="text-xl font-bold">Lead Management System</h1>
        <div className="flex gap-4 items-center">
          {!isOnline && (
            <div className="flex items-center gap-2 bg-yellow-500 text-black px-3 py-1 rounded text-sm font-bold">
              <WifiOffIcon size={16} /> Offline Mode
            </div>
          )}
          {role === 'admin' && (
            <a 
              href="/api/export/csv" 
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded text-sm font-medium transition-colors"
            >
              <DownloadIcon size={16} /> Export CSV
            </a>
          )}
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded text-sm font-medium transition-colors"
          >
            <LogOutIcon size={16} /> Logout
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative">
        {(loading && leads.length === 0 && isOnline) ? (
           <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-20">
             <LoaderIcon className="animate-spin text-blue-600" size={48} />
           </div>
        ) : (
          <>
            <div className={`
              ${selectedLead ? 'hidden md:flex' : 'flex'} 
              w-full md:w-1/3 lg:w-1/4 flex-col h-full
            `}>
              {upcomingReminders.length > 0 && (
                <div className="p-3 bg-amber-50 border-b border-amber-200">
                    <h3 className="font-semibold text-amber-800 flex items-center gap-2"><ClockIcon size={16}/> Reminders</h3>
                    <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                        {upcomingReminders.map(lead => {
                            const reminderDate = new Date(lead.ReminderDateTime!);
                            const isOverdue = reminderDate < now;
                            return (
                                <div key={lead.LeadID} onClick={() => setSelectedLead(lead)} className="p-2 rounded-md bg-white cursor-pointer hover:bg-gray-100 border border-gray-200 shadow-sm">
                                    <p className="font-bold text-sm truncate text-gray-800">{lead.LeadName}</p>
                                    <p className={`text-xs truncate ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                                      {formatDistanceToNow(lead.ReminderDateTime!)}
                                    </p>
                                    {lead.ReminderNote && <p className="text-xs text-gray-500 truncate mt-1">"{lead.ReminderNote}"</p>}
                                </div>
                            )
                        })}
                    </div>
                </div>
              )}
              <div className="p-3 bg-gray-100 border-b font-semibold text-gray-700">
                Leads ({leads.length})
              </div>
              <LeadList 
                leads={leads} 
                selectedLeadId={selectedLead?.LeadID || null} 
                onSelect={setSelectedLead} 
              />
            </div>

            <div className={`
              ${selectedLead ? 'flex' : 'hidden md:flex'} 
              flex-1 flex-col bg-gray-50 h-full relative
            `}>
              {selectedLead ? (
                <>
                  <button 
                    onClick={() => setSelectedLead(null)}
                    className="md:hidden bg-gray-200 text-gray-800 p-2 text-center font-bold sticky top-0 z-10"
                  >
                    &larr; Back to List
                  </button>
                  <LeadDetail 
                    lead={selectedLead} 
                    onUpdate={handleUpdateLead} 
                    onAddNote={handleAddNote}
                    onUpdateReminder={handleUpdateReminder}
                  />
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-lg">
                  {leads.length > 0 ? 'Select a lead to view details' : 'No leads to display. Check connection or try again later.'}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}