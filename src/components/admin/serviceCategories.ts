export const DEFAULT_SERVICE_CATEGORIES = [
  { value: "pedicure",  label: "Pedicure"   },
  { value: "manicure",  label: "Manicure"   },
  { value: "wig_making",label: "Wig Making" },
  { value: "wig_revamp",label: "Wig Revamp" },
  { value: "makeup",    label: "Makeup"     },
  { value: "braiding",  label: "Braiding"   },
  { value: "styling",   label: "Styling"    },
  { value: "hair_care", label: "Hair Care"  },
] as const;

/** @deprecated Use DEFAULT_SERVICE_CATEGORIES instead */
export const SERVICE_CATEGORY_OPTIONS = DEFAULT_SERVICE_CATEGORIES;

export type ServiceCategory = (typeof DEFAULT_SERVICE_CATEGORIES)[number]["value"];
