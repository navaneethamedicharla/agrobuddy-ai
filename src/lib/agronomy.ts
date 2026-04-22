// Rule-based crop recommendation engine. No NPK values.

export type Season = "Kharif" | "Rabi" | "Zaid";
export type SoilType = "Loamy" | "Clay" | "Sandy" | "Black" | "Red";
export type Water = "Low" | "Medium" | "High";

export interface CropRule {
  name: string;
  emoji: string;
  seasons: Season[];
  soils: SoilType[];
  water: Water[];
  regions: string[]; // matched as substrings (case-insensitive). "*" matches all.
  notes: string;
}

const RULES: CropRule[] = [
  { name: "Rice (Paddy)", emoji: "🌾", seasons: ["Kharif"], soils: ["Clay", "Loamy"], water: ["High"], regions: ["*"], notes: "Thrives in flooded fields with clayey soil." },
  { name: "Wheat", emoji: "🌾", seasons: ["Rabi"], soils: ["Loamy", "Clay"], water: ["Medium"], regions: ["*"], notes: "Cool-weather grain; well-drained loam preferred." },
  { name: "Maize", emoji: "🌽", seasons: ["Kharif", "Zaid"], soils: ["Loamy", "Sandy", "Red"], water: ["Medium"], regions: ["*"], notes: "Adaptable cereal; needs moderate water." },
  { name: "Cotton", emoji: "☁️", seasons: ["Kharif"], soils: ["Black", "Loamy"], water: ["Medium"], regions: ["*"], notes: "Black soil retains moisture ideal for cotton." },
  { name: "Sugarcane", emoji: "🎋", seasons: ["Kharif", "Zaid"], soils: ["Loamy", "Black"], water: ["High"], regions: ["*"], notes: "Long-duration crop; needs continuous irrigation." },
  { name: "Soybean", emoji: "🫘", seasons: ["Kharif"], soils: ["Black", "Loamy"], water: ["Medium"], regions: ["*"], notes: "Legume — also fixes nitrogen in soil." },
  { name: "Groundnut", emoji: "🥜", seasons: ["Kharif", "Rabi"], soils: ["Sandy", "Red", "Loamy"], water: ["Low", "Medium"], regions: ["*"], notes: "Sandy loam ideal for pod development." },
  { name: "Bajra (Pearl Millet)", emoji: "🌾", seasons: ["Kharif"], soils: ["Sandy", "Red"], water: ["Low"], regions: ["*"], notes: "Drought-tolerant; great for arid regions." },
  { name: "Jowar (Sorghum)", emoji: "🌾", seasons: ["Kharif", "Rabi"], soils: ["Black", "Red", "Loamy"], water: ["Low", "Medium"], regions: ["*"], notes: "Hardy cereal; tolerates dry conditions." },
  { name: "Mustard", emoji: "🌼", seasons: ["Rabi"], soils: ["Loamy", "Sandy"], water: ["Low", "Medium"], regions: ["*"], notes: "Cool-season oilseed; needs little water." },
  { name: "Chickpea (Gram)", emoji: "🫛", seasons: ["Rabi"], soils: ["Loamy", "Black", "Sandy"], water: ["Low"], regions: ["*"], notes: "Pulse crop; thrives on residual moisture." },
  { name: "Tomato", emoji: "🍅", seasons: ["Kharif", "Rabi", "Zaid"], soils: ["Loamy", "Red", "Sandy"], water: ["Medium", "High"], regions: ["*"], notes: "Vegetable suited to warm weather and well-drained soil." },
  { name: "Onion", emoji: "🧅", seasons: ["Rabi", "Kharif"], soils: ["Loamy", "Sandy"], water: ["Medium"], regions: ["*"], notes: "Bulb crop; requires good drainage." },
  { name: "Potato", emoji: "🥔", seasons: ["Rabi"], soils: ["Loamy", "Sandy"], water: ["Medium"], regions: ["*"], notes: "Cool-season tuber; loose soil for tuber formation." },
  { name: "Watermelon", emoji: "🍉", seasons: ["Zaid"], soils: ["Sandy", "Loamy"], water: ["Medium"], regions: ["*"], notes: "Summer crop; sandy soil with moderate watering." },
  { name: "Mungbean (Moong)", emoji: "🫛", seasons: ["Zaid", "Kharif"], soils: ["Loamy", "Sandy"], water: ["Low"], regions: ["*"], notes: "Short-duration pulse; great for catch crop." },
];

export interface CropMatch { crop: CropRule; score: number; }

export function recommendCrops(input: { region: string; season: Season; soil: SoilType; water: Water }): CropMatch[] {
  const region = input.region.toLowerCase().trim();
  const matches = RULES.map((c) => {
    let score = 0;
    if (c.seasons.includes(input.season)) score += 3;
    if (c.soils.includes(input.soil)) score += 3;
    if (c.water.includes(input.water)) score += 2;
    if (c.regions.includes("*") || c.regions.some((r) => region.includes(r.toLowerCase()))) score += 1;
    return { crop: c, score };
  })
  .filter((m) => m.score >= 6)
  .sort((a, b) => b.score - a.score);
  return matches.slice(0, 6);
}

// FERTILIZER ENGINE
export type GrowthStage = "Seedling" | "Vegetative" | "Flowering" | "Fruiting";
export type FarmingType = "Organic" | "Chemical";

export interface FertilizerAdvice {
  fertilizer: string;
  method: string;
  frequency: string;
  notes: string;
}

const ORGANIC: Record<GrowthStage, FertilizerAdvice[]> = {
  Seedling: [
    { fertilizer: "Vermicompost", method: "Soil mix at base", frequency: "Once at sowing", notes: "Boosts microbial activity and root growth." },
    { fertilizer: "Cow dung compost", method: "Mix into topsoil", frequency: "Once before sowing", notes: "Slow-release nutrient supply." },
  ],
  Vegetative: [
    { fertilizer: "Jeevamrutham (liquid manure)", method: "Drip / drench", frequency: "Every 15 days", notes: "Stimulates leaf and stem growth." },
    { fertilizer: "Neem cake", method: "Soil application", frequency: "Once a month", notes: "Also helps deter soil pests." },
  ],
  Flowering: [
    { fertilizer: "Panchagavya", method: "Foliar spray", frequency: "Every 10 days", notes: "Improves flowering and fruit set." },
    { fertilizer: "Banana peel compost tea", method: "Drench", frequency: "Weekly", notes: "Rich in potassium for flowering." },
  ],
  Fruiting: [
    { fertilizer: "Wood ash", method: "Light topdress", frequency: "Every 15 days", notes: "Supports fruit quality and ripening." },
    { fertilizer: "Compost tea", method: "Foliar spray", frequency: "Weekly", notes: "Maintains plant vigor through fruiting." },
  ],
};

const CHEMICAL: Record<GrowthStage, FertilizerAdvice[]> = {
  Seedling: [
    { fertilizer: "DAP (starter dose)", method: "Soil application near root zone", frequency: "Once at sowing", notes: "Encourages early root development." },
  ],
  Vegetative: [
    { fertilizer: "Urea", method: "Topdress + light irrigation", frequency: "Every 20–25 days", notes: "Promotes leafy growth. Apply sparingly." },
    { fertilizer: "Micronutrient mix", method: "Foliar spray", frequency: "Every 15 days", notes: "Corrects deficiencies in iron, zinc, etc." },
  ],
  Flowering: [
    { fertilizer: "MOP (Muriate of Potash)", method: "Soil application", frequency: "Once at flower initiation", notes: "Supports flower development." },
    { fertilizer: "Boron spray", method: "Foliar spray", frequency: "Once at bud stage", notes: "Improves pollination and fruit set." },
  ],
  Fruiting: [
    { fertilizer: "Potassium nitrate", method: "Drip / foliar", frequency: "Every 10–15 days", notes: "Enhances fruit size and quality." },
    { fertilizer: "Calcium nitrate", method: "Drip irrigation", frequency: "Every 15 days", notes: "Prevents blossom-end rot in fruits." },
  ],
};

export function recommendFertilizer(input: { crop: string; soil: SoilType; stage: GrowthStage; type: FarmingType }): { primary: FertilizerAdvice[]; tips: string[] } {
  const advice = input.type === "Organic" ? ORGANIC[input.stage] : CHEMICAL[input.stage];
  const tips: string[] = [];
  if (input.soil === "Sandy") tips.push("Sandy soil drains fast — apply fertilizers in smaller, more frequent doses.");
  if (input.soil === "Clay") tips.push("Clay soil holds water — avoid waterlogging when applying liquid fertilizers.");
  if (input.soil === "Black") tips.push("Black soil retains moisture well; reduce irrigation after fertilizer application.");
  if (input.soil === "Red") tips.push("Red soil benefits from added organic matter to improve nutrient holding.");
  if (input.soil === "Loamy") tips.push("Loamy soil is ideal — most fertilizer regimes will work effectively.");
  if (input.type === "Organic") tips.push("Combine with crop rotation and green manure for best long-term soil health.");
  if (input.type === "Chemical") tips.push("Always follow label dosages; over-application damages soil and crops.");
  return { primary: advice, tips };
}
