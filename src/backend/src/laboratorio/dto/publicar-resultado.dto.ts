export class PublicarResultadoDto {
  ordenItemId!: string;
  pacienteId!: string;
  colTotal?: number;
  trigliceridos?: number;
  colHdl?: number;
  colLdl?: number;
  resultadoValor?: string;
  unidad?: string;
  rangoReferencia?: string;
  observaciones!: string;
  archivoUrl?: string;
  registradoPor!: string;
}
