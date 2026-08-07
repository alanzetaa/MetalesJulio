import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useNominatimSearch } from "../hooks/useNominatimSearch";
import { extraerCiudad, formatCiudadSugerencia, formatUbicacionSugerencia, type NominatimResult } from "../utils/ubicacion";
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
      ciudad: "",
      ubicacion: "",
      descripcion: "",
      paisCelular: PAIS_TELEFONO_DEFAULT,
      celular: "",
      notificarMensajes: true,
      terminosAceptados: false,
    },
  });

  const [provincia, setProvincia] = useState<string | null>(null);
  // Nombre de la ciudad "pelado" (sin la provincia sumada al texto), para
  // acotar la búsqueda de la dirección exacta a esa ciudad puntual --
  // ver elegirSugerenciaCiudad más abajo.
  const [ciudadBase, setCiudadBase] = useState("");
  const [ciudadValidada, setCiudadValidada] = useState(false);
  const [ciudadSuggOpen, setCiudadSuggOpen] = useState(false);
  const [ubicacionValidada, setUbicacionValidada] = useState(false);
  const [suggOpen, setSuggOpen] = useState(false);
  const [terminosModalOpen, setTerminosModalOpen] = useState(false);
  const ciudadValue = watch("ciudad") ?? "";
  const ubicacionValue = watch("ubicacion") ?? "";
  const ciudadInvalida = ciudadValue.trim() !== "" && !ciudadValidada;
  const ubicacionInvalida = ubicacionValue.trim() !== "" && !ubicacionValidada;
  const cuitValue = watch("cuit") ?? "";
  const cuitValido = cuitValue.trim() !== "" && esCuitValido(cuitValue);
  const paisCelularValue = watch("paisCelular") ?? PAIS_TELEFONO_DEFAULT;
  const paisCelular = PAISES_TELEFONO.find((p) => p.code === paisCelularValue) ?? PAISES_TELEFONO[0];
  const descripcionValue = watch("descripcion") ?? "";
  const { suggestions: ciudadSuggestions, loading: ciudadLoading } = useNominatimSearch(
    ciudadSuggOpen ? ciudadValue : ""
  );
  // Acota la búsqueda de la dirección exacta a la ciudad ya elegida (pedido
  // explícito: si elegiste "Ciudad de Mendoza", no tiene sentido que
  // sugiera direcciones de otra provincia).
  const ubicacionQuery =
    suggOpen && ubicacionValue.trim() ? (ciudadBase ? `${ubicacionValue}, ${ciudadBase}` : ubicacionValue) : "";
  const { suggestions, loading } = useNominatimSearch(ubicacionQuery);

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
      ciudad: profile.ciudad ?? "",
      ubicacion: profile.ubicacion ?? "",
      descripcion: profile.descripcion ?? "",
      paisCelular: paisCode,
      celular: numeroLocal,
      notificarMensajes: profile.notificar_mensajes,
      terminosAceptados: profile.terminos_version_aceptada === TERMINOS_VERSION_ACTUAL,
    });
    setProvincia(profile.provincia ?? null);
    // Si ya tenía ciudad guardada de antes, no hace falta que la vuelva a
    // elegir de la lista para poder guardar otros cambios del perfil.
    setCiudadValidada(Boolean(profile.ciudad));
    setCiudadBase((profile.ciudad ?? "").split(",")[0].trim());
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

  function elegirSugerenciaCiudad(s: NominatimResult) {
    setValue("ciudad", formatCiudadSugerencia(s));
    setCiudadBase(extraerCiudad(s) || s.display_name);
    setProvincia(s.address?.state ?? null);
    setCiudadValidada(true);
    setCiudadSuggOpen(false);
    // Si ya había una dirección exacta cargada, la borramos: quedaría
    // asociada a la ciudad vieja, y ahora la búsqueda de dirección se acota
    // a la ciudad recién elegida.
    setValue("ubicacion", "");
    setUbicacionValidada(false);
  }

  function elegirSugerencia(s: NominatimResult) {
    setValue("ubicacion", formatUbicacionSugerencia(s));
    setUbicacionValidada(true);
    setSuggOpen(false);
  }

  async function onSubmit(values: PerfilFormValues) {
    if (!session) return;
    if (!ciudadValidada) {
      showToast("Elegí tu ciudad de la lista de sugerencias para que quede estandarizada.");
      return;
    }
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
      ciudad: values.ciudad,
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
              <label htmlFor="pfCuit">CUIT</label>
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
              <label htmlFor="pfCiudad">Ciudad *</label>
              <div
                className={
                  "dir-wrap" + (ciudadValidada ? " validado" : ciudadInvalida && !ciudadLoading ? " invalido" : "")
                }
              >
                <input
                  id="pfCiudad"
                  autoComplete="off"
                  placeholder="Empezá a escribir tu ciudad"
                  {...register("ciudad", {
                    onChange: () => {
                      setCiudadValidada(false);
                      setCiudadSuggOpen(true);
                    },
                  })}
                  onBlur={() => setTimeout(() => setCiudadSuggOpen(false), 180)}
                />
                <span className="dir-status">
                  {ciudadLoading ? "⏳" : ciudadValidada ? "✓" : ciudadInvalida ? "✗" : ""}
                </span>
                {ciudadSuggOpen && ciudadValue.trim().length >= 3 && (
                  <div className="dir-sugg">
                    {ciudadSuggestions.length === 0 ? (
                      <div className="dir-sugg-item dir-sugg-empty">Sin resultados — seguí escribiendo</div>
                    ) : (
                      ciudadSuggestions.map((s, i) => (
                        <button
                          type="button"
                          key={i}
                          className="dir-sugg-item"
                          onMouseDown={() => elegirSugerenciaCiudad(s)}
                        >
                          {formatCiudadSugerencia(s)}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              {errors.ciudad && <p className="field-error">{errors.ciudad.message}</p>}
            </div>
          </div>
          <div className="form-row">
            <div className="field">
              <label htmlFor="pfUbicacion">Dirección exacta</label>
              <div
                className={
                  "dir-wrap" + (ubicacionValidada ? " validado" : ubicacionInvalida && !loading ? " invalido" : "")
                }
              >
                <input
                  id="pfUbicacion"
                  autoComplete="off"
                  placeholder="Calle y altura, si querés ser más específico"
                  {...register("ubicacion", {
                    onChange: () => {
                      setUbicacionValidada(false);
                      setSuggOpen(true);
                    },
                  })}
                  onBlur={() => setTimeout(() => setSuggOpen(false), 180)}
                />
                <span className="dir-status">
                  {loading ? "⏳" : ubicacionValidada ? "✓" : ubicacionInvalida ? "✗" : ""}
                </span>
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
              <p className="hint">Este dato es privado, solo lo ves vos.</p>
            </div>
          </div>
          <div className="form-row">
            <div className="field">
              <label htmlFor="pfDescripcion">Contanos sobre vos (Así aparecerá la descripción de tu perfil)</label>
              <textarea
                id="pfDescripcion"
                rows={3}
                maxLength={300}
                placeholder="Tu experiencia y especialidad general"
                {...register("descripcion")}
              />
              <p className="hint">{descripcionValue.length}/300 caracteres</p>
              {errors.descripcion && <p className="field-error">{errors.descripcion.message}</p>}
            </div>
          </div>
          <div className="form-row">
            <div className="field">
              <label htmlFor="pfCelular">Celular</label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <img
                  src={`https://flagcdn.com/24x18/${paisCelular.code.toLowerCase()}.png`}
                  srcSet={`https://flagcdn.com/48x36/${paisCelular.code.toLowerCase()}.png 2x`}
                  width={24}
                  height={18}
                  alt=""
                  style={{ borderRadius: 2, flexShrink: 0, display: "block" }}
                />
                <select
                  id="pfPaisCelular"
                  aria-label="País"
                  title={paisCelular.nombre}
                  style={{ flex: "0 0 auto", width: 70 }}
                  {...register("paisCelular")}
                >
                  {PAISES_TELEFONO.map((p) => (
                    <option key={p.code} value={p.code} title={p.nombre}>
                      +{p.dial}
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
