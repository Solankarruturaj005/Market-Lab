import {
  Bell,
  CheckCircle2,
  ChevronDown,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { DataBadge } from '../components/DataBadge';
import { EmptyState } from '../components/EmptyState';
import { ErrorMessage } from '../components/ErrorMessage';
import { SkeletonLoader } from '../components/Loader';
import { PageHeader } from '../components/PageHeader';
import { createAlert, deleteAlert, fetchAlerts } from '../services/alertService';
import { fetchStocks } from '../services/stockService';
import type { AlertItem, Stock } from '../types/stock';
import { formatCurrency, isIndexSymbol } from '../utils/formatters';

export default function Alerts() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [selectedStockId, setSelectedStockId] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [triggerType, setTriggerType] = useState<AlertItem['triggerType']>('ABOVE');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingAlert, setDeletingAlert] = useState<AlertItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadData() {
      setIsLoading(true);
      try {
        const [alertData, stockData] = await Promise.all([fetchAlerts(), fetchStocks()]);

        if (active) {
          setAlerts(alertData);
          setStocks(stockData);
          setSelectedStockId((current) => current || String(stockData[0]?.id ?? ''));
          setError(null);
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error ? loadError.message : 'Unable to synchronize alert records.',
          );
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const stockId = Number(selectedStockId);
    const parsedTargetPrice = Number(targetPrice);

    if (!Number.isInteger(stockId) || stockId <= 0) {
      setError('Select a valid equity symbol before establishing an alert.');
      return;
    }

    if (!Number.isFinite(parsedTargetPrice) || parsedTargetPrice <= 0) {
      setError('Target threshold price must be greater than zero.');
      return;
    }

    setIsSaving(true);

    try {
      const createdAlert = await createAlert({
        stockId,
        targetPrice: parsedTargetPrice,
        triggerType,
      });

      setAlerts((current) => [createdAlert, ...current]);
      setTargetPrice('');
      setSuccess(`Alert successfully configured for threshold ${formatCurrency(parsedTargetPrice)}.`);
      setTimeout(() => setSuccess(null), 4000);
    } catch (createError) {
      setError(
        createError instanceof Error ? createError.message : 'Unable to persist price alert.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingAlert) return;
    setIsDeleting(true);

    try {
      await deleteAlert(deletingAlert.id);
      setAlerts((current) => current.filter((alert) => alert.id !== deletingAlert.id));
      setDeletingAlert(null);
      setError(null);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : 'Unable to remove price alert.',
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading && alerts.length === 0 && stocks.length === 0) {
    return <SkeletonLoader type="alerts" />;
  }

  const selectedStock = stocks.find((s) => s.id === Number(selectedStockId));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Price Alert Management"
        subtitle="Establish automated price triggers against current coverage snapshot prices."
        badge={
          <DataBadge
            variant="neutral"
            label={`${alerts.length} Active Alert${alerts.length === 1 ? '' : 's'}`}
          />
        }
      />

      {error && <ErrorMessage message={error} />}

      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-800/40 bg-emerald-950/40 p-4 text-xs text-emerald-300">
          <CheckCircle2 size={16} className="flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Alert Configuration Card */}
      <section className="card p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 border-b border-[#334155] pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#334155] bg-[#1E293B] text-white">
            <Plus size={18} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Configure New Price Trigger</h2>
            <p className="text-xs text-[#94A3B8]">
              Target triggers evaluate when the security trades above or below your defined limit.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-3 items-end">
          {/* Equity Selection */}
          <div className="space-y-1.5">
            <label htmlFor="stock-selector" className="text-xs font-medium text-[#94A3B8]">
              Target Equity Symbol
            </label>
            <div className="relative">
              <select
                id="stock-selector"
                value={selectedStockId}
                onChange={(e) => setSelectedStockId(e.target.value)}
                className="w-full rounded-lg border border-[#334155] bg-[#1E293B] py-2.5 px-3 text-xs text-white focus:border-[#F8FAFC] focus:outline-none transition appearance-none"
              >
                {stocks.map((stock) => (
                  <option key={stock.id} value={stock.id} className="bg-[#0F172A] text-white">
                    {stock.symbol} — {stock.name} ({formatCurrency(stock.price ?? 0, stock.symbol)})
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-3 top-3.5 text-[#94A3B8]"
              />
            </div>
          </div>

          {/* Trigger Condition */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#94A3B8]">Trigger Rule</label>
            <div className="grid grid-cols-2 rounded-lg border border-[#334155] bg-[#1E293B] p-1">
              <button
                type="button"
                onClick={() => setTriggerType('ABOVE')}
                className={`flex items-center justify-center gap-1 rounded py-1.5 text-xs font-medium transition ${
                  triggerType === 'ABOVE'
                    ? 'bg-[#0F172A] text-[#059669] border border-emerald-900/60 shadow-sm'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                <TrendingUp size={13} />
                <span>Rises Above</span>
              </button>
              <button
                type="button"
                onClick={() => setTriggerType('BELOW')}
                className={`flex items-center justify-center gap-1 rounded py-1.5 text-xs font-medium transition ${
                  triggerType === 'BELOW'
                    ? 'bg-[#0F172A] text-[#DC2626] border border-red-900/60 shadow-sm'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                <TrendingDown size={13} />
                <span>Falls Below</span>
              </button>
            </div>
          </div>

          {/* Target Price */}
          <div className="space-y-1.5">
            <label htmlFor="target-price" className="text-xs font-medium text-[#94A3B8]">
              Target Price {selectedStock ? (isIndexSymbol(selectedStock.symbol) ? '(Points)' : '(USD)') : ''}
            </label>
            <div className="flex gap-2">
              <input
                id="target-price"
                type="number"
                step="0.01"
                min="0.01"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder={selectedStock?.price ? String(selectedStock.price) : '0.00'}
                required
                className="w-full rounded-lg border border-[#334155] bg-[#1E293B] py-2 px-3 text-xs text-white placeholder-[#64748B] focus:border-[#F8FAFC] focus:outline-none transition sm:text-sm font-mono"
              />
              <button
                type="submit"
                disabled={isSaving}
                className="primary-button whitespace-nowrap text-xs py-2 px-4 flex-shrink-0"
              >
                {isSaving ? 'Configuring...' : 'Set Alert'}
              </button>
            </div>
          </div>
        </form>
      </section>

      {/* Active Alerts List */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#94A3B8]">
          Active Watch Triggers
        </h2>

        {alerts.length === 0 ? (
          <EmptyState
            icon={<Bell size={24} />}
            title="No Active Price Alerts"
            description="You have not created any price alerts yet. Configure a target above or below current market levels to monitor breakouts or pullbacks."
          />
        ) : (
          <div className="card overflow-hidden">
            <div className="divide-y divide-[#334155]">
              {alerts.map((alert) => {
                const stock = alert.stock;
                const isAbove = alert.triggerType === 'ABOVE';
                const currentPrice = stock?.price ?? 0;
                const isTriggered = isAbove
                  ? currentPrice >= alert.targetPrice
                  : currentPrice <= alert.targetPrice;

                return (
                  <div
                    key={alert.id}
                    className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between transition-colors hover:bg-[#1E293B]/30"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border ${
                          isAbove
                            ? 'border-emerald-800/40 bg-emerald-950/40 text-[#059669]'
                            : 'border-red-800/40 bg-red-950/40 text-[#DC2626]'
                        }`}
                      >
                        {isAbove ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                      </div>

                      <div className="min-w-0 truncate">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-white uppercase">
                            {stock?.symbol ?? 'EQUITY'}
                          </span>
                          <span className="truncate text-xs text-[#94A3B8]">{stock?.name}</span>
                        </div>
                        <div className="mt-0.5 text-xs text-[#94A3B8]">
                          Trigger when price moves{' '}
                          <span className="font-semibold text-white">
                            {isAbove ? 'above' : 'below'}
                          </span>{' '}
                          <span className="font-mono font-bold text-white">
                            {formatCurrency(alert.targetPrice, stock?.symbol)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <div className="text-right">
                        <div className="text-[10px] text-[#94A3B8]">Current Feed:</div>
                        <div className="font-mono text-xs font-semibold text-white">
                          {formatCurrency(currentPrice, stock?.symbol)}
                        </div>
                      </div>

                      {isTriggered ? (
                        <DataBadge variant="positive" label="Trigger Met" />
                      ) : (
                        <DataBadge variant="neutral" label="Monitoring" />
                      )}

                      <button
                        type="button"
                        onClick={() => setDeletingAlert(alert)}
                        className="rounded p-2 text-[#94A3B8] hover:bg-red-950/40 hover:text-[#DC2626] transition"
                        title="Delete Alert"
                        aria-label={`Delete alert for ${stock?.symbol}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Informational Note regarding Architecture */}
      <div className="rounded-lg border border-[#334155] bg-[#0F172A] p-4 text-[11px] text-[#94A3B8] leading-relaxed">
        <span className="font-semibold text-white">Architecture Notice: </span>
        Price triggers are evaluated on-demand against current PostgreSQL snapshot and live quote
        data during terminal sessions. Continuous 24/7 background worker evaluation and push/email
        notifications represent a planned Phase 2B architectural enhancement.
      </div>

      {/* Safe Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={Boolean(deletingAlert)}
        title="Delete Price Alert"
        message={`Are you sure you want to delete the price trigger for ${deletingAlert?.stock?.symbol ?? 'this equity'} at ${formatCurrency(deletingAlert?.targetPrice ?? 0, deletingAlert?.stock?.symbol)}? This action cannot be undone.`}
        confirmLabel="Delete Alert"
        cancelLabel="Keep Alert"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingAlert(null)}
      />
    </div>
  );
}
