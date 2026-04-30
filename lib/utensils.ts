export type UtensilCategory = "Besar" | "Sedang" | "Kecil";

export type Utensil = {
  jenis: string;
  kategori: UtensilCategory;
  ukuran: string;
  /** typical capacity / volume hint to help Gemini reason about portions */
  capacityHint?: string;
};

export type UtensilGroup = "sendok" | "piring" | "gelas" | "tambahan";

export type UtensilData = Record<UtensilGroup, Utensil[]>;

export const GROUP_LABEL: Record<UtensilGroup, string> = {
  sendok: "Sendok",
  piring: "Piring",
  gelas: "Gelas",
  tambahan: "Tambahan",
};

export const UTENSILS: UtensilData = {
  sendok: [
    {
      jenis: "Sendok Makan (Dinner Spoon)",
      kategori: "Besar",
      ukuran: "18–21 cm",
      capacityHint: "~15 ml per sendok",
    },
    {
      jenis: "Sendok Sup (Soup Spoon)",
      kategori: "Besar",
      ukuran: "17–19 cm",
      capacityHint: "~15 ml per sendok",
    },
    {
      jenis: "Sendok Teh (Tea Spoon)",
      kategori: "Sedang",
      ukuran: "13–15 cm",
      capacityHint: "~5 ml per sendok",
    },
    {
      jenis: "Sendok Kopi (Coffee Spoon)",
      kategori: "Kecil",
      ukuran: "11–12 cm",
      capacityHint: "~2.5 ml per sendok",
    },
  ],
  piring: [
    {
      jenis: "Piring Makan (Dinner Plate)",
      kategori: "Besar",
      ukuran: "25–30 cm",
    },
    {
      jenis: "Piring Salad (Appetizer Plate)",
      kategori: "Sedang",
      ukuran: "20–22 cm",
    },
    {
      jenis: "Piring Roti (B&B Plate)",
      kategori: "Kecil",
      ukuran: "15–17 cm",
    },
  ],
  gelas: [
    {
      jenis: "Gelas Air (Water Goblet)",
      kategori: "Besar",
      ukuran: "300–400 ml",
    },
    {
      jenis: "Gelas Jus (Highball)",
      kategori: "Sedang",
      ukuran: "240–350 ml",
    },
    {
      jenis: "Gelas Espresso",
      kategori: "Kecil",
      ukuran: "60–90 ml",
    },
  ],
  tambahan: [
    {
      jenis: "Sendok Sayur (Ladle)",
      kategori: "Besar",
      ukuran: "20–25 cm",
      capacityHint: "~80–120 ml per centong",
    },
    {
      jenis: "Centong Nasi",
      kategori: "Sedang",
      ukuran: "20 cm",
      capacityHint: "~70–100 g nasi per centong",
    },
    {
      jenis: "Mangkuk Sup",
      kategori: "Sedang",
      ukuran: "15–18 cm",
      capacityHint: "~250–400 ml volume",
    },
  ],
};

/**
 * Render the utensils table as a compact reference block for Gemini.
 * Output is plain text grouped by section.
 */
export function utensilsForPrompt(): string {
  const lines: string[] = [];
  for (const [group, items] of Object.entries(UTENSILS) as [
    UtensilGroup,
    Utensil[]
  ][]) {
    lines.push(`# ${GROUP_LABEL[group]}`);
    for (const u of items) {
      const cap = u.capacityHint ? `, ${u.capacityHint}` : "";
      lines.push(`- ${u.jenis} — ${u.kategori}, ${u.ukuran}${cap}`);
    }
  }
  return lines.join("\n");
}
