import { useState } from 'react';
import { Key, Trash2, Copy, Check, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import type { ApiKey } from '@/types';

interface ApiKeyCardProps {
  apiKey: ApiKey;
  onDelete: (id: string) => void;
}

export default function ApiKeyCard({ apiKey, onDelete }: ApiKeyCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(apiKey.id);
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="card-premium p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center flex-shrink-0">
            <Key className="w-5 h-5 text-accent-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-primary-900">{apiKey.name}</p>
            <p className="text-xs text-primary-400 mt-0.5 font-mono">
              {apiKey.key_prefix}...
            </p>
            <div className="flex items-center gap-3 mt-1.5">
              <p className="text-xs text-primary-400">
                Created {new Date(apiKey.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
              {apiKey.last_used_at && (
                <p className="text-xs text-primary-400">
                  Last used {new Date(apiKey.last_used_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className={clsx(
              'badge',
              apiKey.is_active
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-primary-50 text-primary-500 border border-primary-200',
            )}
          >
            {apiKey.is_active ? 'Active' : 'Inactive'}
          </span>

          <button
            onClick={() => setShowConfirm(true)}
            className="p-2 rounded-lg text-primary-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            aria-label="Delete API key"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Delete confirmation */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">Delete this API key?</p>
                  <p className="text-xs text-red-600 mt-0.5">
                    This action cannot be undone. Any integrations using this key will stop working.
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="btn-danger text-xs !py-1.5 !px-3"
                    >
                      {deleting ? 'Deleting...' : 'Yes, delete'}
                    </button>
                    <button
                      onClick={() => setShowConfirm(false)}
                      className="btn-ghost text-xs !py-1.5 !px-3"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Component for displaying a newly created key (shown once)
export function NewApiKeyDisplay({ apiKey, onDismiss }: { apiKey: string; onDismiss: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = apiKey;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary-900/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onDismiss(); }}
    >
      <div className="bg-white rounded-2xl shadow-premium-xl max-w-lg w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <Check className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-primary-900">API Key Created</h3>
            <p className="text-sm text-primary-500">Copy your key now. It won't be shown again.</p>
          </div>
        </div>

        <div className="bg-primary-950 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between gap-3">
            <code className="text-sm text-emerald-400 font-mono break-all">{apiKey}</code>
            <button
              onClick={handleCopy}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex-shrink-0',
                copied
                  ? 'text-emerald-400 bg-emerald-400/10'
                  : 'text-primary-300 hover:text-white bg-primary-800 hover:bg-primary-700',
              )}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-6">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Store this key securely. For security, we do not store the full key and cannot show it again.
            </p>
          </div>
        </div>

        <button onClick={onDismiss} className="btn-primary w-full">
          Done
        </button>
      </div>
    </motion.div>
  );
}
