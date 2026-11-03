import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import {
  Ban,
  Banknote,
  Box,
  Boxes,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  FileText,
  FolderTree,
  ImagePlus,
  Package,
  Pencil,
  Percent,
  Plus,
  Ruler,
  Search,
  Star,
  Tag,
  Trash2,
  TriangleAlert,
} from 'lucide-react';

import { Combobox } from '@/components/Combobox';
import { FormDialog } from '@/components/FormDialog';
import { FormSection } from '@/components/FormSection';
import { OptionSection } from '@/components/OptionSection';
import { Pill, PillTone } from '@/components/Pill';
import { Measure, Product } from '@/redux/api/provider/types';
import { useGetProductTypesQuery } from '@/redux/api/productType/productTypeApi';
import { PRODUCT_SUGGESTIONS } from '@/data/productSuggestions';
import {
  MEASURES,
  SECTION_SUGGESTIONS,
  formatAmount,
  measureUnits,
  priceLabel,
  stockLevel,
} from '@/utils/units';
import { ProductsManagerProps } from './types';
import { useProductsManager } from './useProductsManager';
// Reuse the ServicesManager styles for the generic form fields…
import styles from '@/components/ServicesManager/ServicesManager.module.css';
// …plus the mockup-matched list (tiles / toolbar / table) and form controls.
import ui from './ProductsManager.module.css';

const PAGE_SIZE = 6;

type StockState = 'in' | 'low' | 'out' | 'made';
type StatusFilter = 'all' | 'active' | 'inactive';
type StockFilter = 'all' | 'in' | 'low' | 'out';

/** Where a product's inventory stands (made-to-order items never run low). */
function stockState(p: Product): StockState {
  if (p.unlimitedStock) return p.stockQty <= 0 ? 'out' : 'made';
  const level = stockLevel(p.stockQty, p.stepQty);
  return level === 'ok' ? 'in' : level;
}

/** Quantity text: plain number for pieces ("24"), with units otherwise ("500 g"). */
function qtyText(base: number, measure: Measure): string {
  return measure === 'count' ? `${base}` : formatAmount(base, measure);
}

/** "₹599" when priced per single piece, else the full "₹249 / 100 g". */
function priceText(p: Product): string {
  const full = priceLabel(p.priceMinor, p.priceQty, p.measure, p.currency);
  return p.measure === 'count' && p.priceQty === 1 ? full.split(' / ')[0] : full;
}

const SECTION_TONES: PillTone[] = ['lavender', 'blue', 'green'];
/** Same section name → same pill colour, every render. */
function sectionTone(name: string): PillTone {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return SECTION_TONES[h % SECTION_TONES.length];
}

function StockPill({ p }: { p: Product }) {
  const state = stockState(p);
  if (state === 'made') return <Pill tone="grey">Made to order</Pill>;
  if (state === 'out') return <Pill tone="red">Out of Stock</Pill>;
  const qty = qtyText(p.stockQty, p.measure);
  return state === 'low' ? (
    <Pill tone="orange">Low Stock ({qty})</Pill>
  ) : (
    <Pill tone="green">In Stock ({qty})</Pill>
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

/** Add / edit / delete the products a STORE business sells. */
export function ProductsManager({
  providerId,
  products,
  subcategorySlug,
  businessCodEnabled,
  businessPartialPayEnabled,
  onManageStock,
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

  // ── List filters, summary counts and client-side paging ────────────
  const [query, setQuery] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [page, setPage] = useState(1);

  const sections = useMemo(
    () =>
      Array.from(
        new Set(products.map((p) => p.section?.trim()).filter((s): s is string => !!s)),
      ).sort((a, b) => a.localeCompare(b)),
    [products],
  );

  const counts = useMemo(() => {
    let active = 0;
    let low = 0;
    let out = 0;
    for (const p of products) {
      if (p.isActive !== false) active += 1;
      const state = stockState(p);
      if (state === 'out') out += 1;
      else if (state === 'low') low += 1;
    }
    return { total: products.length, active, low, out };
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (
        q &&
        !p.name.toLowerCase().includes(q) &&
        !(p.section ?? '').toLowerCase().includes(q)
      )
        return false;
      if (sectionFilter && (p.section?.trim() ?? '') !== sectionFilter) return false;
      if (statusFilter === 'active' && p.isActive === false) return false;
      if (statusFilter === 'inactive' && p.isActive !== false) return false;
      if (stockFilter !== 'all') {
        const state = stockState(p);
        // Made-to-order items are always available, so they count as in stock.
        const bucket = state === 'made' ? 'in' : state;
        if (bucket !== stockFilter) return false;
      }
      return true;
    });
  }, [products, query, sectionFilter, statusFilter, stockFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  // Any filter/search change starts over on page 1.
  const withPageReset =
    <T,>(set: (v: T) => void) =>
    (v: T) => {
      set(v);
      setPage(1);
    };
  const onQuery = withPageReset(setQuery);
  const onSection = withPageReset(setSectionFilter);
  const onStatus = withPageReset(setStatusFilter);
  const onStock = withPageReset(setStockFilter);

  const hasProducts = products.length > 0 || editing === 'new';

  return (
    <div className={ui.root}>
      {hasProducts ? (
        <>
          <div className={ui.tiles}>
            <SummaryTile tone="blue" icon={<Box size={26} />} label="Total Products" value={counts.total} />
            <SummaryTile tone="mint" icon={<CircleCheck size={26} />} label="Active" value={counts.active} />
            <SummaryTile tone="peach" icon={<TriangleAlert size={26} />} label="Low Stock" value={counts.low} />
            <SummaryTile tone="pink" icon={<Ban size={26} />} label="Out of Stock" value={counts.out} />
          </div>

          <div className={ui.toolbar}>
            <label className={ui.search}>
              <Search size={18} aria-hidden="true" />
              <span className={ui.srOnly}>Search products</span>
              <input
                type="search"
                placeholder="Search products by name or section..."
                value={query}
                onChange={(e) => onQuery(e.target.value)}
              />
            </label>
            <label className={ui.filterWrap}>
              <span className={ui.srOnly}>Filter by section</span>
              <select
                className={ui.filter}
                value={sectionFilter}
                onChange={(e) => onSection(e.target.value)}
              >
                <option value="">All Sections</option>
                {sections.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className={ui.filterChevron} aria-hidden="true" />
            </label>
            <label className={ui.filterWrap}>
              <span className={ui.srOnly}>Filter by status</span>
              <select
                className={ui.filter}
                value={statusFilter}
                onChange={(e) => onStatus(e.target.value as StatusFilter)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <ChevronDown size={16} className={ui.filterChevron} aria-hidden="true" />
            </label>
            <label className={ui.filterWrap}>
              <span className={ui.srOnly}>Filter by stock</span>
              <select
                className={ui.filter}
                value={stockFilter}
                onChange={(e) => onStock(e.target.value as StockFilter)}
              >
                <option value="all">All Stock</option>
                <option value="in">In stock</option>
                <option value="low">Low stock</option>
                <option value="out">Out of stock</option>
              </select>
              <ChevronDown size={16} className={ui.filterChevron} aria-hidden="true" />
            </label>
            <div className={ui.toolbarActions}>
              {onManageStock && (
                <button type="button" className={ui.outlineBtn} onClick={onManageStock}>
                  <Box size={18} aria-hidden="true" />
                  Manage Stock
                </button>
              )}
              <button type="button" className={ui.primaryBtn} onClick={startAdd}>
                <Plus size={18} aria-hidden="true" />
                Add Product
              </button>
            </div>
          </div>

          <div className={ui.tableCard}>
            <div className={ui.tableScroll}>
              <table className={ui.table}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Section</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th className={ui.center}>Min. Order</th>
                    <th>Rating</th>
                    <th className={ui.center}>Status</th>
                    <th className={ui.center}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className={ui.noMatch}>
                        No products match your filters.
                      </td>
                    </tr>
                  ) : (
                    pageRows.map((p) => {
                      const active = p.isActive !== false;
                      const sub = p.description?.trim() || p.productType?.name;
                      return (
                        <tr key={p.id} className={active ? '' : ui.rowInactive}>
                          <td className={ui.fade}>
                            <div className={ui.productCell}>
                              {p.imageUrl ? (
                                <img className={ui.thumb} src={p.imageUrl} alt="" />
                              ) : (
                                <span className={`${ui.thumb} ${ui.thumbPlaceholder}`} aria-hidden="true">
                                  <Package size={22} />
                                </span>
                              )}
                              <div className={ui.cellMain}>
                                <span className={ui.cellTitle}>{p.name}</span>
                                {sub && (
                                  <span className={ui.cellSub} title={sub}>
                                    {sub}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className={ui.fade}>
                            {p.section?.trim() ? (
                              <Pill tone={sectionTone(p.section.trim())}>{p.section.trim()}</Pill>
                            ) : (
                              <span className={ui.muted}>—</span>
                            )}
                          </td>
                          <td className={`${ui.fade} ${ui.price}`}>{priceText(p)}</td>
                          <td className={ui.fade}>
                            <StockPill p={p} />
                          </td>
                          <td className={`${ui.fade} ${ui.center} ${ui.minOrder}`}>
                            {qtyText(p.stepQty, p.measure)}
                          </td>
                          <td className={ui.fade}>
                            {(p.ratingCount ?? 0) > 0 ? (
                              <span className={ui.rating}>
                                <Star size={16} className={ui.star} aria-hidden="true" />
                                <strong>{(p.ratingAvg ?? 0).toFixed(1)}</strong>
                                <span className={ui.muted}>({p.ratingCount})</span>
                              </span>
                            ) : (
                              <span className={ui.muted}>—</span>
                            )}
                          </td>
                          <td className={ui.center}>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={active}
                              aria-label={`${active ? 'Hide' : 'List'} ${p.name}`}
                              title={active ? 'Listed — click to hide' : 'Hidden — click to list'}
                              className={`${ui.switch} ${active ? ui.switchOn : ''}`}
                              onClick={() => toggleActive(p)}
                            >
                              <span className={ui.switchKnob} aria-hidden="true" />
                            </button>
                          </td>
                          <td>
                            <div className={ui.actions}>
                              <button
                                type="button"
                                className={ui.iconBtn}
                                onClick={() => startEdit(p)}
                                aria-label={`Edit ${p.name}`}
                              >
                                <Pencil size={18} aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                className={`${ui.iconBtn} ${ui.iconBtnDanger}`}
                                onClick={() => remove(p.id)}
                                aria-label={`Delete ${p.name}`}
                              >
                                <Trash2 size={18} aria-hidden="true" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {filtered.length > 0 && (
              <div className={ui.pager}>
                <span className={ui.pagerInfo}>
                  Showing {pageStart + 1}–{pageStart + pageRows.length} of {filtered.length}{' '}
                  {filtered.length === 1 ? 'product' : 'products'}
                </span>
                <nav className={ui.pagerNav} aria-label="Products pages">
                  <button
                    type="button"
                    className={ui.pageArrow}
                    onClick={() => setPage(currentPage - 1)}
                    disabled={currentPage <= 1}
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={18} aria-hidden="true" />
                  </button>
                  {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={`${ui.pageNum} ${n === currentPage ? ui.pageNumActive : ''}`}
                      onClick={() => setPage(n)}
                      aria-current={n === currentPage ? 'page' : undefined}
                      aria-label={`Page ${n}`}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    type="button"
                    className={ui.pageArrow}
                    onClick={() => setPage(currentPage + 1)}
                    disabled={currentPage >= pageCount}
                    aria-label="Next page"
                  >
                    <ChevronRight size={18} aria-hidden="true" />
                  </button>
                </nav>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className={ui.emptyCard}>
          <span className={ui.emptyIcon} aria-hidden="true">
            <Package size={28} />
          </span>
          <p className={ui.emptyText}>
            No products yet. Add the items you sell so customers can browse and order them.
          </p>
          <button type="button" className={ui.primaryBtn} onClick={startAdd}>
            <Plus size={18} aria-hidden="true" />
            Add Product
          </button>
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
    </div>
  );
}
