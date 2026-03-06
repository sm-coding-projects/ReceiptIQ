import { useState } from 'react';
import { Download, Eye, FileImage, Loader2, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import type { ReceiptFile } from '@/types';

interface ReceiptCardProps {
  receipt: ReceiptFile;
}

export default function ReceiptCard({ receipt }: ReceiptCardProps) {
  const [expanded, setExpanded] = useState(false);

  const statusConfig = {
    pending: {
      label: 'Pending',
      className: 'badge-pending',
      icon: null,
    },
    processing: {
      label: 'Processing',
      className: 'badge-processing',
      icon: <Loader2 className="w-3 h-3 animate-spin" />,
    },
    completed: {
      label: 'Completed',
      className: 'badge-completed',
      icon: null,
    },
    failed: {
      label: 'Failed',
      className: 'badge-failed',
      icon: <AlertTriangle className="w-3 h-3" />,
    },
  };

  const status = statusConfig[receipt.status];

  const downloadJson = () => {
    if (!receipt.result) return;
    const blob = new Blob([JSON.stringify(receipt.result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${receipt.original_filename.replace(/\.[^/.]+$/, '')}_result.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount: number | null, currency: string | null) => {
    if (amount === null) return '--';
    const curr = currency || 'USD';
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: curr }).format(amount);
    } catch {
      return `${amount.toFixed(2)} ${curr}`;
    }
  };

  return (
    <div className="card-premium overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
          <FileImage className="w-5 h-5 text-primary-400" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-primary-900 truncate">
            {receipt.original_filename}
          </p>
          <p className="text-xs text-primary-400 mt-0.5">
            {new Date(receipt.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={clsx(status.className, 'flex items-center gap-1')}>
            {status.icon}
            {status.label}
          </span>
        </div>
      </div>

      {/* Result preview (when completed) */}
      {receipt.status === 'completed' && receipt.result && (
        <>
          <div className="px-4 pb-3 border-t border-primary-50 pt-3">
            <div className="grid grid-cols-2 gap-3">
              {receipt.result.vendor_name && (
                <div>
                  <p className="text-xs text-primary-400">Vendor</p>
                  <p className="text-sm font-medium text-primary-900 truncate">{receipt.result.vendor_name}</p>
                </div>
              )}
              {receipt.result.total !== null && (
                <div>
                  <p className="text-xs text-primary-400">Total</p>
                  <p className="text-sm font-semibold text-primary-900">
                    {formatCurrency(receipt.result.total, receipt.result.currency)}
                  </p>
                </div>
              )}
              {receipt.result.transaction_date && (
                <div>
                  <p className="text-xs text-primary-400">Date</p>
                  <p className="text-sm text-primary-700">{receipt.result.transaction_date}</p>
                </div>
              )}
              {receipt.result.payment_method && (
                <div>
                  <p className="text-xs text-primary-400">Payment</p>
                  <p className="text-sm text-primary-700">{receipt.result.payment_method}</p>
                </div>
              )}
            </div>

            {/* Expandable details */}
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 mt-3 text-xs font-medium text-accent-600 hover:text-accent-700 transition-colors"
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {expanded ? 'Hide' : 'View'} details
            </button>
          </div>

          <AnimatePresence>
            {expanded && receipt.result && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 border-t border-primary-50 pt-3 space-y-3">
                  {/* All fields */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {receipt.result.vendor_address && (
                      <div className="col-span-2">
                        <p className="text-xs text-primary-400">Address</p>
                        <p className="text-primary-700">{receipt.result.vendor_address}</p>
                      </div>
                    )}
                    {receipt.result.receipt_number && (
                      <div>
                        <p className="text-xs text-primary-400">Receipt #</p>
                        <p className="text-primary-700">{receipt.result.receipt_number}</p>
                      </div>
                    )}
                    {receipt.result.transaction_time && (
                      <div>
                        <p className="text-xs text-primary-400">Time</p>
                        <p className="text-primary-700">{receipt.result.transaction_time}</p>
                      </div>
                    )}
                    {receipt.result.subtotal !== null && (
                      <div>
                        <p className="text-xs text-primary-400">Subtotal</p>
                        <p className="text-primary-700">
                          {formatCurrency(receipt.result.subtotal, receipt.result.currency)}
                        </p>
                      </div>
                    )}
                    {receipt.result.tax !== null && (
                      <div>
                        <p className="text-xs text-primary-400">Tax</p>
                        <p className="text-primary-700">
                          {formatCurrency(receipt.result.tax, receipt.result.currency)}
                        </p>
                      </div>
                    )}
                    {receipt.result.confidence !== null && (
                      <div>
                        <p className="text-xs text-primary-400">Confidence</p>
                        <p className="text-primary-700">{(receipt.result.confidence * 100).toFixed(0)}%</p>
                      </div>
                    )}
                  </div>

                  {/* Line items */}
                  {receipt.result.line_items && receipt.result.line_items.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-primary-500 mb-2">Line Items</p>
                      <div className="bg-primary-50/50 rounded-lg overflow-hidden">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-primary-100">
                              <th className="text-left py-2 px-3 font-medium text-primary-500">Item</th>
                              <th className="text-right py-2 px-3 font-medium text-primary-500">Qty</th>
                              <th className="text-right py-2 px-3 font-medium text-primary-500">Price</th>
                              <th className="text-right py-2 px-3 font-medium text-primary-500">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {receipt.result.line_items.map((item, idx) => (
                              <tr key={idx} className="border-b border-primary-100 last:border-0">
                                <td className="py-2 px-3 text-primary-700">{item.name}</td>
                                <td className="py-2 px-3 text-right text-primary-600">{item.quantity ?? '--'}</td>
                                <td className="py-2 px-3 text-right text-primary-600">
                                  {item.unit_price !== null ? item.unit_price.toFixed(2) : '--'}
                                </td>
                                <td className="py-2 px-3 text-right font-medium text-primary-700">
                                  {item.total_price !== null ? item.total_price.toFixed(2) : '--'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="px-4 pb-4 flex items-center gap-2">
            <button onClick={downloadJson} className="btn-secondary text-xs !py-2 !px-3 flex-1">
              <Download className="w-3.5 h-3.5" />
              Download JSON
            </button>
          </div>
        </>
      )}

      {/* Error state */}
      {receipt.status === 'failed' && receipt.error_message && (
        <div className="px-4 pb-4 border-t border-primary-50 pt-3">
          <div className="bg-red-50 border border-red-100 rounded-lg p-3">
            <p className="text-xs text-red-600">{receipt.error_message}</p>
          </div>
        </div>
      )}

      {/* Processing state */}
      {receipt.status === 'processing' && (
        <div className="px-4 pb-4 border-t border-primary-50 pt-3">
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg p-3">
            <Loader2 className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0" />
            <p className="text-xs text-blue-700">Extracting data from receipt...</p>
          </div>
        </div>
      )}
    </div>
  );
}
