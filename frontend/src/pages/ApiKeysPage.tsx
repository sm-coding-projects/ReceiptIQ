import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Key,
  Loader2,
  ArrowLeft,
  Shield,
  AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '@/utils/api';
import ApiKeyCard, { NewApiKeyDisplay } from '@/components/ApiKeyCard';
import CodeBlock from '@/components/CodeBlock';
import type { ApiKey, ApiKeyCreated } from '@/types';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    try {
      const response = await api.get<ApiKey[]>('/keys/');
      setKeys(response.data);
    } catch {
      // Silent error - will show empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const createKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Please enter a name for your API key');
      return;
    }

    setCreating(true);
    try {
      const response = await api.post<ApiKeyCreated>('/keys/', { name: newKeyName.trim() });
      // Backend returns raw_key, frontend uses key
      const rawKey = response.data.key || (response.data as any).raw_key;
      setNewlyCreatedKey(rawKey);
      setNewKeyName('');
      setShowCreateForm(false);
      fetchKeys();
      toast.success('API key created successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create API key';
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  const deleteKey = async (id: string) => {
    try {
      await api.delete(`/api-keys/${id}`);
      setKeys((prev) => prev.filter((k) => k.id !== id));
      toast.success('API key deleted');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete API key';
      toast.error(message);
    }
  };

  const usageExample = [
    {
      label: 'Python',
      language: 'python',
      code: `import requests

API_KEY = "your_api_key_here"

response = requests.post(
    "https://api.receiptiq.com/v1/extract",
    headers={"X-API-Key": API_KEY},
    files={"file": open("receipt.jpg", "rb")}
)

print(response.json())`,
    },
    {
      label: 'cURL',
      language: 'bash',
      code: `curl -X POST https://api.receiptiq.com/v1/extract \\
  -H "X-API-Key: your_api_key_here" \\
  -F "file=@receipt.jpg"`,
    },
    {
      label: 'JavaScript',
      language: 'javascript',
      code: `const form = new FormData();
form.append('file', fileInput.files[0]);

const response = await fetch('https://api.receiptiq.com/v1/extract', {
  method: 'POST',
  headers: { 'X-API-Key': 'your_api_key_here' },
  body: form
});

const data = await response.json();
console.log(data);`,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-accent-600 animate-spin" />
          <p className="text-sm text-primary-400">Loading API keys...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="mb-8"
        >
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-primary-500 hover:text-primary-700 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-primary-900">API Keys</h1>
              <p className="text-sm text-primary-500 mt-1">
                Manage your API keys for programmatic access to the ReceiptIQ API.
              </p>
            </div>

            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-primary text-sm"
            >
              <Plus className="w-4 h-4" />
              Generate New Key
            </button>
          </div>
        </motion.div>

        {/* Create Key Form */}
        <AnimatePresence>
          {showCreateForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="card-premium p-6">
                <h3 className="text-base font-semibold text-primary-900 mb-4">Generate a new API key</h3>
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label htmlFor="key-name" className="label-field">
                      Key name
                    </label>
                    <input
                      id="key-name"
                      type="text"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="e.g. Production, Development, Integration Test"
                      className="input-field"
                      autoFocus
                      onKeyDown={(e) => { if (e.key === 'Enter') createKey(); }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={createKey}
                      disabled={creating}
                      className="btn-primary text-sm"
                    >
                      {creating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create'
                      )}
                    </button>
                    <button
                      onClick={() => { setShowCreateForm(false); setNewKeyName(''); }}
                      className="btn-ghost text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>

                <div className="mt-4 bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    Your API key will only be shown once after creation. Make sure to copy and store it securely.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Newly Created Key Modal */}
        {newlyCreatedKey && (
          <NewApiKeyDisplay
            apiKey={newlyCreatedKey}
            onDismiss={() => setNewlyCreatedKey(null)}
          />
        )}

        {/* Keys List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3 mb-10"
        >
          {keys.length === 0 ? (
            <div className="card-premium p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
                <Key className="w-8 h-8 text-primary-300" />
              </div>
              <h3 className="text-base font-medium text-primary-900 mb-1">No API keys yet</h3>
              <p className="text-sm text-primary-400 max-w-sm mx-auto mb-6">
                Generate your first API key to start using the ReceiptIQ API programmatically.
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn-primary text-sm"
              >
                <Plus className="w-4 h-4" />
                Generate Your First Key
              </button>
            </div>
          ) : (
            keys.map((key) => (
              <ApiKeyCard key={key.id} apiKey={key} onDelete={deleteKey} />
            ))
          )}
        </motion.div>

        {/* Usage Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="card-premium p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center">
                <Shield className="w-5 h-5 text-accent-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-primary-900">Using Your API Key</h3>
                <p className="text-sm text-primary-500">
                  Pass your key via the <code className="text-xs bg-primary-50 px-1.5 py-0.5 rounded font-mono">X-API-Key</code> header
                </p>
              </div>
            </div>

            <CodeBlock tabs={usageExample} />

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="bg-primary-50/50 rounded-xl p-4">
                <p className="font-medium text-primary-900 mb-1">Endpoint</p>
                <p className="text-primary-500 font-mono text-xs">POST /v1/extract</p>
              </div>
              <div className="bg-primary-50/50 rounded-xl p-4">
                <p className="font-medium text-primary-900 mb-1">Content Type</p>
                <p className="text-primary-500 font-mono text-xs">multipart/form-data</p>
              </div>
              <div className="bg-primary-50/50 rounded-xl p-4">
                <p className="font-medium text-primary-900 mb-1">Rate Limit</p>
                <p className="text-primary-500 font-mono text-xs">100 requests/min</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
