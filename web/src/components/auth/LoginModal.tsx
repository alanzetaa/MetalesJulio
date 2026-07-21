import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "../../lib/supabaseClient";
import { useToast } from "../../context/ToastContext";
import { Modal } from "../ui/Modal";
import { PassField } from "../ui/PassField";
import { loginSchema, type LoginFormValues } from "./authSchemas";

const APP_URL = window.location.origin + window.location.pathname;

export function loginConGoogle() {
  void supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: APP_URL } });
}

interface Props {
  open: boolean;
  onClose: () => void;
  onForgotPassword: () => void;
}

export function LoginModal({ open, onClose, onForgotPassword }: Props) {
  const { showToast } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginFormValues) {
    const { error } = await supabase.auth.signInWithPassword(values);
    if (error) {
      showToast(error.message);
      return;
    }
    reset();
  }

  return (
    <Modal open={open} onClose={onClose} title="Ingresar">
      <button
        type="button"
        className="btn btn-dark"
        style={{ width: "100%", justifyContent: "center", marginBottom: 16 }}
        onClick={loginConGoogle}
      >
        Continuar con Google
      </button>
      <p className="divider-or">o ingresá con tu email</p>
      <form onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
        <div className="form-row">
          <div className="field">
            <label htmlFor="liEmail">Email</label>
            <input id="liEmail" type="email" autoComplete="username" {...register("email")} />
            {errors.email && <p className="field-error">{errors.email.message}</p>}
          </div>
        </div>
        <div className="form-row">
          <div className="field">
            <label htmlFor="liPassword">Contraseña</label>
            <PassField id="liPassword" autoComplete="current-password" {...register("password")} />
            {errors.password && <p className="field-error">{errors.password.message}</p>}
          </div>
        </div>
        <div style={{ textAlign: "right", margin: "-8px 0 4px" }}>
          <button type="button" className="link-btn" onClick={onForgotPassword}>
            ¿Olvidaste tu contraseña?
          </button>
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-outline-dark" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-dark" disabled={isSubmitting}>
            Ingresar
          </button>
        </div>
      </form>
    </Modal>
  );
}
