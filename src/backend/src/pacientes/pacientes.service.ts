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
