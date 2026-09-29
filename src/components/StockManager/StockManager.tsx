import { ChevronDown, PackageMinus, PackagePlus, X } from 'lucide-react';

import { AlertBanner } from '@/components/AlertBanner';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Combobox } from '@/components/Combobox';
import { Product } from '@/redux/api/provider/types';
import { measureUnits, stockLabel } from '@/utils/units';
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
  } = useStockManager(providerId);

  const items = products.map((p) => ({ label: p.name, meta: p }));
  const disabled = !selectedProduct;
  const unitOptions = measureUnits(selectedProduct?.measure ?? 'count');

  return (
    <Card
      title="Manage stock"
      subtitle="Search a product, then add or remove stock — no need to open each one."
    >
      {products.length === 0 ? (
        <p className={styles.muted}>Add a product first, then you can manage its stock here.</p>
      ) : (
        <>
          <div className={ui.searchWrap}>
            <Combobox<Product>
              value={query}
              placeholder="Search a product by name…"
              items={items}
              onChange={onQueryChange}
              onSelect={onSelectProduct}
            />
          </div>

          {successMessage && <AlertBanner tone="success">{successMessage}</AlertBanner>}

          <form className={ui.panel} onSubmit={submit}>
            <div className={ui.panelHead}>
              <div>
                <div className={ui.panelName}>
                  {selectedProduct ? selectedProduct.name : 'No product selected'}
                </div>
                <p className={ui.panelSub}>
                  {selectedProduct
                    ? `Currently ${stockLabel(selectedProduct.stockQty, selectedProduct.measure)}`
                    : 'Search and pick a product above to manage its stock.'}
                </p>
              </div>
              {selectedProduct && (
                <button
                  type="button"
                  className={ui.clearBtn}
                  onClick={clearSelection}
                  aria-label="Clear selection"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              )}
            </div>

            <div className={ui.directionRow}>
              <button
                type="button"
                className={`${ui.directionBtn} ${
                  form.direction === 'add' ? ui.directionBtnActiveAdd : ''
                }`}
                onClick={() => setDirection('add')}
                disabled={disabled}
              >
                <PackagePlus size={16} aria-hidden="true" /> Add stock
              </button>
              <button
                type="button"
                className={`${ui.directionBtn} ${
                  form.direction === 'remove' ? ui.directionBtnActiveRemove : ''
                }`}
                onClick={() => setDirection('remove')}
                disabled={disabled}
              >
                <PackageMinus size={16} aria-hidden="true" /> Remove stock
              </button>
            </div>

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
                    disabled={disabled}
                  />
                  <select
                    className={ui.unitSuffix}
                    name="unit"
                    value={form.unit}
                    onChange={onFieldChange}
                    disabled={disabled}
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
                <div className={ui.selectWrap}>
                  <select
                    id="stockReason"
                    className={ui.select}
                    name="reason"
                    value={form.reason}
                    onChange={onFieldChange}
                    disabled={disabled}
                  >
                    <option value="">Select a reason…</option>
                    <option value="SALE">Offline sale</option>
                    <option value="RESTOCK">Restock</option>
                    <option value="DAMAGED">Damaged / lost</option>
                    <option value="OTHER">Other</option>
                  </select>
                  <ChevronDown size={16} className={ui.chev} aria-hidden="true" />
                </div>
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
                disabled={disabled}
              />
            </div>

            {error && <AlertBanner tone="error">{error}</AlertBanner>}

            <div className={styles.formActions}>
              <Button type="button" variant="secondary" onClick={clearSelection} disabled={saving || disabled}>
                Cancel
              </Button>
              <Button type="submit" loading={saving} loadingText="Saving…" disabled={disabled}>
                Save adjustment
              </Button>
            </div>
          </form>
        </>
      )}
    </Card>
  );
}
