export interface PaisTelefono {
  code: string;
  nombre: string;
  bandera: string;
  dial: string;
  /** Solo Argentina: los celulares llevan un "9" entre el código de país y
   * el código de área en el formato internacional (así funcionan los links
   * de WhatsApp) -- ningún otro país de la lista tiene esta regla. */
  nueveParaMovil?: boolean;
}

// Argentina primero (precargado por default) + resto de Sudamérica, para
// cubrir a alguien que tenga un celular de otro país (pedido explícito del
// dueño).
export const PAISES_TELEFONO: PaisTelefono[] = [
  { code: "AR", nombre: "Argentina", bandera: "🇦🇷", dial: "54", nueveParaMovil: true },
  { code: "BO", nombre: "Bolivia", bandera: "🇧🇴", dial: "591" },
  { code: "BR", nombre: "Brasil", bandera: "🇧🇷", dial: "55" },
  { code: "CL", nombre: "Chile", bandera: "🇨🇱", dial: "56" },
  { code: "CO", nombre: "Colombia", bandera: "🇨🇴", dial: "57" },
  { code: "EC", nombre: "Ecuador", bandera: "🇪🇨", dial: "593" },
  { code: "PY", nombre: "Paraguay", bandera: "🇵🇾", dial: "595" },
  { code: "PE", nombre: "Perú", bandera: "🇵🇪", dial: "51" },
  { code: "UY", nombre: "Uruguay", bandera: "🇺🇾", dial: "598" },
  { code: "VE", nombre: "Venezuela", bandera: "🇻🇪", dial: "58" },
];

export const PAIS_TELEFONO_DEFAULT = "AR";
