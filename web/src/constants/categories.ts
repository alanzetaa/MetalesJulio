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
