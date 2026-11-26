import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { RegistrarAuditoriaInput } from './auditoria.types.js';

type QueryExecutor = Pick<DataSource, 'query'>;

@Injectable()
export class AuditoriaService {
  constructor(private readonly dataSource: DataSource) {}

  async registrar(
    input: RegistrarAuditoriaInput,
    executor: QueryExecutor = this.dataSource,
  ): Promise<void> {
    await executor.query(
      `INSERT INTO auditoria.bitacora
         (usuario_id, accion, recurso, recurso_id, paciente_id, ip, detalle)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb)`,
      [
        input.usuarioId,
        input.accion,
        input.recurso,
        input.recursoId ?? null,
        input.pacienteId ?? null,
        input.ip?.trim() || null,
        JSON.stringify(input.detalle ?? {}),
      ],
    );
  }

  async listarPorPaciente(pacienteId: string): Promise<
    Array<{
      id: string;
      ocurrioEn: string;
      usuarioId: string | null;
      accion: string;
      recurso: string;
      recursoId: string | null;
      detalle: unknown;
    }>
  > {
    const rows = await this.dataSource.query(
      `SELECT id, ocurrio_en, usuario_id, accion, recurso, recurso_id, detalle
       FROM auditoria.bitacora
       WHERE paciente_id = $1
       ORDER BY ocurrio_en DESC
       LIMIT 200`,
      [pacienteId],
    );
    return rows.map((r: Record<string, unknown>) => ({
      id: String(r.id),
      ocurrioEn:
        r.ocurrio_en instanceof Date
          ? r.ocurrio_en.toISOString()
          : String(r.ocurrio_en),
      usuarioId: (r.usuario_id as string | null) ?? null,
      accion: String(r.accion),
      recurso: String(r.recurso),
      recursoId: (r.recurso_id as string | null) ?? null,
      detalle: r.detalle,
    }));
  }
}
