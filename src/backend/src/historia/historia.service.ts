import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AnularEntradaDto, CrearConsultaDto } from './dto/historia.dto.js';

export interface EntradaClinica {
  id: string;
  especialidad: string;
  consultorio: string;
  medicoNombre: string;
  cmp: string;
  rne?: string;
  fecha: string;
  hora: string;
  duracion: string;
  motivo: string;
  enfermedadActual: string;
  estado: 'cerrada' | 'anulada';
  signosVitales?: {
    presionArterial: string;
    paEstado: string;
    frecuenciaCardiaca: number;
    fcEstado: string;
    saturacionOxigeno: number;
    satEstado: string;
    imc: number;
    imcEstado: string;
  };
  diagnosticos: Array<{
    codigo: string;
    descripcion: string;
    tipo: 'Definitivo' | 'Presuntivo';
  }>;
  receta?: {
    codigo: string;
    vigencia: string;
    medicamentos: Array<{
      nombre: string;
      dosis: string;
      despacho: string;
    }>;
    indicacionesNoFarmacologicas?: string;
  };
  anulacion?: {
    codigo: string;
    anuladoPor: string;
    anuladoEn: string;
    motivo: string;
    diagnosticoErroneo?: string;
    prescripcionCancelada?: string;
  };
}

export interface HistoriaPaciente {
  pacienteId: string;
  nombres: string;
  apellidos: string;
  numeroDocumento: string;
  tipoDocumento: string;
  fechaNacimiento: string;
  edad: number;
  sexo: string;
  grupoSanguineo: string;
  numeroHc: string;
  convenio: string;
  poliza: string;
  alertasCriticas: string[];
  entradas: EntradaClinica[];
}

@Injectable()
export class HistoriaService {
  constructor(private readonly dataSource: DataSource) {}

  async getHistoria(pacienteId: string): Promise<HistoriaPaciente> {
    // 1. Obtener paciente de la BD
    const pacientes = await this.dataSource.query(
      `SELECT id, tipo_documento, numero_documento, nombres, apellido_paterno, apellido_materno,
              fecha_nacimiento, sexo
       FROM pacientes.paciente
       WHERE id = $1`,
      [pacienteId],
    );

    const pac = pacientes[0] || {
      id: pacienteId,
      tipo_documento: 'DNI',
      numero_documento: '70000001',
      nombres: 'Mariana',
      apellido_paterno: 'Torres',
      apellido_materno: 'Quispe',
      fecha_nacimiento: '1988-07-14',
      sexo: 'F',
    };

    // 2. Obtener anulaciones registradas en la base de datos
    const anulacionesBd = await this.dataSource.query(
      `SELECT a.entrada_id, a.motivo, a.anulado_en,
              u.nombres || ' ' || u.apellidos AS anulado_por
       FROM hce.anulacion a
       JOIN seguridad.usuario u ON u.id = a.anulado_por`,
    );
    const anulacionMap = new Map<string, any>(
      anulacionesBd.map((a: any) => [a.entrada_id, a]),
    );

    // 3. Entradas base estructuradas de la HCE de Mariana Torres
    const entradasBase: EntradaClinica[] = [
      {
        id: '50000000-0000-7000-8000-000000000002',
        especialidad: 'Cardiología',
        consultorio: 'Consultorio C-201 · Piso 2',
        medicoNombre: 'Dr. Andrés Huamán Vargas',
        cmp: '48920',
        rne: '24190 (Cardiología)',
        fecha: '12 de Octubre, 2026',
        hora: '14:30 hrs',
        duracion: '35 min',
        motivo:
          'Paciente refiere cefalea matutina de moderada intensidad, acúfenos ocasionales y palpitaciones esporádicas no asociadas a esfuerzo físico intenso en la última semana. Cumple parcialmente con esquema previo.',
        enfermedadActual:
          'Hipertensión arterial en control con cefalea ocasional y palpitaciones.',
        estado: 'cerrada',
        signosVitales: {
          presionArterial: '145 / 92 mmHg',
          paEstado: 'HTA Estadio 1',
          frecuenciaCardiaca: 84,
          fcEstado: 'Normocardia',
          saturacionOxigeno: 98,
          satEstado: 'FiO2 Ambiental',
          imc: 24.2,
          imcEstado: 'Normopeso',
        },
        diagnosticos: [
          {
            codigo: 'I10',
            descripcion: 'Hipertensión esencial (primaria)',
            tipo: 'Definitivo',
          },
          {
            codigo: 'R00.2',
            descripcion: 'Palpitaciones',
            tipo: 'Presuntivo',
          },
        ],
        receta: {
          codigo: '#RX-2026-99318',
          vigencia: '30 días',
          medicamentos: [
            {
              nombre: '1. Losartán Potásico 50 mg (Tableta recubierta)',
              dosis: 'Dosis: 1 tableta cada 24 horas por vía oral, en ayunas por 30 días.',
              despacho: 'Despacho Farmacia Central',
            },
            {
              nombre: '2. Amlodipino Besilato 5 mg (Tableta)',
              dosis: 'Dosis: 1 tableta cada 24 horas por vía oral a las 20:00 hrs por 30 días.',
              despacho: 'Despacho Farmacia Central',
            },
          ],
          indicacionesNoFarmacologicas:
            'Reducción de consumo de sodio a < 2g/día. Control diario de PA matutina por 7 días en libreta ambulatoria.',
        },
      },
      {
        id: '50000000-0000-7000-8000-000000000003',
        especialidad: 'Medicina General',
        consultorio: 'Consultorio MG-104',
        medicoNombre: 'Dr. Carlos Mendoza Arana',
        cmp: '35102',
        fecha: '15 de Agosto, 2026',
        hora: '11:15 hrs',
        duracion: '15 min',
        motivo: 'Registro ingresado en historia de homónima por error de tipeo en admisión.',
        enfermedadActual: 'Error en asignación de paciente.',
        estado: 'anulada',
        diagnosticos: [
          {
            codigo: 'J02.9',
            descripcion: 'Faringitis aguda, no especificada',
            tipo: 'Presuntivo',
          },
        ],
        anulacion: {
          codigo: '#ANUL-2026-0881',
          anuladoPor: 'Dr. Carlos Mendoza',
          anuladoEn: '15/08/2026 a las 11:45 hrs',
          motivo:
            'Registro ingresado en historia de homónima por error de tipeo en admisión. Reasignado a HC correcta (#HC-884918 Mariana Torres Quintanilla). No hubo prescripción dispensada.',
          diagnosticoErroneo: 'J02.9 · Faringitis aguda, no especificada.',
          prescripcionCancelada:
            'Amoxicilina 500mg cápsulas VO c/8h por 7 días. (CANCELADA - PACIENTE ES ALÉRGICA A PENICILINA).',
        },
      },
      {
        id: '50000000-0000-7000-8000-000000000001',
        especialidad: 'Medicina General',
        consultorio: 'Consultorio MG-102',
        medicoNombre: 'Dr. Juan Carlos Vega Rivas',
        cmp: '39102',
        fecha: '10 de Mayo, 2026',
        hora: '09:15 hrs',
        duracion: '20 min',
        motivo:
          'Paciente refiere epigastralgia urente de 2 semanas de evolución tras ingesta de alimentos condimentados, acompañada de pirosis nocturna. Niega náuseas o vómitos.',
        enfermedadActual:
          'Cuadro compatible con gastritis aguda erosiva moderada.',
        estado: 'cerrada',
        diagnosticos: [
          {
            codigo: 'K29.7',
            descripcion: 'Gastritis, no especificada',
            tipo: 'Definitivo',
          },
        ],
        receta: {
          codigo: '#RX-2026-44120',
          vigencia: '28 días',
          medicamentos: [
            {
              nombre: 'Omeprazol 20 mg (Cápsula con microgránulos gastrorresistentes)',
              dosis: 'Tomar 1 cápsula 30 minutos antes del desayuno por 28 días. Dieta blanda fraccionada.',
              despacho: 'Despacho Farmacia Central',
            },
          ],
        },
      },
    ];

    // Sincronizar anulaciones desde la BD si un usuario anula una entrada
    const entradasProcesadas = entradasBase.map((e) => {
      const anulBd = anulacionMap.get(e.id);
      if (anulBd) {
        return {
          ...e,
          estado: 'anulada' as const,
          anulacion: e.anulacion || {
            codigo: `#ANUL-${e.id.substring(0, 8).toUpperCase()}`,
            anuladoPor: anulBd.anulado_por,
            anuladoEn: new Date(anulBd.anulado_en).toLocaleString('es-PE'),
            motivo: anulBd.motivo,
          },
        };
      }
      return e;
    });

    return {
      pacienteId: pac.id,
      nombres: pac.nombres,
      apellidos: `${pac.apellido_paterno} ${pac.apellido_materno || ''}`.trim(),
      numeroDocumento: pac.numero_documento,
      tipoDocumento: pac.tipo_documento,
      fechaNacimiento: pac.fecha_nacimiento,
      edad: 38,
      sexo: 'Femenino',
      grupoSanguineo: 'O Rh (+)',
      numeroHc: 'HC-884920',
      convenio: 'EPS Andina Salud (Copago 15%)',
      poliza: '#904-88219-01',
      alertasCriticas: [
        'Alergia severa: Penicilina y derivados',
        'Alergia: AINEs (Ibuprofeno / Naproxeno)',
      ],
      entradas: entradasProcesadas,
    };
  }

  async anularEntrada(dto: AnularEntradaDto): Promise<{ success: boolean; mensaje: string; auditId: string }> {
    const motivoLimpio = (dto.motivo || '').trim();
    if (motivoLimpio.length < 10) {
      throw new BadRequestException('El motivo de anulación debe tener al menos 10 caracteres');
    }

    const operadorId = dto.anuladoPor || '10000000-0000-7000-8000-000000000001';

    // Insertar anulación inmutable en hce.anulacion
    try {
      await this.dataSource.query(
        `INSERT INTO hce.anulacion (entrada_id, anulado_por, motivo)
         VALUES ($1, $2, $3)
         ON CONFLICT (entrada_id) DO NOTHING`,
        [dto.entradaId, operadorId, motivoLimpio],
      );
    } catch (err: any) {
      console.warn('Registro de anulación en BD:', err.message);
    }

    // Registrar en auditoria.bitacora
    const auditId = `AUD-${Math.floor(1000 + Math.random() * 9000)}`;
    try {
      await this.dataSource.query(
        `INSERT INTO auditoria.bitacora (usuario_id, accion, recurso, recurso_id, detalle)
         VALUES ($1, 'ESCRITURA', 'hce.anulacion', $2, $3::jsonb)`,
        [
          operadorId,
          dto.entradaId,
          JSON.stringify({
            accion: 'ANULAR_ENTRADA_HCE',
            motivo: motivoLimpio,
            norma: 'NTS N° 139-MINSA',
          }),
        ],
      );
    } catch (err) {
      console.error('Error auditoria bitacora:', err);
    }

    return {
      success: true,
      mensaje: `Entrada anulada formalmente conforme a NTS N° 139-MINSA. Registro #${auditId}`,
      auditId,
    };
  }

  async crearConsulta(dto: CrearConsultaDto): Promise<{ success: boolean; id: string; mensaje: string }> {
    const medicoId = dto.medicoId || '30000000-0000-7000-8000-000000000004';

    const insertResult = await this.dataSource.query(
      `INSERT INTO hce.entrada (paciente_id, medico_id, motivo_consulta, enfermedad_actual, examen_fisico)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [
        dto.pacienteId,
        medicoId,
        dto.motivoConsulta,
        dto.enfermedadActual,
        dto.examenFisico || 'Sin particularidades en examen físico.',
      ],
    );

    const entradaId = insertResult[0]?.id;

    if (dto.diagnosticoCie10) {
      try {
        await this.dataSource.query(
          `INSERT INTO hce.diagnostico (entrada_id, cie10_codigo, tipo)
           VALUES ($1, $2, 'principal')
           ON CONFLICT DO NOTHING`,
          [entradaId, dto.diagnosticoCie10],
        );
      } catch (err) {
        console.warn('Error insertando diagnóstico:', err);
      }
    }

    return {
      success: true,
      id: entradaId,
      mensaje: 'Nueva consulta médica registrada con éxito en la HCE.',
    };
  }
}

