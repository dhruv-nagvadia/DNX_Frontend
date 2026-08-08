import { useRef } from 'react';
import { ArrowLeft, Camera, Check, X } from 'lucide-react';

import { AlertBanner } from '@/components/AlertBanner';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { CategoryIcon } from '@/components/CategoryIcon';
import { PageHeader } from '@/components/PageHeader';
import { Skeleton } from '@/components/Skeleton';
import { TextField } from '@/components/TextField';

import { useBusinessForm } from './useBusinessForm';
import styles from './BusinessFormPage.module.css';

/** JSX only — logic comes from useBusinessForm. Handles both create and edit. */
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
    selectCategory,
    selectSubcategory,
    onChange,
    addImages,
    removeImage,
    onSubmit,
    goBack,
  } = useBusinessForm();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const backButton = (
    <button type="button" className={styles.back} onClick={goBack}>
      <ArrowLeft size={16} aria-hidden="true" />
      <span className={styles.backLabel}>Back</span>
    </button>
  );

  if (loadingExisting) {
    return (
      <AppShell>
        {backButton}
        <Skeleton width="40%" height={34} />
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} height={180} radius="var(--radius-xl)" />
        ))}
      </AppShell>
    );
  }

  const totalSteps = isEdit ? 3 : 4;

  return (
    <AppShell>
      {backButton}
      <PageHeader
        title={isEdit ? 'Edit business' : 'Add a new business'}
        subtitle={
          isEdit
            ? 'Update your business details. Changes go live immediately.'
            : 'Tell customers about your business so they can find and book you.'
        }
      />

      <form className={styles.form} onSubmit={onSubmit} noValidate>
        {/* Step 1 — type */}
        <Card
          eyebrow={`Step 1 of ${totalSteps}`}
          title="Business type"
          subtitle="Choose the category that fits best."
        >
          {categoriesLoading ? (
            <div className={styles.grid}>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} height={94} radius="var(--radius-lg)" />
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
                    {active && <Check className={styles.tick} size={15} aria-hidden="true" />}
                    <CategoryIcon slug={c.slug} size={26} strokeWidth={1.6} />
                    <span className={styles.categoryName}>{c.name}</span>
                  </button>
                );
              })}
            </div>
          )}
          {errors.categoryId && <p className={styles.fieldError}>{errors.categoryId}</p>}

          {form.categoryId && subcategories.length > 0 && (
            <div className={styles.subSection}>
              <p className={styles.subLabel}>Select your business type</p>
              <div className={styles.chips}>
                {subcategories.map((s) => (
                  <button
                    type="button"
                    key={s.id}
                    aria-pressed={form.subcategoryId === s.id}
                    className={`${styles.chip} ${
                      form.subcategoryId === s.id ? styles.chipActive : ''
                    }`}
                    onClick={() => selectSubcategory(s.id)}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
              {errors.subcategoryId && <p className={styles.fieldError}>{errors.subcategoryId}</p>}
            </div>
          )}
        </Card>

        {/* Step 2 — details */}
        <Card
          eyebrow={`Step 2 of ${totalSteps}`}
          title="Business details"
          subtitle="How your business appears to customers."
        >
          <div className={styles.fields}>
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

            <div className={styles.field}>
              <label className={styles.textareaLabel} htmlFor="description">
                About your business <span className={styles.optional}>(optional)</span>
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
          </div>
        </Card>

        {/* Step 3 — photos (create only; edit manages photos on the detail page) */}
        {!isEdit && (
          <Card
            eyebrow={`Step 3 of ${totalSteps}`}
            title="Business photos"
            subtitle={`Add up to ${maxImages} photos. The first one becomes your cover.`}
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
              accept="image/*"
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
          </Card>
        )}

        {/* Final step — location */}
        <Card
          eyebrow={`Step ${totalSteps} of ${totalSteps}`}
          title="Location"
          subtitle="Helps customers nearby find you. All fields optional."
        >
          <div className={styles.fields}>
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
                label="City"
                name="city"
                placeholder="City"
                value={form.city}
                onChange={onChange}
              />
              <TextField
                dense
                label="State"
                name="state"
                placeholder="State"
                value={form.state}
                onChange={onChange}
              />
            </div>
            <TextField
              dense
              label="Postal code"
              name="postalCode"
              inputMode="numeric"
              placeholder="380015"
              value={form.postalCode}
              onChange={onChange}
            />
          </div>
        </Card>

        {serverError && <AlertBanner tone="error">{serverError}</AlertBanner>}

        {/* Sticky so the primary action is always reachable on a long form. */}
        <div className={styles.actionBar}>
          <span className={styles.actionNote}>You can change all of this later.</span>
          <Button type="submit" loading={submitting} loadingText="Saving…">
            {isEdit ? 'Save changes' : 'Create business'}
          </Button>
        </div>
      </form>
    </AppShell>
  );
}
