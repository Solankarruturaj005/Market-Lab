import { BellDot, Plus, Trash2 } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import { ErrorMessage } from '../components/ErrorMessage';
import { Loader } from '../components/Loader';
import { createAlert, deleteAlert, fetchAlerts } from '../services/alertService';
import { fetchStocks } from '../services/stockService';
import type { AlertItem, Stock } from '../types/stock';
import { formatCurrency } from '../utils/formatters';

export default function Alerts() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [selectedStockId, setSelectedStockId] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [triggerType, setTriggerType] = useState<AlertItem['triggerType']>('ABOVE');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingAlertId, setDeletingAlertId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadAlerts() {
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
          setError(loadError instanceof Error ? loadError.message : 'Unable to load alerts.');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadAlerts();

    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const stockId = Number(selectedStockId);
    const parsedTargetPrice = Number(targetPrice);

    if (!Number.isInteger(stockId) || stockId <= 0) {
      setError('Choose a stock before creating an alert.');
      return;
    }

    if (!Number.isFinite(parsedTargetPrice) || parsedTargetPrice <= 0) {
      setError('Enter a target price greater than zero.');
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
      setError(null);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Unable to create alert.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (alertId: number) => {
    setDeletingAlertId(alertId);

    try {
      await deleteAlert(alertId);
      setAlerts((current) => current.filter((alert) => alert.id !== alertId));
      setError(null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete alert.');
    } finally {
      setDeletingAlertId(null);
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="space-y-8">
      <section className="card p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-cyan-300/80">Alerts</div>
            <h1 className="mt-3 text-3xl font-semibold text-white">Price alert center</h1>
            <p className="mt-3 text-sm text-slate-400">
              Connected to the backend alert feed so you can review active price triggers.
            </p>
          </div>
          <div className="rounded-2xl bg-cyan-400/10 p-3 text-cyan-300">
            <BellDot size={22} />
          </div>
        </div>
      </section>

      <section className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-white">Create alert</h2>
            <p className="mt-2 text-sm text-slate-400">
              Set a target price for one of the supported live-market symbols.
            </p>
          </div>
          <div className="rounded-2xl bg-emerald-400/10 p-3 text-emerald-300">
            <Plus size={20} />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.8fr_0.7fr_auto]">
          <label className="dropdown-shell flex min-w-0">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Stock
            </span>
            <select
              value={selectedStockId}
              onChange={(event) => setSelectedStockId(event.target.value)}
              className="dropdown-select min-w-0"
              disabled={stocks.length === 0 || isSaving}
            >
              {stocks.map((stock) => (
                <option className="dropdown-option" key={stock.id} value={stock.id}>
                  {stock.symbol} - {stock.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Target
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={targetPrice}
              onChange={(event) => setTargetPrice(event.target.value)}
              placeholder="250.00"
              className="field-input"
              disabled={isSaving}
            />
          </label>

          <label className="dropdown-shell flex">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Trigger
            </span>
            <select
              value={triggerType}
              onChange={(event) => setTriggerType(event.target.value as AlertItem['triggerType'])}
              className="dropdown-select min-w-[130px]"
              disabled={isSaving}
            >
              <option className="dropdown-option" value="ABOVE">
                Above target
              </option>
              <option className="dropdown-option" value="BELOW">
                Below target
              </option>
            </select>
          </label>

          <button
            type="submit"
            disabled={isSaving || stocks.length === 0}
            className="primary-button min-h-[54px] gap-2 disabled:opacity-50"
          >
            <Plus size={16} />
            {isSaving ? 'Creating' : 'Add alert'}
          </button>
        </form>
      </section>

      {error ? <ErrorMessage message={error} /> : null}

      {alerts.length === 0 ? (
        <section className="card p-10 text-center text-sm text-slate-400">
          No active alerts yet. Create one above and it will appear here immediately.
        </section>
      ) : (
        <section className="grid gap-4">
          {alerts.map((alert) => (
            <article
              key={alert.id}
              className="card flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <div className="text-xs uppercase tracking-[0.22em] text-slate-500">
                  {alert.stock.symbol}
                </div>
                <div className="mt-2 text-xl font-semibold text-white">{alert.stock.name}</div>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
                <span className="rounded-full bg-white/5 px-3 py-2">
                  Trigger: {alert.triggerType === 'ABOVE' ? 'Above target' : 'Below target'}
                </span>
                <span className="rounded-full bg-white/5 px-3 py-2">
                  Target: {formatCurrency(alert.targetPrice)}
                </span>
                <span className="rounded-full bg-emerald-400/10 px-3 py-2 text-emerald-300">
                  {alert.isActive ? 'Active' : 'Paused'}
                </span>
                <button
                  type="button"
                  onClick={() => void handleDelete(alert.id)}
                  disabled={deletingAlertId === alert.id}
                  className="inline-flex items-center gap-2 rounded-full border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-rose-200 transition hover:border-rose-300/40 hover:bg-rose-400/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  {deletingAlertId === alert.id ? 'Deleting' : 'Delete'}
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
