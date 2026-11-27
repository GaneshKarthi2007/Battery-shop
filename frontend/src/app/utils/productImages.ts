export const FALLBACK_BATTERY_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">
      <rect width="120" height="120" rx="16" fill="#F1F5F9"/>
      <rect x="28" y="34" width="14" height="8" rx="2" fill="#334155"/>
      <rect x="78" y="34" width="14" height="8" rx="2" fill="#334155"/>
      <rect x="20" y="42" width="80" height="52" rx="8" fill="#1E293B"/>
      <rect x="26" y="48" width="68" height="40" rx="4" fill="#0F172A"/>
      <path d="M62 54L52 68h9l-3 14 12-16h-9l1-12z" fill="#38BDF8"/>
    </svg>`
  );

const BRAND_IMAGE_MAP: Record<string, { car: string; inverter: string; default: string }> = {
  exide: {
    car: "https://rukminim3.flixcart.com/image/480/480/xif0q/vehicle-battery/b/o/k/12-exidexltz6-6-exide-original-imahh5ymvzbjqfyb.jpeg",
    inverter: "https://4.imimg.com/data4/KP/IY/GLADMIN-178989/exide-inverter-batteries-500x500.jpg",
    default: "https://rukminim3.flixcart.com/image/480/480/xif0q/vehicle-battery/b/o/k/12-exidexltz6-6-exide-original-imahh5ymvzbjqfyb.jpeg",
  },
  amaron: {
    car: "https://rukminim3.flixcart.com/image/328/328/xif0q/vehicle-battery/b/x/f/12-b-am-z4l-4-amron-original-imahq86gaea9frhb.jpeg",
    inverter: "https://5.imimg.com/data5/SELLER/Default/2024/2/391773277/RP/CE/WX/44555943/amaron-heavy-duty-battery-500x500.jpeg",
    default: "https://rukminim3.flixcart.com/image/328/328/xif0q/vehicle-battery/b/x/f/12-b-am-z4l-4-amron-original-imahq86gaea9frhb.jpeg",
  },
  luminous: {
    car: "https://5.imimg.com/data5/JR/DF/MY-1980226/luminous-inverter-500x500.jpg",
    inverter: "https://rukminim3.flixcart.com/image/480/640/xif0q/solar-battery/r/k/e/lptt12150l-luminous-12-enriched-0-original-imagmfngjgbg4c8x.jpeg",
    default: "https://rukminim3.flixcart.com/image/480/640/xif0q/solar-battery/r/k/e/lptt12150l-luminous-12-enriched-0-original-imagmfngjgbg4c8x.jpeg",
  },
  livguard: {
    car: "https://rukminim3.flixcart.com/image/480/640/xif0q/inverter-battery/5/g/k/28-lithium-x-1500-0-livguard-100-original-imahh23ynzmzfzrj.jpeg",
    inverter: "https://rukminim3.flixcart.com/image/480/640/xif0q/inverter-battery/5/g/k/28-lithium-x-1500-0-livguard-100-original-imahh23ynzmzfzrj.jpeg",
    default: "https://rukminim3.flixcart.com/image/480/640/xif0q/inverter-battery/5/g/k/28-lithium-x-1500-0-livguard-100-original-imahh23ynzmzfzrj.jpeg",
  },
  okaya: {
    car: "https://5.imimg.com/data5/SELLER/Default/2022/9/DY/KS/MI/81577079/okaya-opht18060-solar-battery-500x500.jpg",
    inverter: "https://rukminim3.flixcart.com/image/480/640/xif0q/inverter-battery/g/t/u/60-9-optt22060-atsw-1175-sine-wave-10-okaya-original-imahc9u2hfqm2muz.jpeg",
    default: "https://5.imimg.com/data5/SELLER/Default/2022/9/DY/KS/MI/81577079/okaya-opht18060-solar-battery-500x500.jpg",
  },
  "sf sonic": {
    car: "https://5.imimg.com/data5/EY/BK/MY-3336932/sf-sonic-car-batteries-500x500.jpg",
    inverter: "https://rukminim3.flixcart.com/image/328/328/xif0q/vehicle-battery/p/c/1/12-sf-48s-tza7b-7-sf-sonic-original-imahqhn9za5yrdkf.jpeg",
    default: "https://5.imimg.com/data5/EY/BK/MY-3336932/sf-sonic-car-batteries-500x500.jpg",
  },
  microtek: {
    car: "https://upload.wikimedia.org/wikipedia/commons/f/f9/Power_inverter.jpg",
    inverter: "https://upload.wikimedia.org/wikipedia/commons/f/f9/Power_inverter.jpg",
    default: "https://upload.wikimedia.org/wikipedia/commons/f/f9/Power_inverter.jpg",
  },
};

const GENERIC_CAR_IMAGE =
  "https://upload.wikimedia.org/wikipedia/commons/4/4c/Car_battery.jpg";
const GENERIC_INVERTER_IMAGE =
  "https://upload.wikimedia.org/wikipedia/commons/4/44/Inverter_battery-_for_desktop.jpg";

/**
 * Resolve an external internet product image URL based on product brand (and type).
 */
export function getBrandProductImage(brand?: string, type?: string): string {
  const normalizedBrand = (brand || "").trim().toLowerCase();
  const normalizedType = (type || "").trim().toLowerCase();
  const isInverter = normalizedType.includes("invert") || normalizedType.includes("ups") || normalizedType.includes("solar");
  const isCar = normalizedType.includes("car") || normalizedType.includes("bike") || normalizedType.includes("auto");

  for (const [key, urls] of Object.entries(BRAND_IMAGE_MAP)) {
    if (normalizedBrand.includes(key) || (key === "sf sonic" && normalizedBrand.includes("sfsonic"))) {
      if (isInverter) return urls.inverter;
      if (isCar) return urls.car;
      return urls.default;
    }
  }

  return isInverter ? GENERIC_INVERTER_IMAGE : GENERIC_CAR_IMAGE;
}
