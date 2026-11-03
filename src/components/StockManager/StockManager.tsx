import {
  ArrowRight,
  Ban,
  Box,
  ChevronDown,
  CircleCheck,
  History,
  ImageOff,
  Layers,
  Minus,
  PackageMinus,
  PackagePlus,
  Plus,
  Search,
  TriangleAlert,
} from 'lucide-react';
import { ReactNode } from 'react';

import { AlertBanner } from '@/components/AlertBanner';
import { ModernCard, ModernCardLink } from '@/components/ModernCard';
import { Pill, PillTone } from '@/components/Pill';
import { Skeleton } from '@/components/Skeleton';
import { Product, StockAdjustment, StockAdjustmentReason } from '@/redux/api/provider/types';
import { formatAmount, measureUnits, priceLabel } from '@/utils/units';
import { StockFilter, StockManagerProps } from './types';
import { isLow, isOut, RECENT_LIMIT, useStockManager } from './useStockManager';
import ui from './StockManager.module.css';

const REASONS: { value: StockAdjustmentReason; label: string; tone: PillTone }[] = [
  { value: 'SALE', label: 'Offline sale', tone: 'lavender' },
  { value: 'RESTOCK', label: 'Restock', tone: 'blue' },
  { value: 'DAMAGED', label: 'Damaged / lost', tone: 'orange' },
  { value: 'OTHER', label: 'Other', tone: 'grey' },
];

const FILTERS: { value: StockFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'low', label: 'Low stock' },
  { value: 'out', label: 'Out of stock' },
];

/** "piece" reads as "pcs" in the compact unit dropdown, like the amounts. */
const unitText = (label: string) => (label === 'piece' ? 'pcs' : label);

const dateFmt = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/** Stock pill for a product: list row and the "Current Stock" badge share it. */
function stockPill(p: Product, current = false): { tone: PillTone; text: string } {
  if (isOut(p)) return { tone: 'red', text: p.unlimitedStock ? 'Unavailable' : 'Out of stock' };
  if (p.unlimitedStock) return { tone: 'grey', text: 'Made to order' };
  const amount = formatAmount(p.stockQty, p.measure);
  if (current) return { tone: isLow(p) ? 'orange' : 'green', text: `Current Stock: ${amount}` };
  if (isLow(p)) {
    return { tone: 'orange', text: `Only ${p.measure === 'count' ? p.stockQty : amount} left` };
  }
  return { tone: 'green', text: amount };
}

function Thumb({ src, size }: { src?: string | null; size: 'sm' | 'lg' }) {
  const cls = size === 'lg' ? ui.photo : ui.thumb;
  return src ? (
    <img className={cls} src={src} alt="" loading="lazy" />
  ) : (
    <span className={`${cls} ${ui.thumbPlaceholder}`} aria-hidden="true">
      <ImageOff size={size === 'lg' ? 28 : 18} />
    </span>
  );
}

function SummaryTile({
  tone,
  icon,
  label,
  value,
}: {
  tone: 'blue' | 'mint' | 'peach' | 'pink';
  icon: ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className={`${ui.tile} ${ui[`tile_${tone}`]}`}>
      <span className={ui.tileIcon} aria-hidden="true">
        {icon}
      </span>
      <div className={ui.tileText}>
        <span className={ui.tileLabel}>{label}</span>
        <span className={ui.tileValue}>{value}</span>
      </div>
    </div>
  );
}

function HistoryRow({ row }: { row: StockAdjustment }) {
  const reason = REASONS.find((r) => r.value === row.reason);
  const amount = formatAmount(Math.abs(row.delta), row.product.measure);
  return (
    <tr>
      <td className={ui.nowrap}>{dateFmt.format(new Date(row.createdAt))}</td>
      <td className={ui.strong}>{row.product.name}</td>
      <td>
        <Pill tone={row.delta >= 0 ? 'green' : 'red'}>
          {row.delta >= 0 ? '+' : '−'}
          {amount}
        </Pill>
      </td>
      <td>{reason ? <Pill tone={reason.tone}>{reason.label}</Pill> : <span className={ui.muted}>—</span>}</td>
      <td className={ui.noteCell}>{row.note?.trim() || <span className={ui.muted}>—</span>}</td>
      <td className={ui.nowrap}>
        {row.stockAfter == null ? (
          <span className={ui.muted}>—</span>
        ) : (
          formatAmount(row.stockAfter, row.product.measure)
        )}
      </td>
    </tr>
  );
}

/**
 * Manage Stock tab: summary tiles, a searchable product list, the adjust
 * panel for the selected product, and the recent stock-change history.
 * Every value shown comes from the `products` prop or the stock-adjustments API.
 */
export function StockManager({ providerId, products }: StockManagerProps) {
  const {
    counts,
    query,
    filter,
    setFilter,
    visibleProducts,
    selectedProduct: sel,
    form,
    newStock,
    amountBase,
    removingTooMuch,
    error,
    successMessage,
    saving,
    onQueryChange,
    onSelectProduct,
    onFieldChange,
    stepAmount,
    setDirection,
    submit,
    setAvailability,
    history,
  } = useStockManager(providerId, products);

  if (products.length === 0) {
    return (
      <ModernCard icon={<Layers size={22} />} title="Manage Stock">
        <div className={ui.empty}>
          <Box size={32} aria-hidden="true" />
          <p className={ui.emptyTitle}>Add products first</p>
          <p className={ui.muted}>Once this business has products, you can manage their stock here.</p>
        </div>
      </ModernCard>
    );
  }

  const markOutOfStock = () => {
    if (!sel) return;
    if (window.confirm(`Mark ${sel.name} as out of stock? This sets its stock to 0.`)) {
      setAvailability(false);
    }
  };

  const unitOptions = measureUnits(sel?.measure ?? 'count');
  const current = sel ? stockPill(sel, true) : null;

  return (
    <div className={ui.root}>
      <div className={ui.tiles}>
        <SummaryTile tone="blue" icon={<Box size={26} />} label="Total Products" value={counts.total} />
        <SummaryTile tone="mint" icon={<CircleCheck size={26} />} label="In Stock" value={counts.in} />
        <SummaryTile tone="peach" icon={<TriangleAlert size={26} />} label="Low Stock" value={counts.low} />
        <SummaryTile tone="pink" icon={<Ban size={26} />} label="Out of Stock" value={counts.out} />
      </div>

      <div className={ui.columns}>
        {/* ── Select product ─────────────────────────────────────────── */}
        <section className={`${ui.card} ${ui.selectCard}`}>
          <h2 className={ui.cardTitle}>
            <Box size={22} className={ui.cardIcon} aria-hidden="true" /> Select Product
          </h2>
          <label className={ui.search}>
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={onQueryChange}
              placeholder="Search a product by name..."
              aria-label="Search a product by name"
            />
          </label>
          <div className={ui.chips} role="group" aria-label="Filter products">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                className={`${ui.chip} ${filter === f.value ? ui.chipActive : ''}`}
                aria-pressed={filter === f.value}
                onClick={() => setFilter(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className={ui.listWrap}>
            {visibleProducts.length === 0 ? (
              <p className={`${ui.muted} ${ui.listEmpty}`}>No products match.</p>
            ) : (
              <ul className={ui.list}>
                {visibleProducts.map((p) => {
                  const pill = stockPill(p);
                  const active = sel?.id === p.id;
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        className={`${ui.row} ${active ? ui.rowActive : ''}`}
                        aria-current={active || undefined}
                        onClick={() => onSelectProduct(p)}
                      >
                        <Thumb src={p.imageUrl} size="sm" />
                        <span className={ui.rowText}>
                          <span className={ui.rowName}>{p.name}</span>
                          {(p.section || p.productType?.name) && (
                            <span className={ui.rowSub}>{p.section || p.productType?.name}</span>
                          )}
                        </span>
                        <Pill tone={pill.tone}>{pill.text}</Pill>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        {/* ── Adjust stock ───────────────────────────────────────────── */}
        <section className={ui.card}>
          <h2 className={ui.cardTitle}>
            <Layers size={22} className={ui.cardIcon} aria-hidden="true" /> Adjust Stock
          </h2>

          {sel && current && (
            <>
              <div className={ui.productHead}>
                <Thumb src={sel.imageUrl} size="lg" />
                <div className={ui.productInfo}>
                  <div className={ui.productName}>{sel.name}</div>
                  <div className={ui.productSub}>
                    {(sel.section || sel.productType?.name) && (
                      <>
                        {sel.section || sel.productType?.name}
                        <span className={ui.dot} aria-hidden="true">
                          •
                        </span>
                      </>
                    )}
                    {priceLabel(sel.priceMinor, sel.priceQty, sel.measure, sel.currency)}
                  </div>
                </div>
                <Pill tone={current.tone} className={ui.currentPill}>
                  {current.text}
                </Pill>
              </div>

              {successMessage && <AlertBanner tone="success">{successMessage}</AlertBanner>}

              {sel.unlimitedStock ? (
                <div className={ui.form}>
                  <p className={ui.muted}>
                    Made to order, no fixed quantity to track. It is currently{' '}
                    <strong>{sel.stockQty > 0 ? 'available' : 'unavailable'}</strong> to customers.
                  </p>
                  <div className={ui.segment}>
                    <button
                      type="button"
                      className={`${ui.segBtn} ${sel.stockQty > 0 ? ui.segActive : ''}`}
                      onClick={() => setAvailability(true)}
                      disabled={saving || sel.stockQty > 0}
                    >
                      <PackagePlus size={18} aria-hidden="true" /> Mark available
                    </button>
                    <button
                      type="button"
                      className={`${ui.segBtn} ${sel.stockQty <= 0 ? ui.segActiveDanger : ''}`}
                      onClick={markOutOfStock}
                      disabled={saving || sel.stockQty <= 0}
                    >
                      <PackageMinus size={18} aria-hidden="true" /> Mark unavailable
                    </button>
                  </div>
                  {error && <AlertBanner tone="error">{error}</AlertBanner>}
                </div>
              ) : (
                <form className={ui.form} onSubmit={submit} noValidate>
                  <div className={ui.segment}>
                    <button
                      type="button"
                      className={`${ui.segBtn} ${form.direction === 'add' ? ui.segActive : ''}`}
                      aria-pressed={form.direction === 'add'}
                      onClick={() => setDirection('add')}
                      disabled={saving}
                    >
                      <Plus size={18} aria-hidden="true" /> Add Stock
                    </button>
                    <button
                      type="button"
                      className={`${ui.segBtn} ${form.direction === 'remove' ? ui.segActive : ''}`}
                      aria-pressed={form.direction === 'remove'}
                      onClick={() => setDirection('remove')}
                      disabled={saving || sel.stockQty <= 0}
                      title={
                        sel.stockQty <= 0
                          ? 'Nothing to remove. This product is already out of stock.'
                          : undefined
                      }
                    >
                      <Minus size={18} aria-hidden="true" /> Remove Stock
                    </button>
                  </div>

                  <div className={ui.grid2}>
                    <div className={ui.field}>
                      <label className={ui.label} htmlFor="stockAmount">
                        Quantity <span className={ui.req}>*</span>
                      </label>
                      <div className={ui.qtyRow}>
                        <div className={ui.stepper}>
                          <button
                            type="button"
                            className={ui.stepBtn}
                            onClick={() => stepAmount(-1)}
                            disabled={saving || !form.amount}
                            aria-label="Decrease quantity"
                          >
                            <Minus size={18} />
                          </button>
                          <input
                            id="stockAmount"
                            name="amount"
                            type="number"
                            min="0"
                            step="any"
                            inputMode="decimal"
                            placeholder="0"
                            value={form.amount}
                            onChange={onFieldChange}
                            disabled={saving}
                          />
                          <button
                            type="button"
                            className={ui.stepBtn}
                            onClick={() => stepAmount(1)}
                            disabled={saving}
                            aria-label="Increase quantity"
                          >
                            <Plus size={18} />
                          </button>
                        </div>
                        <div className={ui.selectWrap}>
                          <select
                            className={`${ui.select} ${ui.unitSelect}`}
                            name="unit"
                            value={form.unit}
                            onChange={onFieldChange}
                            disabled={saving}
                            aria-label="Unit"
                          >
                            {unitOptions.map((u) => (
                              <option key={u.value} value={u.value}>
                                {unitText(u.label)}
                              </option>
                            ))}
                          </select>
                          <ChevronDown size={18} className={ui.chevron} aria-hidden="true" />
                        </div>
                      </div>
                      {amountBase > 0 &&
                        (removingTooMuch ? (
                          <p className={`${ui.helper} ${ui.helperError}`}>
                            Only {formatAmount(sel.stockQty, sel.measure)} in stock, you can't remove more
                            than that.
                          </p>
                        ) : (
                          <p className={`${ui.helper} ${ui.helperOk}`}>
                            New stock will be {formatAmount(newStock, sel.measure)}
                          </p>
                        ))}
                    </div>

                    <div className={ui.field}>
                      <label className={ui.label} htmlFor="stockReason">
                        Reason <span className={ui.req}>*</span>
                      </label>
                      <div className={ui.selectWrap}>
                        <select
                          id="stockReason"
                          className={ui.select}
                          name="reason"
                          value={form.reason}
                          onChange={onFieldChange}
                          disabled={saving}
                        >
                          <option value="">Select a reason…</option>
                          {REASONS.map((r) => (
                            <option key={r.value} value={r.value}>
                              {r.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={18} className={ui.chevron} aria-hidden="true" />
                      </div>
                    </div>
                  </div>

                  <div className={ui.field}>
                    <label className={ui.label} htmlFor="stockNote">
                      Note <span className={ui.optional}>(optional)</span>
                    </label>
                    <textarea
                      id="stockNote"
                      name="note"
                      className={ui.textarea}
                      rows={2}
                      placeholder="e.g. Received new stock from supplier"
                      value={form.note}
                      onChange={onFieldChange}
                      disabled={saving}
                    />
                  </div>

                  {error && <AlertBanner tone="error">{error}</AlertBanner>}

                  <div className={ui.actions}>
                    <button
                      type="submit"
                      className={ui.primaryBtn}
                      disabled={saving || removingTooMuch}
                    >
                      {saving ? 'Saving…' : 'Update Stock'}
                    </button>
                    <button
                      type="button"
                      className={ui.dangerBtn}
                      onClick={markOutOfStock}
                      disabled={saving || sel.stockQty <= 0}
                    >
                      <Ban size={20} aria-hidden="true" /> Mark as Out of Stock
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </section>
      </div>

      {/* ── Recent stock changes ─────────────────────────────────────── */}
      <ModernCard
        icon={<History size={22} />}
        iconTone="ink"
        title="Recent Stock Changes"
        flush
        action={
          (history.showAll || history.items.length >= RECENT_LIMIT) && (
            <ModernCardLink
              onClick={history.toggleShowAll}
              iconRight={history.showAll ? undefined : <ArrowRight size={16} aria-hidden="true" />}
            >
              {history.showAll ? 'Show less' : 'View All'}
            </ModernCardLink>
          )
        }
      >
        <div className={ui.tableScroll}>
          <table className={ui.table}>
            <thead>
              <tr>
                <th>Date &amp; Time</th>
                <th>Product</th>
                <th>Change</th>
                <th>Reason</th>
                <th>Note</th>
                <th>New Stock</th>
              </tr>
            </thead>
            <tbody>
              {history.loading ? (
                Array.from({ length: 3 }, (_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }, (__, j) => (
                      <td key={j}>
                        <Skeleton height={18} width={j === 4 ? '80%' : '60%'} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : history.isError ? (
                <tr>
                  <td colSpan={6} className={ui.tableEmpty}>
                    Couldn't load stock changes. Please try again later.
                  </td>
                </tr>
              ) : history.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className={ui.tableEmpty}>
                    No stock changes yet.
                  </td>
                </tr>
              ) : (
                history.items.map((row) => <HistoryRow key={row.id} row={row} />)
              )}
            </tbody>
          </table>
        </div>
      </ModernCard>
    </div>
  );
}
