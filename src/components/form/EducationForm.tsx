import { useState, useEffect, useImperativeHandle, forwardRef, useRef } from 'react';
import { useProfile } from '../../hooks/useProfile';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../common/Input';
import { Textarea } from '../common/Textarea';
import { Button } from '../common/Button';
import { Trash2 } from 'lucide-react';
import type { EducationEntry } from '../../lib/types';

export interface EducationFormHandle {
  saveCurrentEntries: () => Promise<void>;
  getCurrentEntries: () => EducationEntry[];
}

interface EducationFormProps {}

export const EducationForm = forwardRef<EducationFormHandle, EducationFormProps>((_props, ref) => {
  const { educationEntries, updateEducation } = useProfile();
  const { user } = useAuth();
  const [entries, setEntries] = useState<EducationEntry[]>([]);

  // Helper to convert date (YYYY-MM-DD) to month input (YYYY-MM)
  const dateToMonth = (dateValue: string): string => {
    if (!dateValue) return '';
    return dateValue.substring(0, 7); // Extract YYYY-MM from YYYY-MM-DD
  };

  // Helper to convert month input (YYYY-MM) to full date (YYYY-MM-01) for database
  const monthToDate = (monthValue: string): string => {
    if (!monthValue) return '';
    return `${monthValue}-01`;
  };

  // Sync from database only on initial load or when entries are added/removed externally
  // Use refs to track state and prevent overwriting user input while typing
  const isInitialMount = useRef(true);
  const previousEntriesCount = useRef(educationEntries.length);
  
  useEffect(() => {
    // Only sync from database on initial mount or if entries array length changes
    // This prevents overwriting local state while user is typing
    const currentEntriesCount = educationEntries.length;
    
    if (isInitialMount.current) {
      // Initial load - sync from database
      const entriesWithMonthDates = educationEntries.map(entry => ({
        ...entry,
        graduation_date: dateToMonth(entry.graduation_date),
      }));
      setEntries(entriesWithMonthDates);
      isInitialMount.current = false;
      previousEntriesCount.current = currentEntriesCount;
    } else if (previousEntriesCount.current !== currentEntriesCount) {
      // Entry count changed (added/removed) - sync from database
      const entriesWithMonthDates = educationEntries.map(entry => ({
        ...entry,
        graduation_date: dateToMonth(entry.graduation_date),
      }));
      setEntries(entriesWithMonthDates);
      previousEntriesCount.current = currentEntriesCount;
    }
    // If entry count hasn't changed, don't sync - user is editing local state
  }, [educationEntries]);

  const handleAddEntry = () => {
    const newEntry: EducationEntry = {
      id: `temp-${Date.now()}`,
      user_id: user?.id || '', // Use user ID from auth (will be overridden in updateEducation, but good for consistency)
      university: '',
      degree: '', // Degree type (B.S., M.S., etc.)
      major: '',
      minor: undefined,
      location: undefined,
      graduation_date: '', // Will be in month format (YYYY-MM) in state
      gpa: undefined,
      honors: undefined,
      coursework: '',
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
      graduation_date: monthToDate(entry.graduation_date),
    }));
    updateEducation(updatedForDB);
  };

  // Update local state only (no database calls while typing)
  const handleUpdateEntry = (id: string, field: keyof EducationEntry, value: any) => {
    const updated = entries.map((entry) =>
      entry.id === id ? { ...entry, [field]: value } : entry
    );
    setEntries(updated);
  };

  // Handle coursework as text (like description in work experience)
  const handleCourseworkChange = (id: string, value: string) => {
    handleUpdateEntry(id, 'coursework', value || undefined);
  };

  // Save to database when user leaves a field (on blur)
  const handleFieldBlur = () => {
    const updatedForDB = entries.map(entry => ({
      ...entry,
      graduation_date: monthToDate(entry.graduation_date),
    }));
    updateEducation(updatedForDB);
  };

  // Expose save function and current entries getter for parent component
  useImperativeHandle(ref, () => ({
    saveCurrentEntries: async () => {
      const updatedForDB = entries.map(entry => ({
        ...entry,
        graduation_date: monthToDate(entry.graduation_date),
      }));
      await updateEducation(updatedForDB);
    },
    getCurrentEntries: () => {
      // Return current entries from local state (what user has typed)
      // Convert month dates back to full dates for consistency
      return entries.map(entry => ({
        ...entry,
        graduation_date: monthToDate(entry.graduation_date),
      }));
    },
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Education
          <span className="text-red-500 ml-1">*</span>
        </h2>
        <Button onClick={handleAddEntry} variant="secondary">
          + Add Education
        </Button>
      </div>

      {entries.map((entry, index) => (
        <div key={entry.id} className="border border-gray-200 rounded-lg p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">Education Entry {index + 1}</h3>
            <Button
              onClick={() => handleRemoveEntry(entry.id)}
              variant="danger"
              className="p-2"
              title="Remove entry"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          <Input
            label="School Name"
            type="text"
            required
            value={entry.university || ''}
            onChange={(e) => handleUpdateEntry(entry.id, 'university', e.target.value)}
            onBlur={handleFieldBlur}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Degree Type"
              type="text"
              placeholder="e.g., B.S., M.S., B.A."
              required
              value={entry.degree || ''}
              onChange={(e) => handleUpdateEntry(entry.id, 'degree', e.target.value)}
              onBlur={handleFieldBlur}
            />

            <Input
              label="Major"
              type="text"
              placeholder="e.g., Computer Science"
              required
              value={entry.major || ''}
              onChange={(e) => handleUpdateEntry(entry.id, 'major', e.target.value)}
              onBlur={handleFieldBlur}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Minor(s)"
              type="text"
              placeholder="e.g., Mathematics"
              value={entry.minor || ''}
              onChange={(e) => handleUpdateEntry(entry.id, 'minor', e.target.value || undefined)}
              onBlur={handleFieldBlur}
            />

            <Input
              label="Location (City, State)"
              type="text"
              placeholder="e.g., Berkeley, CA"
              value={entry.location || ''}
              onChange={(e) => handleUpdateEntry(entry.id, 'location', e.target.value || undefined)}
              onBlur={handleFieldBlur}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Expected Graduation Date (Month/Year)"
              type="month"
              placeholder="MM/YYYY"
              required
              value={entry.graduation_date || ''}
              onChange={(e) => handleUpdateEntry(entry.id, 'graduation_date', e.target.value)}
              onBlur={handleFieldBlur}
            />

            <Input
              label="GPA"
              type="number"
              step="0.01"
              min="0"
              max="4"
              placeholder="e.g., 3.8"
              value={entry.gpa?.toString() || ''}
              onChange={(e) => handleUpdateEntry(entry.id, 'gpa', e.target.value ? parseFloat(e.target.value) : undefined)}
              onBlur={handleFieldBlur}
            />
          </div>

          <Input
            label="Honors/Distinctions"
            type="text"
            placeholder="e.g., Dean's Honors List"
            value={entry.honors || ''}
            onChange={(e) => handleUpdateEntry(entry.id, 'honors', e.target.value || undefined)}
            onBlur={handleFieldBlur}
          />

          <Textarea
            label="Relevant Coursework"
            placeholder="Describe relevant coursework..."
            rows={4}
            value={entry.coursework || ''}
            onChange={(e) => handleCourseworkChange(entry.id, e.target.value)}
            onBlur={handleFieldBlur}
          />
        </div>
      ))}
    </div>
  );
});

