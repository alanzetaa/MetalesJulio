export interface NominatimAddress {
  road?: string;
  pedestrian?: string;
  house_number?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  suburb?: string;
  city_district?: string;
  county?: string;
  state?: string;
}

export interface NominatimResult {
  display_name: string;
  address?: NominatimAddress;
}

/** Arma un texto legible (calle+altura, localidad, provincia) a partir de una sugerencia de Nominatim. */
export function formatUbicacionSugerencia(d: NominatimResult): string {
  const a = d.address ?? {};
  const calle = a.road ?? a.pedestrian ?? "";
  const numero = a.house_number ?? "";
  const localidad = a.city ?? a.town ?? a.village ?? a.municipality ?? a.suburb ?? a.city_district ?? "";
  const provincia = a.state ?? "";

  const partes: string[] = [];
  if (calle) partes.push(calle + (numero ? ` ${numero}` : ""));
  if (localidad) partes.push(localidad);
  if (provincia && provincia !== localidad) partes.push(provincia);

  return partes.length ? partes.join(", ") : d.display_name;
}

/**
 * Nombre de provincia que usa Nominatim para la Ciudad Autónoma de Buenos
 * Aires. A diferencia del resto de las provincias, CABA no está dividida en
 * ciudades/localidades separadas -- pero según qué límite administrativo de
 * OpenStreetMap haya matcheado para una dirección puntual, el campo "city"
 * a veces vuelve "Buenos Aires" y otras veces "Ciudad Autónoma de Buenos
 * Aires" para el mismo lugar real. Se fuerza siempre a este mismo texto
 * cuando la provincia es CABA, para que perfiles distintos no queden con
 * nombres de ciudad distintos por esta inconsistencia de origen.
 */
const CABA_ESTADO = "Ciudad Autónoma de Buenos Aires";

/**
 * Solo la ciudad/localidad (sin calle ni provincia) -- se usa para el
 * campo "Ciudad" del perfil, que fuerza a elegir una sugerencia de
 * Nominatim en vez de dejar tipear texto libre, así todos los perfiles
 * quedan con el mismo nombre para el mismo lugar (antes se veía "CABA" en
 * un perfil y "Ciudad Autónoma de Buenos Aires" en otro).
 */
export function extraerCiudad(d: NominatimResult): string {
  const a = d.address ?? {};
  if (a.state === CABA_ESTADO) return CABA_ESTADO;
  return a.city ?? a.town ?? a.village ?? a.municipality ?? a.suburb ?? a.city_district ?? a.county ?? "";
}

/** "Ciudad, Provincia" a partir de una sugerencia -- lo que se guarda como
 * texto del campo Ciudad del perfil (mismo patrón de "varias partes juntas
 * en un string" que ya usa formatUbicacionSugerencia para la dirección). */
export function formatCiudadSugerencia(d: NominatimResult): string {
  const ciudad = extraerCiudad(d);
  const provincia = d.address?.state ?? "";
  if (!ciudad) return d.display_name;
  if (!provincia || provincia === ciudad) return ciudad;
  return `${ciudad}, ${provincia}`;
}
