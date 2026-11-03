export class CrearPacienteDto {
  tipoDocumento!: 'DNI' | 'CE' | 'PASAPORTE';
  numeroDocumento!: string;
  nombres!: string;
  apellidoPaterno!: string;
  apellidoMaterno!: string;
  fechaNacimiento!: string;
  sexo!: 'M' | 'F';
  telefono?: string;
  email?: string;
  direccion?: string;
  canalRecordatorio?: 'email' | 'sms';
  seguro?: string;
  alergias?: string;
  creadoPor?: string;
}

