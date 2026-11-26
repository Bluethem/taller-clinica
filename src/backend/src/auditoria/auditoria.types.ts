export type AccionBitacora =
  | 'LECTURA'
  | 'ESCRITURA'
  | 'ANULACION'
  | 'LOGIN'
  | 'LOGIN_FALLIDO'
  | 'ACCESO_DENEGADO';

export interface RegistrarAuditoriaInput {
  usuarioId: string | null;
  accion: AccionBitacora;
  recurso: string;
  recursoId?: string | null;
  pacienteId?: string | null;
  ip?: string | null;
  detalle?: Record<string, unknown> | null;
}
