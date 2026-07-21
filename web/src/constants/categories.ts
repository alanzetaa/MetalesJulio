export const CATEGORIES = [
  "Soldadura",
  "Herrería artística",
  "Rejas y portones",
  "Carpintería metálica",
  "Torno y mecanizado",
  "Joyería y bijouterie",
  "Escultura en metal",
  "Restauración de piezas",
  "Herramientas y afilado",
  "Otros oficios",
] as const;

export type Categoria = (typeof CATEGORIES)[number];

export const CATEGORY_COLORS: Record<string, string> = {
  Soldadura: "#e07a5f",
  "Herrería artística": "#3d5a80",
  "Rejas y portones": "#588157",
  "Carpintería metálica": "#e9c46a",
  "Torno y mecanizado": "#9d4edd",
  "Joyería y bijouterie": "#f4a261",
  "Escultura en metal": "#2a9d8f",
  "Restauración de piezas": "#ee6c4d",
  "Herramientas y afilado": "#4895ef",
  "Otros oficios": "#6b6b6b",
};
