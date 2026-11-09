export class ItemComprobanteDto {
  conceptoId!: number;
  descripcion!: string;
  cantidad!: number;
  precioUnitario!: number;
  copagoMonto!: number;
}

export class EmitirComprobanteDto {
  pacienteId!: string;
  citaId?: string;
  convenioId!: number;
  tipo!: 'boleta' | 'factura';
  serie!: string;
  metodoPago!: 'pos' | 'yape' | 'efectivo';
  referenciaPos?: string;
  items!: ItemComprobanteDto[];
  emitidoPor?: string;
}

