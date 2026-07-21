import { useState, type InputHTMLAttributes } from "react";

export function PassField(props: InputHTMLAttributes<HTMLInputElement>) {
  const [showing, setShowing] = useState(false);
  return (
    <div className="pass-field">
      <input {...props} type={showing ? "text" : "password"} />
      <button
        type="button"
        className="pass-toggle"
        title="Mostrar/ocultar contraseña"
        onClick={() => setShowing((s) => !s)}
      >
        {showing ? "🙈" : "👁"}
      </button>
    </div>
  );
}
