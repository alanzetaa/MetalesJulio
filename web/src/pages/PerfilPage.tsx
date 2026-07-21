import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useNominatimSearch } from "../hooks/useNominatimSearch";
import { formatUbicacionSugerencia, type NominatimResult } from "../utils/ubicacion";
import { capitalizarNombre } from "../utils/format";
import { perfilSchema, type PerfilFormValues } from "../components/perfil/perfilSchema";

export function PerfilPage() {
  const { session, profile, refetchProfile } = useAuth();
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
      whatsapp: "",
      instagram: "",
      contactoEmail: "",
    },
  });

  const [provincia, setProvincia] = useState<string | null>(null);
  const [ubicacionValidada, setUbicacionValidada] = useState(false);
  const [suggOpen, setSuggOpen] = useState(false);
  const ubicacionValue = watch("ubicacion") ?? "";
  const { suggestions, loading } = useNominatimSearch(suggOpen ? ubicacionValue : "");

  useEffect(() => {
    if (!profile) return;
    reset({
      nombre: capitalizarNombre(profile.nombre),
      apellido: capitalizarNombre(profile.apellido),
      dni: profile.dni,
      cuit: profile.cuit ?? "",
      ubicacion: profile.ubicacion ?? "",
      descripcion: profile.descripcion ?? "",
      whatsapp: profile.whatsapp ?? "",
      instagram: profile.instagram ?? "",
      contactoEmail: profile.contacto_email ?? "",
    });
    setProvincia(profile.provincia ?? null);
  }, [profile, reset]);

  function elegirSugerencia(s: NominatimResult) {
    setValue("ubicacion", formatUbicacionSugerencia(s));
    setProvincia(s.address?.state ?? null);
    setUbicacionValidada(true);
    setSuggOpen(false);
  }

  async function onSubmit(values: PerfilFormValues) {
    if (!session) return;
    const whatsapp = values.whatsapp?.replace(/[^0-9]/g, "") ?? "";
    const instagram = values.instagram?.replace(/^@/, "") ?? "";
    const contactoEmail = values.contactoEmail?.trim() ?? "";

    if (!whatsapp && !instagram && !contactoEmail) {
      showToast("Dejá al menos un dato de contacto público.");
      return;
    }

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
      instagram: instagram || null,
      contacto_email: contactoEmail || null,
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
              <input id="pfCuit" placeholder="Ej: 20-30123456-7" {...register("cuit")} />
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
          <div className="form-row form-row-2">
            <div className="field">
              <label htmlFor="pfWhatsapp">WhatsApp público (con código de país)</label>
              <input id="pfWhatsapp" placeholder="Ej: 5491122334455" {...register("whatsapp")} />
            </div>
            <div className="field">
              <label htmlFor="pfInstagram">Instagram público</label>
              <input id="pfInstagram" placeholder="Ej: @mi.taller" {...register("instagram")} />
            </div>
          </div>
          <div className="form-row">
            <div className="field">
              <label htmlFor="pfContactoEmail">Email público de contacto (opcional)</label>
              <input
                id="pfContactoEmail"
                type="email"
                placeholder="contacto@tuemail.com"
                {...register("contactoEmail")}
              />
            </div>
          </div>
          <p className="hint">
            * Campos obligatorios. Dejá al menos un dato de contacto público (WhatsApp, Instagram o email).
          </p>
          <div className="form-actions">
            <button type="submit" className="btn btn-dark" disabled={isSubmitting}>
              Guardar perfil
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
