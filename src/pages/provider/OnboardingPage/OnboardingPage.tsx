import { useRef } from 'react';

import { TextField } from '@/components/TextField';
import { Button } from '@/components/Button';
import { categoryIcon } from '@/utils/categoryIcons';
import { useOnboardingPage } from './useOnboardingPage';
import styles from './OnboardingPage.module.css';

/** JSX only — logic comes from useOnboardingPage. */
export default function OnboardingPage() {
  const {
    userName,
    categories,
    categoriesLoading,
    form,
    images,
    errors,
    serverError,
    submitting,
    success,
    maxImages,
    selectCategory,
    onChange,
    addImages,
    removeImage,
    onSubmit,
    goToDashboard,
  } = useOnboardingPage();

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (success) {
    return (
      <div className={styles.page}>
        <div className={styles.success}>
          <div className={styles.successIcon}>✓</div>
          <h2 className={styles.title}>Your business is live! 🎉</h2>
          <p className={styles.subtitle}>
            Customers can now discover <strong>{form.businessName}</strong> on DNX.
          </p>
          <Button style={{ marginTop: 24 }} onClick={goToDashboard}>
            Go to dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.topbar}>
        <div className={styles.topbarInner}>
          <span className={styles.logo}>DNX for Business</span>
          <span className={styles.topbarLabel}>Set up your business</span>
        </div>
      </div>

      <form onSubmit={onSubmit} noValidate>
        <div className={styles.container}>
          <header className={styles.header}>
            <h1 className={styles.title}>
              Welcome{userName ? `, ${userName}` : ''} 👋
            </h1>
            <p className={styles.subtitle}>
              Complete your business profile so customers can find and book you.
            </p>
          </header>

          {/* Step 1 — business type */}
          <section className={styles.card}>
            <div className={styles.sectionHead}>
              <span className={styles.stepBadge}>1</span>
              <h3 className={styles.sectionTitle}>What type of business do you run?</h3>
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
                      {active && <span className={styles.tick}>✓</span>}
                      <span className={styles.categoryIcon}>{categoryIcon(c.slug)}</span>
                      <span className={styles.categoryName}>{c.name}</span>
                    </div>
                  );
                })}
              </div>
            )}
            {errors.categoryId && <p className={styles.fieldError}>{errors.categoryId}</p>}
          </section>

          {/* Step 2 — details */}
          <section className={styles.card}>
            <div className={styles.sectionHead}>
              <span className={styles.stepBadge}>2</span>
              <h3 className={styles.sectionTitle}>Business details</h3>
            </div>
            <p className={styles.sectionHint}>Basic information customers will see.</p>

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

          {/* Step 3 — photos */}
          <section className={styles.card}>
            <div className={styles.sectionHead}>
              <span className={styles.stepBadge}>3</span>
              <h3 className={styles.sectionTitle}>Business photos</h3>
            </div>
            <p className={styles.sectionHint}>
              Add up to {maxImages} photos. The first one becomes your cover image.
            </p>

            <div
              className={styles.dropzone}
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => (e.key === 'Enter' ? fileInputRef.current?.click() : undefined)}
            >
              <span className={styles.dropzoneIcon}>📷</span>
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
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Step 4 — location */}
          <section className={styles.card}>
            <div className={styles.sectionHead}>
              <span className={styles.stepBadge}>4</span>
              <h3 className={styles.sectionTitle}>Location</h3>
            </div>
            <p className={styles.sectionHint}>Helps nearby customers find you.</p>

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

        {/* Sticky action bar */}
        <div className={styles.actionBar}>
          <div className={styles.actionInner}>
            <span className={styles.actionNote}>You can edit all of this later.</span>
            <Button type="submit" loading={submitting}>
              Create business profile
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
