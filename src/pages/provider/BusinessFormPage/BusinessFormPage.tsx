import { useRef } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Briefcase,
  Calendar,
  Camera,
  Check,
  FileText,
  Image as ImageIcon,
  LayoutGrid,
  ListChecks,
  LocateFixed,
  MapPin,
  Percent,
  Phone,
  ShoppingBag,
  Tag,
  Wallet,
  X,
} from 'lucide-react';

import { AlertBanner } from '@/components/AlertBanner';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { CategoryIcon } from '@/components/CategoryIcon';
import { FormSection } from '@/components/FormSection';
import { OptionSection } from '@/components/OptionSection';
import { PageHeader } from '@/components/PageHeader';
import { Skeleton } from '@/components/Skeleton';
import { Stepper } from '@/components/Stepper';
import { TextField } from '@/components/TextField';

import { BusinessStepId } from './types';
import { useBusinessForm } from './useBusinessForm';
import styles from './BusinessFormPage.module.css';

const STEP_COPY: Record<BusinessStepId, { label: string; title: string; subtitle: string; hint?: string }> = {
  type: {
    label: 'Business type',
    title: 'What kind of business is this?',
    subtitle: "Start here — it decides what customers see and how they'll book you.",
  },
  details: {
    label: 'Details',
    title: 'Business details',
    subtitle: 'How your business appears to customers.',
  },
  payments: {
    label: 'Payments',
    title: 'How customers can pay',
    subtitle: 'Choose which payment options you accept. You can change these any time.',
  },
  photos: {
    label: 'Photos',
    title: 'Business photos',
    subtitle: 'A few good photos help customers trust and choose you.',
    hint: 'Optional',
  },
  location: {
    label: 'Location',
    title: 'Where are you?',
    subtitle: 'Helps customers nearby find you. All fields are optional.',
    hint: 'Optional',
  },
};

/** JSX only — logic comes from useBusinessForm. A step-by-step flow, for both create and edit. */
export default function BusinessFormPage() {
  const {
    isEdit,
    loadingExisting,
    categories,
    subcategories,
    categoriesLoading,
    form,
    images,
    errors,
    serverError,
    submitting,
    maxImages,
    steps,
    step,
    furthest,
    isLastStep,
    goToStep,
    next,
    back,
    saveNow,
    selectType,
    selectCategory,
    selectSubcategory,
    onChange,
    toggleCodEnabled,
    togglePartialPayEnabled,
    addImages,
    removeImage,
    onSubmit,
    useCurrentLocation,
    locating,
    locationError,
    resolvingPincode,
    goBack,
  } = useBusinessForm();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const backButton = (
    <button type="button" className={styles.back} onClick={goBack}>
      <ArrowLeft size={16} aria-hidden="true" />
      <span className={styles.backLabel}>{isEdit ? 'Back to business' : 'All businesses'}</span>
    </button>
  );

  if (loadingExisting) {
    return (
      <AppShell>
        {backButton}
        <Skeleton width="40%" height={34} />
        <Skeleton height={64} radius="var(--radius-xl)" />
        <Skeleton height={320} radius="var(--radius-xl)" />
      </AppShell>
    );
  }

  const stepId = steps[step];
  const copy = STEP_COPY[stepId];
  const depositPreview = Number(form.depositPercent) > 0 ? Number(form.depositPercent) : 20;
  const hasLocation = !!form.latitude && !!form.longitude;

  return (
    <AppShell>
      {backButton}
      <PageHeader
        title={isEdit ? 'Edit business' : 'Add a new business'}
        subtitle={
          isEdit
            ? 'Update your business details. Changes go live as soon as you save.'
            : 'Tell customers about your business so they can find and book you.'
        }
      />

      <Stepper
        className={styles.stepper}
        steps={steps.map((id) => ({
          id,
          label: STEP_COPY[id].label,
          hint: STEP_COPY[id].hint,
        }))}
        current={step}
        reachable={furthest}
        onSelect={goToStep}
      />

      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <Card
          eyebrow={`Step ${step + 1} of ${steps.length}`}
          title={copy.title}
          subtitle={copy.subtitle}
        >
          <div className={styles.stepBody}>
            {/* ── Step: business type ───────────────────────────────────── */}
            {stepId === 'type' && (
              <>
                <FormSection
                  icon={<Briefcase size={16} />}
                  title="Business model"
                  description="Do customers book a time slot, or order products?"
                >
                  <div className={styles.typeChooser}>
                    <button
                      type="button"
                      aria-pressed={form.type === 'SERVICE'}
                      className={`${styles.typeCard} ${form.type === 'SERVICE' ? styles.typeCardActive : ''}`}
                      onClick={() => selectType('SERVICE')}
                    >
                      {form.type === 'SERVICE' && <Check className={styles.tick} size={15} aria-hidden="true" />}
                      <span className={styles.typeIcon}>
                        <Calendar size={24} strokeWidth={1.8} aria-hidden="true" />
                      </span>
                      <span className={styles.typeTitle}>Service business</span>
                      <span className={styles.typeDesc}>
                        Customers book a time slot — salon, clinic, tutor, repair…
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-pressed={form.type === 'STORE'}
                      className={`${styles.typeCard} ${form.type === 'STORE' ? styles.typeCardActive : ''}`}
                      onClick={() => selectType('STORE')}
                    >
                      {form.type === 'STORE' && <Check className={styles.tick} size={15} aria-hidden="true" />}
                      <span className={styles.typeIcon}>
                        <ShoppingBag size={24} strokeWidth={1.8} aria-hidden="true" />
                      </span>
                      <span className={styles.typeTitle}>Product / store business</span>
                      <span className={styles.typeDesc}>
                        Customers browse products and place pickup orders — no time slots.
                      </span>
                    </button>
                  </div>
                </FormSection>

                <FormSection
                  icon={<LayoutGrid size={16} />}
                  title={form.type === 'STORE' ? 'Store category' : 'Service category'}
                  description={form.type === 'STORE' ? 'What kind of store is it?' : 'What kind of service?'}
                >
                  {categoriesLoading ? (
                    <div className={styles.grid}>
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} height={100} radius="var(--radius-lg)" />
                      ))}
                    </div>
                  ) : (
                    <div className={styles.grid}>
                      {categories.map((c) => {
                        const active = form.categoryId === c.id;
                        return (
                          <button
                            type="button"
                            key={c.id}
                            aria-pressed={active}
                            className={`${styles.categoryCard} ${active ? styles.categoryCardActive : ''}`}
                            onClick={() => selectCategory(c.id)}
                          >
                            {active && <Check className={styles.tick} size={13} aria-hidden="true" />}
                            <span className={styles.categoryIconBadge}>
                              <CategoryIcon slug={c.slug} size={22} strokeWidth={1.6} />
                            </span>
                            <span className={styles.categoryName}>{c.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {errors.categoryId && <p className={styles.fieldError}>{errors.categoryId}</p>}
                </FormSection>

                {form.categoryId && subcategories.length > 0 && (
                  <FormSection
                    icon={<Tag size={16} />}
                    title="Specific business type"
                    description="Pick the one that describes you best."
                  >
                    <div className={styles.chips}>
                      {subcategories.map((s) => (
                        <button
                          type="button"
                          key={s.id}
                          aria-pressed={form.subcategoryId === s.id}
                          className={`${styles.chip} ${form.subcategoryId === s.id ? styles.chipActive : ''}`}
                          onClick={() => selectSubcategory(s.id)}
                        >
                          {s.name}
                        </button>
                      ))}
                    </div>
                    {errors.subcategoryId && <p className={styles.fieldError}>{errors.subcategoryId}</p>}
                  </FormSection>
                )}
              </>
            )}

            {/* ── Step: details ─────────────────────────────────────────── */}
            {stepId === 'details' && (
              <>
                <FormSection
                  icon={<Phone size={16} />}
                  title="Basic information"
                  description="Your business name and how customers can reach you."
                >
                  <TextField
                    dense
                    label="Business name"
                    name="businessName"
                    placeholder="e.g. Sharma Salon & Spa"
                    value={form.businessName}
                    onChange={onChange}
                    error={errors.businessName}
                  />
                  <div className={styles.row}>
                    <TextField
                      dense
                      label="Business phone"
                      name="phone"
                      type="tel"
                      inputMode="numeric"
                      prefix="+91"
                      placeholder="9876543210"
                      value={form.phone}
                      onChange={onChange}
                      error={errors.phone}
                    />
                    <TextField
                      dense
                      label="Business email (optional)"
                      name="email"
                      type="email"
                      inputMode="email"
                      placeholder="contact@business.com"
                      value={form.email}
                      onChange={onChange}
                      error={errors.email}
                    />
                  </div>
                </FormSection>

                <FormSection
                  icon={<FileText size={16} />}
                  title="About your business"
                  description="A short description helps customers choose you."
                >
                  <div className={styles.field}>
                    <label className={styles.textareaLabel} htmlFor="description">
                      Description <span className={styles.optional}>(optional)</span>
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      className={styles.textarea}
                      placeholder="Describe your services, specialities, experience…"
                      value={form.description}
                      onChange={onChange}
                    />
                  </div>
                </FormSection>
              </>
            )}

            {/* ── Step: payments ────────────────────────────────────────── */}
            {stepId === 'payments' && (
              <>
                <OptionSection
                  name="partialPayEnabled"
                  icon={<Percent size={16} />}
                  label="Accept partial payment"
                  description={
                    form.type === 'STORE'
                      ? 'Customers pay a part now to confirm an order, and the rest when they pick it up.'
                      : 'Customers pay a part now to confirm a booking, and the rest at the appointment.'
                  }
                  checked={form.partialPayEnabled}
                  onChange={togglePartialPayEnabled}
                  settingsTitle="Partial payment settings"
                >
                  <TextField
                    dense
                    label="Advance deposit (%)"
                    name="depositPercent"
                    type="number"
                    inputMode="numeric"
                    placeholder="20"
                    value={form.depositPercent}
                    onChange={onChange}
                    hint="Leave blank to use the standard 20%."
                  />
                  <p className={styles.example}>
                    <Wallet size={14} aria-hidden="true" />
                    On a ₹1,000 {form.type === 'STORE' ? 'order' : 'booking'}, the customer pays{' '}
                    <strong>₹{Math.round((1000 * depositPreview) / 100)}</strong> now and ₹
                    {1000 - Math.round((1000 * depositPreview) / 100)} in person.
                  </p>
                </OptionSection>

                {form.type === 'STORE' && (
                  <OptionSection
                    name="codEnabled"
                    icon={<Banknote size={16} />}
                    label="Accept Cash on Delivery"
                    description="Customers can place an order and pay in cash when they pick it up."
                    checked={form.codEnabled}
                    onChange={toggleCodEnabled}
                    settingsTitle="Cash on delivery"
                  >
                    <ul className={styles.notes}>
                      <li>You collect the cash yourself at pickup.</li>
                      <li>DNX&apos;s commission on cash sales is taken off your next payout.</li>
                      <li>You can still turn Cash on Delivery off for individual products later.</li>
                    </ul>
                  </OptionSection>
                )}

                {!form.partialPayEnabled && (form.type === 'SERVICE' || !form.codEnabled) && (
                  <p className={styles.note}>
                    <ListChecks size={14} aria-hidden="true" /> Customers can always pay the full amount online.
                  </p>
                )}
              </>
            )}

            {/* ── Step: photos (create only) ────────────────────────────── */}
            {stepId === 'photos' && (
              <FormSection
                icon={<ImageIcon size={16} />}
                title="Photos"
                description={`Add up to ${maxImages}. The first one becomes your cover.`}
              >
                <button
                  type="button"
                  className={styles.dropzone}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <span className={styles.dropzoneIcon}>
                    <Camera size={24} aria-hidden="true" />
                  </span>
                  <span className={styles.dropzoneText}>Click to upload photos</span>
                  <span className={styles.dropzoneHint}>JPG, PNG or WEBP · up to 5MB each</span>
                </button>
                <input
                  ref={fileInputRef}
                  className={styles.hiddenInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={(e) => {
                    addImages(e.target.files);
                    e.target.value = '';
                  }}
                />

                {images.length > 0 && (
                  <div className={styles.thumbs}>
                    {images.map((img, i) => (
                      <div className={styles.thumb} key={img.preview}>
                        <img className={styles.thumbImg} src={img.preview} alt={`Photo ${i + 1}`} />
                        {i === 0 && <span className={styles.coverBadge}>Cover</span>}
                        <button
                          type="button"
                          className={styles.thumbRemove}
                          onClick={() => removeImage(i)}
                          aria-label={`Remove photo ${i + 1}`}
                        >
                          <X size={13} aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </FormSection>
            )}

            {/* ── Step: location ────────────────────────────────────────── */}
            {stepId === 'location' && (
              <>
                <FormSection
                  icon={<MapPin size={16} />}
                  title="Address"
                  description="Where customers find you."
                >
                  <TextField
                    dense
                    label="Address"
                    name="addressLine"
                    placeholder="Shop / building, street"
                    value={form.addressLine}
                    onChange={onChange}
                  />
                  <div className={styles.row}>
                    <TextField
                      dense
                      label="Postal code"
                      name="postalCode"
                      inputMode="numeric"
                      placeholder="380015"
                      value={form.postalCode}
                      onChange={onChange}
                      hint={resolvingPincode ? 'Looking up your city…' : undefined}
                    />
                    <TextField
                      dense
                      label="City"
                      name="city"
                      placeholder="Auto-filled from PIN code"
                      value={form.city}
                      onChange={onChange}
                    />
                  </div>
                  <TextField
                    dense
                    label="State"
                    name="state"
                    placeholder="Auto-filled from PIN code"
                    value={form.state}
                    onChange={onChange}
                  />
                </FormSection>

                <FormSection
                  icon={<LocateFixed size={16} />}
                  title="Pin your location"
                  description="Lets customers find you in “nearest” search and see how far you are."
                  action={hasLocation ? <span className={styles.pinned}>Location saved</span> : undefined}
                >
                  <div className={styles.locationRow}>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={useCurrentLocation}
                      loading={locating}
                      loadingText="Locating…"
                      iconLeft={<LocateFixed size={16} aria-hidden="true" />}
                    >
                      {hasLocation ? 'Update from my current location' : 'Use my current location'}
                    </Button>
                  </div>
                  {locationError && <AlertBanner tone="error">{locationError}</AlertBanner>}
                </FormSection>
              </>
            )}
          </div>
        </Card>

        {serverError && <AlertBanner tone="error">{serverError}</AlertBanner>}

        {/* Sticky so the next action is always reachable. */}
        <div className={styles.actionBar}>
          <Button
            type="button"
            variant="secondary"
            onClick={back}
            disabled={step === 0 || submitting}
            iconLeft={<ArrowLeft size={16} aria-hidden="true" />}
          >
            Back
          </Button>

          <span className={styles.actionNote}>
            Step {step + 1} of {steps.length} · {copy.label}
          </span>

          <div className={styles.actionRight}>
            {isEdit && !isLastStep && (
              <Button type="submit" variant="secondary" onClick={saveNow} loading={submitting} loadingText="Saving…">
                Save changes
              </Button>
            )}
            {isLastStep ? (
              <Button type="submit" loading={submitting} loadingText="Saving…">
                {isEdit ? 'Save changes' : 'Create business'}
              </Button>
            ) : (
              <Button type="button" onClick={next} disabled={submitting} iconRight={<ArrowRight size={16} aria-hidden="true" />}>
                Continue
              </Button>
            )}
          </div>
        </div>
      </form>
    </AppShell>
  );
}
