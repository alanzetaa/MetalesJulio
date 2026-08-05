// Edge Function de Supabase: le manda un mail a quien hizo una denuncia,
// con un mensaje escrito a mano por un súper admin desde HQ Metales
// (botón "Mensaje" en la tabla de Denuncias, ver reglas.md).
//
// A diferencia de notificar-mensaje/notificar-denuncia (que se disparan
// solas desde un Database Webhook en un insert), esta la invoca el cliente
// directo con supabase.functions.invoke() cuando el admin aprieta "Enviar".
//
// Cómo desplegarla: Supabase Dashboard > Edge Functions > "New function",
// pegar este archivo tal cual. Usa el mismo secret RESEND_API_KEY que ya
// cargan notificar-mensaje/notificar-denuncia (no hace falta cargarlo de
// nuevo). SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY ya los inyecta Supabase
// automáticamente en cualquier Edge Function.
//
// El dominio comunidadmetalesjulio.com.ar ya está verificado en Resend
// (DNS delegado a Cloudflare, ver reglas.md), así que se puede mandar desde
// una casilla nueva del mismo dominio (soporte@) sin configuración extra.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const FROM_EMAIL = "Comunidad Metales Julio - Soporte <soporte@comunidadmetalesjulio.com.ar>";

function escapeHtml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("método no permitido", { status: 405 });
  }

  const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer /i, "");
  if (!jwt) {
    return new Response("sin sesión", { status: 401 });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Se verifica que quien llama sea de verdad un súper admin del lado del
  // servidor (con la service_role key, no confiando en nada que mande el
  // cliente) -- mismo criterio que todas las funciones admin_* de la base,
  // que están gateadas por es_super_admin().
  const { data: userData, error: userError } = await admin.auth.getUser(jwt);
  if (userError || !userData?.user) {
    return new Response("sesión inválida", { status: 401 });
  }

  const { data: superAdminRow } = await admin
    .from("super_admins")
    .select("user_id")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (!superAdminRow) {
    return new Response("no autorizado", { status: 403 });
  }

  const { denunciaId, mensaje } = await req.json();
  if (!denunciaId || typeof mensaje !== "string" || !mensaje.trim()) {
    return new Response("faltan datos", { status: 400 });
  }

  const { data: denuncia } = await admin
    .from("denuncias")
    .select("denunciante_id, publicacion_id")
    .eq("id", denunciaId)
    .maybeSingle();

  if (!denuncia) {
    return new Response("denuncia no encontrada", { status: 404 });
  }

  const [{ data: denuncianteAuth }, { data: publicacion }] = await Promise.all([
    admin.auth.admin.getUserById(denuncia.denunciante_id),
    admin.from("publicaciones").select("titulo").eq("id", denuncia.publicacion_id).maybeSingle(),
  ]);

  const destinatarioEmail = denuncianteAuth?.user?.email;
  if (!destinatarioEmail) {
    return new Response("sin email del denunciante", { status: 404 });
  }

  const tituloPublicacion = publicacion?.titulo || "una publicación";
  const mensajeHtml = escapeHtml(mensaje.trim()).replace(/\n/g, "<br>");

  const html = `
    <p>Hola, te escribimos desde la Comunidad Metales Julio por la denuncia que hiciste
    sobre la publicación "<strong>${escapeHtml(tituloPublicacion)}</strong>".</p>
    <p style="white-space:pre-wrap;">${mensajeHtml}</p>
    <p style="color:#888;font-size:12.5px;">Este mail es solo informativo, no hace falta que lo respondas
    -- si necesitás agregar algo más, podés escribirnos por mensaje dentro de la plataforma.</p>
  `;

  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [destinatarioEmail],
      subject: "Sobre tu denuncia en Comunidad Metales Julio",
      html,
    }),
  });

  if (!resendRes.ok) {
    const detalle = await resendRes.text();
    return new Response("error al mandar el mail: " + detalle, { status: 500 });
  }

  return new Response("ok", { status: 200 });
});
