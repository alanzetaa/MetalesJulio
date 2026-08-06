import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "../ui/Modal";
import { supabase } from "../../lib/supabaseClient";
import { useToast } from "../../context/ToastContext";
import { CATEGORIES } from "../../constants/categories";
import { contieneInsulto } from "../../utils/moderacion";
import { capitalizarOracion } from "../../utils/format";
import { puedeEditarPublicacion } from "../../utils/publicaciones";
import type { TipoPublicacion } from "../../lib/database.types";
import { publicacionSchema, type PublicacionFormValues } from "./publicacionSchema";
import type { MisPublicacionItem } from "./MisPublicacionCard";

interface EditarPublicacionModalProps {
  /** null = modal cerrado */
  item: MisPublicacionItem | null;
  onClose: () => void;
  onUpdated: () => void;
}

/**
 * Editar título/rubro/descripción/tipo de una publicación propia -- solo
 * dentro de los primeros 20 minutos de creada (pedido explícito del dueño,
 * ver puedeEditarPublicacion). Las fotos se editan aparte (agregar/quitar
 * desde MisPublicacionCard), sin ese límite de tiempo.
 */
export function EditarPublicacionModal({ item, onClose, onUpdated }: EditarPublicacionModalProps) {
  const { showToast } = useToast();
  const [tipo, setTipo] = useState<TipoPublicacion>("ofrezco");
  const [guardando, setGuardando] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PublicacionFormValues>({
    resolver: zodResolver(publicacionSchema),
    defaultValues: { titulo: "", categoria: "", descripcion: "" },
  });

  // Cada vez que se abre el modal con una publicación distinta, precarga
  // el formulario con sus datos actuales.
  useEffect(() => {
    if (!item) return;
    reset({ titulo: item.titulo, categoria: item.categoria, descripcion: item.descripcion ?? "" });
    setTipo(item.tipo);
  }, [item, reset]);

  async function onSubmit(values: PublicacionFormValues) {
    if (!item) return;
    if (!puedeEditarPublicacion(item.created_at)) {
      showToast("Ya pasaron los 20 minutos: esta publicación ya no se puede editar.");
      onClose();
      return;
    }
    if (contieneInsulto(values.titulo) || contieneInsulto(values.descripcion)) {
      showToast("El título o la descripción contienen lenguaje que no está permitido.");
      return;
    }

    setGuardando(true);
    const { error } = await supabase
      .from("publicaciones")
      .update({
        titulo: capitalizarOracion(values.titulo),
        categoria: values.categoria,
        descripcion: values.descripcion ? capitalizarOracion(values.descripcion) : null,
        tipo,
      })
      .eq("id", item.id);
    setGuardando(false);
    if (error) {
      showToast(
        error.message.indexOf("20 minutos") !== -1
          ? "Ya pasaron los 20 minutos: esta publicación ya no se puede editar."
          : `Error al guardar: ${error.message}`
      );
      return;
    }
    showToast("Publicación actualizada.");
    onClose();
    onUpdated();
  }

  return (
    <Modal open={Boolean(item)} onClose={onClose} title="Editar publicación" maxWidth={460}>
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
          </div>
        </div>
        <div className="form-row">
          <div className="field">
            <label htmlFor="editPubTitulo">Título *</label>
            <input id="editPubTitulo" {...register("titulo")} />
            {errors.titulo && <p className="field-error">{errors.titulo.message}</p>}
          </div>
        </div>
        <div className="form-row">
          <div className="field">
            <label htmlFor="editPubCategoria">Rubro *</label>
            <select id="editPubCategoria" {...register("categoria")}>
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
            <label htmlFor="editPubDescripcion">Descripción</label>
            <textarea id="editPubDescripcion" rows={3} {...register("descripcion")} />
          </div>
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-outline-dark" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-dark" disabled={guardando}>
            Guardar cambios
          </button>
        </div>
      </form>
    </Modal>
  );
}
