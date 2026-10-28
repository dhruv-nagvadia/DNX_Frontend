import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useGetCategoriesQuery } from '@/redux/api/category/categoryApi';
import {
  useCreateProviderMutation,
  useGetMyBusinessQuery,
  useUpdateBusinessMutation,
  useUploadBusinessImagesMutation,
} from '@/redux/api/provider/providerApi';

import { isRasterImage, IMAGE_REJECT_MSG } from '@/utils/imageValidation';
import { lookupPincode, reverseGeocode } from '@/utils/geoLookup';
import { BusinessForm, BusinessFormErrors, BusinessStepId, PickedImage } from './types';
import { STEP_FIELDS, validateBusiness } from './validation';

const PIN_RE = /^\d{6}$/;

const EMPTY: BusinessForm = {
  type: 'SERVICE',
  categoryId: '',
  subcategoryId: '',
  businessName: '',
  phone: '',
  email: '',
  description: '',
  addressLine: '',
  city: '',
  state: '',
  postalCode: '',
  latitude: '',
  longitude: '',
  depositPercent: '',
  codEnabled: true,
  partialPayEnabled: true,
};

const MAX_IMAGES = 8;

/** A new step starts at the top of the page. */
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
}

// Photos are added while creating; an existing business manages them on its detail page.
const CREATE_STEPS: BusinessStepId[] = ['type', 'details', 'payments', 'photos', 'location'];
const EDIT_STEPS: BusinessStepId[] = ['type', 'details', 'payments', 'location'];

/** Shared create/edit logic. Edit mode is active when a route :id is present. */
export function useBusinessForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const { data: allCategories = [], isLoading: categoriesLoading } = useGetCategoriesQuery();
  const { data: existing, isLoading: loadingExisting } = useGetMyBusinessQuery(id as string, {
    skip: !isEdit,
  });

  const [createProvider, { isLoading: creating }] = useCreateProviderMutation();
  const [updateBusiness, { isLoading: updating }] = useUpdateBusinessMutation();
  const [uploadImages, { isLoading: uploading }] = useUploadBusinessImagesMutation();

  const [form, setForm] = useState<BusinessForm>(EMPTY);
  const [images, setImages] = useState<PickedImage[]>([]);
  const stepIds = isEdit ? EDIT_STEPS : CREATE_STEPS;
  const [step, setStep] = useState(0);
  // The furthest step reached — when creating, you can go back to these but not skip ahead.
  const [furthest, setFurthest] = useState(0);
  const [errors, setErrors] = useState<BusinessFormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [resolvingPincode, setResolvingPincode] = useState(false);
  // Only auto-fill city/state from a typed PIN — never on the initial edit-mode
  // hydration, so we don't clobber a business's already-saved city/state.
  const pincodeEditedByUser = useRef(false);
  // Set by the edit-mode "Save now" shortcut so it saves from any step.
  const saveNowRef = useRef(false);

  // Prefill when editing.
  useEffect(() => {
    if (existing) {
      setForm({
        type: existing.type ?? 'SERVICE',
        categoryId: existing.category.id,
        subcategoryId: existing.subcategory?.id ?? '',
        businessName: existing.businessName,
        phone: existing.phone,
        email: existing.email ?? '',
        description: existing.description ?? '',
        addressLine: existing.addressLine ?? '',
        city: existing.city ?? '',
        state: existing.state ?? '',
        postalCode: existing.postalCode ?? '',
        latitude: existing.latitude != null ? String(existing.latitude) : '',
        longitude: existing.longitude != null ? String(existing.longitude) : '',
        depositPercent: existing.depositPercent ? String(existing.depositPercent) : '',
        codEnabled: existing.codEnabled ?? true,
        partialPayEnabled: existing.partialPayEnabled ?? true,
      });
    }
  }, [existing]);

  // Revoke object URLs on unmount.
  useEffect(() => {
    return () => images.forEach((img) => URL.revokeObjectURL(img.preview));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Switching mode clears the category (service and store categories differ).
  const selectType = useCallback((type: 'SERVICE' | 'STORE') => {
    setForm((prev) =>
      prev.type === type ? prev : { ...prev, type, categoryId: '', subcategoryId: '' },
    );
  }, []);

  const selectCategory = useCallback((categoryId: string) => {
    // Changing the category clears the previously selected business type.
    setForm((prev) => ({ ...prev, categoryId, subcategoryId: '' }));
    setErrors((prev) => ({ ...prev, categoryId: undefined }));
  }, []);

  const selectSubcategory = useCallback((subcategoryId: string) => {
    setForm((prev) => ({ ...prev, subcategoryId }));
    setErrors((prev) => ({ ...prev, subcategoryId: undefined }));
  }, []);

  // Only show categories that match the chosen mode (service vs store).
  const categories = allCategories.filter((c) => (c.type ?? 'SERVICE') === form.type);

  // Business types available for the currently selected category.
  const subcategories = allCategories.find((c) => c.id === form.categoryId)?.subcategories ?? [];

  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'postalCode') pincodeEditedByUser.current = true;
    setForm((prev) => ({ ...prev, [name]: value }));
    // A message about a field goes away as soon as it's edited, not only on the next submit.
    setErrors((prev) => (prev[name as keyof BusinessForm] ? { ...prev, [name]: undefined } : prev));
  }, []);

  const toggleCodEnabled = useCallback(() => {
    setForm((prev) => ({ ...prev, codEnabled: !prev.codEnabled }));
  }, []);

  const togglePartialPayEnabled = useCallback(() => {
    setForm((prev) => ({ ...prev, partialPayEnabled: !prev.partialPayEnabled }));
  }, []);

  // Debounced PIN → city/state autofill (India Post), only for pincodes the
  // provider actually typed — the resolved city/state can still be edited.
  useEffect(() => {
    if (!pincodeEditedByUser.current) return;
    const pincode = form.postalCode.trim();
    if (!PIN_RE.test(pincode)) {
      setResolvingPincode(false);
      return;
    }
    let cancelled = false;
    setResolvingPincode(true);
    const timer = setTimeout(async () => {
      const result = await lookupPincode(pincode);
      if (!cancelled) {
        if (result) setForm((prev) => ({ ...prev, city: result.city, state: result.state }));
        setResolvingPincode(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [form.postalCode]);

  const addImages = useCallback((fileList: FileList | null) => {
    if (!fileList) return;
    const files = Array.from(fileList).filter(isRasterImage);
    if (files.length !== fileList.length) window.alert(IMAGE_REJECT_MSG);
    const incoming = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...incoming].slice(0, MAX_IMAGES));
  }, []);

  // Uses the browser's built-in geolocation (no API key needed) for coordinates,
  // then reverse-geocodes them to fill in address/PIN/city/state too, so the
  // business can be found via "nearest" search AND by postal/city/state.
  const useCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Location isn’t available in this browser.');
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latitude = String(Math.round(pos.coords.latitude * 1e6) / 1e6);
        const longitude = String(Math.round(pos.coords.longitude * 1e6) / 1e6);
        setForm((prev) => ({ ...prev, latitude, longitude }));

        reverseGeocode(pos.coords.latitude, pos.coords.longitude)
          .then(({ address, city, state, postalCode }) => {
            setForm((prev) => ({
              ...prev,
              addressLine: address ?? prev.addressLine,
              city: city ?? prev.city,
              state: state ?? prev.state,
              postalCode: postalCode ?? prev.postalCode,
            }));
          })
          .finally(() => setLocating(false));
      },
      (err) => {
        setLocationError(
          err.code === err.PERMISSION_DENIED
            ? 'Location access was denied. You can allow it in your browser settings.'
            : 'Could not get your location. Please try again.',
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }, []);

  const removeImage = useCallback((index: number) => {
    setImages((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  /** Checks just one step's fields; returns whether they're all fine. */
  const validateStep = useCallback(
    (stepId: BusinessStepId): boolean => {
      const all = validateBusiness(form);
      const mine: BusinessFormErrors = {};
      for (const key of STEP_FIELDS[stepId]) if (all[key]) mine[key] = all[key];
      setErrors(mine);
      return Object.keys(mine).length === 0;
    },
    [form],
  );

  const goToStep = useCallback(
    (index: number) => {
      // Editing: every step already has data, so jump freely. Creating: only back to steps already reached.
      if (index < 0 || index >= stepIds.length) return;
      if (!isEdit && index > furthest) return;
      setServerError(null);
      setStep(index);
      scrollToTop();
    },
    [stepIds.length, isEdit, furthest],
  );

  const next = useCallback(() => {
    if (!validateStep(stepIds[step])) return;
    const target = Math.min(step + 1, stepIds.length - 1);
    setStep(target);
    setFurthest((f) => Math.max(f, target));
    setServerError(null);
    scrollToTop();
  }, [validateStep, stepIds, step]);

  const back = useCallback(() => goToStep(step - 1), [goToStep, step]);

  const isLastStep = step === stepIds.length - 1;

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setServerError(null);

      // Pressing Enter on an earlier step moves on instead of saving half a form.
      if (!isLastStep && !saveNowRef.current) {
        next();
        return;
      }
      saveNowRef.current = false;

      const validationErrors = validateBusiness(form);
      setErrors(validationErrors);
      if (Object.keys(validationErrors).length > 0) {
        // Take them to the first step that has a problem.
        const firstBad = stepIds.findIndex((id) => STEP_FIELDS[id].some((f) => validationErrors[f]));
        if (firstBad >= 0) {
          setStep(firstBad);
          scrollToTop();
        }
        return;
      }

      const payload = {
        type: form.type,
        categoryId: form.categoryId,
        subcategoryId: form.subcategoryId || undefined,
        businessName: form.businessName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        description: form.description.trim() || undefined,
        addressLine: form.addressLine.trim() || undefined,
        city: form.city.trim() || undefined,
        state: form.state.trim() || undefined,
        postalCode: form.postalCode.trim() || undefined,
        latitude: form.latitude.trim() ? Number(form.latitude) : undefined,
        longitude: form.longitude.trim() ? Number(form.longitude) : undefined,
        depositPercent: form.depositPercent.trim() ? Number(form.depositPercent) : 0,
        codEnabled: form.codEnabled,
        partialPayEnabled: form.partialPayEnabled,
      };

      try {
        if (isEdit && id) {
          await updateBusiness({ id, data: payload }).unwrap();
          navigate(`/businesses/${id}`);
        } else {
          const created = await createProvider(payload).unwrap();
          if (images.length > 0) {
            const fd = new FormData();
            images.forEach((img) => fd.append('images', img.file));
            await uploadImages({ id: created.id, formData: fd }).unwrap();
          }
          navigate(`/businesses/${created.id}`);
        }
      } catch {
        setServerError('Could not save. Please check your details and try again.');
      }
    },
    [form, images, isEdit, id, createProvider, updateBusiness, uploadImages, navigate, isLastStep, next, stepIds],
  );

  return {
    isEdit,
    loadingExisting: isEdit && loadingExisting,
    categories,
    subcategories,
    categoriesLoading,
    form,
    images,
    errors,
    serverError,
    submitting: creating || updating || uploading,
    maxImages: MAX_IMAGES,
    selectType,
    selectCategory,
    selectSubcategory,
    onChange,
    toggleCodEnabled,
    togglePartialPayEnabled,
    addImages,
    removeImage,
    onSubmit,
    steps: stepIds,
    step,
    furthest: isEdit ? stepIds.length - 1 : furthest,
    isLastStep,
    goToStep,
    next,
    back,
    // Edit mode: save from any step without clicking through to the end.
    saveNow: () => {
      saveNowRef.current = true;
    },
    useCurrentLocation,
    locating,
    locationError,
    resolvingPincode,
  };
}
