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
  provincia: string | null;
  descripcion: string | null;
  whatsapp: string | null;
  instagram: string | null;
  contacto_email: string | null;
  suspendido_hasta: string | null;
  notificar_mensajes: boolean;
  created_at: string;
};
export type ProfileInsert = Omit<ProfileRow, "created_at" | "suspendido_hasta" | "notificar_mensajes"> & {
  created_at?: string;
  suspendido_hasta?: string | null;
  notificar_mensajes?: boolean;
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
};
export type PublicacionInsert = Omit<PublicacionRow, "id" | "created_at" | "foto_paths"> & {
  id?: string;
  created_at?: string;
  foto_paths?: string[];
};
export type PublicacionUpdate = Partial<PublicacionInsert>;

export type PublicacionLikeRow = {
  publicacion_id: string;
  user_id: string;
  created_at: string;
};
export type PublicacionLikeInsert = Omit<PublicacionLikeRow, "created_at"> & { created_at?: string };

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
};

export type PublicacionesLikesCountRow = {
  publicacion_id: string;
  cantidad: number;
};

// ---- Funciones (RPC) ----

export type AdminMiembroRow = {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  ubicacion: string | null;
  created_at: string;
  ultima_conexion: string | null;
  suspendido_hasta: string | null;
  mensajes_recibidos: number;
  contactos_recibidos: number;
  whatsapp: string | null;
  instagram: string | null;
  contacto_email: string | null;
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
      mensajes: { Row: MensajeRow; Insert: MensajeInsert; Update: MensajeUpdate; Relationships: [] };
      contactos: { Row: ContactoRow; Insert: ContactoInsert; Update: never; Relationships: [] };
      super_admins: { Row: SuperAdminRow; Insert: SuperAdminRow; Update: never; Relationships: [] };
    };
    Views: {
      comunidad_publicaciones: { Row: ComunidadPublicacionRow; Relationships: [] };
      mensajes_detalle: { Row: MensajeDetalleRow; Relationships: [] };
      publicaciones_likes_count: { Row: PublicacionesLikesCountRow; Relationships: [] };
    };
    Functions: {
      contar_miembros: { Args: Record<string, never>; Returns: number };
      es_super_admin: { Args: Record<string, never>; Returns: boolean };
      admin_listar_miembros: { Args: Record<string, never>; Returns: AdminMiembroRow[] };
      admin_suspender_usuario: { Args: { target_id: string; hasta: string | null }; Returns: void };
      admin_eliminar_perfil: { Args: { target_id: string }; Returns: void };
      admin_stats_categorias: { Args: Record<string, never>; Returns: StatsCategoriaRow[] };
      admin_stats_altas_por_dia: { Args: Record<string, never>; Returns: StatsPorDiaRow[] };
      admin_stats_mensajes_por_dia: { Args: Record<string, never>; Returns: StatsPorDiaRow[] };
      admin_stats_contactos_por_dia: { Args: Record<string, never>; Returns: StatsPorDiaRow[] };
      admin_listar_mensajes: { Args: Record<string, never>; Returns: AdminMensajeRow[] };
      admin_listar_super_admins: { Args: Record<string, never>; Returns: AdminSuperAdminRow[] };
      admin_agregar_super_admin: { Args: { target_id: string }; Returns: void };
      admin_quitar_super_admin: { Args: { target_id: string }; Returns: void };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
