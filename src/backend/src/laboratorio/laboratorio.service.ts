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
  observaciones: string;
}

@Injectable()
export class LaboratorioService {
  constructor(private readonly dataSource: DataSource) {}

  async getColaOrdenes(): Promise<OrdenLaboratorio[]> {
    // Órdenes estáticas de la cola de laboratorio según prototipo UX
    const ordenesBase: OrdenLaboratorio[] = [
      {
        ordenId: '60000000-0000-7000-8000-000000000001',
        ordenItemId: '61000000-0000-7000-8000-000000000001',
        codigoOrden: 'ORD-LAB-2026-1049',
        pacienteId: '20000000-0000-7000-8000-000000000001',
        pacienteNombre: 'Mariana Torres Quispe',
        pacienteDni: '70000001',
        pacienteEdad: 38,
        examenNombre: 'Perfil Lipídico',
        examenDetalle: 'Colesterol total, HDL, LDL, Triglicéridos',
        medicoNombre: 'Dr. Andrés Huamán (Cardio)',
        prioridad: 'en_proceso',
        tiempo: '2h · Normal',
        estado: 'en_proceso',
        hc: '984022-A',
        tubo: 'Tubo Vacutainer Tapa Roja (Gel)',
        muestra: 'Suero sanguíneo',
        fechaToma: 'Hoy, 07:30 hrs',
        bioquimico: 'Lic. Patricia Morales (CQFP 1482)',
        valores: {
          colTotal: 215,
          trigliceridos: 160,
          colHdl: 48,
          colLdl: 135,
        },
        observaciones: 'Muestra sin hemólisis ni lipemia visible. Valores concordantes con historial previo.',
      },
      {
        ordenId: '60000000-0000-7000-8000-000000000002',
        ordenItemId: '61000000-0000-7000-8000-000000000002',
        codigoOrden: 'ORD-LAB-2026-1048',
        pacienteId: '20000000-0000-7000-8000-000000000002',
        pacienteNombre: 'Carlos Benavides Ruiz',
        pacienteDni: '45192834',
        pacienteEdad: 52,
        examenNombre: 'Glucosa en ayunas + Hemoglobina Glicosilada',
        examenDetalle: 'Glucosa basal y HbA1c',
        medicoNombre: 'Dr. Mendoza',
        prioridad: 'urgente',
        tiempo: '3h',
        estado: 'urgente',
        hc: '942011-B',
        tubo: 'Tubo Vacutainer Tapa Gris (Fluoruro)',
        muestra: 'Plasma fluorado',
        fechaToma: 'Hoy, 08:15 hrs',
        bioquimico: 'Lic. Patricia Morales (CQFP 1482)',
        valores: {
          colTotal: 190,
          trigliceridos: 140,
          colHdl: 55,
          colLdl: 98,
        },
        observaciones: 'Paciente en ayunas de 10 horas. Sin interferencias analíticas.',
      },
      {
        ordenId: '60000000-0000-7000-8000-000000000003',
        ordenItemId: '61000000-0000-7000-8000-000000000003',
        codigoOrden: 'ORD-LAB-2026-1047',
        pacienteId: '20000000-0000-7000-8000-000000000003',
        pacienteNombre: 'Rosa Flores Poma',
        pacienteDni: '10294857',
        pacienteEdad: 64,
        examenNombre: 'Hemograma Completo Automatizado + Plaquetas',
        examenDetalle: 'Fórmula leucocitaria y recuento plaquetario',
        medicoNombre: 'Dra. Valdivia',
        prioridad: 'rutina',
        tiempo: '4h',
        estado: 'rutina',
        hc: '915033-C',
        tubo: 'Tubo Vacutainer Tapa Lila (EDTA K2)',
        muestra: 'Sangre total con EDTA',
        fechaToma: 'Hoy, 09:00 hrs',
        bioquimico: 'Lic. Patricia Morales (CQFP 1482)',
        valores: {
          colTotal: 180,
          trigliceridos: 130,
          colHdl: 60,
          colLdl: 94,
        },
        observaciones: 'Muestra homogénea sin microcoágulos.',
      },
    ];

    // Verificar en la BD si alguna orden ya tiene resultado publicado
    try {
      const resultados = await this.dataSource.query(
        `SELECT orden_item_id, valor, observaciones FROM laboratorio.resultado`,
      );
      const resMap = new Map<string, any>(
        resultados.map((r: any) => [r.orden_item_id, r]),
      );

      return ordenesBase.map(o => {
        if (resMap.has(o.ordenItemId)) {
          return {
            ...o,
            estado: 'validado' as const,
          };
        }
        return o;
      });
    } catch {
      return ordenesBase;
    }
  }

  async guardarResultado(dto: PublicarResultadoDto): Promise<{ success: boolean; id: string; mensaje: string }> {
    const valorCadena = `Colesterol Total: ${dto.colTotal} mg/dL; Triglicéridos: ${dto.trigliceridos} mg/dL; HDL: ${dto.colHdl} mg/dL; LDL: ${dto.colLdl} mg/dL`;
    const rangoReferencia = 'CT < 200; TG < 150; HDL > 50; LDL < 100';
    const archivoUrl = dto.archivoUrl || 'https://archivos.sanrafael.example.pe/lab/Perfil_Lipidico_MarianaTorres_12102026.pdf';

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
       VALUES ($1, $2, 'mg/dL', $3, $4, $5, $6)
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

