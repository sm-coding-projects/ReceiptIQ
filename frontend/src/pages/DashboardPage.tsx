import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Key,
  ArrowRight,
  Loader2,
  FolderOpen,
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '@/utils/api';
import FileUpload from '@/components/FileUpload';
import type { User, ReceiptBatch, DashboardStats } from '@/types';
import clsx from 'clsx';

interface DashboardPageProps {
  user: User;
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

export default function DashboardPage({ user }: DashboardPageProps) {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    total_receipts: 0,
    processed: 0,
    pending: 0,
    failed: 0,
  });
  const [batches, setBatches] = useState<ReceiptBatch[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      const [statsRes, batchesRes] = await Promise.all([
        api.get<DashboardStats>('/receipts/stats'),
        api.get<ReceiptBatch[]>('/receipts/'),
      ]);
      setStats(statsRes.data);
      setBatches(batchesRes.data);
    } catch {
      // Silently handle - show empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleUploadComplete = (batchId: string) => {
    fetchDashboard();
    navigate(`/dashboard/batch/${batchId}`);
  };

  const statCards = [
    {
      label: 'Total Receipts',
      value: stats.total_receipts,
      icon: FileText,
      color: 'text-primary-600',
      bg: 'bg-primary-50',
    },
    {
      label: 'Processed',
      value: stats.processed,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Pending',
      value: stats.pending,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Failed',
      value: stats.failed,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-accent-600 animate-spin" />
          <p className="text-sm text-primary-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="mb-8"
        >
          <motion.div variants={fadeInUp} className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-primary-900">
                Welcome back, {user.full_name.split(' ')[0]}
              </h1>
              <p className="text-sm text-primary-500 mt-1">
                Upload receipts, track processing, and download results.
              </p>
            </div>
            <Link to="/dashboard/api-keys" className="btn-secondary text-sm">
              <Key className="w-4 h-4" />
              API Keys
            </Link>
          </motion.div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {statCards.map((stat) => (
            <motion.div
              key={stat.label}
              variants={fadeInUp}
              className="card-premium p-5"
            >
              <div className="flex items-center gap-3">
                <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', stat.bg)}>
                  <stat.icon className={clsx('w-5 h-5', stat.color)} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary-900">{stat.value}</p>
                  <p className="text-xs text-primary-400">{stat.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-1"
          >
            <div className="card-premium p-6">
              <h2 className="text-lg font-semibold text-primary-900 mb-4">Upload Receipts</h2>
              <FileUpload onUploadComplete={handleUploadComplete} />
            </div>
          </motion.div>

          {/* Recent Batches */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2"
          >
            <div className="card-premium">
              <div className="p-6 border-b border-primary-100">
                <h2 className="text-lg font-semibold text-primary-900">Recent Batches</h2>
                <p className="text-sm text-primary-400 mt-0.5">
                  Your recent receipt upload batches
                </p>
              </div>

              {batches.length === 0 ? (
                /* Empty State */
                <div className="p-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
                    <FolderOpen className="w-8 h-8 text-primary-300" />
                  </div>
                  <h3 className="text-base font-medium text-primary-900 mb-1">No batches yet</h3>
                  <p className="text-sm text-primary-400 max-w-sm mx-auto">
                    Upload your first receipt images to get started. We'll extract all the structured data for you.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-primary-50">
                  {batches.slice(0, 10).map((batch) => (
                    <Link
                      key={batch.id}
                      to={`/dashboard/batch/${batch.id}`}
                      className="flex items-center gap-4 p-4 hover:bg-primary-50/50 transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-primary-400" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-primary-900 truncate">
                          {batch.name || `Batch ${batch.id.slice(0, 8)}`}
                        </p>
                        <p className="text-xs text-primary-400 mt-0.5">
                          {batch.file_count} file{batch.file_count !== 1 ? 's' : ''} &middot;{' '}
                          {new Date(batch.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span
                          className={clsx({
                            'badge-pending': batch.status === 'pending',
                            'badge-processing': batch.status === 'processing',
                            'badge-completed': batch.status === 'completed',
                            'badge-failed': batch.status === 'failed',
                          })}
                        >
                          {batch.status === 'completed' && `${batch.completed_count}/${batch.file_count}`}
                          {batch.status === 'processing' && 'Processing'}
                          {batch.status === 'pending' && 'Pending'}
                          {batch.status === 'failed' && 'Failed'}
                        </span>
                        <ArrowRight className="w-4 h-4 text-primary-300 group-hover:text-primary-500 transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
