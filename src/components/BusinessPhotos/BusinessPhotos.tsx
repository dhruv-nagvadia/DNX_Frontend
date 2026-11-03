import { DragEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import {
  CircleAlert,
  CircleCheck,
  CloudUpload,
  FolderOpen,
  Grip,
  Image as ImageIcon,
  Loader2,
  Plus,
  SquarePlus,
  Star,
  Trash2,
} from 'lucide-react';

import { ModernCard } from '@/components/ModernCard';

import styles from './BusinessPhotos.module.css';

export interface BusinessPhotosProps {
  /** Ordered photo URLs; images[0] is the cover. */
  images: string[];
  maxImages: number;
  uploading: boolean;
  /** A reorder / cover / remove save is in flight. */
  saving: boolean;
  /** Validates type + cap itself. */
  onAddFiles: (files: FileList | null) => void;
  onSetCover: (url: string) => void;
  onRemove: (url: string) => void;
  onReorder: (images: string[]) => void;
}

const ACCEPT = 'image/jpeg,image/png,image/webp';

/** Returns a copy of `list` with the item at `from` moved to `to`. */
function moveItem<T>(list: T[], from: number, to: number): T[] {
  const next = list.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/**
 * Business Detail → Photos tab ("Dhruv's Salon Photo Dashboard.png"): summary
 * tiles, cover + upload cards, and a drag-to-reorder gallery. Everything
 * below the tab row; all data comes from props.
 */
export function BusinessPhotos({
  images,
  maxImages,
  uploading,
  saving,
  onAddFiles,
  onSetCover,
  onRemove,
  onReorder,
}: BusinessPhotosProps) {
  const count = images.length;
  const slotsLeft = Math.max(0, maxImages - count);
  const full = slotsLeft === 0;
  const cover = images[0];
  const uploadDisabled = full || uploading;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const gripRefs = useRef(new Map<string, HTMLButtonElement>());
  const focusAfterMove = useRef<string | null>(null);

  const [dropActive, setDropActive] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [coverHint, setCoverHint] = useState(false);
  const [announce, setAnnounce] = useState('');

  // Keep keyboard focus on the moved photo's grip once the new order lands.
  useEffect(() => {
    const url = focusAfterMove.current;
    if (!url) return;
    const el = gripRefs.current.get(url);
    if (el) {
      el.focus();
      focusAfterMove.current = null;
    }
  }, [images]);

  const openPicker = () => {
    if (!uploadDisabled) fileInputRef.current?.click();
  };

  /* ── Upload drop zone (files from the desktop) ─────────────────────── */
  const onZoneDragOver = (e: DragEvent<HTMLDivElement>) => {
    if (!Array.from(e.dataTransfer.types).includes('Files')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = uploadDisabled ? 'none' : 'copy';
    if (!uploadDisabled) setDropActive(true);
  };
  const onZoneDragLeave = (e: DragEvent<HTMLDivElement>) => {
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
    setDropActive(false);
  };
  const onZoneDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDropActive(false);
    if (uploadDisabled) return;
    if (e.dataTransfer.files.length > 0) onAddFiles(e.dataTransfer.files);
  };

  /* ── Gallery reorder (native HTML5 drag & drop) ────────────────────── */
  const resetDrag = () => {
    setDragIndex(null);
    setOverIndex(null);
  };
  const onTileDragStart = (e: DragEvent<HTMLDivElement>, index: number) => {
    if (saving) {
      e.preventDefault();
      return;
    }
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', images[index]); // Firefox needs data to start a drag
  };
  const onTileDragOver = (e: DragEvent<HTMLDivElement>, index: number) => {
    if (dragIndex === null) return; // not an in-gallery drag (e.g. files)
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (overIndex !== index) setOverIndex(index);
  };
  const onTileDrop = (e: DragEvent<HTMLDivElement>, index: number) => {
    if (dragIndex === null) return;
    e.preventDefault();
    const from = dragIndex;
    resetDrag();
    if (from !== index && !saving) {
      onReorder(moveItem(images, from, index));
      setAnnounce(`Photo moved to position ${index + 1} of ${count}.`);
    }
  };

  /* ── Keyboard reorder on the grip ──────────────────────────────────── */
  const onGripKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let to: number | null = null;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') to = index - 1;
    else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') to = index + 1;
    else if (e.key === 'Home') to = 0;
    else if (e.key === 'End') to = count - 1;
    if (to === null) return;
    e.preventDefault();
    if (saving || to < 0 || to >= count || to === index) return;
    focusAfterMove.current = images[index];
    onReorder(moveItem(images, index, to));
    setAnnounce(`Photo moved to position ${to + 1} of ${count}.`);
  };

  const handleRemove = (url: string) => {
    if (saving) return;
    if (window.confirm('Remove this photo?')) onRemove(url);
  };

  const handleChangeCover = () => {
    setCoverHint(true);
    const el = galleryRef.current;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      el.focus({ preventScroll: true });
    }
  };

  const progress = maxImages > 0 ? Math.min(100, (count / maxImages) * 100) : 0;

  return (
    <div className={styles.root}>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT}
        multiple
        hidden
        onChange={(e) => {
          onAddFiles(e.target.files);
          e.target.value = '';
        }}
      />
      <span className={styles.srOnly} aria-live="polite">
        {announce}
      </span>

      {/* ── Summary tiles ─────────────────────────────────────────────── */}
      <div className={styles.tiles}>
        <div className={`${styles.tile} ${styles.tile_blue}`}>
          <span className={styles.tileIcon}>
            <ImageIcon size={30} aria-hidden="true" />
          </span>
          <div className={styles.tileText}>
            <span className={styles.tileLabel}>Photos</span>
            <span className={styles.tileValue}>
              {count} / {maxImages}
            </span>
            <span
              className={styles.progress}
              role="progressbar"
              aria-label="Photos used"
              aria-valuemin={0}
              aria-valuemax={maxImages}
              aria-valuenow={count}
            >
              <span className={styles.progressFill} style={{ width: `${progress}%` }} />
            </span>
          </div>
        </div>

        <div className={`${styles.tile} ${styles.tile_mint}`}>
          <span className={styles.tileIcon}>
            <SquarePlus size={30} aria-hidden="true" />
          </span>
          <div className={styles.tileText}>
            <span className={styles.tileLabel}>Slots Left</span>
            <span className={styles.tileValue}>{slotsLeft}</span>
          </div>
        </div>

        <div className={`${styles.tile} ${styles.tile_lavender}`}>
          <span className={styles.tileIcon}>
            <Star size={30} aria-hidden="true" />
          </span>
          <div className={styles.tileText}>
            {cover ? (
              <span className={styles.tileStatus}>
                Cover Photo Set
                <CircleCheck size={24} className={styles.tileCheck} aria-label="Set" />
              </span>
            ) : (
              <>
                <span className={styles.tileStatus}>No Cover Photo</span>
                <span className={styles.tileWarn}>
                  <CircleAlert size={14} aria-hidden="true" />
                  Upload a photo to set your cover
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className={styles.columns}>
        {/* ── Left: cover + upload ────────────────────────────────────── */}
        <div className={styles.side}>
          <ModernCard icon={<ImageIcon size={22} aria-hidden="true" />} iconTone="ink" title="Cover Photo">
            {cover ? (
              <div className={styles.coverFrame}>
                <img className={styles.coverImg} src={cover} alt="Cover photo" />
                <span className={`${styles.coverPill} ${styles.coverPillTopLeft}`}>
                  <Star size={14} fill="currentColor" aria-hidden="true" />
                  Cover
                </span>
              </div>
            ) : (
              <div className={styles.coverEmpty}>
                <ImageIcon size={32} aria-hidden="true" />
                <span>No cover yet</span>
              </div>
            )}
            <p className={styles.helper}>This is the first photo customers see in search and on your profile.</p>
            {cover && (
              <>
                <button
                  type="button"
                  className={styles.outlineBtn}
                  onClick={handleChangeCover}
                  aria-controls="business-photos-gallery"
                >
                  <ImageIcon size={18} aria-hidden="true" />
                  Change cover
                </button>
                {coverHint && (
                  <p className={styles.coverHint} role="status">
                    {count > 1
                      ? 'Pick a photo below and choose Set as cover'
                      : 'Upload another photo, then choose Set as cover'}
                  </p>
                )}
              </>
            )}
          </ModernCard>

          <ModernCard icon={<CloudUpload size={22} aria-hidden="true" />} iconTone="ink" title="Upload Photos">
            <div
              className={`${styles.dropZone} ${dropActive ? styles.dropZoneActive : ''} ${
                full ? styles.dropZoneDisabled : ''
              }`}
              onDragOver={onZoneDragOver}
              onDragLeave={onZoneDragLeave}
              onDrop={onZoneDrop}
              aria-disabled={full || undefined}
            >
              {uploading ? (
                <>
                  <Loader2 size={34} className={`${styles.zoneIcon} ${styles.spin}`} aria-hidden="true" />
                  <strong className={styles.zoneTitle} role="status">
                    Uploading…
                  </strong>
                </>
              ) : (
                <>
                  <CloudUpload size={34} className={styles.zoneIcon} aria-hidden="true" />
                  <strong className={styles.zoneTitle}>
                    {full ? `Maximum of ${maxImages} photos reached` : 'Drag & drop photos here'}
                  </strong>
                  {!full && <span className={styles.zoneOr}>or</span>}
                </>
              )}
              <button type="button" className={styles.primaryBtn} onClick={openPicker} disabled={uploadDisabled}>
                <FolderOpen size={18} aria-hidden="true" />
                Browse files
              </button>
              <p className={styles.zoneNote}>
                {full ? (
                  <>Maximum of {maxImages} photos reached — remove one to add more.</>
                ) : (
                  <>
                    JPG, PNG or WEBP <span aria-hidden="true">•</span> up to 10 MB each{' '}
                    <span aria-hidden="true">•</span> <strong>{slotsLeft}</strong> more photo
                    {slotsLeft === 1 ? '' : 's'} allowed
                  </>
                )}
              </p>
            </div>
          </ModernCard>
        </div>

        {/* ── Right: gallery ──────────────────────────────────────────── */}
        <div ref={galleryRef} id="business-photos-gallery" tabIndex={-1} className={styles.galleryAnchor}>
          <ModernCard
            icon={<ImageIcon size={22} aria-hidden="true" />}
            iconTone="ink"
            title={`Gallery (${count})`}
            action={
              count > 1 ? (
                <span className={styles.headHint}>
                  Drag to reorder <span aria-hidden="true">•</span> first photo is the cover
                </span>
              ) : undefined
            }
          >
            {count === 0 && (
              <p className={styles.emptyMsg}>No photos yet. Businesses with photos get noticeably more bookings.</p>
            )}
            <div
              className={`${styles.grid} ${saving ? styles.gridSaving : ''}`}
              aria-busy={saving || undefined}
              onDragEnd={resetDrag}
            >
              {images.map((url, i) => {
                const isCover = i === 0;
                const isTarget = dragIndex !== null && overIndex === i && dragIndex !== i;
                return (
                  <div
                    key={url}
                    className={`${styles.tilePhoto} ${dragIndex === i ? styles.tileDragging : ''} ${
                      isTarget ? styles.tileDropTarget : ''
                    }`}
                    draggable={!saving}
                    onDragStart={(e) => onTileDragStart(e, i)}
                    onDragOver={(e) => onTileDragOver(e, i)}
                    onDragLeave={() => setOverIndex((cur) => (cur === i ? null : cur))}
                    onDrop={(e) => onTileDrop(e, i)}
                  >
                    <img className={styles.photoImg} src={url} alt={`Photo ${i + 1}`} draggable={false} />

                    <button
                      type="button"
                      ref={(el) => {
                        if (el) gripRefs.current.set(url, el);
                        else gripRefs.current.delete(url);
                      }}
                      className={styles.grip}
                      aria-label={`Photo ${i + 1} of ${count}. Use arrow keys to reorder.`}
                      aria-disabled={saving || undefined}
                      onKeyDown={(e) => onGripKeyDown(e, i)}
                    >
                      <Grip size={16} aria-hidden="true" />
                    </button>

                    <span className={styles.position} aria-hidden="true">
                      {i + 1}
                    </span>

                    {isCover ? (
                      <span className={`${styles.coverPill} ${styles.coverPillBottomRight}`}>
                        <Star size={14} fill="currentColor" aria-hidden="true" />
                        Cover
                      </span>
                    ) : (
                      <div className={styles.tileActions}>
                        <button
                          type="button"
                          className={`${styles.chipBtn} ${styles.chipCover}`}
                          onClick={() => onSetCover(url)}
                          disabled={saving}
                          aria-label={`Set photo ${i + 1} as cover`}
                        >
                          <Star size={13} aria-hidden="true" />
                          Set as cover
                        </button>
                        <button
                          type="button"
                          className={`${styles.chipBtn} ${styles.chipRemove}`}
                          onClick={() => handleRemove(url)}
                          disabled={saving}
                          aria-label={`Remove photo ${i + 1}`}
                        >
                          <Trash2 size={13} aria-hidden="true" />
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {!full && (
                <button
                  type="button"
                  className={styles.addTile}
                  onClick={openPicker}
                  disabled={uploadDisabled || saving}
                >
                  {uploading ? (
                    <Loader2 size={26} className={styles.spin} aria-hidden="true" />
                  ) : (
                    <Plus size={28} aria-hidden="true" />
                  )}
                  <span>{uploading ? 'Uploading…' : 'Add photo'}</span>
                </button>
              )}
            </div>
          </ModernCard>
        </div>
      </div>
    </div>
  );
}
