import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CrearPacienteDto } from './dto/crear-paciente.dto.js';

export interface PacienteDirectorio {
  id: string;
  nombres: string;
  apellidos: string;
  nombreCompleto: string;
  iniciales: string;
  edad: number;
  sexo: 'Femenino' | 'Masculino';
  tipoDocumento: string;
  numeroDocumento: string;
  numeroHc: string;
  seguro: string;
  seguroClase: string;
  ultimaAtencion: {
    especialidad: string;
    medico: string;
  };
  estado: string;
  estadoClase: string;
  telefono: string;
  email: string;
  direccion: string;
  alergias: string;
  diagnosticoReciente: string;
  medicoTratante: string;
}

@Injectable()
export class PacientesService {
  constructor(private readonly dataSource: DataSource) {}

  async getDirectorio(q?: string, filtro?: string): Promise<PacienteDirectorio[]> {
<<<<<<< Updated upstream
    const pacientesBase: PacienteDirectorio[] = [
      {
        id: '20000000-0000-7000-8000-000000000001',
        nombres: 'Mariana',
        apellidos: 'Torres Quispe',
        nombreCompleto: 'Mariana Torres Quispe',
        iniciales: 'MT',
        edad: 29,
        sexo: 'Femenino',
        tipoDocumento: 'DNI',
        numeroDocumento: '70000001',
        numeroHc: '2024-00412',
        seguro: 'Rímac Seguros',
        seguroClase: 'bg-red-50 text-red-700 border-red-200',
        ultimaAtencion: {
          especialidad: 'Cardiología',
          medico: 'Dr. Carlos Benavides',
        },
        estado: 'Cita Agendada',
        estadoClase: 'bg-blue-100 text-blue-800',
        telefono: '+51 987 654 321',
        email: 'mariana.torres@gmail.com',
        direccion: 'Av. Javier Prado Este 2410, San Borja',
        alergias: 'Penicilina, Betalactámicos',
        diagnosticoReciente: 'I10 - Hipertensión arterial esencial primaria',
        medicoTratante: 'Dr(a). Carlos Benavides Soto',
      },
      {
        id: '20000000-0000-7000-8000-000000000002',
        nombres: 'Carlos Alberto',
        apellidos: 'Mendoza Ramos',
        nombreCompleto: 'Carlos Alberto Mendoza Ramos',
        iniciales: 'CM',
        edad: 45,
        sexo: 'Masculino',
        tipoDocumento: 'DNI',
        numeroDocumento: '42891045',
        numeroHc: '2023-11890',
        seguro: 'Pacífico Salud',
        seguroClase: 'bg-blue-50 text-blue-700 border-blue-200',
        ultimaAtencion: {
          especialidad: 'Medicina General',
          medico: 'Triaje 02',
        },
        estado: 'En Triaje',
        estadoClase: 'bg-amber-100 text-amber-800',
        telefono: '+51 912 345 678',
        email: 'carlos.mendoza@gmail.com',
        direccion: 'Calle Los Cedros 345, Surquillo',
        alergias: 'Ninguna conocida',
        diagnosticoReciente: 'K29.7 - Gastritis no especificada',
        medicoTratante: 'Dr(a). Juan Carlos Vega',
      },
      {
        id: '20000000-0000-7000-8000-000000000003',
        nombres: 'Rosa Elena',
        apellidos: 'Huamán Quispe',
        nombreCompleto: 'Rosa Elena Huamán Quispe',
        iniciales: 'RH',
        edad: 62,
        sexo: 'Femenino',
        tipoDocumento: 'DNI',
        numeroDocumento: '09482156',
        numeroHc: '2021-04512',
        seguro: 'Particular',
        seguroClase: 'bg-slate-100 text-slate-700 border-slate-200',
        ultimaAtencion: {
          especialidad: 'Geriatría',
          medico: 'Dr(a). Beatriz Mendoza',
        },
        estado: 'Activo',
        estadoClase: 'bg-emerald-100 text-emerald-800',
        telefono: '+51 945 678 123',
        email: 'rosa.huaman@hotmail.com',
        direccion: 'Av. Primavera 1280, San Borja',
        alergias: 'AINEs (Ibuprofeno / Naproxeno)',
        diagnosticoReciente: 'M17.0 - Gonartrosis bilateral primaria',
        medicoTratante: 'Dr(a). Beatriz Mendoza',
      },
      {
        id: '20000000-0000-7000-8000-000000000004',
        nombres: 'Jorge Luis',
        apellidos: 'Valdivia Paredes',
        nombreCompleto: 'Jorge Luis Valdivia Paredes',
        iniciales: 'JV',
        edad: 24,
        sexo: 'Masculino',
        tipoDocumento: 'DNI',
        numeroDocumento: '74128930',
        numeroHc: '2024-00891',
        seguro: 'EPS Sanitas',
        seguroClase: 'bg-sky-50 text-sky-700 border-sky-200',
        ultimaAtencion: {
          especialidad: 'Traumatología',
          medico: 'Dr(a). Andrés Huamán',
        },
        estado: 'Atendido',
        estadoClase: 'bg-slate-100 text-slate-700',
        telefono: '+51 933 221 100',
        email: 'jorge.valdivia@outlook.com',
        direccion: 'Av. Aviación 3210, San Borja',
        alergias: 'Sulfas',
        diagnosticoReciente: 'S83.5 - Esguince de rodilla',
        medicoTratante: 'Dr(a). Andrés Huamán',
      },
      {
        id: '20000000-0000-7000-8000-000000000005',
        nombres: 'Ana Lucía',
        apellidos: 'Salcedo Castro',
        nombreCompleto: 'Ana Lucía Salcedo Castro',
        iniciales: 'AS',
        edad: 38,
        sexo: 'Femenino',
        tipoDocumento: 'DNI',
        numeroDocumento: '46219803',
        numeroHc: '2022-09321',
        seguro: 'Rímac Seguros',
        seguroClase: 'bg-red-50 text-red-700 border-red-200',
        ultimaAtencion: {
          especialidad: 'Ginecología',
          medico: 'Consultorio C-104',
        },
        estado: 'En Espera',
        estadoClase: 'bg-orange-100 text-orange-800',
        telefono: '+51 977 889 900',
        email: 'ana.salcedo@gmail.com',
        direccion: 'Calle Las Begonias 789, San Isidro',
        alergias: 'Ninguna conocida',
        diagnosticoReciente: 'Z01.4 - Examen ginecológico de rutina',
        medicoTratante: 'Dra. Valdivia',
      },
    ];

    // Consultar si hay nuevos pacientes creados en la BD
=======
>>>>>>> Stashed changes
    try {
      // DISTINCT ON elimina duplicados por nombre completo, conservando el registro más antiguo
      const rows = await this.dataSource.query(
        `SELECT DISTINCT ON (p.nombres, p.apellido_paterno, p.apellido_materno)
           p.id,
           p.tipo_documento,
           p.numero_documento,
           p.nombres,
           p.apellido_paterno,
           p.apellido_materno,
           p.fecha_nacimiento,
           p.sexo,
           p.telefono,
           p.email,
           p.direccion,
           COALESCE(c.nombre, 'Particular') AS seguro,
           pc.nro_poliza,
           (
             SELECT string_agg(a.descripcion, ', ')
             FROM pacientes.antecedente a
             WHERE a.paciente_id = p.id AND a.tipo = 'alergia'
           ) AS alergias,
           (
             SELECT dx.codigo || ' - ' || dx.descripcion
             FROM hce.entrada e
             JOIN hce.diagnostico d ON d.entrada_id = e.id
             JOIN hce.cie10 dx ON dx.codigo = d.cie10_codigo
             WHERE e.paciente_id = p.id
             ORDER BY e.fecha DESC
             LIMIT 1
           ) AS diagnostico_reciente,
           (
             SELECT u.nombres || ' ' || u.apellidos
             FROM hce.entrada e
             JOIN agenda.medico m ON m.id = e.medico_id
             JOIN seguridad.usuario u ON u.id = m.usuario_id
             WHERE e.paciente_id = p.id
             ORDER BY e.fecha DESC
             LIMIT 1
           ) AS medico_tratante,
           (
             SELECT esp.nombre
             FROM hce.entrada e
             JOIN agenda.medico m ON m.id = e.medico_id
             JOIN agenda.especialidad esp ON esp.id = m.especialidad_id
             WHERE e.paciente_id = p.id
             ORDER BY e.fecha DESC
             LIMIT 1
           ) AS especialidad_reciente,
           (
             SELECT ci.estado
             FROM agenda.cita ci
             WHERE ci.paciente_id = p.id
             ORDER BY ci.inicio DESC
             LIMIT 1
           ) AS estado_cita
         FROM pacientes.paciente p
         LEFT JOIN facturacion.paciente_convenio pc ON pc.paciente_id = p.id
         LEFT JOIN facturacion.convenio c ON c.id = pc.convenio_id
         ORDER BY p.nombres, p.apellido_paterno, p.apellido_materno, p.creado_en ASC`,
      );

      let lista: PacienteDirectorio[] = rows.map((bp: any) => {
        const nombres = bp.nombres;
        const apellidos = `${bp.apellido_paterno} ${bp.apellido_materno || ''}`.trim();
        const nombreCompleto = `${nombres} ${apellidos}`;
        const iniciales = `${nombres.charAt(0)}${bp.apellido_paterno.charAt(0)}`.toUpperCase();
        const birthYear = bp.fecha_nacimiento ? new Date(bp.fecha_nacimiento).getFullYear() : 1990;
        const edad = new Date().getFullYear() - birthYear;
        const seguroLimpio = (bp.seguro || 'Particular').replace(' (ficticia)', '');

        let seguroClase = 'bg-slate-100 text-slate-700 border-slate-200';
        if (/Andina|Rímac/i.test(seguroLimpio)) {
          seguroClase = 'bg-red-50 text-red-700 border-red-200';
        } else if (/Vida Plena|Pacífico/i.test(seguroLimpio)) {
          seguroClase = 'bg-blue-50 text-blue-700 border-blue-200';
        } else if (/Costa Azul|Sanitas/i.test(seguroLimpio)) {
          seguroClase = 'bg-sky-50 text-sky-700 border-sky-200';
        } else if (/SOAT/i.test(seguroLimpio)) {
          seguroClase = 'bg-purple-50 text-purple-700 border-purple-200';
        }

        let estadoTexto = 'Activo';
        let estadoClase = 'bg-emerald-100 text-emerald-800';
        if (bp.estado_cita === 'programada') {
          estadoTexto = 'Cita Agendada';
          estadoClase = 'bg-blue-100 text-blue-800';
        } else if (bp.estado_cita === 'atendida') {
          estadoTexto = 'Atendido';
          estadoClase = 'bg-slate-100 text-slate-700';
        } else if (bp.estado_cita === 'confirmada') {
          estadoTexto = 'Confirmada';
          estadoClase = 'bg-indigo-100 text-indigo-800';
        } else if (bp.estado_cita === 'cancelada') {
          estadoTexto = 'Cita Cancelada';
          estadoClase = 'bg-rose-100 text-rose-800';
        } else if (bp.estado_cita === 'inasistencia') {
          estadoTexto = 'Inasistencia';
          estadoClase = 'bg-amber-100 text-amber-800';
        }

        const ultEsp = bp.especialidad_reciente || 'Medicina General';
        const ultMed = bp.medico_tratante ? `Dr(a). ${bp.medico_tratante}` : 'Consultorios externos';

        return {
          id: bp.id,
          nombres,
          apellidos,
          nombreCompleto,
          iniciales,
          edad,
          sexo: bp.sexo === 'M' || bp.sexo === 'Masculino' ? 'Masculino' : 'Femenino',
          tipoDocumento: bp.tipo_documento || 'DNI',
          numeroDocumento: bp.numero_documento,
          numeroHc: `HC-${bp.numero_documento.slice(-6)}`,
          seguro: seguroLimpio,
          seguroClase,
          ultimaAtencion: {
            especialidad: ultEsp,
            medico: ultMed,
          },
          estado: estadoTexto,
          estadoClase,
          telefono: bp.telefono || '+51 900 000 000',
          email: bp.email || `${bp.numero_documento}@clinica.pe`,
          direccion: bp.direccion || 'Sede San Borja',
          alergias: bp.alergias || 'Ninguna registrada',
          diagnosticoReciente: bp.diagnostico_reciente || 'Control médico preventivo',
          medicoTratante: ultMed,
        };
      });

      // Filtro por texto si existe
      if (q && q.trim()) {
        const term = q.trim().toLowerCase();
        lista = lista.filter(
          (p) =>
            p.nombreCompleto.toLowerCase().includes(term) ||
            p.numeroDocumento.includes(term) ||
            p.numeroHc.toLowerCase().includes(term),
        );
      }

      // Filtro rápido si existe
      if (filtro && filtro !== 'todos') {
        if (filtro === 'citas') {
          lista = lista.filter((p) => p.estado.toLowerCase().includes('cita') || p.estado.toLowerCase().includes('agendada'));
        } else if (filtro === 'triaje') {
          lista = lista.filter((p) => p.estado.toLowerCase().includes('triaje') || p.estado.toLowerCase().includes('espera'));
        } else if (filtro === 'atendidos') {
          lista = lista.filter((p) => p.estado.toLowerCase().includes('atendido'));
        }
      }

      return lista;
    } catch (err: any) {
      console.error('Error al obtener directorio de pacientes desde BD:', err.message);
      return [];
    }
  }

  async crearPaciente(dto: CrearPacienteDto): Promise<{ success: boolean; id: string; mensaje: string }> {
    if (!dto.numeroDocumento || !dto.nombres || !dto.apellidoPaterno) {
      throw new BadRequestException('Documento, nombres y apellido paterno son requeridos');
    }

    const creadorId = dto.creadoPor || '10000000-0000-7000-8000-000000000001';
    const emailDefault = dto.email || `${dto.nombres.toLowerCase().replace(/\s+/g, '')}@ejemplo.pe`;
    const canal = dto.canalRecordatorio || 'email';

    const insertResult = await this.dataSource.query(
      `INSERT INTO pacientes.paciente
         (tipo_documento, numero_documento, nombres, apellido_paterno, apellido_materno,
          fecha_nacimiento, sexo, telefono, email, direccion, canal_recordatorio, creado_por)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id`,
      [
        dto.tipoDocumento || 'DNI',
        dto.numeroDocumento,
        dto.nombres,
        dto.apellidoPaterno,
        dto.apellidoMaterno || '',
        dto.fechaNacimiento || '1995-01-01',
        dto.sexo || 'F',
        dto.telefono || null,
        emailDefault,
        dto.direccion || null,
        canal,
        creadorId,
      ],
    );

    const pacienteId = insertResult[0]?.id;

    // Si tiene alergias, insertar antecedente
    if (dto.alergias) {
      try {
        await this.dataSource.query(
          `INSERT INTO pacientes.antecedente (paciente_id, tipo, descripcion, registrado_por)
           VALUES ($1, 'alergia', $2, $3)`,
          [pacienteId, dto.alergias, creadorId],
        );
      } catch (err) {
        console.warn('Error registrando antecedente:', err);
      }
    }

    // Registrar en auditoria.bitacora
    try {
      await this.dataSource.query(
        `INSERT INTO auditoria.bitacora (usuario_id, accion, recurso, recurso_id, paciente_id, detalle)
         VALUES ($1, 'ESCRITURA', 'pacientes.paciente', $2, $2, $3::jsonb)`,
        [
          creadorId,
          pacienteId,
          JSON.stringify({
            accion: 'REGISTRAR_PACIENTE',
            documento: dto.numeroDocumento,
            nombreCompleto: `${dto.nombres} ${dto.apellidoPaterno}`,
          }),
        ],
      );
    } catch (err) {
      console.error('Error auditoria bitacora paciente:', err);
    }

    return {
      success: true,
      id: pacienteId,
      mensaje: `Paciente ${dto.nombres} ${dto.apellidoPaterno} registrado con éxito con HC generada.`,
    };
  }
}
