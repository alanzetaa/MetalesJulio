import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "../../lib/supabaseClient";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import { Modal } from "../ui/Modal";
import { newPasswordSchema, type NewPasswordFormValues } from "./authSchemas";

/**
 * Se abre automáticamente cuando Supabase dispara PASSWORD_RECOVERY (ver
 * AuthContext). Sin botón de cerrar, a propósito: hay que completar el
 * cambio de contraseña para seguir.
 */
export function NewPasswordModal() {
  const { showToast } = useToast();
  const { enRecuperacion, setEnRecuperacion } = useAuth();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NewPasswordFormValues>({ resolver: zodResolver(newPasswordSchema) });

  async function onSubmit(values: NewPasswordFormValues) {
    const { error } = await supabase.auth.updateUser({ password: values.password1 });
    if (error) {
      showToast(error.message);
      return;
    }
    reset();
    setEnRecuperacion(false);
    if (window.location.hash) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    showToast("Contraseña actualizada.");
  }

  return (
    <Modal open={enRecuperacion} title="Nueva contraseña" blocking>
      <form onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
        <p className="hint" style={{ marginTop: 0 }}>
          Ingresá tu nueva contraseña para volver a entrar.
        </p>
        <div className="form-row">
          <div className="field">
            <label htmlFor="npPassword1">Nueva contraseña</label>
            <input
              id="npPassword1"
              type="password"
              autoComplete="new-password"
              placeholder="Mínimo 6 caracteres"
              {...register("password1")}
            />
            {errors.password1 && <p className="field-error">{errors.password1.message}</p>}
          </div>
        </div>
        <div className="form-row">
          <div className="field">
            <label htmlFor="npPassword2">Repetir contraseña</label>
            <input
              id="npPassword2"
              type="password"
              autoComplete="new-password"
              placeholder="Repetí la contraseña"
              {...register("password2")}
            />
            {errors.password2 && <p className="field-error">{errors.password2.message}</p>}
          </div>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-dark" disabled={isSubmitting}>
            Guardar contraseña
          </button>
        </div>
      </form>
    </Modal>
  );
}
