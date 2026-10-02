import { DiscountType, PlatformCouponAppliesTo } from '@/redux/api/admin/types';

export interface PlatformCouponForm {
  code: string;
  description: string;
  appliesTo: PlatformCouponAppliesTo;
  discountType: DiscountType;
  discountValue: string; // percent (PERCENT) or rupees (FLAT)
  minOrder: string; // rupees
  maxDiscount: string; // rupees (PERCENT only)
  categoryId: string; // '' = any category
  expiresAt: string; // YYYY-MM-DD
  usageLimit: string;
  isActive: boolean;
}
