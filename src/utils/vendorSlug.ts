/**
 * Helper to produce a clean URL-friendly slug from a vendor's business name
 */
export function slugifyVendor(name: string): string {
  if (!name) return '';
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Retrieve the public slug for a vendor, falling back to slugified business_name or id
 */
export function getVendorSlug(vendor: { id?: string; slug?: string; business_name?: string }): string {
  if (vendor.slug && vendor.slug.trim()) {
    return vendor.slug.trim();
  }
  if (vendor.business_name && vendor.business_name.trim()) {
    const slug = slugifyVendor(vendor.business_name);
    if (slug) return slug;
  }
  return vendor.id || '';
}
