import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "../../lib/supabaseClient";
import { useToast } from "../../context/ToastContext";
import { Modal } from "../ui/Modal";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "./authSchemas";

const APP_URL = window.location.origin + window.location.pathname;

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ForgotPasswordModal({ open, onClose }: Props) {
  const { showToast } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(values: ForgotPasswordFormValues) {
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, { redirectTo: APP_URL });
    if (error) {
      showToast(error.message);
      return;
    }
    reset();
    onClose();
    showToast("Revisá tu email para restablecer la contraseña.");
  }

  return (
    <Modal open={open} onClose={onClose} title="Recuperar contraseña">
      <form onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
        <p className="hint" style={{ marginTop: 0 }}>
          Escribí tu email y te mandamos un enlace para crear una nueva contraseña.
        </p>
        <div className="form-row">
          <div className="field">
            <label htmlFor="fpEmail">Email</label>
            <input id="fpEmail" type="email" autoComplete="username" {...register("email")} />
            {errors.email && <p className="field-error">{errors.email.message}</p>}
          </div>
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-outline-dark" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-dark" disabled={isSubmitting}>
            Enviar enlace
          </button>
        </div>
      </form>
    </Modal>
  );
}
