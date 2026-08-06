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
// El dominio comunidadmetalesjulio.com.ar ya está verificado en Resend
// (DNS delegado a Cloudflare, ver reglas.md) -- FROM_EMAIL puede mandarle a
// cualquier miembro, ya no está limitado al modo sandbox de Resend.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const SITE_URL = "https://metalesjulio.vercel.app/";
const FROM_EMAIL = "Comunidad Metales Julio <notificaciones@comunidadmetalesjulio.com.ar>";

// Ventana de agrupado, en minutos -- ver reglas.md ("Resend tiene DOS
// topes..."): con el plan gratis de Resend (100 mails/día) una comunidad
// chica ya lo pisaba fácil. Antes se agrupaba solo dentro de la MISMA
// conversación (mismo remitente+destinatario+publicación); ahora se agrupa
// por DESTINATARIO nomás, sin importar quién le escribió ni sobre qué
// publicación -- si ya le avisamos hace menos de VENTANA_MIN que tiene algo
// nuevo, no se manda otro mail aunque sea de otra persona/publicación
// distinta (igual lo ve todo adentro de la plataforma). Por eso el mail deja
// de nombrar a quién escribió: un solo mail puede representar mensajes de
// varias personas distintas.
const VENTANA_MIN = 15;

Deno.serve(async (req) => {
  const payload = await req.json();

  if(payload.type !== "INSERT" || payload.table !== "mensajes"){
    return new Response("ignorado", { status: 200 });
  }

  const mensaje = payload.record;
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const [{ data: destinatario }, { data: destinatarioPerfil }] = await Promise.all([
    admin.auth.admin.getUserById(mensaje.destinatario_id),
    admin.from("profiles").select("notificar_mensajes").eq("id", mensaje.destinatario_id).maybeSingle()
  ]);

  // La persona destinataria puede haber destildado "Avisarme por mail cuando
  // reciba un mensaje" en Mi perfil (tildado por default) -- si es así, no
  // se manda mail (el mensaje se sigue viendo igual adentro de la plataforma).
  if(destinatarioPerfil?.notificar_mensajes === false){
    return new Response("destinatario desactivó las notificaciones por mail", { status: 200 });
  }

  const destinatarioEmail = destinatario?.user?.email;
  if(!destinatarioEmail){
    return new Response("sin email de destinatario", { status: 200 });
  }

  const ventanaAntes = new Date(new Date(mensaje.created_at).getTime() - VENTANA_MIN * 60 * 1000).toISOString();
  const { count: mensajesRecientes } = await admin
    .from("mensajes")
    .select("id", { count: "exact", head: true })
    .eq("destinatario_id", mensaje.destinatario_id)
    .neq("id", mensaje.id)
    .gte("created_at", ventanaAntes)
    .lt("created_at", mensaje.created_at);

  if((mensajesRecientes ?? 0) > 0){
    return new Response("ya se avisó hace poco a este destinatario", { status: 200 });
  }

  // Genérico a propósito: este mail puede representar mensajes de más de una
  // persona/publicación distinta (ver VENTANA_MIN más arriba), así que no
  // conviene nombrar a nadie en particular -- manda directo a la plataforma
  // a revisar.
  const html = `
    <p>Tenés mensajes nuevos en la Comunidad Metales Julio.</p>
    <p><a href="${SITE_URL}" style="color:#b3986a;">Entrá a la comunidad para leerlos</a></p>
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
      subject: "Tenés mensajes nuevos en Comunidad Metales Julio",
      html: html
    })
  });

  if(!resendRes.ok){
    const detalle = await resendRes.text();
    return new Response("error al mandar el mail: " + detalle, { status: 500 });
  }

  return new Response("ok", { status: 200 });
});
