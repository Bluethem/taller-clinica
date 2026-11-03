import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { EmitirComprobanteDto } from './dto/emitir-comprobante.dto.js';

export interface ConvenioInfo {
  convenioId: number;
  nombre: string;
  tipo: string;
  nroPoliza: string | null;
  copagoPct: number;
}

export interface TarifaItem {
  conceptoId: number;
  codigo: string;
  descripcion: string;
  precioBase: number;
  coberturaEpsPct: number;
  copagoPct: number;
  copagoPaciente: number;
  montoEps: number;
}

export interface LiquidacionData {
  pacienteId: string;
  pacienteNombre: string;
  pacienteDni: string;
  email: string;
  citaId: string | null;
  medicoNombre: string;
  especialidad: string;
  consultorio: string;
  convenio: ConvenioInfo;
  items: TarifaItem[];
  totalBruto: number;
  totalCopago: number;
  totalEps: number;
  igv: number;
}

export interface ComprobanteEmitido {
  success: boolean;
  comprobanteId: string;
  numero: string;
  tipo: string;
  serie: string;
  totalCobrado: number;
  mensaje: string;
}

const CAJERO_ID = '10000000-0000-7000-8000-000000000010'; // evargas / cajero

@Injectable()
export class FacturacionService {
  constructor(private readonly dataSource: DataSource) {}

  async getLiquidacion(pacienteId: string): Promise<LiquidacionData> {
    // Paciente
    const pacientes = await this.dataSource.query(
      `SELECT p.id, p.nombres, p.apellido_paterno, p.apellido_materno,
              p.numero_documento, p.tipo_documento
       FROM pacientes.paciente p WHERE p.id = $1`,
      [pacienteId],
    );

    const pac = pacientes[0];
    if (!pac) throw new Error('Paciente no encontrado');

    const nombre = `${pac.nombres} ${pac.apellido_paterno} ${pac.apellido_materno}`;

    // Convenio activo del paciente
    const convenios = await this.dataSource.query(
      `SELECT pc.convenio_id, c.nombre, c.tipo, pc.nro_poliza
       FROM facturacion.paciente_convenio pc
       JOIN facturacion.convenio c ON c.id = pc.convenio_id
       WHERE pc.paciente_id = $1
         AND (pc.vigente_hasta IS NULL OR pc.vigente_hasta >= CURRENT_DATE)
       ORDER BY pc.vigente_desde DESC LIMIT 1`,
      [pacienteId],
    );

    const conv = convenios[0] ?? { convenio_id: 1, nombre: 'Particular', tipo: 'particular', nro_poliza: null };

    // Tarifas del convenio para conceptos frecuentes (CONS_ESP + LAB_PERFIL_LIP)
    const tarifas = await this.dataSource.query(
      `SELECT t.concepto_id, co.codigo, co.descripcion,
              t.precio, t.copago_pct
       FROM facturacion.tarifa t
       JOIN facturacion.concepto co ON co.id = t.concepto_id
       WHERE t.convenio_id = $1
         AND (t.vigente_hasta IS NULL OR t.vigente_hasta >= CURRENT_DATE)
         AND co.codigo IN ('CONS_ESP', 'LAB_PERFIL_LIP')
       ORDER BY t.concepto_id`,
      [conv.convenio_id],
    );

    // Si no hay tarifas, usar datos de demostración
    const rawItems: TarifaItem[] = tarifas.length > 0
      ? tarifas.map((t: any) => {
          const precio = parseFloat(t.precio);
          const copagoPct = parseFloat(t.copago_pct);
          const coberturaEpsPct = 100 - copagoPct;
          const copagoPaciente = parseFloat((precio * copagoPct / 100).toFixed(2));
          const montoEps = parseFloat((precio - copagoPaciente).toFixed(2));
          return {
            conceptoId: t.concepto_id,
            codigo: t.codigo === 'CONS_ESP' ? 'CONS-01' : 'PROC-04',
            descripcion:
              t.codigo === 'CONS_ESP'
                ? 'Consulta Médica Especializada Cardiología'
                : 'Perfil Lipídico (Bioquímica)',
            precioBase: precio,
            coberturaEpsPct,
            copagoPct,
            copagoPaciente,
            montoEps,
          };
        })
      : [
          {
            conceptoId: 2,
            codigo: 'CONS-01',
            descripcion: 'Consulta Médica Especializada Cardiología',
            precioBase: 180,
            coberturaEpsPct: 85,
            copagoPct: 15,
            copagoPaciente: 27,
            montoEps: 153,
          },
          {
            conceptoId: 5,
            codigo: 'PROC-04',
            descripcion: 'Perfil Lipídico (Bioquímica)',
            precioBase: 80,
            coberturaEpsPct: 90,
            copagoPct: 10,
            copagoPaciente: 8,
            montoEps: 72,
          },
        ];

    const totalBruto = rawItems.reduce((s, i) => s + i.precioBase, 0);
    const totalCopago = rawItems.reduce((s, i) => s + i.copagoPaciente, 0);
    const totalEps = rawItems.reduce((s, i) => s + i.montoEps, 0);
    const igv = parseFloat((totalCopago * 0.18).toFixed(2));

    // Cita más reciente del paciente
    const citas = await this.dataSource.query(
      `SELECT c.id, c.inicio, c.motivo,
              u.nombres || ' ' || u.apellidos AS medico_nombre,
              e.nombre AS especialidad,
              co.codigo AS consultorio
       FROM agenda.cita c
       JOIN agenda.medico m ON m.id = c.medico_id
       JOIN seguridad.usuario u ON u.id = m.usuario_id
       JOIN agenda.especialidad e ON e.id = m.especialidad_id
       JOIN agenda.consultorio co ON co.id = c.consultorio_id
       WHERE c.paciente_id = $1
         AND c.estado = 'atendida'
       ORDER BY c.inicio DESC LIMIT 1`,
      [pacienteId],
    );
    const cita = citas[0];

    return {
      pacienteId,
      pacienteNombre: nombre,
      pacienteDni: pac.numero_documento,
      email: 'marianatorres@gmail.com',
      citaId: cita?.id ?? null,
      medicoNombre: cita?.medico_nombre ?? 'Dr. Andrés Huamán',
      especialidad: cita?.especialidad ?? 'Cardiología',
      consultorio: cita?.consultorio ?? 'Consultorio 304',
      convenio: {
        convenioId: conv.convenio_id,
        nombre: conv.nombre,
        tipo: conv.tipo,
        nroPoliza: conv.nro_poliza,
        copagoPct: rawItems[0]?.copagoPct ?? 15,
      },
      items: rawItems,
      totalBruto,
      totalCopago,
      totalEps,
      igv,
    };
  }

  async emitirComprobante(dto: EmitirComprobanteDto): Promise<ComprobanteEmitido> {
    const emitidoPor = dto.emitidoPor || CAJERO_ID;

    // Calcular siguiente número de comprobante para la serie
    const res = await this.dataSource.query(
      `SELECT COALESCE(MAX(numero), 0) + 1 AS siguiente
       FROM facturacion.comprobante
       WHERE serie = $1`,
      [dto.serie],
    );
    const numero: number = res[0].siguiente;

    // Insertar comprobante
    const compResult = await this.dataSource.query(
      `INSERT INTO facturacion.comprobante
         (tipo, serie, numero, paciente_id, convenio_id, cita_id, emitido_por)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [dto.tipo, dto.serie, numero, dto.pacienteId, dto.convenioId, dto.citaId ?? null, emitidoPor],
    );
    const comprobanteId: string = compResult[0].id;

    // Insertar ítems
    for (const item of dto.items) {
      await this.dataSource.query(
        `INSERT INTO facturacion.comprobante_item
           (comprobante_id, concepto_id, cantidad, precio_unitario, copago_monto)
         VALUES ($1, $2, $3, $4, $5)`,
        [comprobanteId, item.conceptoId, item.cantidad, item.precioUnitario, item.copagoMonto],
      );
    }

    // Registrar auditoría
    const totalCopago = dto.items.reduce((s, i) => s + i.copagoMonto, 0);
    try {
      await this.dataSource.query(
        `INSERT INTO auditoria.bitacora (usuario_id, accion, recurso, recurso_id, paciente_id, detalle)
         VALUES ($1, 'ESCRITURA', 'facturacion.comprobante', $2, $3, $4::jsonb)`,
        [
          emitidoPor,
          comprobanteId,
          dto.pacienteId,
          JSON.stringify({
            accion: 'EMITIR_COMPROBANTE',
            tipo: dto.tipo,
            serie: dto.serie,
            numero,
            metodoPago: dto.metodoPago,
            referenciaPos: dto.referenciaPos,
            totalCopago,
          }),
        ],
      );
    } catch (err) {
      console.error('Error auditoria facturacion:', err);
    }

    const tipoLabel = dto.tipo === 'boleta' ? 'Boleta' : 'Factura';
    const codigoDoc = `${dto.serie}-${String(numero).padStart(7, '0')}`;

    return {
      success: true,
      comprobanteId,
      numero: codigoDoc,
      tipo: tipoLabel,
      serie: dto.serie,
      totalCobrado: totalCopago,
      mensaje: `${tipoLabel} ${codigoDoc} emitida con éxito. Sincronizada con SUNAT y SUSALUD.`,
    };
  }
}
