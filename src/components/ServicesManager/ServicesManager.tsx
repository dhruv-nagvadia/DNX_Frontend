import { Clock, Pencil, Plus, Trash2 } from 'lucide-react';

import { AlertBanner } from '@/components/AlertBanner';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Service } from '@/redux/api/provider/types';
import { ServicesManagerProps } from './types';
import { useServicesManager } from './useServicesManager';
import styles from './ServicesManager.module.css';

function formatPrice(minor: number, currency: string) {
  const amount = (minor / 100).toLocaleString('en-IN');
  return currency === 'INR' ? `₹${amount}` : `${amount} ${currency}`;
}

/** Turns 90 into "1 hr 30 min" — clearer than a raw minute count. */
function formatDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (!hours) return `${minutes} min`;
  return minutes ? `${hours} hr ${minutes} min` : `${hours} hr`;
}

const HOUR_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const MINUTE_OPTIONS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

/** Add / edit / delete the services offered by a business. */
export function ServicesManager({ providerId, services }: ServicesManagerProps) {
  const {
    editing,
    form,
    error,
    saving,
    startAdd,
    startEdit,
    cancel,
    onChange,
    submit,
    remove,
    toggleActive,
  } = useServicesManager(providerId);

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
          <label className={styles.label} htmlFor="hours">
            Duration
          </label>
          <div className={styles.durationSelects}>
            <select
              id="hours"
              name="hours"
              className={styles.select}
              value={form.hours}
              onChange={onChange}
            >
              {HOUR_OPTIONS.map((h) => (
                <option key={h} value={h}>
                  {h} hr
                </option>
              ))}
            </select>
            <select
              name="minutes"
              className={styles.select}
              value={form.minutes}
              onChange={onChange}
              aria-label="Duration minutes"
            >
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
          Description <span className={styles.optional}>(optional)</span>
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

      {error && <AlertBanner tone="error">{error}</AlertBanner>}

      <div className={styles.formActions}>
        <Button type="button" variant="secondary" onClick={cancel}>
          Cancel
        </Button>
        <Button type="submit" loading={saving} loadingText="Saving…">
          {isNew ? 'Add service' : 'Save changes'}
        </Button>
      </div>
    </form>
  );

  return (
    <Card
      title="Services"
      subtitle="What customers can book, with price and duration."
      action={
        editing === null ? (
          <Button
            variant="secondary"
            onClick={startAdd}
            iconLeft={<Plus size={16} aria-hidden="true" />}
          >
            Add service
          </Button>
        ) : undefined
      }
    >
      {editing === 'new' && renderForm(true)}

      {services.length === 0 && editing !== 'new' ? (
        <p className={styles.muted}>
          No services yet. Add the services you offer so customers know what they can book.
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
                    <span className={styles.price}>{formatPrice(s.priceMinor, s.currency)}</span>
                    <span className={styles.metaItem}>
                      <Clock size={14} aria-hidden="true" /> {formatDuration(s.durationMin)}
                    </span>
                    <button
                      type="button"
                      className={`${styles.statusChip} ${
                        s.isActive === false ? styles.inactive : styles.active
                      }`}
                      onClick={() => toggleActive(s)}
                      aria-pressed={s.isActive !== false}
                    >
                      <span className={styles.statusDot} aria-hidden="true" />
                      {s.isActive === false ? 'Inactive' : 'Active'}
                    </button>
                  </div>
                </div>

                <div className={styles.rowActions}>
                  <button
                    type="button"
                    className={styles.iconBtn}
                    onClick={() => startEdit(s)}
                    aria-label={`Edit ${s.name}`}
                  >
                    <Pencil size={16} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                    onClick={() => remove(s.id)}
                    aria-label={`Delete ${s.name}`}
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
