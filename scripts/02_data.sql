-- =====================================================================
-- Script 2/2: datos de prueba (TODOS FICTICIOS: nombres, documentos,
-- teléfonos, correos, pólizas y aseguradoras no corresponden a personas
-- ni empresas reales). Ejecutar después de 01_schema.sql.
-- Zona horaria de las citas: Lima (UTC-05).
-- =====================================================================
BEGIN;

-- ---------- Seguridad ----------
INSERT INTO seguridad.rol (nombre, descripcion) VALUES
 ('medico','Consulta y registra la HCE'),
 ('enfermera','Consulta la HCE y registra información de atención'),
 ('admision','Registra pacientes y gestiona citas'),
 ('administrador','Gestiona usuarios, roles y configuración'),
 ('laboratorio','Registra órdenes y resultados'),
 ('cajero','Emite comprobantes y gestiona glosas'),
 ('gerencia','Consulta reportes gerenciales');

-- Hashes Argon2id de la contraseña demo compartida: password1234 (solo desarrollo)
INSERT INTO seguridad.usuario (id, username, nombres, apellidos, email, password_hash, rol_id) VALUES
 ('10000000-0000-7000-8000-000000000001','lparedes','Lucía','Paredes Vega','lparedes@sanrafael.example.pe','$argon2id$v=19$m=65536,t=3,p=4$NNi7foQqsrlconfaIfsSGA$yl0x3phkoOYlBRXc5X5paCDPhc/jkWakBt9g70OFVs4',1),
 ('10000000-0000-7000-8000-000000000002','msalazar','Marco','Salazar Rojas','msalazar@sanrafael.example.pe','$argon2id$v=19$m=65536,t=3,p=4$NNi7foQqsrlconfaIfsSGA$yl0x3phkoOYlBRXc5X5paCDPhc/jkWakBt9g70OFVs4',1),
 ('10000000-0000-7000-8000-000000000003','cquispe','Carla','Quispe Mendoza','cquispe@sanrafael.example.pe','$argon2id$v=19$m=65536,t=3,p=4$NNi7foQqsrlconfaIfsSGA$yl0x3phkoOYlBRXc5X5paCDPhc/jkWakBt9g70OFVs4',1),
 ('10000000-0000-7000-8000-000000000004','ahuaman','Andrés','Huamán Torres','ahuaman@sanrafael.example.pe','$argon2id$v=19$m=65536,t=3,p=4$NNi7foQqsrlconfaIfsSGA$yl0x3phkoOYlBRXc5X5paCDPhc/jkWakBt9g70OFVs4',1),
 ('10000000-0000-7000-8000-000000000005','vcardenas','Valeria','Cárdenas Ríos','vcardenas@sanrafael.example.pe','$argon2id$v=19$m=65536,t=3,p=4$NNi7foQqsrlconfaIfsSGA$yl0x3phkoOYlBRXc5X5paCDPhc/jkWakBt9g70OFVs4',1),
 ('10000000-0000-7000-8000-000000000006','rmedina','Rosa','Medina Flores','rmedina@sanrafael.example.pe','$argon2id$v=19$m=65536,t=3,p=4$NNi7foQqsrlconfaIfsSGA$yl0x3phkoOYlBRXc5X5paCDPhc/jkWakBt9g70OFVs4',2),
 ('10000000-0000-7000-8000-000000000007','dramos','Diego','Ramos León','dramos@sanrafael.example.pe','$argon2id$v=19$m=65536,t=3,p=4$NNi7foQqsrlconfaIfsSGA$yl0x3phkoOYlBRXc5X5paCDPhc/jkWakBt9g70OFVs4',3),
 ('10000000-0000-7000-8000-000000000008','scampos','Sofía','Campos Aguirre','scampos@sanrafael.example.pe','$argon2id$v=19$m=65536,t=3,p=4$NNi7foQqsrlconfaIfsSGA$yl0x3phkoOYlBRXc5X5paCDPhc/jkWakBt9g70OFVs4',4),
 ('10000000-0000-7000-8000-000000000009','jnavarro','Julio','Navarro Peña','jnavarro@sanrafael.example.pe','$argon2id$v=19$m=65536,t=3,p=4$NNi7foQqsrlconfaIfsSGA$yl0x3phkoOYlBRXc5X5paCDPhc/jkWakBt9g70OFVs4',5),
 ('10000000-0000-7000-8000-000000000010','evargas','Elena','Vargas Soto','evargas@sanrafael.example.pe','$argon2id$v=19$m=65536,t=3,p=4$NNi7foQqsrlconfaIfsSGA$yl0x3phkoOYlBRXc5X5paCDPhc/jkWakBt9g70OFVs4',6),
 ('10000000-0000-7000-8000-000000000011','rluna','Ricardo','Luna Herrera','rluna@sanrafael.example.pe','$argon2id$v=19$m=65536,t=3,p=4$NNi7foQqsrlconfaIfsSGA$yl0x3phkoOYlBRXc5X5paCDPhc/jkWakBt9g70OFVs4',7);

-- ---------- Pacientes (registrados por admisión: Diego Ramos) ----------
INSERT INTO pacientes.paciente (id, tipo_documento, numero_documento, nombres, apellido_paterno, apellido_materno, fecha_nacimiento, sexo, telefono, email, direccion, canal_recordatorio, creado_por) VALUES
 ('20000000-0000-7000-8000-000000000001','DNI','70000001','Mariana','Torres','Quispe','1988-03-14','F','900000001','mariana.torres@example.pe','Av. Ficticia 101, San Borja','email','10000000-0000-7000-8000-000000000007'),
 ('20000000-0000-7000-8000-000000000002','DNI','70000002','Luis Alberto','Gutiérrez','Ñahui','1975-11-02','M','900000002','luis.gutierrez@example.pe','Jr. Imaginario 202, Surquillo','email','10000000-0000-7000-8000-000000000007'),
 ('20000000-0000-7000-8000-000000000003','DNI','70000003','Carmen Rosa','Díaz','Alva','1992-07-21','F','900000003',NULL,'Calle Demo 303, San Borja','sms','10000000-0000-7000-8000-000000000007'),
 ('20000000-0000-7000-8000-000000000004','DNI','70000004','José Miguel','Palomino','Cruz','1969-01-30','M','900000004','jose.palomino@example.pe','Av. Prueba 404, La Victoria','sms','10000000-0000-7000-8000-000000000007'),
 ('20000000-0000-7000-8000-000000000005','DNI','70000005','Ana Lucía','Salas','Bedoya','1995-09-09','F','900000005','ana.salas@example.pe','Psje. Test 505, Miraflores','email','10000000-0000-7000-8000-000000000007'),
 ('20000000-0000-7000-8000-000000000006','DNI','70000006','Pedro Pablo','Cáceres','Núñez','1981-05-17','M','900000006','pedro.caceres@example.pe','Av. Modelo 606, San Isidro','email','10000000-0000-7000-8000-000000000007'),
 ('20000000-0000-7000-8000-000000000007','DNI','70000007','Mateo','Rojas','Vilca','2019-12-05','M','900000007','familia.rojas@example.pe','Calle Muestra 707, San Borja','email','10000000-0000-7000-8000-000000000007'),
 ('20000000-0000-7000-8000-000000000008','CE','000123456','Fiorella','Ramírez','Arce','1990-02-28','F','900000008','fiorella.ramirez@example.pe','Av. Simulada 808, Lince','sms','10000000-0000-7000-8000-000000000007');

INSERT INTO pacientes.antecedente (paciente_id, tipo, descripcion, registrado_por) VALUES
 ('20000000-0000-7000-8000-000000000001','personal','Hipertensión arterial en seguimiento','10000000-0000-7000-8000-000000000007'),
 ('20000000-0000-7000-8000-000000000001','alergia','Alergia a penicilina','10000000-0000-7000-8000-000000000007'),
 ('20000000-0000-7000-8000-000000000002','quirurgico','Apendicectomía en 2005','10000000-0000-7000-8000-000000000007'),
 ('20000000-0000-7000-8000-000000000003','familiar','Madre con diabetes mellitus tipo 2','10000000-0000-7000-8000-000000000007'),
 ('20000000-0000-7000-8000-000000000004','habito','Fumador, 10 cigarrillos al día','10000000-0000-7000-8000-000000000007'),
 ('20000000-0000-7000-8000-000000000005','alergia','Alergia a mariscos','10000000-0000-7000-8000-000000000007'),
 ('20000000-0000-7000-8000-000000000007','personal','Esquema de vacunación completo para su edad','10000000-0000-7000-8000-000000000007'),
 ('20000000-0000-7000-8000-000000000008','familiar','Padre con hipertensión arterial','10000000-0000-7000-8000-000000000007');

-- ---------- Agenda: catálogos ----------
INSERT INTO agenda.especialidad (nombre, duracion_cita_min) VALUES
 ('Medicina General',30),('Ginecología',30),('Pediatría',30),('Cardiología',40),('Traumatología',30);   -- ids 1..5

INSERT INTO agenda.consultorio (codigo, piso) VALUES
 ('C-101',1),('C-102',1),('C-103',1),('C-201',2),('C-202',2);                                           -- ids 1..5

INSERT INTO agenda.medico (id, usuario_id, cmp, especialidad_id) VALUES
 ('30000000-0000-7000-8000-000000000001','10000000-0000-7000-8000-000000000001','CMP90001',1),
 ('30000000-0000-7000-8000-000000000002','10000000-0000-7000-8000-000000000002','CMP90002',2),
 ('30000000-0000-7000-8000-000000000003','10000000-0000-7000-8000-000000000003','CMP90003',3),
 ('30000000-0000-7000-8000-000000000004','10000000-0000-7000-8000-000000000004','CMP90004',4),
 ('30000000-0000-7000-8000-000000000005','10000000-0000-7000-8000-000000000005','CMP90005',5);

-- Lunes a viernes: médicos 1-3 de mañana, médicos 4-5 de tarde
INSERT INTO agenda.horario_medico (medico_id, dia_semana, hora_inicio, hora_fin)
SELECT m.id, d, CASE WHEN m.cmp IN ('CMP90001','CMP90002','CMP90003') THEN time '08:00' ELSE time '14:00' END,
              CASE WHEN m.cmp IN ('CMP90001','CMP90002','CMP90003') THEN time '13:00' ELSE time '19:00' END
FROM agenda.medico m CROSS JOIN generate_series(1,5) AS d;

-- ---------- Citas (admisión: Diego Ramos) ----------
-- Los 'atendida' e 'inasistencia' son pasados; los demás, próximos a hoy (09/10/2026).
INSERT INTO agenda.cita (id, paciente_id, medico_id, consultorio_id, inicio, fin, motivo, estado, llegada_en, atencion_inicio_en, creado_por) VALUES
 ('40000000-0000-7000-8000-000000000001','20000000-0000-7000-8000-000000000001','30000000-0000-7000-8000-000000000001',1,'2026-09-14 08:00-05','2026-09-14 08:30-05','Tos persistente y fiebre leve','atendida','2026-09-14 07:55-05','2026-09-14 08:12-05','10000000-0000-7000-8000-000000000007'),
 ('40000000-0000-7000-8000-000000000002','20000000-0000-7000-8000-000000000001','30000000-0000-7000-8000-000000000004',4,'2026-09-21 14:00-05','2026-09-21 14:40-05','Control de presión arterial','atendida','2026-09-21 13:50-05','2026-09-21 14:05-05','10000000-0000-7000-8000-000000000007'),
 ('40000000-0000-7000-8000-000000000003','20000000-0000-7000-8000-000000000002','30000000-0000-7000-8000-000000000001',1,'2026-09-14 08:30-05','2026-09-14 09:00-05','Dolor lumbar','atendida','2026-09-14 08:20-05','2026-09-14 08:35-05','10000000-0000-7000-8000-000000000007'),
 ('40000000-0000-7000-8000-000000000004','20000000-0000-7000-8000-000000000003','30000000-0000-7000-8000-000000000002',2,'2026-09-28 09:00-05','2026-09-28 09:30-05','Control ginecológico anual','atendida','2026-09-28 08:50-05','2026-09-28 09:10-05','10000000-0000-7000-8000-000000000007'),
 ('40000000-0000-7000-8000-000000000005','20000000-0000-7000-8000-000000000004','30000000-0000-7000-8000-000000000005',5,'2026-10-05 14:00-05','2026-10-05 14:30-05','Dolor de rodilla tras accidente de tránsito','atendida','2026-10-05 13:55-05','2026-10-05 14:08-05','10000000-0000-7000-8000-000000000007'),
 ('40000000-0000-7000-8000-000000000006','20000000-0000-7000-8000-000000000007','30000000-0000-7000-8000-000000000003',3,'2026-10-05 08:00-05','2026-10-05 08:30-05','Control de niño sano y vacunas','atendida','2026-10-05 07:50-05','2026-10-05 08:10-05','10000000-0000-7000-8000-000000000007'),
 ('40000000-0000-7000-8000-000000000007','20000000-0000-7000-8000-000000000005','30000000-0000-7000-8000-000000000001',1,'2026-10-05 09:00-05','2026-10-05 09:30-05','Dolor de cabeza recurrente','inasistencia',NULL,NULL,'10000000-0000-7000-8000-000000000007'),
 ('40000000-0000-7000-8000-000000000008','20000000-0000-7000-8000-000000000002','30000000-0000-7000-8000-000000000004',4,'2026-10-12 14:00-05','2026-10-12 14:40-05','Evaluación cardiológica preventiva','confirmada',NULL,NULL,'10000000-0000-7000-8000-000000000007'),
 ('40000000-0000-7000-8000-000000000009','20000000-0000-7000-8000-000000000006','30000000-0000-7000-8000-000000000001',1,'2026-10-13 08:00-05','2026-10-13 08:30-05','Chequeo general','programada',NULL,NULL,'10000000-0000-7000-8000-000000000007'),
 ('40000000-0000-7000-8000-000000000010','20000000-0000-7000-8000-000000000008','30000000-0000-7000-8000-000000000005',5,'2026-10-15 15:00-05','2026-10-15 15:30-05','Dolor de hombro izquierdo','programada',NULL,NULL,'10000000-0000-7000-8000-000000000007'),
 -- cita cancelada: libera el horario 13/10 09:00 (la restricción excluye las canceladas)...
 ('40000000-0000-7000-8000-000000000011','20000000-0000-7000-8000-000000000004','30000000-0000-7000-8000-000000000001',1,'2026-10-13 09:00-05','2026-10-13 09:30-05','Control de resfrío','cancelada',NULL,NULL,'10000000-0000-7000-8000-000000000007'),
 -- ...y otra paciente lo toma
 ('40000000-0000-7000-8000-000000000012','20000000-0000-7000-8000-000000000005','30000000-0000-7000-8000-000000000001',1,'2026-10-13 09:00-05','2026-10-13 09:30-05','Reprogramación de dolor de cabeza','programada',NULL,NULL,'10000000-0000-7000-8000-000000000007');

-- Reprogramación de la cita 09: queda en cita_historial con el valor anterior (RNF04)
SELECT set_config('app.usuario_id','10000000-0000-7000-8000-000000000007', true);
UPDATE agenda.cita SET inicio = '2026-10-14 08:30-05', fin = '2026-10-14 09:00-05'
 WHERE id = '40000000-0000-7000-8000-000000000009';
-- Cancelación de la cita 11 ya nace cancelada en el seed; para ver la acción 'cancelacion' en vivo:
--   UPDATE agenda.cita SET estado = 'cancelada' WHERE id = '...';

INSERT INTO agenda.outbox_evento (tipo, agregado_id, payload, procesado_en) VALUES
 ('CitaProgramada','40000000-0000-7000-8000-000000000008','{"paciente_id":"20000000-0000-7000-8000-000000000002","inicio":"2026-10-12T14:00:00-05:00"}', now()),
 ('CitaProgramada','40000000-0000-7000-8000-000000000010','{"paciente_id":"20000000-0000-7000-8000-000000000008","inicio":"2026-10-15T15:00:00-05:00"}', NULL),
 ('CitaReprogramada','40000000-0000-7000-8000-000000000009','{"paciente_id":"20000000-0000-7000-8000-000000000006","inicio":"2026-10-14T08:30:00-05:00"}', NULL),
 ('CitaProgramada','40000000-0000-7000-8000-000000000012','{"paciente_id":"20000000-0000-7000-8000-000000000005","inicio":"2026-10-13T09:00:00-05:00"}', NULL),
 ('CitaCancelada','40000000-0000-7000-8000-000000000011','{"paciente_id":"20000000-0000-7000-8000-000000000004"}', now());

-- ---------- Notificaciones (recordatorios 24 h antes, HU02) ----------
INSERT INTO notificaciones.recordatorio (cita_id, canal, programado_para, estado, intentos, enviado_en, error) VALUES
 ('40000000-0000-7000-8000-000000000005','sms',  '2026-10-04 14:00-05','enviado',1,'2026-10-04 14:00:21-05',NULL),
 ('40000000-0000-7000-8000-000000000006','email','2026-10-04 08:00-05','enviado',1,'2026-10-04 08:00:09-05',NULL),
 ('40000000-0000-7000-8000-000000000007','email','2026-10-04 09:00-05','enviado',1,'2026-10-04 09:00:12-05',NULL),
 ('40000000-0000-7000-8000-000000000008','email','2026-10-11 14:00-05','pendiente',0,NULL,NULL),
 ('40000000-0000-7000-8000-000000000009','email','2026-10-13 08:30-05','pendiente',0,NULL,NULL),
 ('40000000-0000-7000-8000-000000000010','sms',  '2026-10-14 15:00-05','pendiente',0,NULL,NULL),
 ('40000000-0000-7000-8000-000000000012','email','2026-10-12 09:00-05','fallido',3,NULL,'SMTP: buzón no disponible (simulado)');

-- ---------- HCE ----------
INSERT INTO hce.cie10 (codigo, descripcion) VALUES
 ('J06.9','Infección aguda de las vías respiratorias superiores, no especificada'),
 ('J02.9','Faringitis aguda, no especificada'),
 ('I10','Hipertensión esencial (primaria)'),
 ('M54.5','Lumbago (dolor lumbar bajo)'),
 ('Z01.4','Examen ginecológico (general) (de rutina)'),
 ('M25.5','Dolor articular'),
 ('Z00.1','Control de salud de rutina del niño'),
 ('E11.9','Diabetes mellitus tipo 2 sin mención de complicación'),
 ('K29.7','Gastritis, no especificada'),
 ('R51','Cefalea'),
 ('E78.5','Dislipidemia, no especificada'),
 ('K21.9','Enfermedad por reflujo gastroesofágico sin esofagitis'),
 ('D50.9','Anemia por deficiencia de hierro sin especificación');

INSERT INTO hce.entrada (id, paciente_id, cita_id, medico_id, fecha, motivo_consulta, enfermedad_actual, examen_fisico, corrige_a_id) VALUES
 ('50000000-0000-7000-8000-000000000001','20000000-0000-7000-8000-000000000001','40000000-0000-7000-8000-000000000001','30000000-0000-7000-8000-000000000001','2026-09-14 08:12-05','Tos persistente y fiebre leve','Cuadro de 3 días con tos seca, malestar y fiebre de 37.8 °C.','Faringe congestiva; murmullo vesicular normal.',NULL),
 ('50000000-0000-7000-8000-000000000002','20000000-0000-7000-8000-000000000001','40000000-0000-7000-8000-000000000002','30000000-0000-7000-8000-000000000004','2026-09-21 14:05-05','Control de presión arterial','Paciente con HTA en seguimiento; refiere cefalea ocasional.','PA 148/92 mmHg; FC 78 lpm.',NULL),
 ('50000000-0000-7000-8000-000000000003','20000000-0000-7000-8000-000000000002','40000000-0000-7000-8000-000000000003','30000000-0000-7000-8000-000000000001','2026-09-14 08:35-05','Dolor lumbar','Dolor lumbar de 1 semana tras esfuerzo.','Contractura paravertebral.',NULL),
 ('50000000-0000-7000-8000-000000000004','20000000-0000-7000-8000-000000000002','40000000-0000-7000-8000-000000000003','30000000-0000-7000-8000-000000000001','2026-09-14 08:50-05','Dolor lumbar','Dolor lumbar de 1 semana tras esfuerzo (entrada corregida: el diagnóstico estaba mal codificado).','Contractura paravertebral; sin déficit neurológico.','50000000-0000-7000-8000-000000000003'),
 ('50000000-0000-7000-8000-000000000005','20000000-0000-7000-8000-000000000003','40000000-0000-7000-8000-000000000004','30000000-0000-7000-8000-000000000002','2026-09-28 09:10-05','Control ginecológico anual','Sin molestias; control de rutina.','Examen sin hallazgos.',NULL),
 ('50000000-0000-7000-8000-000000000006','20000000-0000-7000-8000-000000000004','40000000-0000-7000-8000-000000000005','30000000-0000-7000-8000-000000000005','2026-10-05 14:08-05','Dolor de rodilla derecha','Dolor y edema tras accidente de tránsito hace 2 días.','Edema leve; flexión limitada por dolor.',NULL),
 ('50000000-0000-7000-8000-000000000007','20000000-0000-7000-8000-000000000007','40000000-0000-7000-8000-000000000006','30000000-0000-7000-8000-000000000003','2026-10-05 08:10-05','Control de niño sano','Desarrollo acorde a la edad; completa esquema de vacunación.','Peso y talla en percentiles normales.',NULL),
 ('50000000-0000-7000-8000-000000000008','20000000-0000-7000-8000-000000000002','40000000-0000-7000-8000-000000000008','30000000-0000-7000-8000-000000000004','2026-10-12 14:15-05','Evaluación cardiológica preventiva y control de lípidos','Paciente asintomático acude a chequeo preventivo. Refiere disnea ocasional con esfuerzos mayores. Antecedente familiar de dislipidemia.','PA 130/85 mmHg; FC 74 lpm; IMC 26.2 (Sobrepeso leve). Ruidos cardíacos rítmicos.',NULL),
 ('50000000-0000-7000-8000-000000000009','20000000-0000-7000-8000-000000000003',NULL,'30000000-0000-7000-8000-000000000001','2026-10-10 10:15-05','Epigastralgia y pirosis nocturna','Cuadro de 2 semanas de ardor retroesternal y pirosis recurrente tras ingesta de café o comidas condimentadas. Niega melena.','Abdomen blando, depresible, leve dolor a la palpación profunda en epigastrio.',NULL),
 ('50000000-0000-7000-8000-000000000010','20000000-0000-7000-8000-000000000005',NULL,'30000000-0000-7000-8000-000000000001','2026-10-13 09:15-05','Cefalea tensional recurrente y fatiga','Cefalea bilateral opresiva de intensidad moderada asociada a estrés laboral. Refiere astenia vespertina.','PA 118/75 mmHg; FC 70 lpm; contractura muscular en región cervical y trapecios.',NULL),
 ('50000000-0000-7000-8000-000000000011','20000000-0000-7000-8000-000000000004',NULL,'30000000-0000-7000-8000-000000000001','2026-10-08 11:30-05','Control de diabetes mellitus tipo 2','Paciente diabético tipo 2 en seguimiento ambulatorio. Cumplimiento dietético parcial. Refiere polidipsia esporádica.','PA 132/84 mmHg; FC 76 lpm; examen de pies sin lesiones tróficas; sensibilidad conservada.',NULL),
 ('50000000-0000-7000-8000-000000000012','20000000-0000-7000-8000-000000000006',NULL,'30000000-0000-7000-8000-000000000001','2026-10-14 08:45-05','Chequeo médico preventivo anual','Paciente asintomático solicita evaluación clínica anual general. Sin quejas específicas.','PA 120/78 mmHg; FC 68 lpm; SatO2 99%; examen cardiopulmonar y abdominal normal.',NULL);

INSERT INTO hce.diagnostico (entrada_id, cie10_codigo, tipo) VALUES
 ('50000000-0000-7000-8000-000000000001','J06.9','principal'),
 ('50000000-0000-7000-8000-000000000002','I10','principal'),
 ('50000000-0000-7000-8000-000000000003','J02.9','principal'),   -- error de codificación, luego anulada
 ('50000000-0000-7000-8000-000000000004','M54.5','principal'),
 ('50000000-0000-7000-8000-000000000005','Z01.4','principal'),
 ('50000000-0000-7000-8000-000000000006','M25.5','principal'),
 ('50000000-0000-7000-8000-000000000007','Z00.1','principal'),
 ('50000000-0000-7000-8000-000000000002','R51','secundario'),
 ('50000000-0000-7000-8000-000000000008','E78.5','principal'),
 ('50000000-0000-7000-8000-000000000009','K21.9','principal'),
 ('50000000-0000-7000-8000-000000000010','R51','principal'),
 ('50000000-0000-7000-8000-000000000011','E11.9','principal'),
 ('50000000-0000-7000-8000-000000000012','Z00.1','principal');

INSERT INTO hce.indicacion (entrada_id, descripcion) VALUES
 ('50000000-0000-7000-8000-000000000001','Reposo relativo por 3 días e hidratación abundante.'),
 ('50000000-0000-7000-8000-000000000002','Dieta baja en sodio; control de presión en casa y regreso en 4 semanas.'),
 ('50000000-0000-7000-8000-000000000004','Calor local y evitar cargar peso por 2 semanas.'),
 ('50000000-0000-7000-8000-000000000005','Control anual; consultar antes si hay molestias.'),
 ('50000000-0000-7000-8000-000000000006','Reposo de la articulación y hielo local 15 min cada 6 horas.'),
 ('50000000-0000-7000-8000-000000000007','Próximo control de crecimiento en 6 meses.'),
 ('50000000-0000-7000-8000-000000000008','Dieta baja en grasas saturadas; ejercicio aeróbico 30 min/día; control lipídico.'),
 ('50000000-0000-7000-8000-000000000009','Evitar irritantes gástricos y comidas abundantes nocturnas. Fraccionar ingesta.'),
 ('50000000-0000-7000-8000-000000000010','Higiene del sueño, pausas activas laborales y manejo de estrés.'),
 ('50000000-0000-7000-8000-000000000011','Monitoreo de glucemia en ayunas 2 veces por semana; restricción de carbohidratos refinados.'),
 ('50000000-0000-7000-8000-000000000012','Mantener actividad física regular y chequeo anual programado.');

INSERT INTO hce.receta_item (entrada_id, medicamento, dosis, frecuencia, duracion_dias) VALUES
 ('50000000-0000-7000-8000-000000000001','Paracetamol 500 mg','1 tableta','cada 8 horas si hay fiebre',3),
 ('50000000-0000-7000-8000-000000000002','Losartán 50 mg','1 tableta','cada 24 horas',30),
 ('50000000-0000-7000-8000-000000000004','Naproxeno 550 mg','1 tableta','cada 12 horas con alimentos',5),
 ('50000000-0000-7000-8000-000000000006','Ibuprofeno 400 mg','1 tableta','cada 8 horas con alimentos',5),
 ('50000000-0000-7000-8000-000000000001','Suero oral','1 sobre en 1 litro de agua','a sorbos durante el día',3),
 ('50000000-0000-7000-8000-000000000008','Atorvastatina 20 mg','1 tableta','cada 24 horas por la noche',30),
 ('50000000-0000-7000-8000-000000000009','Esomeprazol 40 mg','1 cápsula','cada 24 horas antes del desayuno',28),
 ('50000000-0000-7000-8000-000000000010','Paracetamol 500 mg','1 tableta','cada 8 horas condicional al dolor',3),
 ('50000000-0000-7000-8000-000000000011','Metformina 850 mg','1 tableta','cada 12 horas con almuerzo y cena',60);

INSERT INTO hce.anulacion (entrada_id, anulado_por, anulado_en, motivo) VALUES
 ('50000000-0000-7000-8000-000000000003','10000000-0000-7000-8000-000000000001','2026-09-14 08:48-05','Diagnóstico mal codificado (J02.9); se registra una entrada corregida.');

-- ---------- Laboratorio e imágenes ----------
INSERT INTO laboratorio.examen (codigo, nombre, tipo) VALUES
 ('HEMOGRAMA','Hemograma completo','laboratorio'),
 ('GLUCOSA','Glucosa en ayunas','laboratorio'),
 ('PERFIL_LIP','Perfil lipídico','laboratorio'),
 ('PAPANICOLAOU','Papanicolaou','laboratorio'),
 ('RX_RODILLA','Radiografía de rodilla','imagen'),
 ('ECO_ABD','Ecografía abdominal','imagen');                                                              -- ids 1..6

INSERT INTO laboratorio.orden (id, paciente_id, entrada_id, medico_id, creada_en, indicacion_clinica) VALUES
 ('60000000-0000-7000-8000-000000000001','20000000-0000-7000-8000-000000000001','50000000-0000-7000-8000-000000000002','30000000-0000-7000-8000-000000000004','2026-09-21 14:30-05','Control metabólico en paciente hipertensa'),
 ('60000000-0000-7000-8000-000000000002','20000000-0000-7000-8000-000000000001','50000000-0000-7000-8000-000000000001','30000000-0000-7000-8000-000000000001','2026-09-14 08:25-05','Descartar proceso infeccioso'),
 ('60000000-0000-7000-8000-000000000003','20000000-0000-7000-8000-000000000004','50000000-0000-7000-8000-000000000006','30000000-0000-7000-8000-000000000005','2026-10-05 14:20-05','Descartar lesión ósea tras trauma'),
 ('60000000-0000-7000-8000-000000000004','20000000-0000-7000-8000-000000000003','50000000-0000-7000-8000-000000000005','30000000-0000-7000-8000-000000000002','2026-09-28 09:25-05','Tamizaje anual'),
 ('60000000-0000-7000-8000-000000000005','20000000-0000-7000-8000-000000000007','50000000-0000-7000-8000-000000000007','30000000-0000-7000-8000-000000000003','2026-10-05 08:25-05','Tamizaje de anemia'),
 ('60000000-0000-7000-8000-000000000006','20000000-0000-7000-8000-000000000002','50000000-0000-7000-8000-000000000008','30000000-0000-7000-8000-000000000004','2026-10-12 14:35-05','Control lipídico y glucémico post-consulta cardiológica'),
 ('60000000-0000-7000-8000-000000000007','20000000-0000-7000-8000-000000000005','50000000-0000-7000-8000-000000000010','30000000-0000-7000-8000-000000000001','2026-10-13 09:30-05','Descarte de anemia y fórmula leucocitaria por astenia crónica'),
 ('60000000-0000-7000-8000-000000000008','20000000-0000-7000-8000-000000000004','50000000-0000-7000-8000-000000000011','30000000-0000-7000-8000-000000000001','2026-10-08 11:45-05','Evaluación de perfil lipídico y glicemia en diabético tipo 2'),
 ('60000000-0000-7000-8000-000000000009','20000000-0000-7000-8000-000000000006','50000000-0000-7000-8000-000000000012','30000000-0000-7000-8000-000000000001','2026-10-14 09:00-05','Perfil analítico ocupacional preventivo');

INSERT INTO laboratorio.orden_item (id, orden_id, examen_id) VALUES
 ('61000000-0000-7000-8000-000000000001','60000000-0000-7000-8000-000000000001',3),
 ('61000000-0000-7000-8000-000000000002','60000000-0000-7000-8000-000000000001',2),
 ('61000000-0000-7000-8000-000000000003','60000000-0000-7000-8000-000000000002',1),
 ('61000000-0000-7000-8000-000000000004','60000000-0000-7000-8000-000000000003',5),
 ('61000000-0000-7000-8000-000000000005','60000000-0000-7000-8000-000000000004',4),
 ('61000000-0000-7000-8000-000000000006','60000000-0000-7000-8000-000000000005',1),
 ('61000000-0000-7000-8000-000000000007','60000000-0000-7000-8000-000000000006',3),
 ('61000000-0000-7000-8000-000000000008','60000000-0000-7000-8000-000000000006',2),
 ('61000000-0000-7000-8000-000000000009','60000000-0000-7000-8000-000000000007',1),
 ('61000000-0000-7000-8000-000000000010','60000000-0000-7000-8000-000000000008',2),
 ('61000000-0000-7000-8000-000000000011','60000000-0000-7000-8000-000000000008',3),
 ('61000000-0000-7000-8000-000000000012','60000000-0000-7000-8000-000000000009',1),
 ('61000000-0000-7000-8000-000000000013','60000000-0000-7000-8000-000000000009',2);

-- Técnico de laboratorio: Julio Navarro.
INSERT INTO laboratorio.resultado (orden_item_id, valor, unidad, rango_referencia, archivo_url, observaciones, registrado_por, registrado_en) VALUES
 ('61000000-0000-7000-8000-000000000001','Colesterol total 212; LDL 138; HDL 46','mg/dL','CT < 200; LDL < 130',NULL,'Ligera elevación','10000000-0000-7000-8000-000000000009','2026-09-22 10:00-05'),
 ('61000000-0000-7000-8000-000000000002','92','mg/dL','70 - 100',NULL,NULL,'10000000-0000-7000-8000-000000000009','2026-09-22 10:05-05'),
 ('61000000-0000-7000-8000-000000000003','Leucocitos 11.2; Hb 13.5','miles/µL; g/dL','Leu 4.5-11; Hb 12-16',NULL,'Leucocitosis leve','10000000-0000-7000-8000-000000000009','2026-09-14 16:00-05'),
 ('61000000-0000-7000-8000-000000000004',NULL,NULL,NULL,'https://archivos.sanrafael.example.pe/imagenes/rx-rodilla-0001.pdf','Sin fractura evidente','10000000-0000-7000-8000-000000000009','2026-10-05 15:10-05'),
 ('61000000-0000-7000-8000-000000000005','Negativo para lesión intraepitelial o malignidad (NILM)','-','NILM',NULL,'Frotis celular satisfactorio; bacilos de Döderlein abundantes.','10000000-0000-7000-8000-000000000009','2026-10-01 11:00-05'),
 ('61000000-0000-7000-8000-000000000007','Colesterol total 238; LDL 152; HDL 44; Triglicéridos 190','mg/dL','CT < 200; LDL < 130; TG < 150',NULL,'Dislipidemia moderada a predominio de LDL.','10000000-0000-7000-8000-000000000009','2026-10-13 09:15-05'),
 ('61000000-0000-7000-8000-000000000008','95','mg/dL','70 - 100',NULL,'Normoglicemia en ayunas.','10000000-0000-7000-8000-000000000009','2026-10-13 09:20-05'),
 ('61000000-0000-7000-8000-000000000009','Hemoglobina 13.2; Leucocitos 6,400; Plaquetas 240,000','g/dL; /uL','Hb 12-16; Leu 4,500-11,000',NULL,'Hemograma sin alteraciones patológicas.','10000000-0000-7000-8000-000000000009','2026-10-13 14:00-05'),
 ('61000000-0000-7000-8000-000000000010','142','mg/dL','70 - 100',NULL,'Glicemia elevada en paciente con DM2.','10000000-0000-7000-8000-000000000009','2026-10-09 08:30-05'),
 ('61000000-0000-7000-8000-000000000011','Colesterol total 205; LDL 128; HDL 41; Triglicéridos 178','mg/dL','CT < 200; LDL < 130; TG < 150',NULL,'Hipertrigliceridemia leve.','10000000-0000-7000-8000-000000000009','2026-10-09 08:35-05'),
 ('61000000-0000-7000-8000-000000000012','Hemoglobina 15.4; Leucocitos 7,100; Plaquetas 255,000','g/dL; /uL','Hb 13-17.5; Leu 4,500-11,000',NULL,'Parámetros hematológicos normales.','10000000-0000-7000-8000-000000000009','2026-10-14 12:00-05'),
 ('61000000-0000-7000-8000-000000000013','86','mg/dL','70 - 100',NULL,'Glucosa en rango óptimo.','10000000-0000-7000-8000-000000000009','2026-10-14 12:05-05');

-- ---------- Facturación ----------
INSERT INTO facturacion.convenio (nombre, tipo) VALUES
 ('Particular','particular'),
 ('EPS Andina Salud (ficticia)','eps'),
 ('EPS Vida Plena (ficticia)','eps'),
 ('Seguros Costa Azul (ficticia)','eps'),
 ('SOAT Central Seguros (ficticia)','soat');                                                               -- ids 1..5

INSERT INTO facturacion.concepto (codigo, descripcion) VALUES
 ('CONS_MG','Consulta de medicina general'),
 ('CONS_ESP','Consulta de especialidad'),
 ('LAB_HEMOGRAMA','Hemograma completo'),
 ('LAB_GLUCOSA','Glucosa en ayunas'),
 ('LAB_PERFIL_LIP','Perfil lipídico'),
 ('IMG_RX_RODILLA','Radiografía de rodilla');                                                              -- ids 1..6

-- Tarifario: precio base por concepto x factor del convenio; copago = % que paga el paciente
INSERT INTO facturacion.tarifa (convenio_id, concepto_id, precio, copago_pct, vigente_desde, vigente_hasta)
SELECT cv.id, c.id, round(b.precio * f.factor, 2), f.copago, DATE '2026-01-01', NULL
FROM facturacion.convenio cv
JOIN (VALUES ('Particular',1.00,100.00),('EPS Andina Salud (ficticia)',0.85,20.00),('EPS Vida Plena (ficticia)',0.80,30.00),
             ('Seguros Costa Azul (ficticia)',0.90,20.00),('SOAT Central Seguros (ficticia)',0.70,0.00)) AS f(nombre,factor,copago) ON f.nombre = cv.nombre
CROSS JOIN facturacion.concepto c
JOIN (VALUES ('CONS_MG',120.00),('CONS_ESP',180.00),('LAB_HEMOGRAMA',45.00),('LAB_GLUCOSA',20.00),('LAB_PERFIL_LIP',90.00),('IMG_RX_RODILLA',110.00)) AS b(codigo,precio) ON b.codigo = c.codigo;

INSERT INTO facturacion.paciente_convenio (paciente_id, convenio_id, nro_poliza, vigente_desde, vigente_hasta) VALUES
 ('20000000-0000-7000-8000-000000000001',2,'AND-000101','2026-01-01',NULL),
 ('20000000-0000-7000-8000-000000000002',1,NULL,'2026-01-01',NULL),
 ('20000000-0000-7000-8000-000000000003',3,'VPL-000303','2026-01-01',NULL),
 ('20000000-0000-7000-8000-000000000004',5,'SOAT-2026-0404','2026-10-03',NULL),
 ('20000000-0000-7000-8000-000000000005',4,'CAZ-000505','2026-01-01',NULL),
 ('20000000-0000-7000-8000-000000000006',1,NULL,'2026-01-01',NULL),
 ('20000000-0000-7000-8000-000000000007',2,'AND-000101-D1','2026-01-01',NULL),
 ('20000000-0000-7000-8000-000000000008',3,'VPL-000808','2026-01-01',NULL);

-- Cajera: Elena Vargas
INSERT INTO facturacion.comprobante (id, tipo, serie, numero, paciente_id, convenio_id, cita_id, emitido_en, emitido_por) VALUES
 ('70000000-0000-7000-8000-000000000001','boleta','B001',1,'20000000-0000-7000-8000-000000000001',2,'40000000-0000-7000-8000-000000000001','2026-09-14 08:45-05','10000000-0000-7000-8000-000000000010'),
 ('70000000-0000-7000-8000-000000000002','boleta','B001',2,'20000000-0000-7000-8000-000000000001',2,'40000000-0000-7000-8000-000000000002','2026-09-21 14:50-05','10000000-0000-7000-8000-000000000010'),
 ('70000000-0000-7000-8000-000000000003','boleta','B001',3,'20000000-0000-7000-8000-000000000002',1,'40000000-0000-7000-8000-000000000003','2026-09-14 09:10-05','10000000-0000-7000-8000-000000000010'),
 ('70000000-0000-7000-8000-000000000004','boleta','B001',4,'20000000-0000-7000-8000-000000000004',5,'40000000-0000-7000-8000-000000000005','2026-10-05 15:20-05','10000000-0000-7000-8000-000000000010'),
 ('70000000-0000-7000-8000-000000000005','factura','F001',1,'20000000-0000-7000-8000-000000000003',3,'40000000-0000-7000-8000-000000000004','2026-09-28 09:50-05','10000000-0000-7000-8000-000000000010');

-- HU05: el precio y el copago salen del tarifario vigente del convenio
INSERT INTO facturacion.comprobante_item (comprobante_id, concepto_id, cantidad, precio_unitario, copago_monto)
SELECT v.comprobante_id::uuid, c.id, 1, t.precio, round(t.precio * t.copago_pct / 100, 2)
FROM (VALUES
  ('70000000-0000-7000-8000-000000000001','EPS Andina Salud (ficticia)','CONS_MG'),
  ('70000000-0000-7000-8000-000000000002','EPS Andina Salud (ficticia)','CONS_ESP'),
  ('70000000-0000-7000-8000-000000000003','Particular','CONS_MG'),
  ('70000000-0000-7000-8000-000000000004','SOAT Central Seguros (ficticia)','CONS_ESP'),
  ('70000000-0000-7000-8000-000000000004','SOAT Central Seguros (ficticia)','IMG_RX_RODILLA'),
  ('70000000-0000-7000-8000-000000000005','EPS Vida Plena (ficticia)','CONS_ESP')
) AS v(comprobante_id, convenio, concepto)
JOIN facturacion.convenio cv ON cv.nombre = v.convenio
JOIN facturacion.concepto c  ON c.codigo = v.concepto
JOIN facturacion.tarifa t    ON t.convenio_id = cv.id AND t.concepto_id = c.id AND t.vigente_hasta IS NULL;

INSERT INTO facturacion.glosa (comprobante_id, motivo, monto, estado, registrada_en, resuelta_en) VALUES
 ('70000000-0000-7000-8000-000000000002','Código de diagnóstico no coincide con el convenio',122.40,'abierta','2026-10-01 10:00-05',NULL),
 ('70000000-0000-7000-8000-000000000001','Falta autorización previa de la EPS',81.60,'subsanada','2026-09-20 11:00-05','2026-09-25 09:30-05'),
 ('70000000-0000-7000-8000-000000000005','Tarifa distinta a la del convenio vigente',100.80,'aceptada','2026-10-02 12:00-05','2026-10-06 16:00-05');

-- ---------- Auditoría ----------
INSERT INTO auditoria.bitacora (ocurrio_en, usuario_id, accion, recurso, recurso_id, paciente_id, ip, detalle) VALUES
 ('2026-09-14 08:00-05','10000000-0000-7000-8000-000000000001','LOGIN','sesion',NULL,NULL,'10.0.0.21','{"resultado":"ok"}'),
 ('2026-09-14 08:11-05','10000000-0000-7000-8000-000000000001','LECTURA','hce.historia',NULL,'20000000-0000-7000-8000-000000000001','10.0.0.21','{"origen":"HU03"}'),
 ('2026-09-14 08:35-05','10000000-0000-7000-8000-000000000001','ESCRITURA','hce.entrada','50000000-0000-7000-8000-000000000003','20000000-0000-7000-8000-000000000002','10.0.0.21',NULL),
 ('2026-09-14 08:48-05','10000000-0000-7000-8000-000000000001','ANULACION','hce.entrada','50000000-0000-7000-8000-000000000003','20000000-0000-7000-8000-000000000002','10.0.0.21','{"motivo":"Diagnóstico mal codificado"}'),
 ('2026-09-14 08:50-05','10000000-0000-7000-8000-000000000001','ESCRITURA','hce.entrada','50000000-0000-7000-8000-000000000004','20000000-0000-7000-8000-000000000002','10.0.0.21',NULL),
 ('2026-09-30 17:02-05',NULL,'LOGIN_FALLIDO','sesion',NULL,NULL,'10.0.0.77','{"username_intentado":"admin"}'),
 ('2026-10-01 09:15-05','10000000-0000-7000-8000-000000000007','ACCESO_DENEGADO','hce.historia',NULL,'20000000-0000-7000-8000-000000000001','10.0.0.15','{"motivo":"rol admision sin permiso sobre HCE"}'),
 ('2026-10-05 14:09-05','10000000-0000-7000-8000-000000000005','LECTURA','hce.historia',NULL,'20000000-0000-7000-8000-000000000004','10.0.0.30','{"origen":"HU03"}');

COMMIT;
