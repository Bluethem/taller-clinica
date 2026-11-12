import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PublicarResultadoDto } from './dto/publicar-resultado.dto.js';

export interface OrdenLaboratorio {
  ordenId: string;
  ordenItemId: string;
  codigoOrden: string;
  pacienteId: string;
  pacienteNombre: string;
  pacienteDni: string;
  pacienteEdad: number;
  examenId: number;
  examenCodigo: string;
  examenNombre: string;
  examenDetalle: string;
  medicoNombre: string;
  prioridad: 'en_proceso' | 'urgente' | 'rutina';
  tiempo: string;
  estado: 'en_proceso' | 'urgente' | 'rutina' | 'validado';
  hc: string;
  tubo: string;
  muestra: string;
  fechaToma: string;
  bioquimico: string;
  valores: {
    colTotal: number;
    trigliceridos: number;
    colHdl: number;
    colLdl: number;
  };
  resultadoValor?: string;
  resultadoUnidad?: string;
  resultadoRango?: string;
  observaciones: string;
}

@Injectable()
export class LaboratorioService {
  constructor(private readonly dataSource: DataSource) {}

  async getColaOrdenes(): Promise<OrdenLaboratorio[]> {
    try {
      const rows = await this.dataSource.query(`
        SELECT
          o.id AS orden_id,
          oi.id AS orden_item_id,
          'ORD-LAB-2026-' || LPAD(SUBSTRING(o.id::text, 1, 4), 4, '0') AS codigo_orden,
          p.id AS paciente_id,
          p.nombres || ' ' || p.apellido_paterno || ' ' || COALESCE(p.apellido_materno, '') AS paciente_nombre,
          p.numero_documento AS paciente_dni,
          DATE_PART('year', AGE(p.fecha_nacimiento))::int AS paciente_edad,
          e.id AS examen_id,
          e.codigo AS examen_codigo,
          e.nombre AS examen_nombre,
          COALESCE(o.indicacion_clinica, e.nombre) AS examen_detalle,
          COALESCE('Dr(a). ' || u.nombres || ' ' || u.apellidos, 'Dr(a). Consulta Externa') AS medico_nombre,
          esp.nombre AS especialidad_nombre,
          o.creada_en,
          r.id AS resultado_id,
          r.valor AS resultado_valor,
          r.unidad AS resultado_unidad,
          r.rango_referencia AS resultado_rango,
          r.archivo_url AS resultado_archivo,
          r.observaciones AS resultado_obs,
          r.registrado_en
        FROM laboratorio.orden o
        JOIN laboratorio.orden_item oi ON oi.orden_id = o.id
        JOIN laboratorio.examen e ON e.id = oi.examen_id
        JOIN pacientes.paciente p ON p.id = o.paciente_id
        LEFT JOIN agenda.medico m ON m.id = o.medico_id
        LEFT JOIN seguridad.usuario u ON u.id = m.usuario_id
        LEFT JOIN agenda.especialidad esp ON esp.id = m.especialidad_id
        LEFT JOIN laboratorio.resultado r ON r.orden_item_id = oi.id
        ORDER BY
          CASE WHEN r.id IS NULL THEN 0 ELSE 1 END ASC,
          o.creada_en DESC,
          oi.id ASC
      `);

      return rows.map((row: any) => {
        const esValidado = !!row.resultado_id;
        const indicacion = (row.examen_detalle || '').toLowerCase();
        const esUrgente =
          indicacion.includes('descartar') ||
          indicacion.includes('infeccioso') ||
          indicacion.includes('urgente') ||
          indicacion.includes('trauma');
        const prioridad: 'urgente' | 'rutina' | 'en_proceso' = esUrgente ? 'urgente' : 'rutina';
        const estado: 'validado' | 'urgente' | 'rutina' | 'en_proceso' = esValidado ? 'validado' : prioridad;

        // Metadatos de tubo y muestra según examen
        let tubo = 'Tubo Vacutainer Tapa Roja (Gel)';
        let muestra = 'Suero sanguíneo';
        const codEx = (row.examen_codigo || '').toUpperCase();
        if (codEx === 'HEMOGRAMA') {
          tubo = 'Tubo Vacutainer Tapa Lila (EDTA K2)';
          muestra = 'Sangre total con EDTA';
        } else if (codEx === 'GLUCOSA') {
          tubo = 'Tubo Vacutainer Tapa Gris (Fluoruro)';
          muestra = 'Plasma fluorado';
        } else if (codEx === 'PAPANICOLAOU') {
          tubo = 'Lámina portaobjetos en alcohol 96°';
          muestra = 'Citología cervical';
        } else if (codEx === 'RX_RODILLA') {
          tubo = 'Placa Radiográfica Digital';
          muestra = 'Estudio de Imagenología';
        }

        // Extracción de valores bioquímicos si ya existen
        let colTotal = 215;
        let trigliceridos = 160;
        let colHdl = 48;
        let colLdl = 135;

        if (row.resultado_valor) {
          const ctMatch = row.resultado_valor.match(/(?:Colesterol\s*(?:total)?[:\s]*)(\d+)/i);
          const tgMatch = row.resultado_valor.match(/(?:Triglic[eé]ridos[:\s]*)(\d+)/i);
          const hdlMatch = row.resultado_valor.match(/(?:HDL[:\s]*)(\d+)/i);
          const ldlMatch = row.resultado_valor.match(/(?:LDL[:\s]*)(\d+)/i);
          if (ctMatch) colTotal = Number(ctMatch[1]);
          if (tgMatch) trigliceridos = Number(tgMatch[1]);
          if (hdlMatch) colHdl = Number(hdlMatch[1]);
          if (ldlMatch) colLdl = Number(ldlMatch[1]);
        }

        const fechaToma = row.creada_en
          ? new Date(row.creada_en).toLocaleDateString('es-PE', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : 'Hoy, 07:30 hrs';

        return {
          ordenId: row.orden_id,
          ordenItemId: row.orden_item_id,
          codigoOrden: row.codigo_orden,
          pacienteId: row.paciente_id,
          pacienteNombre: row.paciente_nombre.trim(),
          pacienteDni: row.paciente_dni,
          pacienteEdad: row.paciente_edad || 35,
          examenId: row.examen_id,
          examenCodigo: row.examen_codigo,
          examenNombre: row.examen_nombre,
          examenDetalle: row.examen_detalle,
          medicoNombre: row.medico_nombre,
          prioridad,
          tiempo: esUrgente ? '2h · Urgente' : '4h · Rutina',
          estado,
          hc: `HC-${row.paciente_dni.slice(-6)}`,
          tubo,
          muestra,
          fechaToma,
          bioquimico: 'Lic. Patricia Morales (CQFP 1482)',
          valores: {
            colTotal,
            trigliceridos,
            colHdl,
            colLdl,
          },
          resultadoValor: row.resultado_valor || '',
          resultadoUnidad: row.resultado_unidad || 'mg/dL',
          resultadoRango: row.resultado_rango || '',
          observaciones:
            row.resultado_obs ||
            (esValidado
              ? 'Resultados procesados y validados analíticamente.'
              : 'Muestra sin hemólisis ni lipemia. En espera de validación.'),
        };
      });
    } catch (err: any) {
      console.error('Error al consultar cola de laboratorio desde BD:', err.message);
      return [];
    }
  }

  async guardarResultado(dto: PublicarResultadoDto): Promise<{ success: boolean; id: string; mensaje: string }> {
    let valorCadena = dto.resultadoValor;
    if (!valorCadena) {
      if (dto.colTotal !== undefined) {
        valorCadena = `Colesterol Total: ${dto.colTotal} mg/dL; Triglicéridos: ${dto.trigliceridos} mg/dL; HDL: ${dto.colHdl} mg/dL; LDL: ${dto.colLdl} mg/dL`;
      } else {
        valorCadena = 'Resultado analítico validado y conforme';
      }
    }

    const rangoReferencia = dto.rangoReferencia || 'CT < 200; TG < 150; HDL > 50; LDL < 100';
    const unidad = dto.unidad || 'mg/dL';
    const archivoUrl =
      dto.archivoUrl ||
      'https://archivos.sanrafael.example.pe/lab/Reporte_Laboratorio_Firmado.pdf';

    // Obtener un usuario válido para registrado_por si no viene uno
    let usuarioId = dto.registradoPor;
    if (!usuarioId) {
      const usuarios = await this.dataSource.query(
        `SELECT id FROM seguridad.usuario WHERE username = 'jnavarro' OR rol_id = 5 LIMIT 1`,
      );
      usuarioId = usuarios[0]?.id || '10000000-0000-7000-8000-000000000009';
    }

    // Insertar o actualizar resultado en laboratorio.resultado (UPSERT)
    const result = await this.dataSource.query(
      `INSERT INTO laboratorio.resultado (orden_item_id, valor, unidad, rango_referencia, archivo_url, observaciones, registrado_por)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (orden_item_id)
       DO UPDATE SET
         valor = EXCLUDED.valor,
         unidad = EXCLUDED.unidad,
         rango_referencia = EXCLUDED.rango_referencia,
         archivo_url = EXCLUDED.archivo_url,
         observaciones = EXCLUDED.observaciones,
         registrado_en = now()
       RETURNING id`,
      [
        dto.ordenItemId,
        valorCadena,
        unidad,
        rangoReferencia,
        archivoUrl,
        dto.observaciones,
        usuarioId,
      ],
    );

    const resultadoId = result[0]?.id;

    // Registrar en auditoria.bitacora (HU11)
    try {
      await this.dataSource.query(
        `INSERT INTO auditoria.bitacora (usuario_id, accion, recurso, recurso_id, paciente_id, detalle)
         VALUES ($1, 'ESCRITURA', 'laboratorio.resultado', $2, $3, $4::jsonb)`,
        [
          usuarioId,
          resultadoId,
          dto.pacienteId,
          JSON.stringify({
            accion: 'PUBLICAR_RESULTADO_LAB',
            ordenItemId: dto.ordenItemId,
            valor: valorCadena,
            valores: {
              colTotal: dto.colTotal,
              trigliceridos: dto.trigliceridos,
              colHdl: dto.colHdl,
              colLdl: dto.colLdl,
            },
          }),
        ],
      );
    } catch (err) {
      console.error('Error registrando auditoría laboratorio:', err);
    }

    return {
      success: true,
      id: resultadoId,
      mensaje: 'Resultado publicado con éxito en la historia clínica del paciente',
    };
  }
}
