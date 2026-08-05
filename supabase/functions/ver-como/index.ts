// Edge Function de Supabase: genera una sesión temporal a nombre de otro
// usuario para que un súper admin pueda "ver como" esa persona ve la
// plataforma -- sin necesitar ni conocer su contraseña (pedido del dueño:
// poder entrar a un perfil para verificar un problema, sin usar una
// contraseña genérica compartida, que sería un riesgo de seguridad mucho
// mayor si se filtrara).
//
// Se invoca directo desde el cliente con supabase.functions.invoke() al
// apretar "Ver como" en la tabla de miembros de HQ Metales. Usa
// auth.admin.generateLink (requiere la service_role key, nunca vive en el
// cliente) para conseguir un hashed_token -- el cliente después lo canjea
// con supabase.auth.verifyOtp() y arma una sesión real de Supabase Auth a
// nombre del usuario destino. generateLink NO manda ningún mail (a
// diferencia de signInWithOtp), así que este paso es silencioso para la
// persona.
//
// Queda un registro en public.impersonaciones (quién entró a la cuenta de
// quién y cuándo) para transparencia -- pedido explícito del dueño.
//
// Cómo desplegarla: Supabase Dashboard > Edge Functions > "New function",
// pegar este archivo tal cual. No necesita ningún secret nuevo:
// SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY ya los inyecta Supabase
// automáticamente en cualquier Edge Function.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

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
  // cliente) -- mismo criterio que todas las funciones admin_* de la base.
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

  const { targetId } = await req.json();
  if (!targetId) {
    return new Response("falta targetId", { status: 400 });
  }
  if (targetId === userData.user.id) {
    return new Response("no podés ver como vos mismo", { status: 400 });
  }

  const { data: targetAuth, error: targetError } = await admin.auth.admin.getUserById(targetId);
  const targetEmail = targetAuth?.user?.email;
  if (targetError || !targetEmail) {
    return new Response("usuario no encontrado", { status: 404 });
  }

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: targetEmail,
  });

  if (linkError || !linkData?.properties?.hashed_token) {
    return new Response("no se pudo generar la sesión: " + (linkError?.message ?? ""), { status: 500 });
  }

  await admin.from("impersonaciones").insert({ admin_id: userData.user.id, target_id: targetId });

  return new Response(JSON.stringify({ email: targetEmail, hashedToken: linkData.properties.hashed_token }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
