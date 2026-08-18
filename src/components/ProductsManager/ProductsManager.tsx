import { Boxes, Layers, Pencil, Plus, Trash2 } from 'lucide-react';

import { AlertBanner } from '@/components/AlertBanner';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Product } from '@/redux/api/provider/types';
import { ProductsManagerProps } from './types';
import { useProductsManager } from './useProductsManager';
// Reuse the ServicesManager styles — same list/form visual language.
import styles from '@/components/ServicesManager/ServicesManager.module.css';

function formatPrice(minor: number, currency: string) {
  const amount = (minor / 100).toLocaleString('en-IN');
  return currency === 'INR' ? `₹${amount}` : `${amount} ${currency}`;
}

/** Add / edit / delete the products a STORE business sells. */
export function ProductsManager({ providerId, products }: ProductsManagerProps) {
  const { editing, form, error, saving, startAdd, startEdit, cancel, onChange, submit, remove, toggleActive } =
    useProductsManager(providerId);

  const renderForm = (isNew: boolean) => (
    <form className={styles.form} onSubmit={submit}>
      <p className={styles.formTitle}>{isNew ? 'New product' : 'Edit product'}</p>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="name">
          Product name
        </label>
        <input
          id="name"
          name="name"
          className={styles.input}
          placeholder="e.g. Basmati Rice"
          value={form.name}
          onChange={onChange}
        />
      </div>

      <div className={styles.row2}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="price">
            Price
          </label>
          <div className={styles.inputPrefix}>
            <span className={styles.prefix}>₹</span>
            <input
              id="price"
              name="price"
              className={styles.input}
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              placeholder="120"
              value={form.price}
              onChange={onChange}
            />
          </div>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="unit">
            Unit
          </label>
          <input
            id="unit"
            name="unit"
            className={styles.input}
            placeholder="e.g. 1 kg, 500 ml, piece"
            value={form.unit}
            onChange={onChange}
          />
        </div>
      </div>

      <div className={styles.row2}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="section">
            Section <span className={styles.optional}>(optional)</span>
          </label>
          <input
            id="section"
            name="section"
            className={styles.input}
            placeholder="e.g. Grains, Toiletries"
            value={form.section}
            onChange={onChange}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="stockQty">
            In stock
          </label>
          <input
            id="stockQty"
            name="stockQty"
            className={styles.input}
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            placeholder="0"
            value={form.stockQty}
            onChange={onChange}
          />
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="description">
          Description <span className={styles.optional}>(optional)</span>
        </label>
        <textarea
          id="description"
          name="description"
          className={styles.textarea}
          placeholder="Brand, quality, or any details customers should know."
          value={form.description}
          onChange={onChange}
        />
      </div>

      {error && <AlertBanner tone="error">{error}</AlertBanner>}

      <div className={styles.formActions}>
        <Button type="button" variant="secondary" onClick={cancel}>
          Cancel
        </Button>
        <Button type="submit" loading={saving} loadingText="Saving…">
          {isNew ? 'Add product' : 'Save changes'}
        </Button>
      </div>
    </form>
  );

  return (
    <Card
      title="Products"
      subtitle="What customers can order, with price, unit and stock."
      action={
        editing === null ? (
          <Button variant="secondary" onClick={startAdd} iconLeft={<Plus size={16} aria-hidden="true" />}>
            Add product
          </Button>
        ) : undefined
      }
    >
      {editing === 'new' && renderForm(true)}

      {products.length === 0 && editing !== 'new' ? (
        <p className={styles.muted}>
          No products yet. Add the items you sell so customers can browse and order them.
        </p>
      ) : (
        <div className={styles.list}>
          {products.map((p: Product) =>
            editing === p.id ? (
              <div key={p.id}>{renderForm(false)}</div>
            ) : (
              <div
                key={p.id}
                className={`${styles.row} ${p.isActive === false ? styles.rowInactive : ''}`}
              >
                <div className={styles.rowMain}>
                  <div className={styles.rowName}>{p.name}</div>
                  {p.description && <div className={styles.rowDesc}>{p.description}</div>}
                  <div className={styles.rowMeta}>
                    <span className={styles.price}>
                      {formatPrice(p.priceMinor, p.currency)} <span className={styles.optional}>/ {p.unit}</span>
                    </span>
                    {p.section && (
                      <span className={styles.metaItem}>
                        <Layers size={14} aria-hidden="true" /> {p.section}
                      </span>
                    )}
                    <span className={styles.metaItem}>
                      <Boxes size={14} aria-hidden="true" />{' '}
                      {p.stockQty > 0 ? `${p.stockQty} in stock` : 'Out of stock'}
                    </span>
                    <button
                      type="button"
                      className={`${styles.statusChip} ${
                        p.isActive === false ? styles.inactive : styles.active
                      }`}
                      onClick={() => toggleActive(p)}
                      aria-pressed={p.isActive !== false}
                    >
                      <span className={styles.statusDot} aria-hidden="true" />
                      {p.isActive === false ? 'Hidden' : 'Listed'}
                    </button>
                  </div>
                </div>

                <div className={styles.rowActions}>
                  <button
                    type="button"
                    className={styles.iconBtn}
                    onClick={() => startEdit(p)}
                    aria-label={`Edit ${p.name}`}
                  >
                    <Pencil size={16} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                    onClick={() => remove(p.id)}
                    aria-label={`Delete ${p.name}`}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </Card>
  );
}
