import { useRef } from 'react';
import { ArrowLeft, Camera, Check, X } from 'lucide-react';

import { TextField } from '@/components/TextField';
import { Button } from '@/components/Button';
import { CategoryIcon } from '@/components/CategoryIcon';
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

  if (loadingExisting) {
    return (
      <div className={styles.page}>
        <div className={styles.center}>Loading business…</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.topbar}>
        <div className={styles.topbarInner}>
          <button type="button" className={styles.back} onClick={goBack}>
            <ArrowLeft size={16} /> Back
          </button>
        </div>
      </div>

      <form onSubmit={onSubmit} noValidate>
        <div className={styles.container}>
          <h1 className={styles.title}>{isEdit ? 'Edit business' : 'Add a new business'}</h1>
          <p className={styles.subtitle}>
            {isEdit
              ? 'Update your business details below.'
              : 'Tell customers about your business so they can find and book you.'}
          </p>

          {/* Step 1 — type */}
          <section className={styles.card}>
            <div className={styles.sectionHead}>
              <span className={styles.stepBadge}>1</span>
              <h3 className={styles.sectionTitle}>Business type</h3>
            </div>
            <p className={styles.sectionHint}>Choose the category that fits best.</p>

            {categoriesLoading ? (
              <p className={styles.loading}>Loading categories…</p>
            ) : (
              <div className={styles.grid}>
                {categories.map((c) => {
                  const active = form.categoryId === c.id;
                  return (
                    <div
                      role="button"
                      tabIndex={0}
                      key={c.id}
                      className={`${styles.categoryCard} ${active ? styles.categoryCardActive : ''}`}
                      onClick={() => selectCategory(c.id)}
                      onKeyDown={(e) => (e.key === 'Enter' ? selectCategory(c.id) : undefined)}
                    >
                      {active && <Check className={styles.tick} size={16} />}
                      <CategoryIcon slug={c.slug} size={26} strokeWidth={1.6} />
                      <span className={styles.categoryName}>{c.name}</span>
                    </div>
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
                      className={`${styles.chip} ${
                        form.subcategoryId === s.id ? styles.chipActive : ''
                      }`}
                      onClick={() => selectSubcategory(s.id)}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
                {errors.subcategoryId && (
                  <p className={styles.fieldError}>{errors.subcategoryId}</p>
                )}
              </div>
            )}
          </section>

          {/* Step 2 — details */}
          <section className={styles.card}>
            <div className={styles.sectionHead}>
              <span className={styles.stepBadge}>2</span>
              <h3 className={styles.sectionTitle}>Business details</h3>
            </div>
            <TextField
              label="Business name"
              name="businessName"
              placeholder="e.g. Sharma Salon & Spa"
              value={form.businessName}
              onChange={onChange}
              error={errors.businessName}
            />
            <div className={styles.row}>
              <TextField
                label="Business phone"
                name="phone"
                type="tel"
                placeholder="9876543210"
                value={form.phone}
                onChange={onChange}
                error={errors.phone}
              />
              <TextField
                label="Business email (optional)"
                name="email"
                type="email"
                placeholder="contact@business.com"
                value={form.email}
                onChange={onChange}
                error={errors.email}
              />
            </div>
            <label className={styles.textareaLabel} htmlFor="description">
              About your business (optional)
            </label>
            <textarea
              id="description"
              name="description"
              className={styles.textarea}
              placeholder="Describe your services, specialities, experience…"
              value={form.description}
              onChange={onChange}
            />
          </section>

          {/* Step 3 — photos (create only; edit manages photos on the detail page) */}
          {!isEdit && (
            <section className={styles.card}>
              <div className={styles.sectionHead}>
                <span className={styles.stepBadge}>3</span>
                <h3 className={styles.sectionTitle}>Business photos</h3>
              </div>
              <p className={styles.sectionHint}>
                Add up to {maxImages} photos. The first one becomes your cover.
              </p>

              <div
                className={styles.dropzone}
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => (e.key === 'Enter' ? fileInputRef.current?.click() : undefined)}
              >
                <Camera size={28} />
                <span className={styles.dropzoneText}>Click to upload photos</span>
                <span className={styles.dropzoneHint}>JPG, PNG or WEBP · up to 5MB each</span>
              </div>
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
                        aria-label="Remove photo"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Step 4 — location */}
          <section className={styles.card}>
            <div className={styles.sectionHead}>
              <span className={styles.stepBadge}>{isEdit ? '3' : '4'}</span>
              <h3 className={styles.sectionTitle}>Location</h3>
            </div>
            <TextField
              label="Address (optional)"
              name="addressLine"
              placeholder="Shop / building, street"
              value={form.addressLine}
              onChange={onChange}
            />
            <div className={styles.row}>
              <TextField
                label="City (optional)"
                name="city"
                placeholder="City"
                value={form.city}
                onChange={onChange}
              />
              <TextField
                label="State (optional)"
                name="state"
                placeholder="State"
                value={form.state}
                onChange={onChange}
              />
            </div>
            <TextField
              label="Postal code (optional)"
              name="postalCode"
              placeholder="380015"
              value={form.postalCode}
              onChange={onChange}
            />
          </section>

          {serverError && <p className={styles.serverError}>{serverError}</p>}
        </div>

        <div className={styles.actionBar}>
          <div className={styles.actionInner}>
            <span className={styles.actionNote}>You can edit all of this later.</span>
            <Button type="submit" loading={submitting}>
              {isEdit ? 'Save changes' : 'Create business'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
