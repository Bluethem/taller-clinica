export class AnularEntradaDto {
  entradaId!: string;
  motivo!: string;
  anuladoPor?: string;
}

export class CrearConsultaDto {
  pacienteId!: string;
  medicoId?: string;
  motivoConsulta!: string;
  enfermedadActual!: string;
  examenFisico?: string;
  diagnosticoCie10?: string;
  prescripcion?: string;
  creadoPor?: string;
}

