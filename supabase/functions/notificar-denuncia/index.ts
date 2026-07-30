// Edge Function de Supabase: avisa por mail a TODOS los súper admins cuando
// alguien denuncia a otro miembro en la Comunidad Metales Julio.
//
// Se dispara desde un Database Webhook (Dashboard > Database > Webhooks) con
// evento "insert" sobre la tabla public.denuncias.
//
// Cómo desplegarla: Supabase Dashboard > Edge Functions > "New function",
// pegar este archivo tal cual (no hace falta la CLI de Supabase ni Node).
// Usa el mismo secret RESEND_API_KEY que ya carga notificar-mensaje (no
// hace falta cargarlo de nuevo). SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY
// ya los inyecta Supabase automáticamente en cualquier Edge Function.
//
// Importante: sin verificar un dominio propio en Resend, solo se puede
// mandar mail a la casilla con la que te registraste en Resend (modo
// sandbox) -- ver el mismo comentario en notificar-mensaje/index.ts.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const SITE_URL = "https://metalesjulio.vercel.app/";
const FROM_EMAIL = "Comunidad Metales Julio <onboarding@resend.dev>";

// Tiene que coincidir con MOTIVOS_DENUNCIA en web/src/constants/denuncias.ts.
const ETIQUETAS_MOTIVO: Record<string, string> = {
  estafa: "Estafa o intento de estafa",
  producto_no_coincide: "El producto/trabajo no coincide con lo publicado",
  lenguaje_inapropiado: "Lenguaje inapropiado o insultos",
  acoso: "Acoso o comportamiento intimidante",
  spam: "Spam o publicidad no relacionada",
  otro: "Otro",
};

Deno.serve(async (req) => {
  const payload = await req.json();

  if(payload.type !== "INSERT" || payload.table !== "denuncias"){
    return new Response("ignorado", { status: 200 });
  }

  const denuncia = payload.record;
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const [{ data: superAdmins }, { data: denunciante }, { data: denunciado }, { data: publicacion }] = await Promise.all([
    admin.from("super_admins").select("user_id"),
    admin.from("profiles").select("nombre, apellido").eq("id", denuncia.denunciante_id).maybeSingle(),
    admin.from("profiles").select("nombre, apellido").eq("id", denuncia.denunciado_id).maybeSingle(),
    admin.from("publicaciones").select("titulo").eq("id", denuncia.publicacion_id).maybeSingle()
  ]);

  if(!superAdmins || superAdmins.length === 0){
    return new Response("no hay super admins para avisar", { status: 200 });
  }

  const emails = (
    await Promise.all(
      superAdmins.map(async (sa) => {
        const { data } = await admin.auth.admin.getUserById(sa.user_id);
        return data?.user?.email ?? null;
      })
    )
  ).filter((email): email is string => Boolean(email));

  if(emails.length === 0){
    return new Response("sin emails de super admins", { status: 200 });
  }

  const nombreDenunciante = [denunciante?.nombre, denunciante?.apellido].filter(Boolean).join(" ") || "Alguien de la comunidad";
  const nombreDenunciado = [denunciado?.nombre, denunciado?.apellido].filter(Boolean).join(" ") || "Alguien de la comunidad";
  const tituloPublicacion = publicacion?.titulo || "una publicación";
  const motivoLabel = ETIQUETAS_MOTIVO[denuncia.motivo] || denuncia.motivo;

  const html = `
    <p><strong>${nombreDenunciante}</strong> denunció a <strong>${nombreDenunciado}</strong>
    sobre la publicación "<strong>${tituloPublicacion}</strong>" en la Comunidad Metales Julio.</p>
    <p><strong>Motivo:</strong> ${motivoLabel}</p>
    ${denuncia.comentario ? `<p style="color:#555;">"${denuncia.comentario}"</p>` : ""}
    <p><a href="${SITE_URL}" style="color:#b3986a;">Entrá a HQ Metales para ver el detalle</a></p>
  `;

  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: emails,
      subject: `Nueva denuncia en Comunidad Metales Julio: ${motivoLabel}`,
      html: html
    })
  });

  if(!resendRes.ok){
    const detalle = await resendRes.text();
    return new Response("error al mandar el mail: " + detalle, { status: 500 });
  }

  return new Response("ok", { status: 200 });
});
