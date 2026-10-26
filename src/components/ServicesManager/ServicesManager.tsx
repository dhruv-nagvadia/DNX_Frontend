import { useEffect, useState } from 'react';
import { Clock, FileText, MapPin, Pencil, Percent, Plus, Tag, Timer, Trash2 } from 'lucide-react';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Combobox } from '@/components/Combobox';
import { FormDialog } from '@/components/FormDialog';
import { FormSection } from '@/components/FormSection';
import { OptionSection } from '@/components/OptionSection';
import { Service } from '@/redux/api/provider/types';
import { SERVICE_SUGGESTIONS } from '@/data/serviceSuggestions';
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
export function ServicesManager({
  providerId,
  services,
  subcategorySlug,
  businessPartialPayEnabled,
}: ServicesManagerProps) {
  const {
    editing,
    form,
    error,
    saving,
    startAdd,
    startEdit,
    cancel,
    onChange,
    toggleTravelRequired,
    togglePartialPayEnabled,
    applySuggestion,
    submit,
    remove,
    toggleActive,
  } = useServicesManager(providerId, businessPartialPayEnabled);

  const suggestions = (subcategorySlug && SERVICE_SUGGESTIONS[subcategorySlug]) || [];
  const comboItems = suggestions.map((s) => ({ label: s.name, meta: s.durationMin }));

  const isNew = editing === 'new';

  // The form is split into tabs; it always opens on the first one.
  const [tab, setTab] = useState('details');
  useEffect(() => {
    if (editing !== null) setTab('details');
  }, [editing]);
  const tabs = [
    { id: 'details', label: 'Details' },
    { id: 'pricing', label: 'Price & time' },
    { id: 'options', label: 'Options' },
  ];

  return (
    <Card
      title="Services"
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
      {services.length === 0 && editing !== 'new' ? (
        <p className={styles.muted}>
          No services yet. Add the services you offer so customers know what they can book.
        </p>
      ) : (
        <div className={styles.list}>
          {services.map((s: Service) => (
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
                  {s.travelRequired && (
                    <span className={styles.metaItem}>
                      <MapPin size={14} aria-hidden="true" /> On-location
                    </span>
                  )}
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
          ))}
        </div>
      )}

      <FormDialog
        open={editing !== null}
        title={isNew ? 'Add a service' : 'Edit service'}
        subtitle="What customers can book, with its price and how long it takes."
        onClose={cancel}
        onSubmit={submit}
        tabs={tabs}
        activeTab={tab}
        onTabChange={setTab}
        error={error}
        submitLabel={isNew ? 'Add service' : 'Save changes'}
        submitting={saving}
      >
        {tab === 'details' && (
          <FormSection
            icon={<FileText size={16} />}
            title="Service details"
          >
            <div className={styles.field}>
              <label className={styles.label} htmlFor="name">
                Service name
              </label>
              <Combobox
                id="name"
                name="name"
                placeholder="e.g. Root Canal Treatment — or search common services"
                value={form.name}
                items={isNew ? comboItems : []}
                onChange={onChange}
                onSelect={(item) => applySuggestion(item.label, item.meta)}
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
                placeholder="What's included in this service?"
                value={form.description}
                onChange={onChange}
              />
            </div>
          </FormSection>
        )}

        {tab === 'pricing' && (
          <FormSection
            icon={<Tag size={16} />}
            title="Price & duration"
            description="How much it costs and how long it takes. Duration blocks out the calendar."
          >
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
            <p className={styles.formHint}>
              <Timer size={14} aria-hidden="true" /> Customers book a{' '}
              <strong>{formatDuration(Number(form.hours) * 60 + Number(form.minutes) || 0)}</strong>{' '}
              slot
              {form.price ? (
                <>
                  {' '}
                  for <strong>₹{Number(form.price).toLocaleString('en-IN')}</strong>
                </>
              ) : null}
              .
            </p>
          </FormSection>
        )}

        {tab === 'options' && (
          <>
            <OptionSection
              name="travelRequired"
              icon={<MapPin size={16} />}
              label="On-location service"
              description="You travel to the customer instead of them visiting you."
              checked={form.travelRequired}
              onChange={toggleTravelRequired}
              settingsTitle="Travel charges"
            >
              <div className={styles.row2}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="travelBaseFee">
                    Base travel fee
                  </label>
                  <div className={styles.inputPrefix}>
                    <span className={styles.prefix}>₹</span>
                    <input
                      id="travelBaseFee"
                      name="travelBaseFee"
                      className={styles.input}
                      type="number"
                      min="0"
                      step="any"
                      inputMode="decimal"
                      placeholder="0"
                      value={form.travelBaseFee}
                      onChange={onChange}
                    />
                  </div>
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="travelPerKm">
                    Fee per km
                  </label>
                  <div className={styles.inputPrefix}>
                    <span className={styles.prefix}>₹</span>
                    <input
                      id="travelPerKm"
                      name="travelPerKm"
                      className={styles.input}
                      type="number"
                      min="0"
                      step="any"
                      inputMode="decimal"
                      placeholder="0"
                      value={form.travelPerKm}
                      onChange={onChange}
                    />
                  </div>
                </div>
              </div>
              <p className={styles.formHint}>
                The customer pays the base fee plus the per-km fee for the distance from your
                business to their address, on top of the service price.
              </p>
            </OptionSection>

            <OptionSection
              name="partialPayEnabled"
              icon={<Percent size={16} />}
              label="Accept partial payment for this service"
              description={
                businessPartialPayEnabled === false
                  ? 'Partial payment is turned off for the whole business — turn it on under Edit business → Payments.'
                  : 'Customers can pay a deposit now to confirm, and the rest at the appointment.'
              }
              checked={form.partialPayEnabled && businessPartialPayEnabled !== false}
              disabled={businessPartialPayEnabled === false}
              onChange={togglePartialPayEnabled}
              settingsTitle="Deposit"
            >
              <p className={styles.formHint}>
                The deposit percentage is set once for your whole business, under Edit business →
                Payments.
              </p>
            </OptionSection>
          </>
        )}
      </FormDialog>
    </Card>
  );
}
