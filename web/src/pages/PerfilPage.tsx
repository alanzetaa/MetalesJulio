import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useNominatimSearch } from "../hooks/useNominatimSearch";
import { formatUbicacionSugerencia, type NominatimResult } from "../utils/ubicacion";
import { esCuitValido } from "../utils/cuit";
import { capitalizarNombre, formatFecha } from "../utils/format";
import { contieneInsulto } from "../utils/moderacion";
import { nombreApellidoDesdeGoogle } from "../utils/googleProfile";
import { armarNumeroCompleto, separarNumeroGuardado } from "../utils/telefono";
import { PAISES_TELEFONO, PAIS_TELEFONO_DEFAULT } from "../constants/paisesTelefono";
import { perfilSchema, type PerfilFormValues } from "../components/perfil/perfilSchema";
import { TerminosModal } from "../components/perfil/TerminosModal";
import { TERMINOS_VERSION_ACTUAL } from "../constants/terminos";

export function PerfilPage() {
  const { session, profile, loadingProfile, refetchProfile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PerfilFormValues>({
    resolver: zodResolver(perfilSchema),
    defaultValues: {
      nombre: "",
      apellido: "",
      dni: "",
      cuit: "",
      ubicacion: "",
      descripcion: "",
      paisCelular: PAIS_TELEFONO_DEFAULT,
      celular: "",
      notificarMensajes: true,
      terminosAceptados: false,
    },
  });

  const [provincia, setProvincia] = useState<string | null>(null);
  const [ubicacionValidada, setUbicacionValidada] = useState(false);
  const [suggOpen, setSuggOpen] = useState(false);
  const [terminosModalOpen, setTerminosModalOpen] = useState(false);
  const ubicacionValue = watch("ubicacion") ?? "";
  const cuitValue = watch("cuit") ?? "";
  const cuitValido = cuitValue.trim() !== "" && esCuitValido(cuitValue);
  const paisCelularValue = watch("paisCelular") ?? PAIS_TELEFONO_DEFAULT;
  const paisCelular = PAISES_TELEFONO.find((p) => p.code === paisCelularValue) ?? PAISES_TELEFONO[0];
  const { suggestions, loading } = useNominatimSearch(suggOpen ? ubicacionValue : "");

  // Una vez aceptados, los Términos y Condiciones quedan bloqueados (no se
  // puede "desaceptar") — pedido explícito del dueño, regla importante. Si
  // en el futuro se sube TERMINOS_VERSION_ACTUAL, esto vuelve a false solo
  // (ver reglas.md, "Términos y Condiciones").
  const yaAceptoVersionActual = profile?.terminos_version_aceptada === TERMINOS_VERSION_ACTUAL;

  useEffect(() => {
    if (!profile) return;
    const { paisCode, numeroLocal } = separarNumeroGuardado(profile.whatsapp);
    reset({
      nombre: capitalizarNombre(profile.nombre),
      apellido: capitalizarNombre(profile.apellido),
      dni: profile.dni,
      cuit: profile.cuit ?? "",
      ubicacion: profile.ubicacion ?? "",
      descripcion: profile.descripcion ?? "",
      paisCelular: paisCode,
      celular: numeroLocal,
      notificarMensajes: profile.notificar_mensajes,
      terminosAceptados: profile.terminos_version_aceptada === TERMINOS_VERSION_ACTUAL,
    });
    setProvincia(profile.provincia ?? null);
  }, [profile, reset]);

  // Primera vez completando el perfil (todavía no existe la fila en
  // profiles): si entró con Google, precarga nombre/apellido con lo que
  // Google ya nos dio, en vez de dejar el campo en blanco -- sigue siendo
  // editable antes de guardar.
  useEffect(() => {
    if (loadingProfile || profile || !session) return;
    const { nombre, apellido } = nombreApellidoDesdeGoogle(session);
    if (nombre) setValue("nombre", nombre);
    if (apellido) setValue("apellido", apellido);
  }, [session, profile, loadingProfile, setValue]);

  function elegirSugerencia(s: NominatimResult) {
    setValue("ubicacion", formatUbicacionSugerencia(s));
    setProvincia(s.address?.state ?? null);
    setUbicacionValidada(true);
    setSuggOpen(false);
  }

  async function onSubmit(values: PerfilFormValues) {
    if (!session) return;
    if (contieneInsulto(values.descripcion)) {
      showToast("La descripción contiene lenguaje que no está permitido.");
      return;
    }
    const whatsapp = values.celular ? armarNumeroCompleto(values.paisCelular, values.celular) : "";

    const wasComplete = Boolean(profile);
    const { error } = await supabase.from("profiles").upsert({
      id: session.user.id,
      nombre: capitalizarNombre(values.nombre),
      apellido: capitalizarNombre(values.apellido),
      dni: values.dni,
      cuit: values.cuit || null,
      email: session.user.email ?? "",
      ubicacion: values.ubicacion || null,
      provincia: provincia ?? profile?.provincia ?? null,
      descripcion: values.descripcion || null,
      whatsapp: whatsapp || null,
      // Instagram y el email de contacto alternativo ya no se piden en el
      // formulario (pedido explícito del dueño: el email de la cuenta ya es
      // el único dato de mail que hace falta) -- se preserva lo que ya
      // hubiera guardado antes, en vez de borrarlo, para no perder datos
      // viejos sin que nadie lo haya pedido.
      instagram: profile?.instagram ?? null,
      contacto_email: profile?.contacto_email ?? null,
      notificar_mensajes: values.notificarMensajes,
      terminos_version_aceptada: TERMINOS_VERSION_ACTUAL,
      terminos_aceptados_at: new Date().toISOString(),
    });

    if (error) {
      showToast(`Error al guardar: ${error.message}`);
      return;
    }

    await refetchProfile();
    if (!wasComplete) {
      showToast("¡Perfil completo! Ahora podés crear tu primera publicación.");
      navigate("/publicaciones");
    } else {
      showToast("Tu perfil se guardó correctamente.");
    }
  }

  return (
    <div className="app-content-inner">
      <section className="app-section">
        <div className="app-section-head">
          <h2>{profile ? "Mi perfil" : "Completá tu perfil"}</h2>
          <p>Estos son tus datos de identidad y contacto dentro de la comunidad.</p>
        </div>
        <form onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
          <div className="form-row form-row-2">
            <div className="field">
              <label htmlFor="pfNombre">Nombre *</label>
              <input id="pfNombre" {...register("nombre")} />
              {errors.nombre && <p className="field-error">{errors.nombre.message}</p>}
            </div>
            <div className="field">
              <label htmlFor="pfApellido">Apellido *</label>
              <input id="pfApellido" {...register("apellido")} />
              {errors.apellido && <p className="field-error">{errors.apellido.message}</p>}
            </div>
          </div>
          <div className="form-row form-row-2">
            <div className="field">
              <label htmlFor="pfDni">DNI *</label>
              <input id="pfDni" inputMode="numeric" placeholder="Ej: 30123456" {...register("dni")} />
              {errors.dni && <p className="field-error">{errors.dni.message}</p>}
            </div>
            <div className="field">
              <label htmlFor="pfCuit">CUIT (opcional)</label>
              <div className={"check-wrap" + (cuitValido ? " validado" : "")}>
                <input id="pfCuit" placeholder="Ej: 20-30123456-7" {...register("cuit")} />
                {cuitValido && <span className="check-status">✓</span>}
              </div>
              {errors.cuit && <p className="field-error">{errors.cuit.message}</p>}
            </div>
          </div>
          <p className="hint" style={{ marginTop: -8, marginBottom: 16 }}>
            Tu DNI y CUIT son privados: solo se usan para verificar tu identidad y nunca se muestran
            públicamente.
          </p>
          <div className="form-row">
            <div className="field">
              <label htmlFor="pfUbicacion">Ubicación</label>
              <div className={"dir-wrap" + (ubicacionValidada ? " validado" : "")}>
                <input
                  id="pfUbicacion"
                  autoComplete="off"
                  placeholder="Empezá a escribir tu localidad o dirección"
                  {...register("ubicacion", {
                    onChange: () => {
                      setUbicacionValidada(false);
                      setSuggOpen(true);
                    },
                  })}
                  onBlur={() => setTimeout(() => setSuggOpen(false), 180)}
                />
                <span className="dir-status">{loading ? "⏳" : ubicacionValidada ? "✓" : ""}</span>
                {suggOpen && ubicacionValue.trim().length >= 3 && (
                  <div className="dir-sugg">
                    {suggestions.length === 0 ? (
                      <div className="dir-sugg-item dir-sugg-empty">Sin resultados — seguí escribiendo</div>
                    ) : (
                      suggestions.map((s, i) => (
                        <button
                          type="button"
                          key={i}
                          className="dir-sugg-item"
                          onMouseDown={() => elegirSugerencia(s)}
                        >
                          {formatUbicacionSugerencia(s)}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              <p className="hint">Elegí una opción de la lista para que quede verificada.</p>
              {provincia && <p className="hint">Provincia: {provincia}</p>}
            </div>
          </div>
          <div className="form-row">
            <div className="field">
              <label htmlFor="pfDescripcion">Contanos sobre vos</label>
              <textarea
                id="pfDescripcion"
                rows={3}
                placeholder="Tu experiencia y especialidad general"
                {...register("descripcion")}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="field">
              <label htmlFor="pfCelular">Celular (opcional)</label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span aria-hidden="true" style={{ fontSize: 20, lineHeight: 1 }}>
                  {paisCelular.bandera}
                </span>
                <select
                  id="pfPaisCelular"
                  aria-label="País"
                  style={{ flex: "0 0 auto", width: 130 }}
                  {...register("paisCelular")}
                >
                  {PAISES_TELEFONO.map((p) => (
                    <option key={p.code} value={p.code}>
                      +{p.dial} {p.nombre}
                    </option>
                  ))}
                </select>
                <input
                  id="pfCelular"
                  inputMode="numeric"
                  placeholder="Ej: 11 2233-4455"
                  style={{ flex: 1 }}
                  {...register("celular")}
                />
              </div>
              <p className="hint">
                Sin el 0 ni el 15 — solo el código de área y tu número. Para Argentina, agregamos el 9 que
                pide WhatsApp automáticamente.
              </p>
            </div>
          </div>
          <div className="form-row" style={{ marginTop: 20 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, fontWeight: 600 }}>
              <input type="checkbox" {...register("notificarMensajes")} style={{ width: 18, height: 18 }} />
              Avisarme por mail cuando reciba un mensaje nuevo
            </label>
          </div>
          <div className="form-row" style={{ marginTop: 12 }}>
            <div>
              {yaAceptoVersionActual ? (
                <label
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--color-muted)",
                  }}
                >
                  <input type="checkbox" checked disabled style={{ width: 18, height: 18, marginTop: 2 }} />
                  <span>
                    Aceptaste los{" "}
                    <button
                      type="button"
                      className="link-btn"
                      onClick={() => setTerminosModalOpen(true)}
                      style={{ fontWeight: 700 }}
                    >
                      Términos y Condiciones
                    </button>{" "}
                    el {formatFecha(profile?.terminos_aceptados_at)}. No se puede deshacer.
                  </span>
                </label>
              ) : (
                <label style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    {...register("terminosAceptados")}
                    style={{ width: 18, height: 18, marginTop: 2 }}
                  />
                  <span>
                    Acepto los{" "}
                    <button
                      type="button"
                      className="link-btn"
                      onClick={() => setTerminosModalOpen(true)}
                      style={{ fontWeight: 700 }}
                    >
                      Términos y Condiciones
                    </button>{" "}
                    *
                  </span>
                </label>
              )}
              {errors.terminosAceptados && <p className="field-error">{errors.terminosAceptados.message}</p>}
            </div>
          </div>
          <p className="hint">* Campos obligatorios.</p>
          <div className="form-actions">
            <button type="submit" className="btn btn-dark" disabled={isSubmitting}>
              Guardar perfil
            </button>
          </div>
          <TerminosModal open={terminosModalOpen} onClose={() => setTerminosModalOpen(false)} />
        </form>
      </section>
    </div>
  );
}
