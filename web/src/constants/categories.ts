/**
 * Orden alfabético (pedido de Bruno), con "Otros oficios" al final a
 * propósito: es el cajón de sastre y, si se ordenara estricto, quedaría en el
 * medio de la lista, donde nadie lo busca.
 *
 * Este array es la única fuente de verdad del orden: lo usan el desplegable de
 * rubro del buscador y los formularios de nueva/editar publicación.
 */
export const CATEGORIES = [
  "Carpintería metálica",
  "Escultura en metal",
  "Herramientas y afilado",
  "Herrería artística",
  "Joyería y bijouterie",
  "Rejas y portones",
  "Restauración de piezas",
  "Soldadura",
  "Torno y mecanizado",
  "Otros oficios",
] as const;

export type Categoria = (typeof CATEGORIES)[number];
