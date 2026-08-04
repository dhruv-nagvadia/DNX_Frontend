import { Plus, Pencil, Trash2, Clock } from 'lucide-react';

import { Button } from '@/components/Button';
import { Service } from '@/redux/api/provider/types';
import { ServicesManagerProps } from './types';
import { useServicesManager } from './useServicesManager';
import styles from './ServicesManager.module.css';

function formatPrice(minor: number, currency: string) {
  const amount = (minor / 100).toLocaleString('en-IN');
  return currency === 'INR' ? `₹${amount}` : `${amount} ${currency}`;
}

const HOUR_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const MINUTE_OPTIONS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

/** Add / edit / delete the services offered by a business. */
export function ServicesManager({ providerId, services }: ServicesManagerProps) {
  const { editing, form, error, saving, startAdd, startEdit, cancel, onChange, submit, remove, toggleActive } =
    useServicesManager(providerId);

  const renderForm = (isNew: boolean) => (
    <form className={styles.form} onSubmit={submit}>
      <p className={styles.formTitle}>{isNew ? 'New service' : 'Edit service'}</p>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="name">
          Service name
        </label>
        <input
          id="name"
          name="name"
          className={styles.input}
          placeholder="e.g. Root Canal Treatment"
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
              placeholder="500"
              value={form.price}
              onChange={onChange}
            />
          </div>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Duration</label>
          <div className={styles.durationSelects}>
            <select name="hours" className={styles.select} value={form.hours} onChange={onChange}>
              {HOUR_OPTIONS.map((h) => (
                <option key={h} value={h}>
                  {h} hr
                </option>
              ))}
            </select>
            <select name="minutes" className={styles.select} value={form.minutes} onChange={onChange}>
              {MINUTE_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m} min
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="description">
          Description (optional)
        </label>
        <textarea
          id="description"
          name="description"
          className={styles.textarea}
          placeholder="What's included in this service?"
          value={form.description}
          onChange={onChange}
        />
      </div>

      {error && <p className={styles.formError}>{error}</p>}

      <div className={styles.formActions}>
        <Button type="button" variant="secondary" onClick={cancel}>
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          {isNew ? 'Add service' : 'Save'}
        </Button>
      </div>
    </form>
  );

  return (
    <section className={styles.card}>
      <div className={styles.head}>
        <h3 className={styles.title}>Services</h3>
        {editing === null && (
          <button className={styles.addBtn} onClick={startAdd}>
            <Plus size={16} /> Add service
          </button>
        )}
      </div>

      {editing === 'new' && renderForm(true)}

      {services.length === 0 && editing !== 'new' ? (
        <p className={styles.muted}>
          No services yet. Add the services you offer with their price and duration.
        </p>
      ) : (
        <div className={styles.list}>
          {services.map((s: Service) =>
            editing === s.id ? (
              <div key={s.id}>{renderForm(false)}</div>
            ) : (
              <div
                key={s.id}
                className={`${styles.row} ${s.isActive === false ? styles.rowInactive : ''}`}
              >
                <div className={styles.rowMain}>
                  <div className={styles.rowName}>{s.name}</div>
                  {s.description && <div className={styles.rowDesc}>{s.description}</div>}
                  <div className={styles.rowMeta}>
                    <span className={`${styles.metaItem} ${styles.price}`}>
                      {formatPrice(s.priceMinor, s.currency)}
                    </span>
                    <span className={styles.metaItem}>
                      <Clock size={14} /> {s.durationMin} min
                    </span>
                    <button
                      type="button"
                      className={`${styles.statusChip} ${
                        s.isActive === false ? styles.inactive : styles.active
                      }`}
                      onClick={() => toggleActive(s)}
                      title="Toggle availability"
                    >
                      {s.isActive === false ? 'Inactive' : 'Active'}
                    </button>
                  </div>
                </div>
                <div className={styles.rowActions}>
                  <button className={styles.iconBtn} onClick={() => startEdit(s)} title="Edit">
                    <Pencil size={16} />
                  </button>
                  <button
                    className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                    onClick={() => remove(s.id)}
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </section>
  );
}
