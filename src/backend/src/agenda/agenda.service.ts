import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CrearCitaDto } from './dto/crear-cita.dto.js';

export { CrearCitaDto };

export interface Especialidad {
  id: number;
  nombre: string;
}

export interface Medico {
  id: string;
  nombres: string;
  apellidos: string;
  especialidad: string;
  especialidadId: number;
  cmp: string;
  rne?: string;
  consultorio?: string;
  subespecialidad?: string;
  avatarUrl?: string;
}

const MEDICOS_META: Record<string, { rne: string; consultorio: string; subespecialidad: string; avatarUrl?: string }> = {
  CMP90004: {
    rne: 'RNE 23981',
    consultorio: 'Consultorio C-201 (Pabellón C, 2.° Piso)',
    subespecialidad: 'Cardiología Clínica',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC9sHmOxrLsfAvyLb8Z5xju-80UH0pOHyUsB54rWdcTircUlveBH86a9XUl9bB6zxr0t9qJKQX8XyfuuLXYaBLM867tB9vyUU20MwU1L3B7Pm_bXtXPsGkS24fMVxDaviSubMkQTSIxYjL6OBrmizb8HYbQzGBUpoELD4Z3ZRAypAYU6IvdKFW-SdUD-QzMe3yRMMwwDPYi8aRO7pkeJ9OhRhlicluvPBrkzylVTwned8bYKzQGBqvX',
  },
  CMP51042: {
    rne: 'RNE 28114',
    consultorio: 'Consultorio C-204 (Pabellón C, 2.° Piso)',
    subespecialidad: 'Cardiología No Invasiva',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAW3McX_1FrH95XFOBKjnK3a2oAGO9dn3ju1aM4B4i72nAjn0RKiy1rOuvw2mq0oyVCowyOs1msWX8qNbURcPuv8SJZtVCcFR6NMzXOmFjdQWOlNu7rzaqsjhb-FbFNPaPst57pXw8lfnMzog4jpbXAmxg-AKgPwK4qw5xyCyPTPRZvHjS_VY16dIXYp3ZGPCAwDJPoliHNfn0AMGpKGJPPY7_6PsEaXqgRfgZFk8PF4Paq-r9pKI-_',
  },
  CMP48312: {
    rne: 'RNE 31205',
    consultorio: 'Consultorio C-202 (Pabellón C, 2.° Piso)',
    subespecialidad: 'Electrofisiología y Arritmias',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAcQd5NfU0eD7LqiiQz8upCu_HRFKgbdVcj1jVfziNVQ1V2MVd4KxTPuntLzY42T87dtfaTI3FbDQ3-TYFcXB313aFF_KFL8WU0Fmg9E2azsAImYlloD3ja2uLD5EFet-6uagP5_G6KjpvbXFfE2e3hB8tHL-eAp5g1fpqcBSbovify-kykJwNWJBjGSRdvsjJUP6pezflMsHecKtS-9T20q01WKwv5egvy45MhXTWiDjNSIyv8q8Be',
  },
  CMP90001: {
    rne: 'RNE 19842',
    consultorio: 'Consultorio C-101 (Pabellón A, 1.er Piso)',
    subespecialidad: 'Medicina Familiar e Integral',
  },
  CMP52100: {
    rne: 'RNE 22104',
    consultorio: 'Consultorio C-102 (Pabellón A, 1.er Piso)',
    subespecialidad: 'Medicina Preventiva y Ocupacional',
  },
  CMP90002: {
    rne: 'RNE 21008',
    consultorio: 'Consultorio C-205 (Pabellón C, 2.° Piso)',
    subespecialidad: 'Ginecología y Obstetricia General',
  },
  CMP47650: {
    rne: 'RNE 27610',
    consultorio: 'Consultorio C-206 (Pabellón C, 2.° Piso)',
    subespecialidad: 'Ginecología Oncológica y Menopausia',
  },
  CMP90003: {
    rne: 'RNE 25410',
    consultorio: 'Consultorio C-103 (Pabellón B, 1.er Piso)',
    subespecialidad: 'Pediatría General y Neonatología',
  },
  CMP49880: {
    rne: 'RNE 28930',
    consultorio: 'Consultorio C-104 (Pabellón B, 1.er Piso)',
    subespecialidad: 'Crecimiento y Desarrollo Infantil',
  },
  CMP90005: {
    rne: 'RNE 29401',
    consultorio: 'Consultorio C-105 (Pabellón A, 1.er Piso)',
    subespecialidad: 'Traumatología y Cirugía Articular',
  },
  CMP43290: {
    rne: 'RNE 26315',
    consultorio: 'Consultorio C-106 (Pabellón A, 1.er Piso)',
    subespecialidad: 'Ortopedia y Traumatología Deportiva',
  },
};

export interface Paciente {
  id: string;
  tipo_documento: string;
  numero_documento: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  fecha_nacimiento: string | null;
}

export interface SlotDisponible {
  fecha: string;        // ISO date YYYY-MM-DD
  hora: string;         // HH:MM
  inicio: string;       // ISO datetime
  fin: string;          // ISO datetime
  disponible: boolean;
}


@Injectable()
export class AgendaService {
  constructor(private readonly dataSource: DataSource) {}

  async getEspecialidades(): Promise<Especialidad[]> {
    const rows = await this.dataSource.query(
      `SELECT id, nombre FROM agenda.especialidad ORDER BY nombre`,
    );
    return rows;
  }

  async getMedicosByEspecialidad(especialidadId: number): Promise<Medico[]> {
    const rows = await this.dataSource.query(
      `SELECT m.id, u.nombres, u.apellidos, e.nombre as especialidad, e.id as "especialidadId", m.cmp
       FROM agenda.medico m
       JOIN seguridad.usuario u ON u.id = m.usuario_id
       JOIN agenda.especialidad e ON e.id = m.especialidad_id
       WHERE m.especialidad_id = $1 AND m.activo = true
       ORDER BY u.apellidos`,
      [especialidadId],
    );
    return rows.map((r: any) => {
      const meta = MEDICOS_META[r.cmp] || {
        rne: 'RNE General',
        consultorio: 'Consultorio C-101 (Sede San Borja)',
        subespecialidad: r.especialidad,
      };
      return {
        ...r,
        ...meta,
      };
    });
  }

  async buscarPaciente(query: string): Promise<Paciente[]> {
    const q = `%${query.toLowerCase()}%`;
    const rows = await this.dataSource.query(
      `SELECT id, tipo_documento, numero_documento, nombres,
              apellido_paterno, apellido_materno, fecha_nacimiento
       FROM pacientes.paciente
       WHERE LOWER(numero_documento) LIKE $1
          OR LOWER(apellido_paterno) LIKE $1
          OR LOWER(apellido_materno) LIKE $1
          OR LOWER(nombres) LIKE $1
       ORDER BY apellido_paterno
       LIMIT 10`,
      [q],
    );
    return rows;
  }

  async getSlotsDisponibles(medicoId: string, fechaInicio: string, fechaFin: string): Promise<SlotDisponible[]> {
    // Horario estándar: 08:00 a 17:30, franjas de 30 minutos
    const slots: SlotDisponible[] = [];
    const horas = [
      '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
      '11:00', '11:30', '14:00', '14:30', '15:00', '15:30',
      '16:00', '16:30', '17:00', '17:30',
    ];

    // Citas ocupadas del médico en el rango
    const citasOcupadas = await this.dataSource.query(
      `SELECT inicio, fin FROM agenda.cita
       WHERE medico_id = $1
         AND inicio >= $2::timestamptz
         AND inicio < $3::timestamptz
         AND estado != 'cancelada'`,
      [medicoId, fechaInicio, fechaFin],
    );

    const ocupadas = new Set(
      citasOcupadas.map((c: { inicio: string }) => new Date(c.inicio).toISOString()),
    );

    // Generar slots día por día dentro del rango (lunes a viernes)
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);

    for (let d = new Date(inicio); d < fin; d.setDate(d.getDate() + 1)) {
      const diaSemana = d.getDay(); // 0=dom, 6=sab
      if (diaSemana === 0 || diaSemana === 6) continue;

      const fechaStr = d.toISOString().split('T')[0];

      for (const hora of horas) {
        const [h, m] = hora.split(':').map(Number);
        const slotInicio = new Date(`${fechaStr}T${hora}:00-05:00`); // Lima UTC-5
        const slotFin = new Date(slotInicio.getTime() + 30 * 60 * 1000);

        slots.push({
          fecha: fechaStr,
          hora,
          inicio: slotInicio.toISOString(),
          fin: slotFin.toISOString(),
          disponible: !ocupadas.has(slotInicio.toISOString()),
        });
      }
    }

    return slots;
  }

  async crearCita(dto: CrearCitaDto): Promise<{ id: string; folio: string }> {
    const inicio = new Date(dto.inicio);
    const fin = new Date(inicio.getTime() + 30 * 60 * 1000);

    // Obtener consultorio del médico (primer consultorio del piso del médico o C-101 por defecto)
    const consultorios = await this.dataSource.query(
      `SELECT id FROM agenda.consultorio ORDER BY id LIMIT 1`,
    );
    const consultorioId = consultorios[0]?.id ?? 1;

    const result = await this.dataSource.query(
      `INSERT INTO agenda.cita (paciente_id, medico_id, consultorio_id, inicio, fin, motivo, estado, creado_por)
       VALUES ($1, $2, $3, $4, $5, $6, 'programada', $7)
       RETURNING id`,
      [
        dto.pacienteId,
        dto.medicoId,
        consultorioId,
        inicio.toISOString(),
        fin.toISOString(),
        dto.motivo,
        dto.creadoPor,
      ],
    );

    const citaId: string = result[0].id;
    // Folio legible tipo CIT-YYYY-XXXX
    const folio = `CIT-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`;

    // Registrar en auditoría
    try {
      await this.dataSource.query(
        `INSERT INTO auditoria.bitacora (usuario_id, accion, recurso, recurso_id, paciente_id, detalle)
         VALUES ($1, 'ESCRITURA', 'agenda.cita', $2, $3, $4::jsonb)`,
        [
          dto.creadoPor,
          citaId,
          dto.pacienteId,
          JSON.stringify({ accion: 'CREAR_CITA', folio, inicio: dto.inicio }),
        ],
      );
    } catch (err) {
      console.error('Auditoría cita:', err);
    }

    return { id: citaId, folio };
  }
}

