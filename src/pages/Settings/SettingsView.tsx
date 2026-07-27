// Phase 14 — Settings View
// User account info, data management, and sign-out.
import { useState } from 'react';
import { User, Trash2, LogOut, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageTitle } from '../../components/ui/PageTitle';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/Modal';
import { useSettingsViewModel } from './useSettingsViewModel';

const CONFIRM_PHRASE = 'delete all data';

export function SettingsView() {
  const vm = useSettingsViewModel();
  const [confirmValue, setConfirmValue] = useState('');

  const handleClearConfirm = async () => {
    if (confirmValue.trim().toLowerCase() !== CONFIRM_PHRASE.toLowerCase()) {
      toast.error('Confirmation phrase does not match.');
      return;
    }
    await vm.handleClearAllData();
    toast.success('All data has been cleared.');
    setConfirmValue('');
  };

  const handleDialogClose = () => {
    vm.clearDialog.onClose();
    setConfirmValue('');
  };

  return (
    <div className="space-y-6 max-w-lg">
      <PageTitle title="Settings" />

      {/* Account section */}
      <section className="bg-surface rounded-xl border border-border p-5 space-y-4">
        <h2 className="text-sm font-semibold text-primary flex items-center gap-2">
          <User className="w-4 h-4" />
          Account
        </h2>
        <div className="space-y-2">
          <div>
            <p className="text-xs text-secondary">Email</p>
            <p className="text-sm text-primary">{vm.state.user?.email ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-secondary">User ID</p>
            <p className="text-xs text-secondary font-mono truncate">
              {vm.state.user?.uid ?? '—'}
            </p>
          </div>
        </div>
      </section>

      {/* About section */}
      <section className="bg-surface rounded-xl border border-border p-5 space-y-3">
        <h2 className="text-sm font-semibold text-primary flex items-center gap-2">
          <Info className="w-4 h-4" />
          About
        </h2>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-secondary">Version</p>
            <p className="text-sm text-primary">1.0.0</p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-secondary">Data storage</p>
            <p className="text-sm text-primary">IndexedDB (on-device)</p>
          </div>
        </div>
      </section>

      {/* Danger zone */}
      <section className="bg-surface rounded-xl border border-accent-red/20 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-accent-red flex items-center gap-2">
          <Trash2 className="w-4 h-4" />
          Danger zone
        </h2>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary">Clear all data</p>
            <p className="text-xs text-secondary mt-0.5">
              Permanently deletes all subscriptions, notifications, and cached data from this
              device. Your account is preserved. This cannot be undone.
            </p>
          </div>
          <Button variant="danger" size="sm" onClick={vm.clearDialog.onOpen}>
            Clear data
          </Button>
        </div>
      </section>

      {/* Sign out */}
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="md"
          onClick={vm.logout}
          className="text-secondary"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </Button>
      </div>

      {/* Confirmation dialog */}
      <ConfirmDialog
        open={vm.clearDialog.isOpen}
        onClose={handleDialogClose}
        onConfirm={handleClearConfirm}
        title="Clear all data?"
        message={
          'This will permanently delete all subscriptions, notifications, and cached data from this device. ' +
          'Your account will not be affected.'
        }
        confirmLabel="Clear all data"
        confirmVariant="danger"
        confirmText={CONFIRM_PHRASE}
        confirmValue={confirmValue}
        onConfirmChange={setConfirmValue}
      />
    </div>
  );
}
