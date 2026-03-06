import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Loader2,
  RefreshCw,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '@/utils/api';
import ReceiptCard from '@/components/ReceiptCard';
import type { ReceiptBatch } from '@/types';
import clsx from 'clsx';

export default function BatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [batch, setBatch] = useState<ReceiptBatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBatch = useCallback(async (showRefresh = false) => {
    if (!id) return;
    if (showRefresh) setRefreshing(true);

    try {
      const response = await api.get<ReceiptBatch>(`/receipts/${id}`);
      setBatch(response.data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load batch';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBatch();
  }, [fetchBatch]);

  // Auto-refresh while processing
  useEffect(() => {
    if (!batch) return;
    const isProcessing = batch.status === 'processing' || batch.status === 'pending';
    if (!isProcessing) return;

    const interval = setInterval(() => fetchBatch(), 5000);
    return () => clearInterval(interval);
  }, [batch, fetchBatch]);

  const downloadAllResults = () => {
    if (!batch) return;

    const results = batch.files
      .filter((f) => f.status === 'completed' && f.result)
      .map((f) => ({
        filename: f.original_filename,
        result: f.result,
      }));

    if (results.length === 0) return;

    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `batch_${id?.slice(0, 8)}_results.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-accent-600 animate-spin" />
          <p className="text-sm text-primary-400">Loading batch details...</p>
        </div>
      </div>
    );
  }

  if (error || !batch) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 px-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-primary-900 mb-2">Batch not found</h2>
          <p className="text-sm text-primary-500 mb-6">{error || 'The batch you are looking for does not exist.'}</p>
          <Link to="/dashboard" className="btn-primary">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const completedCount = batch.files.filter((f) => f.status === 'completed').length;
  const processingCount = batch.files.filter((f) => f.status === 'processing').length;
  const pendingCount = batch.files.filter((f) => f.status === 'pending').length;
  const failedCount = batch.files.filter((f) => f.status === 'failed').length;
  const isProcessing = batch.status === 'processing' || batch.status === 'pending';

  return (
    <div className="min-h-screen bg-surface-50 pt-20 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
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
              <h1 className="text-2xl font-bold text-primary-900">
                {batch.name || `Batch ${batch.id.slice(0, 8)}`}
              </h1>
              <p className="text-sm text-primary-500 mt-1">
                {batch.file_count} file{batch.file_count !== 1 ? 's' : ''} &middot;{' '}
                Uploaded {new Date(batch.created_at).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchBatch(true)}
                disabled={refreshing}
                className="btn-ghost text-sm"
                aria-label="Refresh batch status"
              >
                <RefreshCw className={clsx('w-4 h-4', refreshing && 'animate-spin')} />
                Refresh
              </button>

              {completedCount > 0 && (
                <button onClick={downloadAllResults} className="btn-primary text-sm">
                  <Download className="w-4 h-4" />
                  Download All ({completedCount})
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Status summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8"
        >
          <div className="bg-white rounded-xl border border-primary-100 p-4 text-center">
            <p className="text-2xl font-bold text-primary-900">{batch.file_count}</p>
            <p className="text-xs text-primary-400">Total</p>
          </div>
          <div className="bg-white rounded-xl border border-emerald-100 p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{completedCount}</p>
            <p className="text-xs text-primary-400">Completed</p>
          </div>
          <div className="bg-white rounded-xl border border-blue-100 p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{processingCount + pendingCount}</p>
            <p className="text-xs text-primary-400">In Progress</p>
          </div>
          <div className="bg-white rounded-xl border border-red-100 p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{failedCount}</p>
            <p className="text-xs text-primary-400">Failed</p>
          </div>
        </motion.div>

        {/* Auto-refresh notice */}
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 flex items-center gap-3"
          >
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
            <p className="text-sm text-blue-700">
              Processing in progress. This page auto-refreshes every 5 seconds.
            </p>
          </motion.div>
        )}

        {/* Progress bar */}
        {batch.file_count > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between text-xs text-primary-400 mb-2">
              <span>Processing progress</span>
              <span>{Math.round(((completedCount + failedCount) / batch.file_count) * 100)}%</span>
            </div>
            <div className="w-full bg-primary-100 rounded-full h-2 overflow-hidden">
              <div className="flex h-full">
                <div
                  className="bg-emerald-500 transition-all duration-500"
                  style={{ width: `${(completedCount / batch.file_count) * 100}%` }}
                />
                <div
                  className="bg-red-400 transition-all duration-500"
                  style={{ width: `${(failedCount / batch.file_count) * 100}%` }}
                />
                {isProcessing && (
                  <div
                    className="bg-blue-400 animate-pulse transition-all duration-500"
                    style={{ width: `${((processingCount + pendingCount) / batch.file_count) * 100}%` }}
                  />
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Receipt Files */}
        <div className="space-y-4">
          {batch.files.length === 0 ? (
            <div className="card-premium p-12 text-center">
              <FileText className="w-12 h-12 text-primary-300 mx-auto mb-3" />
              <p className="text-base font-medium text-primary-900 mb-1">No files in this batch</p>
              <p className="text-sm text-primary-400">This batch doesn't contain any receipt files.</p>
            </div>
          ) : (
            batch.files.map((file, index) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
              >
                <ReceiptCard receipt={file} />
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
