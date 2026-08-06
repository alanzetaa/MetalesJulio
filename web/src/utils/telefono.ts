import { PAISES_TELEFONO, PAIS_TELEFONO_DEFAULT, type PaisTelefono } from "../constants/paisesTelefono";

function paisPorCode(code: string): PaisTelefono {
  return PAISES_TELEFONO.find((p) => p.code === code) ?? PAISES_TELEFONO[0];
}

/**
 * Arma el número completo que se guarda en profiles.whatsapp: código de
 * país + (el "9" de Argentina si corresponde) + el número local, todo
 * junto en dígitos, sin +/espacios/guiones -- mismo formato que ya se
 * usaba antes de este selector (compatible con los links de WhatsApp que
 * arma el resto de la plataforma).
 */
export function armarNumeroCompleto(paisCode: string, numeroLocal: string): string {
  const pais = paisPorCode(paisCode);
  const soloDigitos = numeroLocal.replace(/[^0-9]/g, "");
  if (!soloDigitos) return "";
  return pais.dial + (pais.nueveParaMovil ? "9" : "") + soloDigitos;
}

/**
 * Inverso de armarNumeroCompleto, para precargar el formulario con un
 * número ya guardado: separa el código de país (probando primero
 * Argentina+9, que es una firma de 3 dígitos, antes que el resto para no
 * confundirla con otro país que empiece parecido) y devuelve el resto como
 * número local. Si no reconoce ningún código (por ejemplo, un número
 * viejo guardado antes de que existiera este selector), lo deja completo
 * como número local bajo Argentina por default, que es como se guardaba
 * antes.
 */
export function separarNumeroGuardado(whatsapp: string | null | undefined): { paisCode: string; numeroLocal: string } {
  const digitos = String(whatsapp ?? "").replace(/[^0-9]/g, "");
  if (!digitos) return { paisCode: PAIS_TELEFONO_DEFAULT, numeroLocal: "" };

  const argentina = paisPorCode("AR");
  if (digitos.startsWith(argentina.dial + "9")) {
    return { paisCode: "AR", numeroLocal: digitos.slice((argentina.dial + "9").length) };
  }

  // Resto de países, del código más largo al más corto para no cortar de
  // más (ej. Paraguay "595" antes que un posible "59" de otro país).
  const candidatos = PAISES_TELEFONO.filter((p) => p.code !== "AR").sort((a, b) => b.dial.length - a.dial.length);
  for (const pais of candidatos) {
    if (digitos.startsWith(pais.dial)) {
      return { paisCode: pais.code, numeroLocal: digitos.slice(pais.dial.length) };
    }
  }

  return { paisCode: PAIS_TELEFONO_DEFAULT, numeroLocal: digitos };
}
