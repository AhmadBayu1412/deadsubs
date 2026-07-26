import { useState } from 'react';
import { useAuthStore } from '../../viewmodels/authStore';
import { useSubscriptionStore } from '../../viewmodels/subscriptionStore';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import toast from 'react-hot-toast';
import {
  User,
  Download,
  Upload,
  Trash2,
  Bell,
  Info,
} from 'lucide-react';

export function SettingsPage() {
  const { user } = useAuthStore();
  const { subscriptions, clearAll, importData } = useSubscriptionStore();

  const [reminders, setReminders] = useState(true);
  const [reminderDays, setReminderDays] = useState([3, 7]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearInput, setClearInput] = useState('');
  const [clearing, setClearing] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleExport = () => {
    const data = JSON.stringify(subscriptions, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deadsubs-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported successfully');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!Array.isArray(data)) throw new Error('Invalid format');
      await importData(data);
      toast.success(`Imported ${data.length} subscriptions`);
    } catch {
      toast.error('Failed to import — check file format');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const handleClearAll = async () => {
    if (clearInput !== 'delete') return;
    setClearing(true);
    try {
      await clearAll();
      setShowClearConfirm(false);
      setClearInput('');
      toast.success('All data cleared');
    } catch {
      toast.error('Failed to clear data');
    } finally {
      setClearing(false);
    }
  };

  const toggleReminderDay = (day: number) => {
    setReminderDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Settings</h1>
        <p className="text-sm text-secondary mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-secondary" />
            <CardTitle>Profile</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs text-secondary">Email</p>
            <p className="text-sm font-medium text-primary">{user?.email ?? 'Not signed in'}</p>
          </div>
          <div>
            <p className="text-xs text-secondary">UID</p>
            <p className="text-sm font-mono text-secondary">{user?.uid ?? '—'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-secondary" />
            <CardTitle>Renewal Reminders</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary">Enable reminders</p>
              <p className="text-xs text-secondary">
                Get notified before subscriptions renew
              </p>
            </div>
            <button
              onClick={() => setReminders(!reminders)}
              className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                reminders ? 'bg-accent-blue' : 'bg-border'
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  reminders ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {reminders && (
            <div>
              <p className="text-sm font-medium text-primary mb-2">Remind me</p>
              <div className="flex gap-2">
                {[3, 7, 14].map((day) => (
                  <button
                    key={day}
                    onClick={() => toggleReminderDay(day)}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors cursor-pointer ${
                      reminderDays.includes(day)
                        ? 'border-accent-blue bg-accent-blue/10 text-accent-blue font-medium'
                        : 'border-border text-secondary hover:border-accent-blue/30'
                    }`}
                  >
                    {day} day{day > 1 ? 's' : ''} before
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary">Export data</p>
              <p className="text-xs text-secondary">
                Download all {subscriptions.length} subscriptions as JSON
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary">Import data</p>
              <p className="text-xs text-secondary">Restore from a previous export</p>
            </div>
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
                disabled={importing}
              />
              <span className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border border-border bg-surface text-secondary hover:border-accent-blue/30 transition-colors">
                <Upload className="w-4 h-4" />
                Import
              </span>
            </label>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div>
              <p className="text-sm font-medium text-accent-red">Clear all data</p>
              <p className="text-xs text-secondary">
                Permanently delete all subscriptions
              </p>
            </div>
            <Button variant="danger" size="sm" onClick={() => setShowClearConfirm(true)}>
              <Trash2 className="w-4 h-4" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-secondary" />
            <CardTitle>About</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <p className="text-sm text-secondary">App version</p>
            <p className="text-sm text-primary font-mono">1.0.0</p>
          </div>
          <div className="flex justify-between">
            <p className="text-sm text-secondary">Subscriptions tracked</p>
            <p className="text-sm text-primary font-semibold">{subscriptions.length}</p>
          </div>
          <div className="flex justify-between">
            <p className="text-sm text-secondary">Built with</p>
            <p className="text-sm text-primary">React + TypeScript + Firebase</p>
          </div>
        </CardContent>
      </Card>

      {/* Clear Confirm Modal */}
      <Modal
        open={showClearConfirm}
        onClose={() => {
          setShowClearConfirm(false);
          setClearInput('');
        }}
        title="Clear All Data"
        size="sm"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-secondary">
            This will permanently delete all {subscriptions.length} subscriptions. This action
            cannot be undone.
          </p>
          <p className="text-xs text-secondary">
            Type <strong className="text-primary">delete</strong> to confirm.
          </p>
          <Input
            value={clearInput}
            onChange={(e) => setClearInput(e.target.value)}
            placeholder="Type 'delete'"
          />
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowClearConfirm(false);
                setClearInput('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={clearInput !== 'delete'}
              loading={clearing}
              onClick={handleClearAll}
            >
              Clear All Data
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
