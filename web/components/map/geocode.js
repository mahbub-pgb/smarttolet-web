// Map a Google geocoder result's address_components onto our location fields.
const pick = (components, type) =>
  components.find((c) => c.types.includes(type))?.long_name || '';

const stripSuffix = (s, suffix) => s.replace(new RegExp(`\\s*${suffix}$`, 'i'), '').trim();

export function extractLocation(result) {
  if (!result) return {};
  const c = result.address_components || [];
  const division = stripSuffix(pick(c, 'administrative_area_level_1'), 'Division');
  const district = stripSuffix(pick(c, 'administrative_area_level_2'), 'District');
  const upazila = pick(c, 'administrative_area_level_3');
  const area =
    pick(c, 'sublocality_level_1') ||
    pick(c, 'sublocality') ||
    pick(c, 'locality') ||
    pick(c, 'neighborhood');
  const road = pick(c, 'route');
  const houseNumber = pick(c, 'street_number');

  const out = { formattedAddress: result.formatted_address || '' };
  if (division) out.division = division;
  if (district) out.district = district;
  if (upazila) out.upazila = upazila;
  if (area) out.area = area;
  if (road) out.road = road;
  if (houseNumber) out.houseNumber = houseNumber;
  return out;
}
