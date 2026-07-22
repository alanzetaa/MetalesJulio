import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "../ui/Modal";
import { supabase, FOTOS_BUCKET } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { CATEGORIES } from "../../constants/categories";
import { MAX_FOTOS, MAX_FOTO_BYTES, buildFotoPath } from "../../utils/publicaciones";
import type { TipoPublicacion } from "../../lib/database.types";
import { publicacionSchema, type PublicacionFormValues } from "./publicacionSchema";

interface NuevaPublicacionModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function NuevaPublicacionModal({ open, onClose, onCreated }: NuevaPublicacionModalProps) {
  const { session } = useAuth();
  const { showToast } = useToast();
  const [tipo, setTipo] = useState<TipoPublicacion>("ofrezco");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [subiendo, setSubiendo] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PublicacionFormValues>({
    resolver: zodResolver(publicacionSchema),
    defaultValues: { titulo: "", categoria: "", descripcion: "" },
  });

  function handleClose() {
    reset({ titulo: "", categoria: "", descripcion: "" });
    setTipo("ofrezco");
    setFiles([]);
    setPreviews([]);
    onClose();
  }

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const elegidos = Array.from(e.target.files ?? []).slice(0, MAX_FOTOS);
    if ((e.target.files?.length ?? 0) > MAX_FOTOS) {
      showToast(`Máximo ${MAX_FOTOS} fotos — se van a usar las primeras ${MAX_FOTOS}.`);
    }
    setFiles(elegidos);
    setPreviews(elegidos.map((f) => URL.createObjectURL(f)));
  }

  async function onSubmit(values: PublicacionFormValues) {
    if (!session) return;
    if (files.some((f) => f.size > MAX_FOTO_BYTES)) {
      showToast("Cada foto no puede pesar más de 5MB.");
      return;
    }

    setSubiendo(true);
    let fotoPaths: string[] = [];
    if (files.length) {
      const uploads = await Promise.all(
        files.map(async (file) => {
          const path = buildFotoPath(session.user.id, file.name);
          const res = await supabase.storage.from(FOTOS_BUCKET).upload(path, file);
          return { res, path };
        })
      );
      const fallo = uploads.find((u) => u.res.error);
      if (fallo?.res.error) {
        setSubiendo(false);
        showToast(`Error al subir una foto: ${fallo.res.error.message}`);
        return;
      }
      fotoPaths = uploads.map((u) => u.path);
    }

    const { error } = await supabase.from("publicaciones").insert({
      user_id: session.user.id,
      titulo: values.titulo,
      categoria: values.categoria,
      descripcion: values.descripcion || null,
      tipo,
      foto_paths: fotoPaths,
    });
    setSubiendo(false);
    if (error) {
      showToast(`Error al publicar: ${error.message}`);
      return;
    }
    showToast("¡Publicación creada!");
    handleClose();
    onCreated();
  }

  return (
    <Modal open={open} onClose={handleClose} title="Nueva publicación" maxWidth={460}>
      <form onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
        <div className="form-row">
          <div className="field">
            <label>¿Qué es esta publicación? *</label>
            <div className="tipo-toggle">
              <button
                type="button"
                className={"tipo-toggle-btn" + (tipo === "ofrezco" ? " active" : "")}
                onClick={() => setTipo("ofrezco")}
              >
                Ofrezco
              </button>
              <button
                type="button"
                className={"tipo-toggle-btn" + (tipo === "busco" ? " active" : "")}
                onClick={() => setTipo("busco")}
              >
                Busco
              </button>
            </div>
            <p className="hint">
              "Ofrezco" si vos hacés el trabajo/artesanía; "Busco" si necesitás que alguien te lo haga o te lo
              venda.
            </p>
          </div>
        </div>
        <div className="form-row">
          <div className="field">
            <label htmlFor="pubTitulo">Título *</label>
            <input id="pubTitulo" placeholder="Ej: Rejas de hierro a medida" {...register("titulo")} />
            {errors.titulo && <p className="field-error">{errors.titulo.message}</p>}
          </div>
        </div>
        <div className="form-row">
          <div className="field">
            <label htmlFor="pubCategoria">Rubro *</label>
            <select id="pubCategoria" {...register("categoria")}>
              <option value="">Elegí un rubro</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {errors.categoria && <p className="field-error">{errors.categoria.message}</p>}
          </div>
        </div>
        <div className="form-row">
          <div className="field">
            <label htmlFor="pubDescripcion">Descripción</label>
            <textarea
              id="pubDescripcion"
              rows={3}
              placeholder="Contá los detalles de este trabajo o artesanía"
              {...register("descripcion")}
            />
          </div>
        </div>
        <div className="form-row">
          <div className="field">
            <label htmlFor="pubFoto">Fotos (opcional, hasta {MAX_FOTOS})</label>
            <input id="pubFoto" type="file" accept="image/*" multiple onChange={handleFotoChange} />
            <p className="hint">
              Fotos del trabajo o artesanía. Máximo {MAX_FOTOS}, 5MB cada una.
            </p>
            <div className="pub-foto-preview-row">
              {previews.map((src) => (
                <img key={src} src={src} alt="" />
              ))}
            </div>
          </div>
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-outline-dark" onClick={handleClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-dark" disabled={subiendo}>
            Publicar
          </button>
        </div>
      </form>
    </Modal>
  );
}
