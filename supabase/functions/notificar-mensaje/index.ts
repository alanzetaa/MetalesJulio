// Edge Function de Supabase: avisa por mail cuando alguien recibe un mensaje
// nuevo en la Comunidad Metales Julio.
//
// Se dispara desde un Database Webhook (Dashboard > Database > Webhooks) con
// evento "insert" sobre la tabla public.mensajes.
//
// Cómo desplegarla: Supabase Dashboard > Edge Functions > "New function",
// pegar este archivo tal cual (no hace falta la CLI de Supabase ni Node).
// Después hay que cargar el secret RESEND_API_KEY (Edge Functions > Settings
// de esta función). SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY ya los inyecta
// Supabase automáticamente en cualquier Edge Function, no hace falta cargarlos.
//
// Importante: sin verificar un dominio propio en Resend, solo se puede
// mandar mail a la casilla con la que te registraste en Resend (modo
// sandbox). Para mandarle a cualquier miembro hay que verificar un dominio
// (Resend > Domains) con un par de registros DNS.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const SITE_URL = "https://metalesjulio.vercel.app/";
const FROM_EMAIL = "Comunidad Metales Julio <onboarding@resend.dev>";

Deno.serve(async (req) => {
  const payload = await req.json();

  if(payload.type !== "INSERT" || payload.table !== "mensajes"){
    return new Response("ignorado", { status: 200 });
  }

  const mensaje = payload.record;
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const [{ data: destinatario }, { data: remitente }, { data: publicacion }] = await Promise.all([
    admin.auth.admin.getUserById(mensaje.destinatario_id),
    admin.from("profiles").select("nombre, apellido").eq("id", mensaje.remitente_id).maybeSingle(),
    admin.from("publicaciones").select("titulo").eq("id", mensaje.publicacion_id).maybeSingle()
  ]);

  const destinatarioEmail = destinatario?.user?.email;
  if(!destinatarioEmail){
    return new Response("sin email de destinatario", { status: 200 });
  }

  const nombreRemitente = [remitente?.nombre, remitente?.apellido].filter(Boolean).join(" ") || "Alguien de la comunidad";
  const tituloPublicacion = publicacion?.titulo || "tu publicación";

  const html = `
    <p>Tenés un mensaje nuevo de <strong>${nombreRemitente}</strong> sobre tu publicación
    "<strong>${tituloPublicacion}</strong>" en la Comunidad Metales Julio.</p>
    <p style="color:#555;">"${mensaje.cuerpo}"</p>
    <p><a href="${SITE_URL}" style="color:#b3986a;">Entrá a la comunidad para responder</a></p>
  `;

  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: destinatarioEmail,
      subject: `Nuevo mensaje de ${nombreRemitente} en Comunidad Metales Julio`,
      html: html
    })
  });

  if(!resendRes.ok){
    const detalle = await resendRes.text();
    return new Response("error al mandar el mail: " + detalle, { status: 500 });
  }

  return new Response("ok", { status: 200 });
});
