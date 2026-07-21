import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "../../lib/supabaseClient";
import { useToast } from "../../context/ToastContext";
import { Modal } from "../ui/Modal";
import { PassField } from "../ui/PassField";
import { registerSchema, type RegisterFormValues } from "./authSchemas";
import { loginConGoogle } from "./LoginModal";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function RegisterModal({ open, onClose }: Props) {
  const { showToast } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterFormValues) {
    const { data, error } = await supabase.auth.signUp(values);
    if (error) {
      showToast(error.message);
      return;
    }
    if (!data.session) {
      showToast("Revisá tu email para confirmar la cuenta y después ingresá.");
      reset();
      onClose();
      return;
    }
    reset();
    onClose();
    showToast("¡Cuenta creada! Ahora completá tu perfil.");
  }

  return (
    <Modal open={open} onClose={onClose} title="Crear mi cuenta">
      <button
        type="button"
        className="btn btn-dark"
        style={{ width: "100%", justifyContent: "center", marginBottom: 16 }}
        onClick={loginConGoogle}
      >
        Continuar con Google
      </button>
      <p className="divider-or">o registrate con tu email</p>
      <form onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
        <div className="form-row">
          <div className="field">
            <label htmlFor="rEmail">Email *</label>
            <input id="rEmail" type="email" autoComplete="username" {...register("email")} />
            {errors.email && <p className="field-error">{errors.email.message}</p>}
          </div>
        </div>
        <div className="form-row">
          <div className="field">
            <label htmlFor="rPassword">Contraseña *</label>
            <PassField id="rPassword" autoComplete="new-password" {...register("password")} />
            {errors.password && <p className="field-error">{errors.password.message}</p>}
          </div>
        </div>
        <p className="hint">
          Después de crear tu cuenta vas a completar tu perfil (nombre, DNI, contacto) y vas a poder publicar
          tus trabajos.
        </p>
        <div className="form-actions">
          <button type="button" className="btn btn-outline-dark" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-dark" disabled={isSubmitting}>
            Crear mi cuenta
          </button>
        </div>
      </form>
    </Modal>
  );
}
