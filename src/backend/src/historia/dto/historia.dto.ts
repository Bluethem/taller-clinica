export class AnularEntradaDto {
  entradaId!: string;
  motivo!: string;
}

export class CrearConsultaDto {
  pacienteId!: string;
  medicoId?: string;
  motivoConsulta!: string;
  enfermedadActual!: string;
  examenFisico?: string;
  diagnosticoCie10!: string;
  prescripcion?: string;
}
