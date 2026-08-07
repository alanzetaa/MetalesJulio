// Tipos escritos a mano a partir de supabase-schema.sql (no generados con la
// CLI de Supabase). Si se cambia el esquema, hay que actualizar este archivo
// a mano también.
//
// Importante: estos tipos se declaran con "type", no "interface" -- con
// "interface" la inferencia genérica de @supabase/supabase-js para
// .insert()/.upsert()/.update() se rompe (el tipo esperado colapsa a
// "never"), un comportamiento conocido de TypeScript con conditional types
// sobre interfaces declaradas por nombre. Verificado con una reproducción
// mínima antes de escribir el resto del archivo así.

export type TipoPublicacion = "ofrezco" | "busco";
export type MedioContacto = "whatsapp" | "instagram" | "email";

export type ProfileRow = {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  cuit: string | null;
  email: string;
  ubicacion: string | null;
  ciudad: string | null;
  provincia: string | null;
  descripcion: string | null;
  whatsapp: string | null;
  instagram: string | null;
  contacto_email: string | null;
  suspendido_hasta: string | null;
  notificar_mensajes: boolean;
  terminos_version_aceptada: number;
  terminos_aceptados_at: string | null;
  ultima_actividad: string | null;
  created_at: string;
};
export type ProfileInsert = Omit<
  ProfileRow,
  | "created_at"
  | "suspendido_hasta"
  | "notificar_mensajes"
  | "terminos_version_aceptada"
  | "terminos_aceptados_at"
  | "ultima_actividad"
> & {
  created_at?: string;
  suspendido_hasta?: string | null;
  notificar_mensajes?: boolean;
  terminos_version_aceptada?: number;
  terminos_aceptados_at?: string | null;
  ultima_actividad?: string | null;
};
export type ProfileUpdate = Partial<ProfileInsert>;

export type PublicacionRow = {
  id: string;
  user_id: string;
  titulo: string;
  categoria: string;
  descripcion: string | null;
  tipo: TipoPublicacion;
  foto_paths: string[];
  created_at: string;
  deleted_at: string | null;
};
export type PublicacionInsert = Omit<PublicacionRow, "id" | "created_at" | "foto_paths" | "deleted_at"> & {
  id?: string;
  created_at?: string;
  foto_paths?: string[];
  deleted_at?: string | null;
};
export type PublicacionUpdate = Partial<PublicacionInsert>;

export type PublicacionLikeRow = {
  publicacion_id: string;
  user_id: string;
  created_at: string;
};
export type PublicacionLikeInsert = Omit<PublicacionLikeRow, "created_at"> & { created_at?: string };

export type PublicacionGuardadaRow = {
  publicacion_id: string;
  user_id: string;
  created_at: string;
};
export type PublicacionGuardadaInsert = Omit<PublicacionGuardadaRow, "created_at"> & { created_at?: string };

export type MensajeRow = {
  id: string;
  publicacion_id: string;
  remitente_id: string;
  destinatario_id: string;
  cuerpo: string;
  created_at: string;
  leido_at: string | null;
};
export type MensajeInsert = Omit<MensajeRow, "id" | "created_at" | "leido_at"> & {
  id?: string;
  created_at?: string;
  leido_at?: string | null;
};
export type MensajeUpdate = { leido_at: string };

export type ContactoRow = {
  id: string;
  publicacion_id: string;
  autor_id: string;
  visitante_id: string;
  medio: MedioContacto;
  created_at: string;
};
export type ContactoInsert = Omit<ContactoRow, "id" | "created_at"> & { id?: string; created_at?: string };

export type SuperAdminRow = {
  user_id: string;
};

export type DenunciaRow = {
  id: string;
  publicacion_id: string;
  denunciante_id: string;
  denunciado_id: string;
  motivo: string;
  comentario: string | null;
  created_at: string;
};
export type DenunciaInsert = Omit<DenunciaRow, "id" | "created_at"> & { id?: string; created_at?: string };

// ---- Vistas (solo lectura) ----

export type ComunidadPublicacionRow = {
  id: string;
  titulo: string;
  categoria: string;
  descripcion: string | null;
  tipo: TipoPublicacion;
  created_at: string;
  autor_id: string;
  nombre: string;
  apellido: string;
  provincia: string | null;
  whatsapp: string | null;
  instagram: string | null;
  contacto_email: string | null;
  foto_paths: string[];
  likes_count: number;
};

export type MensajeDetalleRow = {
  id: string;
  publicacion_id: string;
  remitente_id: string;
  destinatario_id: string;
  cuerpo: string;
  created_at: string;
  leido_at: string | null;
  publicacion_titulo: string;
  remitente_nombre: string;
  remitente_apellido: string;
  destinatario_nombre: string;
  destinatario_apellido: string;
  publicacion_autor_id: string;
};

export type PublicacionesLikesCountRow = {
  publicacion_id: string;
  cantidad: number;
};

export type PerfilPublicoRow = {
  id: string;
  nombre: string;
  apellido: string;
  provincia: string | null;
  descripcion: string | null;
  created_at: string;
};

// ---- Funciones (RPC) ----

export type AdminMiembroRow = {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  ubicacion: string | null;
  ciudad: string | null;
  created_at: string;
  ultima_conexion: string | null;
  ultima_actividad: string | null;
  suspendido_hasta: string | null;
  mensajes_recibidos: number;
  whatsapp: string | null;
  instagram: string | null;
  contacto_email: string | null;
  terminos_version_aceptada: number;
};

export type AdminMensajeRow = {
  id: string;
  created_at: string;
  publicacion_titulo: string;
  remitente_nombre: string;
  remitente_apellido: string;
  destinatario_nombre: string;
  destinatario_apellido: string;
  cuerpo: string;
  publicacion_eliminada_at: string | null;
};

export type AdminDenunciaRow = {
  id: string;
  created_at: string;
  publicacion_titulo: string;
  denunciante_id: string;
  denunciante_nombre: string;
  denunciante_apellido: string;
  denunciante_dni: string;
  denunciante_whatsapp: string | null;
  denunciado_id: string;
  denunciado_nombre: string;
  denunciado_apellido: string;
  denunciado_dni: string;
  motivo: string;
  comentario: string | null;
};

export type AdminPublicacionRow = {
  id: string;
  created_at: string;
  titulo: string;
  categoria: string;
  tipo: TipoPublicacion;
  descripcion: string | null;
  autor_id: string;
  autor_nombre: string;
  autor_apellido: string;
  autor_email: string;
  autor_dni: string;
  likes_count: number;
  deleted_at: string | null;
};

export type AdminSuperAdminRow = {
  user_id: string;
  nombre: string;
  apellido: string;
  email: string;
};

export type StatsPorDiaRow = {
  dia: string;
  cantidad: number;
};

export type StatsCategoriaRow = {
  categoria: string;
  cantidad: number;
};

export type Database = {
  public: {
    Tables: {
      profiles: { Row: ProfileRow; Insert: ProfileInsert; Update: ProfileUpdate; Relationships: [] };
      publicaciones: {
        Row: PublicacionRow;
        Insert: PublicacionInsert;
        Update: PublicacionUpdate;
        Relationships: [];
      };
      publicacion_likes: {
        Row: PublicacionLikeRow;
        Insert: PublicacionLikeInsert;
        Update: never;
        Relationships: [];
      };
      publicaciones_guardadas: {
        Row: PublicacionGuardadaRow;
        Insert: PublicacionGuardadaInsert;
        Update: never;
        Relationships: [];
      };
      mensajes: { Row: MensajeRow; Insert: MensajeInsert; Update: MensajeUpdate; Relationships: [] };
      contactos: { Row: ContactoRow; Insert: ContactoInsert; Update: never; Relationships: [] };
      super_admins: { Row: SuperAdminRow; Insert: SuperAdminRow; Update: never; Relationships: [] };
      denuncias: { Row: DenunciaRow; Insert: DenunciaInsert; Update: never; Relationships: [] };
    };
    Views: {
      comunidad_publicaciones: { Row: ComunidadPublicacionRow; Relationships: [] };
      mensajes_detalle: { Row: MensajeDetalleRow; Relationships: [] };
      publicaciones_likes_count: { Row: PublicacionesLikesCountRow; Relationships: [] };
      perfil_publico: { Row: PerfilPublicoRow; Relationships: [] };
    };
    Functions: {
      contar_miembros: { Args: Record<string, never>; Returns: number };
      es_super_admin: { Args: Record<string, never>; Returns: boolean };
      admin_listar_miembros: { Args: Record<string, never>; Returns: AdminMiembroRow[] };
      admin_suspender_usuario: { Args: { target_id: string; hasta: string | null }; Returns: void };
      admin_eliminar_perfil: { Args: { target_id: string }; Returns: void };
      admin_listar_publicaciones: { Args: Record<string, never>; Returns: AdminPublicacionRow[] };
      admin_eliminar_publicacion: { Args: { target_id: string }; Returns: void };
      admin_stats_categorias: { Args: Record<string, never>; Returns: StatsCategoriaRow[] };
      admin_stats_altas_por_dia: { Args: Record<string, never>; Returns: StatsPorDiaRow[] };
      admin_stats_mensajes_por_dia: { Args: Record<string, never>; Returns: StatsPorDiaRow[] };
      admin_listar_mensajes: { Args: Record<string, never>; Returns: AdminMensajeRow[] };
      admin_listar_denuncias: { Args: Record<string, never>; Returns: AdminDenunciaRow[] };
      admin_listar_super_admins: { Args: Record<string, never>; Returns: AdminSuperAdminRow[] };
      admin_agregar_super_admin: { Args: { target_id: string }; Returns: void };
      admin_quitar_super_admin: { Args: { target_id: string }; Returns: void };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
