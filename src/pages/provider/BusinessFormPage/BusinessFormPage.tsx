import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Check,
  ChevronDown,
  ChevronRight,
  CloudUpload,
  Command,
  CreditCard,
  Crosshair,
  Info,
  Layers,
  MapPin,
  ShoppingBag,
  Star,
  X,
} from 'lucide-react';

import { AlertBanner } from '@/components/AlertBanner';
import { AppShell } from '@/components/AppShell';
import { useAppShell } from '@/components/AppShell/useAppShell';
import shellStyles from '@/components/AppShell/AppShell.module.css';
import { CategoryIcon } from '@/components/CategoryIcon';
import { NotificationBell } from '@/components/NotificationBell';
import { Skeleton } from '@/components/Skeleton';

import { DoneCard } from './DoneCard';
import { FormStepper } from './FormStepper';
import { LivePreview } from './LivePreview';
import { BusinessStepId } from './types';
import { useBusinessForm } from './useBusinessForm';
import styles from './BusinessFormPage.module.css';

const DESCRIPTION_MAX = 500;

const STEP_COPY: Record<BusinessStepId, { label: string; title: string; subtitle: string; optional?: boolean; tip: string }> = {
  type: {
    label: 'Business type',
    title: 'What kind of business is this?',
    subtitle: 'Choose how customers will use your business on DNX.',
    tip: 'Choose the right business type and category so customers can find you easily.',
  },
  details: {
    label: 'Details',
    title: 'Business details',
    subtitle: 'Add your basic business information.',
    tip: 'Write a short, clear description that explains your services and what makes your business special.',
  },
  payments: {
    label: 'Payments',
    title: 'How customers can pay',
    subtitle: 'Choose the payment options you want to offer.',
    tip: 'Offering multiple payment options gives customers more flexibility and can increase bookings.',
  },
  photos: {
    label: 'Photos',
    title: 'Business photos',
    subtitle:
      'Add photos of your salon, interior, work setup, or storefront. Use a clear and attractive cover photo.',
    optional: true,
    tip: 'Add clear, high-quality photos of your space, setup and services. The first photo will be used as your cover.',
  },
  location: {
    label: 'Location',
    title: 'Where are you?',
    subtitle: 'Add your business address so customers can find you easily.',
    optional: true,
    tip: 'A correct location helps customers find your business on the map and get accurate directions.',
  },
};

const DONE_TIP =
  'You can manage everything (like services, hours, photos and payments) from your business dashboard anytime.';

// Pastel tile backgrounds, cycled across the category grid.
const TINTS = ['tintBlue', 'tintLavender', 'tintPeach', 'tintMint', 'tintPink'] as const;

/** Returns up to two initials for the account avatar (mirrors AppShell's own). */
function initialsOf(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'DN'
  );
}

/** Accessible on/off switch styled like the mockup. */
function Switch({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange?: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className={`${styles.switch} ${checked ? styles.switchOn : ''}`}
      onClick={onChange}
    >
      <span className={styles.switchKnob} />
    </button>
  );
}

/** JSX only — logic comes from useBusinessForm. A step-by-step flow, for both create and edit. */
export default function BusinessFormPage() {
  const {
    isEdit,
    existing,
    created,
    photoUploadFailed,
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
    pinLookup,
    pinLookupFailed,
    autoFilled,
    photoError,
  } = useBusinessForm();
  const { user } = useAppShell();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const header = (
    <>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link to="/businesses" className={styles.breadcrumbLink}>
          My Businesses
        </Link>
        <ChevronRight size={14} className={styles.breadcrumbSep} aria-hidden="true" />
        {isEdit ? (
          <>
            {existing ? (
              <Link to={`/businesses/${existing.id}`} className={styles.breadcrumbLink}>
                {existing.businessName}
              </Link>
            ) : (
              <span className={styles.breadcrumbLink}>Business</span>
            )}
            <ChevronRight size={14} className={styles.breadcrumbSep} aria-hidden="true" />
            <span className={styles.breadcrumbCurrent}>Edit</span>
          </>
        ) : (
          <span className={styles.breadcrumbCurrent}>Add business</span>
        )}
      </nav>

      <div className={shellStyles.topbarActions}>
        <NotificationBell />
        <Link className={`${shellStyles.topbarProfile} ${styles.profileChip}`} to="/profile" aria-label="Your profile">
          <span className={shellStyles.topbarAvatar} aria-hidden="true">
            {initialsOf(user?.fullName ?? 'DNX')}
          </span>
          {user?.fullName && <span className={styles.topbarName}>{user.fullName}</span>}
          <ChevronDown size={16} aria-hidden="true" className={styles.topbarChevron} />
        </Link>
      </div>
    </>
  );

  if (loadingExisting) {
    return (
      <AppShell header={header}>
        <Skeleton width="40%" height={34} />
        <Skeleton height={64} radius="var(--m-radius-card)" />
        <Skeleton height={320} radius="var(--m-radius-card)" />
      </AppShell>
    );
  }

  const stepId = steps[step];
  const copy = STEP_COPY[stepId];
  const isStore = form.type === 'STORE';
  const depositShown = Number(form.depositPercent) > 0 ? Number(form.depositPercent) : 20;
  const hasLocation = !!form.latitude && !!form.longitude;
  const codLockedByAdmin = !!existing?.codDisabledByAdmin;

  // ── Live preview data (all from the form / the saved business) ──
  const categoryName = categories.find((c) => c.id === form.categoryId)?.name ?? null;
  const subcategoryName = subcategories.find((s) => s.id === form.subcategoryId)?.name ?? null;
  const categoryLabel = categoryName
    ? subcategoryName
      ? `${categoryName} · ${subcategoryName}`
      : categoryName
    : null;
  const coverUrl = images[0]?.preview ?? existing?.images?.[0] ?? null;
  const ratingSource = created ?? existing;
  const rating =
    ratingSource && ratingSource.ratingCount > 0
      ? `${ratingSource.ratingAvg.toFixed(1)} (${ratingSource.ratingCount} review${ratingSource.ratingCount === 1 ? '' : 's'})`
      : null;

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addImages(e.dataTransfer.files);
  };

  return (
    <AppShell header={header}>
      <div className={styles.page}>
        <header className={styles.pageHead}>
          <h1 className={styles.pageTitle}>{isEdit ? 'Edit business' : 'Add a new business'}</h1>
          <p className={styles.pageSubtitle}>
            {isEdit
              ? 'Update your business details. Changes go live as soon as you save.'
              : 'Takes about 2 minutes — you can change everything later'}
          </p>
        </header>

        <FormStepper
          labels={steps.map((id) => STEP_COPY[id].label)}
          current={step}
          reachable={furthest}
          allDone={!!created}
          onSelect={goToStep}
        />

        <div className={styles.columns}>
          {created ? (
            <DoneCard business={created} photoUploadFailed={photoUploadFailed} />
          ) : (
            <form className={styles.card} onSubmit={onSubmit} noValidate>
              <span className={styles.stepChip}>
                Step {step + 1} of {steps.length}
              </span>
              <div className={styles.cardTitleRow}>
                <h2 className={styles.cardTitle}>{copy.title}</h2>
                {copy.optional && <span className={styles.optionalPill}>Optional</span>}
              </div>
              <p className={styles.cardSubtitle}>{copy.subtitle}</p>

              <div className={styles.stepBody}>
                {/* ── Step: business type ───────────────────────────────── */}
                {stepId === 'type' && (
                  <>
                    <div className={styles.typeChooser}>
                      {(
                        [
                          {
                            id: 'SERVICE',
                            icon: <Command size={30} strokeWidth={1.8} aria-hidden="true" />,
                            title: 'Service business',
                            desc: 'Customers book appointments',
                          },
                          {
                            id: 'STORE',
                            icon: <ShoppingBag size={30} strokeWidth={1.8} aria-hidden="true" />,
                            title: 'Store',
                            desc: 'Customers order products for pickup',
                          },
                        ] as const
                      ).map((t) => {
                        const active = form.type === t.id;
                        return (
                          <button
                            type="button"
                            key={t.id}
                            aria-pressed={active}
                            className={`${styles.typeCard} ${active ? styles.typeCardActive : ''}`}
                            onClick={() => selectType(t.id)}
                          >
                            {active && (
                              <span className={styles.checkBadge} aria-hidden="true">
                                <Check size={14} strokeWidth={3} />
                              </span>
                            )}
                            <span className={styles.typeIcon}>{t.icon}</span>
                            <span className={styles.typeTitle}>{t.title}</span>
                            <span className={styles.typeDesc}>{t.desc}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className={styles.group}>
                      <h3 className={styles.groupTitle}>Choose a category</h3>
                      {categoriesLoading ? (
                        <div className={styles.grid}>
                          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                            <Skeleton key={i} height={96} radius="var(--m-radius-box)" />
                          ))}
                        </div>
                      ) : (
                        <div className={styles.grid}>
                          {categories.map((c, i) => {
                            const active = form.categoryId === c.id;
                            return (
                              <button
                                type="button"
                                key={c.id}
                                aria-pressed={active}
                                className={`${styles.categoryTile} ${styles[TINTS[i % TINTS.length]]} ${active ? styles.categoryTileActive : ''}`}
                                onClick={() => selectCategory(c.id)}
                              >
                                {active && (
                                  <span className={styles.checkBadge} aria-hidden="true">
                                    <Check size={12} strokeWidth={3} />
                                  </span>
                                )}
                                <span className={styles.categoryIcon}>
                                  <CategoryIcon slug={c.slug} size={28} strokeWidth={1.7} />
                                </span>
                                <span className={styles.categoryName}>{c.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                      {errors.categoryId && <p className={styles.fieldError}>{errors.categoryId}</p>}
                    </div>

                    {form.categoryId && subcategories.length > 0 && (
                      <div className={styles.group}>
                        <h3 className={styles.groupTitle}>Specific type</h3>
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
                      </div>
                    )}
                  </>
                )}

                {/* ── Step: details ─────────────────────────────────────── */}
                {stepId === 'details' && (
                  <>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="businessName">
                        Business name <span className={styles.req}>*</span>
                      </label>
                      <input
                        id="businessName"
                        name="businessName"
                        className={`${styles.input} ${errors.businessName ? styles.inputError : ''}`}
                        placeholder="e.g. Sharma Salon & Spa"
                        value={form.businessName}
                        onChange={onChange}
                        aria-invalid={!!errors.businessName}
                      />
                      {errors.businessName && <p className={styles.fieldError}>{errors.businessName}</p>}
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="phone">
                        Business phone <span className={styles.req}>*</span>
                      </label>
                      <div className={styles.phoneRow}>
                        <span className={styles.phonePrefix} aria-label="Country code +91">
                          +91
                          <ChevronDown size={16} aria-hidden="true" />
                        </span>
                        <input
                          id="phone"
                          name="phone"
                          type="tel"
                          inputMode="numeric"
                          className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
                          placeholder="98765 43210"
                          value={form.phone}
                          onChange={onChange}
                          aria-invalid={!!errors.phone}
                        />
                      </div>
                      {errors.phone && <p className={styles.fieldError}>{errors.phone}</p>}
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="email">
                        Business email <span className={styles.labelHint}>(optional)</span>
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        inputMode="email"
                        className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                        placeholder="contact@business.com"
                        value={form.email}
                        onChange={onChange}
                        aria-invalid={!!errors.email}
                      />
                      {errors.email && <p className={styles.fieldError}>{errors.email}</p>}
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="description">
                        Description
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        className={styles.textarea}
                        placeholder="Describe your services, specialities, experience…"
                        maxLength={DESCRIPTION_MAX}
                        value={form.description}
                        onChange={onChange}
                      />
                      <span
                        className={`${styles.counter} ${form.description.length > DESCRIPTION_MAX ? styles.counterOver : ''}`}
                      >
                        {form.description.length} / {DESCRIPTION_MAX}
                      </span>
                    </div>
                  </>
                )}

                {/* ── Step: payments ────────────────────────────────────── */}
                {stepId === 'payments' && (
                  <>
                    <div className={styles.option}>
                      <span className={styles.optionIcon}>
                        <CreditCard size={26} aria-hidden="true" />
                      </span>
                      <div className={styles.optionText}>
                        <span className={styles.optionTitle}>Online payment</span>
                        <span className={styles.optionDesc}>
                          Let customers pay online while {isStore ? 'ordering' : 'booking'}.
                        </span>
                      </div>
                      <span className={styles.optionAside}>
                        <span className={styles.alwaysPill}>Always available</span>
                        <Switch checked disabled label="Online payment (always on)" />
                      </span>
                    </div>

                    <div className={styles.option}>
                      <span className={styles.optionIcon}>
                        <Layers size={26} aria-hidden="true" />
                      </span>
                      <div className={styles.optionText}>
                        <span className={styles.optionTitle}>Accept partial payment</span>
                        <span className={styles.optionDesc}>
                          Take an advance payment at the time of {isStore ? 'ordering' : 'booking'}.
                        </span>
                      </div>
                      <span className={styles.optionAside}>
                        <Switch
                          checked={form.partialPayEnabled}
                          onChange={togglePartialPayEnabled}
                          label="Accept partial payment"
                        />
                      </span>
                      {form.partialPayEnabled && (
                        <div className={styles.optionExtra}>
                          <label className={styles.depositRow} htmlFor="depositPercent">
                            <span>Advance deposit</span>
                            <span className={styles.depositBox}>
                              <input
                                id="depositPercent"
                                name="depositPercent"
                                type="number"
                                inputMode="numeric"
                                min={1}
                                max={100}
                                placeholder="20"
                                className={styles.depositInput}
                                value={form.depositPercent}
                                onChange={onChange}
                              />
                              <span aria-hidden="true">%</span>
                            </span>
                          </label>
                          <p className={styles.depositNote}>
                            Customers pay {depositShown}% online, the rest at your shop.
                          </p>
                        </div>
                      )}
                    </div>

                    {isStore && (
                      <div className={styles.option}>
                        <span className={styles.optionIcon}>
                          <Banknote size={26} aria-hidden="true" />
                        </span>
                        <div className={styles.optionText}>
                          <span className={styles.optionTitle}>Accept Cash on Delivery / pay at venue</span>
                          <span className={styles.optionDesc}>
                            Customers can pay at your business (e.g., cash or card).
                          </span>
                        </div>
                        <span className={styles.optionAside}>
                          <Switch
                            checked={form.codEnabled && !codLockedByAdmin}
                            onChange={toggleCodEnabled}
                            disabled={codLockedByAdmin}
                            label="Accept Cash on Delivery"
                          />
                        </span>
                        {codLockedByAdmin ? (
                          <p className={`${styles.optionExtra} ${styles.lockedNote}`}>
                            Cash on Delivery has been turned off for this business by DNX
                            {existing?.codDisabledReason
                              ? `: ${existing.codDisabledReason.trim().replace(/[.!?]+$/, '')}.`
                              : '.'}
                          </p>
                        ) : (
                          form.codEnabled && (
                            <p className={`${styles.optionExtra} ${styles.depositNote}`}>
                              You collect the cash yourself — DNX&apos;s commission on cash sales is taken off your
                              next payout.
                            </p>
                          )
                        )}
                      </div>
                    )}

                    <p className={styles.infoBox}>
                      <Info size={20} aria-hidden="true" />
                      You can change these any time from your business settings.
                    </p>
                  </>
                )}

                {/* ── Step: photos (create only) ───────────────────────── */}
                {stepId === 'photos' && (
                  <>
                    <div
                      className={`${styles.dropzone} ${dragging ? styles.dropzoneActive : ''}`}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        setDragging(true);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'copy';
                      }}
                      onDragLeave={(e) => {
                        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false);
                      }}
                      onDrop={onDrop}
                    >
                      <CloudUpload size={44} strokeWidth={1.6} className={styles.dropIcon} aria-hidden="true" />
                      <span className={styles.dropTitle}>Drag &amp; drop photos here</span>
                      <span className={styles.dropOr}>or</span>
                      <button
                        type="button"
                        className={`${styles.btn} ${styles.btnOutline}`}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={images.length >= maxImages}
                      >
                        Browse files
                      </button>
                      <span className={styles.dropHint}>
                        JPG, PNG or WEBP • up to 10 MB • up to {maxImages} photos
                      </span>
                    </div>
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
                    {photoError && <p className={styles.fieldError}>{photoError}</p>}

                    {images.length > 0 && (
                      <>
                        <div className={styles.thumbs}>
                          {images.map((img, i) => (
                            <div className={styles.thumb} key={img.preview}>
                              <img className={styles.thumbImg} src={img.preview} alt={`Photo ${i + 1}`} />
                              {i === 0 && (
                                <span className={styles.coverBadge}>
                                  <Star size={12} fill="currentColor" aria-hidden="true" /> Cover
                                </span>
                              )}
                              <button
                                type="button"
                                className={styles.thumbRemove}
                                onClick={() => removeImage(i)}
                                aria-label={`Remove photo ${i + 1}`}
                              >
                                <X size={15} strokeWidth={2.6} aria-hidden="true" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <p className={styles.photoCount}>
                          {images.length} of {maxImages} photos
                        </p>
                      </>
                    )}
                  </>
                )}

                {/* ── Step: location ────────────────────────────────────── */}
                {stepId === 'location' && (
                  <>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="addressLine">
                        Address
                      </label>
                      <input
                        id="addressLine"
                        name="addressLine"
                        className={styles.input}
                        placeholder="Shop / building, street"
                        value={form.addressLine}
                        onChange={onChange}
                      />
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="postalCode">
                        PIN code
                      </label>
                      <div className={styles.row}>
                        <input
                          id="postalCode"
                          name="postalCode"
                          inputMode="numeric"
                          maxLength={6}
                          className={styles.input}
                          placeholder="380015"
                          value={form.postalCode}
                          onChange={onChange}
                        />
                        <div className={styles.pinStatus} aria-live="polite">
                          {resolvingPincode ? (
                            <span className={styles.pinLooking}>Looking up your city…</span>
                          ) : pinLookup ? (
                            <span className={styles.greenPill}>
                              <Check size={16} strokeWidth={2.6} aria-hidden="true" />
                              {[pinLookup.city, pinLookup.state].filter(Boolean).join(', ')}
                            </span>
                          ) : pinLookupFailed ? (
                            <span className={styles.pinLooking}>
                              Couldn&apos;t find this PIN — enter the city and state below.
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className={styles.row}>
                      {(['city', 'state'] as const).map((key) => (
                        <div className={styles.field} key={key}>
                          <label className={styles.label} htmlFor={key}>
                            {key === 'city' ? 'City' : 'State'}
                          </label>
                          <div className={styles.inputWrap}>
                            <input
                              id={key}
                              name={key}
                              className={`${styles.input} ${autoFilled[key] && form[key] ? styles.inputAuto : ''}`}
                              placeholder="Auto-filled from PIN code"
                              value={form[key]}
                              onChange={onChange}
                            />
                            {autoFilled[key] && form[key] && <span className={styles.autoTag}>Auto-filled</span>}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className={styles.pinCard}>
                      <div className={styles.pinHead}>
                        <MapPin size={26} className={styles.pinIcon} aria-hidden="true" />
                        <div className={styles.optionText}>
                          <span className={styles.optionTitle}>Pin your location</span>
                          <span className={styles.optionDesc}>
                            Set the exact location on the map for better accuracy.
                          </span>
                        </div>
                      </div>
                      <div className={styles.pinActions}>
                        <button
                          type="button"
                          className={`${styles.btn} ${styles.btnOutline}`}
                          onClick={useCurrentLocation}
                          disabled={locating}
                        >
                          <Crosshair size={18} aria-hidden="true" />
                          {locating ? 'Locating…' : 'Use my current location'}
                        </button>
                        {hasLocation && (
                          <span className={styles.greenPill}>
                            <Check size={16} strokeWidth={2.6} aria-hidden="true" />
                            Location saved
                          </span>
                        )}
                      </div>
                      {locationError && <AlertBanner tone="error">{locationError}</AlertBanner>}
                    </div>
                  </>
                )}
              </div>

              {serverError && (
                <div className={styles.serverError}>
                  <AlertBanner tone="error">{serverError}</AlertBanner>
                </div>
              )}

              <div className={styles.footer}>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnOutline} ${styles.btnGrey}`}
                  onClick={back}
                  disabled={step === 0 || submitting}
                >
                  <ArrowLeft size={18} aria-hidden="true" />
                  Back
                </button>

                <div className={styles.footerRight}>
                  {isEdit && !isLastStep && (
                    <button
                      type="submit"
                      className={`${styles.btn} ${styles.btnOutline}`}
                      onClick={saveNow}
                      disabled={submitting}
                    >
                      {submitting ? 'Saving…' : 'Save changes'}
                    </button>
                  )}
                  {isLastStep ? (
                    <button type="submit" className={`${styles.btn} ${styles.btnPrimary} ${styles.btnWide}`} disabled={submitting}>
                      {submitting ? (
                        <>
                          <span className={styles.spinner} aria-hidden="true" />
                          {isEdit ? 'Saving…' : images.length > 0 ? 'Creating & uploading…' : 'Creating…'}
                        </>
                      ) : isEdit ? (
                        'Save changes'
                      ) : (
                        'Create business'
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnPrimary} ${styles.btnWide}`}
                      onClick={next}
                      disabled={submitting}
                    >
                      Continue
                      <ArrowRight size={18} aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
            </form>
          )}

          <LivePreview
            coverUrl={coverUrl}
            name={form.businessName.trim()}
            categoryLabel={categoryLabel}
            city={form.city.trim()}
            rating={rating}
            tip={created ? DONE_TIP : copy.tip}
          />
        </div>
      </div>
    </AppShell>
  );
}
