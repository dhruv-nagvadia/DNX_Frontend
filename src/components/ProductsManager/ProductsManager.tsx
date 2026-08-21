import { useRef } from 'react';
import { Boxes, ChevronDown, ImagePlus, Layers, Pencil, Plus, Ruler, Trash2 } from 'lucide-react';

import { AlertBanner } from '@/components/AlertBanner';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Measure, Product } from '@/redux/api/provider/types';
import {
  MEASURES,
  SECTION_SUGGESTIONS,
  formatAmount,
  measureUnits,
  priceLabel,
  stockLabel,
} from '@/utils/units';
import { ProductsManagerProps } from './types';
import { useProductsManager } from './useProductsManager';
// Reuse the ServicesManager styles for the generic form/list…
import styles from '@/components/ServicesManager/ServicesManager.module.css';
// …plus polished controls for the measure/price/stock rows.
import ui from './ProductsManager.module.css';

/** Add / edit / delete the products a STORE business sells. */
export function ProductsManager({ providerId, products }: ProductsManagerProps) {
  const {
    editing,
    form,
    error,
    saving,
    uploadingImage,
    startAdd,
    startEdit,
    cancel,
    onChange,
    selectMeasure,
    pickImage,
    clearImage,
    submit,
    remove,
    toggleActive,
  } = useProductsManager(providerId);

  const fileRef = useRef<HTMLInputElement>(null);
  const unitOptions = measureUnits(form.measure).map((u) => (
    <option key={u.value} value={u.value}>
      {u.label}
    </option>
  ));

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

      <div className={styles.field}>
        <label className={styles.label} htmlFor="measure">
          Measured by
        </label>
        <div className={ui.selectWrap}>
          <select
            id="measure"
            className={ui.select}
            value={form.measure}
            onChange={(e) => selectMeasure(e.target.value as Measure)}
          >
            {MEASURES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <ChevronDown size={16} className={ui.chev} aria-hidden="true" />
        </div>
      </div>

      <div className={ui.grid2}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="price">
            Price (₹)
          </label>
          <div className={ui.affix}>
            <span className={ui.pre}>₹</span>
            <input
              id="price"
              name="price"
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              placeholder="200"
              value={form.price}
              onChange={onChange}
            />
          </div>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="priceQty">
            For this quantity
          </label>
          <div className={ui.affix}>
            <input
              id="priceQty"
              name="priceQty"
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              placeholder="100"
              value={form.priceQty}
              onChange={onChange}
            />
            <select className={ui.unitSuffix} name="priceUnit" value={form.priceUnit} onChange={onChange}>
              {unitOptions}
            </select>
          </div>
        </div>
      </div>

      <div className={ui.grid2}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="stock">
            Available stock
          </label>
          <div className={ui.affix}>
            <input
              id="stock"
              name="stock"
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              placeholder="15"
              value={form.stock}
              onChange={onChange}
            />
            <select className={ui.unitSuffix} name="stockUnit" value={form.stockUnit} onChange={onChange}>
              {unitOptions}
            </select>
          </div>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="step">
            Minimum order (step)
          </label>
          <div className={ui.affix}>
            <input
              id="step"
              name="step"
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              placeholder="100"
              value={form.step}
              onChange={onChange}
            />
            <select className={ui.unitSuffix} name="stepUnit" value={form.stepUnit} onChange={onChange}>
              {unitOptions}
            </select>
          </div>
        </div>
      </div>

      <p className={ui.hint}>
        <Ruler size={13} aria-hidden="true" /> Sold at{' '}
        <strong>
          ₹{form.price || '—'} for {form.priceQty || '—'} {form.priceUnit}
        </strong>
        , from a minimum of {form.step || '—'} {form.stepUnit} (customers can add in those steps).
      </p>

      <div className={styles.row2}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="section">
            Section <span className={styles.optional}>(groups it on the storefront)</span>
          </label>
          <input
            id="section"
            name="section"
            className={styles.input}
            list="product-sections"
            placeholder="e.g. Grains & Rice"
            value={form.section}
            onChange={onChange}
          />
          <datalist id="product-sections">
            {SECTION_SUGGESTIONS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>
            Photo <span className={styles.optional}>(optional)</span>
          </label>
          {form.imageUrl ? (
            <div className={ui.imageRow}>
              <img className={ui.imagePreview} src={form.imageUrl} alt="Product" />
              <div className={ui.imageActions}>
                <button
                  type="button"
                  className={ui.imageBtn}
                  disabled={uploadingImage}
                  onClick={() => fileRef.current?.click()}
                >
                  {uploadingImage ? 'Uploading…' : 'Change'}
                </button>
                <button type="button" className={`${ui.imageBtn} ${ui.imageBtnDanger}`} onClick={clearImage}>
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className={ui.uploadBtn}
              disabled={uploadingImage}
              onClick={() => fileRef.current?.click()}
            >
              <ImagePlus size={16} aria-hidden="true" />
              {uploadingImage ? 'Uploading…' : 'Upload from device'}
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              pickImage(e.target.files?.[0]);
              e.target.value = '';
            }}
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
      subtitle="What customers can order — price per quantity, stock, and a minimum."
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
                    <span className={styles.price}>{priceLabel(p.priceMinor, p.priceQty, p.measure, p.currency)}</span>
                    {p.section && (
                      <span className={styles.metaItem}>
                        <Layers size={14} aria-hidden="true" /> {p.section}
                      </span>
                    )}
                    <span className={styles.metaItem}>
                      <Boxes size={14} aria-hidden="true" /> {stockLabel(p.stockQty, p.measure)}
                    </span>
                    <span className={styles.metaItem}>
                      <Ruler size={14} aria-hidden="true" /> min {formatAmount(p.stepQty, p.measure)}
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
