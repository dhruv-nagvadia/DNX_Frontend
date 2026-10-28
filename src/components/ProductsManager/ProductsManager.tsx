import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Banknote,
  Boxes,
  ChevronDown,
  FileText,
  FolderTree,
  ImagePlus,
  Pencil,
  Percent,
  Plus,
  Ruler,
  Star,
  Tag,
  Trash2,
} from 'lucide-react';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Combobox } from '@/components/Combobox';
import { FormDialog } from '@/components/FormDialog';
import { FormSection } from '@/components/FormSection';
import { OptionSection } from '@/components/OptionSection';
import { Measure, Product } from '@/redux/api/provider/types';
import { useGetProductTypesQuery } from '@/redux/api/productType/productTypeApi';
import { PRODUCT_SUGGESTIONS } from '@/data/productSuggestions';
import {
  MEASURES,
  SECTION_SUGGESTIONS,
  formatAmount,
  measureUnits,
  priceLabel,
  stockLabel,
  stockLevel,
} from '@/utils/units';
import { ProductsManagerProps } from './types';
import { useProductsManager } from './useProductsManager';
// Reuse the ServicesManager styles for the generic form/list…
import styles from '@/components/ServicesManager/ServicesManager.module.css';
// …plus polished controls for the measure/price/stock rows.
import ui from './ProductsManager.module.css';
// Shared "name + inline tag" row styling (same pattern coupons use).
import tagStyles from '@/components/CouponsManager/CouponsManager.module.css';

/** Add / edit / delete the products a STORE business sells. */
export function ProductsManager({
  providerId,
  products,
  subcategorySlug,
  businessCodEnabled,
  businessPartialPayEnabled,
}: ProductsManagerProps) {
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
    toggleCodEnabled,
    togglePartialPayEnabled,
    toggleUnlimitedStock,
    applySuggestion,
    selectMeasure,
    pickImage,
    clearImage,
    submit,
    remove,
    toggleActive,
  } = useProductsManager(providerId, businessCodEnabled, businessPartialPayEnabled);

  const fileRef = useRef<HTMLInputElement>(null);
  const { data: productTypes = [] } = useGetProductTypesQuery();
  const unitOptions = measureUnits(form.measure).map((u) => (
    <option key={u.value} value={u.value}>
      {u.label}
    </option>
  ));

  const suggestions = (subcategorySlug && PRODUCT_SUGGESTIONS[subcategorySlug]) || [];
  const comboItems = suggestions.map((name) => ({ label: name }));

  const isNew = editing === 'new';

  // The form is split into tabs; it always opens on the first one.
  const [tab, setTab] = useState('basics');
  useEffect(() => {
    if (editing !== null) setTab('basics');
  }, [editing]);
  const tabs = [
    { id: 'basics', label: 'Basics' },
    { id: 'pricing', label: 'Price & stock' },
    { id: 'payments', label: 'Payments' },
    { id: 'photo', label: 'Photo' },
  ];

  const codLocked = businessCodEnabled === false;
  const partialLocked = businessPartialPayEnabled === false;

  return (
    <Card
      title="Products"
      action={
        editing === null ? (
          <Button
            variant="secondary"
            onClick={startAdd}
            iconLeft={<Plus size={16} aria-hidden="true" />}
          >
            Add product
          </Button>
        ) : undefined
      }
    >
      {products.length === 0 && editing !== 'new' ? (
        <p className={styles.muted}>
          No products yet. Add the items you sell so customers can browse and order them.
        </p>
      ) : (
        <div className={ui.tableWrap}>
          <table className={ui.table}>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Min. order</th>
                <th>Rating</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p: Product) => {
                const level = p.unlimitedStock ? null : stockLevel(p.stockQty, p.stepQty);
                const outOfStock = p.unlimitedStock ? p.stockQty <= 0 : level === 'out';
                const lowStock = level === 'low';
                return (
                  <tr key={p.id} className={p.isActive === false ? ui.rowInactive : ''}>
                    <td>
                      <div className={ui.productCell}>
                        {p.imageUrl ? (
                          <img className={ui.thumb} src={p.imageUrl} alt="" />
                        ) : (
                          <span className={ui.thumbPlaceholder} aria-hidden="true">
                            <ImagePlus size={16} />
                          </span>
                        )}
                        <div className={ui.cellMain}>
                          <span className={ui.cellTitle}>{p.name}</span>
                          {p.description && <span className={ui.cellSub}>{p.description}</span>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className={ui.categoryCell}>
                        {p.productType && (
                          <span className={tagStyles.scopeTag}>{p.productType.name}</span>
                        )}
                        {p.section ? (
                          <span className={ui.cellSub}>{p.section}</span>
                        ) : (
                          !p.productType && <span className={ui.cellSub}>—</span>
                        )}
                      </div>
                    </td>
                    <td className={ui.price}>
                      {priceLabel(p.priceMinor, p.priceQty, p.measure, p.currency)}
                    </td>
                    <td>
                      <div className={ui.stockCell}>
                        <span>
                          {p.unlimitedStock
                            ? p.stockQty > 0
                              ? 'In stock'
                              : 'Out of stock'
                            : stockLabel(p.stockQty, p.measure)}
                        </span>
                        {(outOfStock || lowStock) && (
                          <span
                            className={`${ui.stockBadge} ${outOfStock ? ui.stockOut : ui.stockLow}`}
                          >
                            <AlertTriangle size={11} aria-hidden="true" />
                            {outOfStock ? 'Out of stock' : 'Low stock'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={ui.minOrder}>{formatAmount(p.stepQty, p.measure)}</td>
                    <td>
                      {(p.ratingCount ?? 0) > 0 ? (
                        <span className={ui.ratingCell}>
                          <Star size={13} aria-hidden="true" /> {(p.ratingAvg ?? 0).toFixed(1)} (
                          {p.ratingCount})
                        </span>
                      ) : (
                        <span className={ui.cellSub}>—</span>
                      )}
                    </td>
                    <td>
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
                    </td>
                    <td>
                      <div className={ui.actionsCell}>
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
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <FormDialog
        open={editing !== null}
        title={isNew ? 'Add a product' : 'Edit product'}
        subtitle="What customers can order: its price, how it's sold, and how much you have."
        onClose={cancel}
        onSubmit={submit}
        tabs={tabs}
        activeTab={tab}
        onTabChange={setTab}
        error={error}
        submitLabel={isNew ? 'Add product' : 'Save changes'}
        submitting={saving}
      >
        {tab === 'basics' && (
          <>
            <FormSection
              icon={<FileText size={16} />}
              title="Product details"
            >
              <div className={styles.field}>
                <label className={styles.label} htmlFor="name">
                  Product name
                </label>
                <Combobox
                  id="name"
                  name="name"
                  placeholder="e.g. Basmati Rice, or search common products"
                  value={form.name}
                  items={isNew ? comboItems : []}
                  onChange={onChange}
                  onSelect={(item) => applySuggestion(item.label)}
                />
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
            </FormSection>

            <FormSection
              icon={<FolderTree size={16} />}
              title="Where it appears"
            >
              <div className={styles.row2}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="productTypeId">
                    Product type <span className={styles.optional}>(optional)</span>
                  </label>
                  <div className={ui.selectWrap}>
                    <select
                      id="productTypeId"
                      name="productTypeId"
                      className={ui.select}
                      value={form.productTypeId}
                      onChange={onChange}
                    >
                      <option value="">Not tagged</option>
                      {productTypes.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} className={ui.chev} aria-hidden="true" />
                  </div>
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="section">
                    Section <span className={styles.optional}>(optional)</span>
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
                    {SECTION_SUGGESTIONS.map((sec) => (
                      <option key={sec} value={sec} />
                    ))}
                  </datalist>
                </div>
              </div>
            </FormSection>
          </>
        )}

        {tab === 'pricing' && (
          <>
            <FormSection
              icon={<Tag size={16} />}
              title="Price"
              description="How the product is measured, and what a given quantity costs."
            >
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
                    <select
                      className={ui.unitSuffix}
                      name="priceUnit"
                      value={form.priceUnit}
                      onChange={onChange}
                    >
                      {unitOptions}
                    </select>
                  </div>
                </div>
              </div>
            </FormSection>

            <FormSection
              icon={<Ruler size={16} />}
              title="Minimum order"
              description="The smallest amount a customer can order; they add more in the same steps."
            >
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
                  <select
                    className={ui.unitSuffix}
                    name="stepUnit"
                    value={form.stepUnit}
                    onChange={onChange}
                  >
                    {unitOptions}
                  </select>
                </div>
              </div>
              <p className={ui.hint}>
                <Ruler size={13} aria-hidden="true" /> Sold at{' '}
                <strong>
                  ₹{form.price || '—'} for {form.priceQty || '—'} {form.priceUnit}
                </strong>
                , from a minimum of {form.step || '—'} {form.stepUnit} (customers can add in those
                steps).
              </p>
            </FormSection>

            <OptionSection
              name="trackStock"
              icon={<Boxes size={16} />}
              label="Track stock quantity"
              description="Turn this off for made-to-order items that are always available, like a restaurant dish."
              checked={!form.unlimitedStock}
              onChange={(track) => {
                if (track === form.unlimitedStock) toggleUnlimitedStock();
              }}
              settingsTitle="Available stock"
            >
              <div className={styles.field}>
                <label className={styles.label} htmlFor="stock">
                  How much do you have?
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
                  <select
                    className={ui.unitSuffix}
                    name="stockUnit"
                    value={form.stockUnit}
                    onChange={onChange}
                  >
                    {unitOptions}
                  </select>
                </div>
              </div>
              <p className={ui.hint}>
                Stock goes down as customers order. You&apos;ll see a low-stock warning when it runs
                low.
              </p>
            </OptionSection>
          </>
        )}

        {tab === 'payments' && (
          <>
            <OptionSection
              name="partialPayEnabled"
              icon={<Percent size={16} />}
              label="Accept partial payment for this product"
              description={
                partialLocked
                  ? 'Partial payment is turned off for the whole business. Turn it on under Edit business → Payments.'
                  : 'Customers can pay a deposit now to confirm the order, and the rest at pickup.'
              }
              checked={form.partialPayEnabled && !partialLocked}
              disabled={partialLocked}
              onChange={togglePartialPayEnabled}
              settingsTitle="Deposit"
            >
              <p className={ui.hint}>
                The deposit percentage is set once for your whole business, under Edit business →
                Payments.
              </p>
            </OptionSection>

            <OptionSection
              name="codEnabled"
              icon={<Banknote size={16} />}
              label="Accept Cash on Delivery for this product"
              description={
                codLocked
                  ? 'Cash on Delivery is turned off for the whole business. Turn it on under Edit business → Payments.'
                  : 'Customers can order this and pay in cash when they pick it up.'
              }
              checked={form.codEnabled && !codLocked}
              disabled={codLocked}
              onChange={toggleCodEnabled}
              settingsTitle="Cash on delivery"
            >
              <p className={ui.hint}>
                You collect the cash at pickup. DNX&apos;s commission on cash sales is taken off
                your next payout.
              </p>
            </OptionSection>
          </>
        )}

        {tab === 'photo' && (
          <FormSection
            icon={<ImagePlus size={16} />}
            title="Product photo"
          >
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
                  <button
                    type="button"
                    className={`${ui.imageBtn} ${ui.imageBtnDanger}`}
                    onClick={clearImage}
                  >
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
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={(e) => {
                pickImage(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
            <p className={ui.hint}>JPG, PNG or WEBP. It's optional; you can add one later.</p>
          </FormSection>
        )}
      </FormDialog>
    </Card>
  );
}
