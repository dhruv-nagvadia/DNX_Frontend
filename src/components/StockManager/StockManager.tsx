import { AlertTriangle, PackageMinus, PackagePlus, X } from 'lucide-react';

import { AlertBanner } from '@/components/AlertBanner';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Combobox } from '@/components/Combobox';
import { Select } from '@/components/Select';
import { Product } from '@/redux/api/provider/types';
import { formatAmount, measureUnits, stockLevel } from '@/utils/units';
import { StockManagerProps } from './types';
import { useStockManager } from './useStockManager';
// Generic field/label/form styling shared across provider forms.
import styles from '@/components/ServicesManager/ServicesManager.module.css';
import ui from './StockManager.module.css';

/**
 * Search any product this business sells and record a stock change right
 * there — no need to open each product's own edit form one at a time.
 */
export function StockManager({ providerId, products }: StockManagerProps) {
  const {
    query,
    selectedProduct,
    form,
    error,
    successMessage,
    saving,
    onQueryChange,
    onSelectProduct,
    clearSelection,
    onFieldChange,
    setDirection,
    submit,
    setAvailability,
  } = useStockManager(providerId);

  const items = products.map((p) => ({ label: p.name, meta: p }));
  const unitOptions = measureUnits(selectedProduct?.measure ?? 'count');
  const level =
    selectedProduct && !selectedProduct.unlimitedStock
      ? stockLevel(selectedProduct.stockQty, selectedProduct.stepQty)
      : null;

  const markOutOfStock = () => {
    if (!selectedProduct) return;
    if (window.confirm(`Mark ${selectedProduct.name} as out of stock? This sets its stock to 0.`)) {
      setAvailability(false);
    }
  };

  return (
    <Card title="Manage stock">
      {products.length === 0 ? (
        <p className={styles.muted}>Add a product first, then you can manage its stock here.</p>
      ) : (
        <>
          <div className={ui.searchWrap}>
            <label className={ui.searchLabel} htmlFor="stockSearch">
              1. Find a product
            </label>
            <Combobox<Product>
              id="stockSearch"
              value={query}
              placeholder="Search a product by name…"
              items={items}
              onChange={onQueryChange}
              onSelect={onSelectProduct}
            />
          </div>

          {successMessage && <AlertBanner tone="success">{successMessage}</AlertBanner>}

          {!selectedProduct ? (
            <p className={ui.hint}>Pick a product above, then its stock controls will show up here.</p>
          ) : selectedProduct.unlimitedStock ? (
            <div className={ui.panel}>
              <div className={ui.panelHead}>
                <div className={ui.panelHeadText}>
                  <div className={ui.panelName}>{selectedProduct.name}</div>
                  <p className={ui.panelSub}>Made to order, no fixed quantity to track.</p>
                </div>
                <button
                  type="button"
                  className={ui.clearBtn}
                  onClick={clearSelection}
                  aria-label="Clear selection"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>

              <div className={`${ui.statRow} ${selectedProduct.stockQty <= 0 ? ui.statRowOut : ''}`}>
                {selectedProduct.stockQty <= 0 && (
                  <span className={ui.statIconOut} aria-hidden="true">
                    <AlertTriangle size={15} />
                  </span>
                )}
                <span
                  className={`${ui.statValue} ${selectedProduct.stockQty > 0 ? ui.statValueOk : ui.statValueOut}`}
                >
                  {selectedProduct.stockQty > 0 ? 'Available' : 'Unavailable'}
                </span>
                <span className={ui.statLabel}>to customers right now</span>
              </div>

              <div className={ui.section}>
                <div className={ui.sectionLabel}>2. Update availability</div>
                <div className={ui.directionRow}>
                  <button
                    type="button"
                    className={`${ui.directionBtn} ${
                      selectedProduct.stockQty > 0 ? ui.directionBtnActiveAdd : ''
                    }`}
                    onClick={() => setAvailability(true)}
                    disabled={saving || selectedProduct.stockQty > 0}
                  >
                    <PackagePlus size={16} aria-hidden="true" /> Mark available
                  </button>
                  <button
                    type="button"
                    className={`${ui.directionBtn} ${
                      selectedProduct.stockQty <= 0 ? ui.directionBtnActiveRemove : ''
                    }`}
                    onClick={markOutOfStock}
                    disabled={saving || selectedProduct.stockQty <= 0}
                  >
                    <PackageMinus size={16} aria-hidden="true" /> Mark unavailable
                  </button>
                </div>
              </div>

              {error && <AlertBanner tone="error">{error}</AlertBanner>}
            </div>
          ) : (
          <form className={ui.panel} onSubmit={submit}>
            <div className={ui.panelHead}>
              <div className={ui.panelHeadText}>
                <div className={ui.panelName}>{selectedProduct.name}</div>
              </div>
              <button
                type="button"
                className={ui.clearBtn}
                onClick={clearSelection}
                aria-label="Clear selection"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className={`${ui.statRow} ${selectedProduct.stockQty <= 0 ? ui.statRowOut : ''}`}>
              {selectedProduct.stockQty > 0 ? (
                <>
                  <span className={ui.statValue}>
                    {formatAmount(selectedProduct.stockQty, selectedProduct.measure)}
                  </span>
                  <span className={ui.statLabel}>in stock</span>
                  {level === 'low' && (
                    <span className={`${ui.stockBadge} ${ui.stockLow}`}>
                      <AlertTriangle size={11} aria-hidden="true" /> Running low
                    </span>
                  )}
                  <button
                    type="button"
                    className={ui.quickOutBtn}
                    onClick={markOutOfStock}
                    disabled={saving}
                  >
                    Mark out of stock
                  </button>
                </>
              ) : (
                <>
                  <span className={ui.statIconOut} aria-hidden="true">
                    <AlertTriangle size={15} />
                  </span>
                  <span className={`${ui.statValue} ${ui.statValueOut}`}>Out of stock</span>
                  <span className={ui.statLabel}>Add stock below to bring it back.</span>
                </>
              )}
            </div>

            <div className={ui.section}>
              <div className={ui.sectionLabel}>2. Adjust stock</div>
              <div className={ui.directionRow}>
                <button
                  type="button"
                  className={`${ui.directionBtn} ${
                    form.direction === 'add' ? ui.directionBtnActiveAdd : ''
                  }`}
                  onClick={() => setDirection('add')}
                  disabled={saving}
                >
                  <PackagePlus size={16} aria-hidden="true" /> Add stock
                </button>
                <button
                  type="button"
                  className={`${ui.directionBtn} ${
                    form.direction === 'remove' ? ui.directionBtnActiveRemove : ''
                  }`}
                  onClick={() => setDirection('remove')}
                  disabled={saving || selectedProduct.stockQty <= 0}
                  title={
                    selectedProduct.stockQty <= 0
                      ? 'Nothing to remove. This product is already out of stock.'
                      : undefined
                  }
                >
                  <PackageMinus size={16} aria-hidden="true" /> Remove stock
                </button>
              </div>
            </div>

            <div className={ui.section}>
              <div className={ui.sectionLabel}>3. Details</div>
              <div className={ui.grid2}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="stockAmount">
                    Amount
                  </label>
                  <div className={ui.affix}>
                    <input
                      id="stockAmount"
                      name="amount"
                      type="number"
                      min="0"
                      step="any"
                      inputMode="decimal"
                      placeholder="1"
                      value={form.amount}
                      onChange={onFieldChange}
                      disabled={saving}
                    />
                    <select
                      className={ui.unitSuffix}
                      name="unit"
                      value={form.unit}
                      onChange={onFieldChange}
                      disabled={saving}
                    >
                      {unitOptions.map((u) => (
                        <option key={u.value} value={u.value}>
                          {u.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="stockReason">
                    Reason <span className={styles.optional}>(optional)</span>
                  </label>
                  <Select
                    id="stockReason"
                    name="reason"
                    value={form.reason}
                    onChange={onFieldChange}
                    disabled={saving}
                  >
                    <option value="">Select a reason…</option>
                    <option value="SALE">Offline sale</option>
                    <option value="RESTOCK">Restock</option>
                    <option value="DAMAGED">Damaged / lost</option>
                    <option value="OTHER">Other</option>
                  </Select>
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="stockNote">
                  Note <span className={styles.optional}>(optional)</span>
                </label>
                <input
                  id="stockNote"
                  name="note"
                  className={styles.input}
                  placeholder="Any details worth keeping"
                  value={form.note}
                  onChange={onFieldChange}
                  disabled={saving}
                />
              </div>
            </div>

            {error && <AlertBanner tone="error">{error}</AlertBanner>}

            <div className={styles.formActions}>
              <Button type="button" variant="secondary" onClick={clearSelection} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" loading={saving} loadingText="Saving…">
                Save adjustment
              </Button>
            </div>
          </form>
          )}
        </>
      )}
    </Card>
  );
}
