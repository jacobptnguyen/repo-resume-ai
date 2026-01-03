import React, { useState, useEffect } from 'react';
import { useProfile } from '../../hooks/useProfile';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../common/Input';
import { Textarea } from '../common/Textarea';
import { Button } from '../common/Button';
import { Trash2 } from 'lucide-react';
import type { WorkExperienceEntry } from '../../lib/types';

export const WorkExperienceForm: React.FC = () => {
  const { workExperienceEntries, updateWorkExperience } = useProfile();
  const { user } = useAuth();
  const [entries, setEntries] = useState<WorkExperienceEntry[]>([]);

  // Helper to convert date (YYYY-MM-DD) to month input (YYYY-MM)
  const dateToMonth = (dateValue: string | null): string => {
    if (!dateValue) return '';
    return dateValue.substring(0, 7); // Extract YYYY-MM from YYYY-MM-DD
  };

  // Helper to convert month input (YYYY-MM) to full date (YYYY-MM-01) for database
  const monthToDate = (monthValue: string): string | null => {
    if (!monthValue) return null;
    return `${monthValue}-01`;
  };

  useEffect(() => {
    // Convert dates from full date to month format for display
    const entriesWithMonthDates = workExperienceEntries.map(entry => ({
      ...entry,
      start_date: dateToMonth(entry.start_date),
      end_date: entry.end_date ? dateToMonth(entry.end_date) : null,
    }));
    setEntries(entriesWithMonthDates);
  }, [workExperienceEntries]);

  const handleAddEntry = () => {
    const newEntry: WorkExperienceEntry = {
      id: `temp-${Date.now()}`,
      user_id: user?.id || '', // Use user ID from auth (will be overridden in updateWorkExperience, but good for consistency)
      company: '',
      job_title: '',
      start_date: '',
      end_date: null,
      description: '',
      display_order: entries.length,
      created_at: new Date().toISOString(),
    };
    setEntries([...entries, newEntry]);
  };

  const handleRemoveEntry = (id: string) => {
    const updated = entries.filter((entry) => entry.id !== id);
    setEntries(updated);
    // Convert month dates back to full dates before saving
    const updatedForDB = updated.map(entry => ({
      ...entry,
      start_date: monthToDate(entry.start_date) || '',
      end_date: entry.end_date ? monthToDate(entry.end_date) : null,
    }));
    updateWorkExperience(updatedForDB);
  };

  // Update local state only (no database calls while typing)
  const handleUpdateEntry = (id: string, field: keyof WorkExperienceEntry, value: any) => {
    const updated = entries.map((entry) =>
      entry.id === id ? { ...entry, [field]: value } : entry
    );
    setEntries(updated);
  };

  // Save to database when user leaves a field (on blur)
  const handleFieldBlur = () => {
    const updatedForDB = entries.map(entry => ({
      ...entry,
      start_date: monthToDate(entry.start_date) || '',
      end_date: entry.end_date ? monthToDate(entry.end_date) : null,
    }));
    updateWorkExperience(updatedForDB);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Work Experience</h2>
        <Button onClick={handleAddEntry} variant="secondary">
          + Add Experience
        </Button>
      </div>

      {entries.map((entry, index) => (
        <div key={entry.id} className="border border-gray-200 rounded-lg p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">Experience Entry {index + 1}</h3>
            <Button
              onClick={() => handleRemoveEntry(entry.id)}
              variant="danger"
              className="p-2"
              title="Remove entry"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Company Name"
              type="text"
              required
              value={entry.company || ''}
              onChange={(e) => handleUpdateEntry(entry.id, 'company', e.target.value)}
              onBlur={handleFieldBlur}
            />

            <Input
              label="Job Title"
              type="text"
              required
              value={entry.job_title || ''}
              onChange={(e) => handleUpdateEntry(entry.id, 'job_title', e.target.value)}
              onBlur={handleFieldBlur}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date (Month/Year)"
              type="month"
              placeholder="MM/YYYY"
              required
              value={entry.start_date || ''}
              onChange={(e) => handleUpdateEntry(entry.id, 'start_date', e.target.value)}
              onBlur={handleFieldBlur}
            />

            <Input
              label="End Date (Month/Year, leave empty for Present)"
              type="month"
              placeholder="MM/YYYY"
              value={entry.end_date || ''}
              onChange={(e) => handleUpdateEntry(entry.id, 'end_date', e.target.value || null)}
              onBlur={handleFieldBlur}
            />
          </div>

          <Textarea
            label="Description/Responsibilities"
            required
            rows={4}
            value={entry.description || ''}
            onChange={(e) => handleUpdateEntry(entry.id, 'description', e.target.value)}
            onBlur={handleFieldBlur}
            placeholder="Describe your responsibilities and achievements..."
          />
        </div>
      ))}
    </div>
  );
};

