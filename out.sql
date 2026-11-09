PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "actividades" ("id" INTEGER NOT NULL,
"codigo" VARCHAR(10),
"actividad" VARCHAR(255) NOT NULL,
"unidades" REAL,
"um" VARCHAR(2),
"duracion" REAL,
"costobase" REAL,
"idprocesotipo" VARCHAR(2),
"activo" TINYINT,
"user_id" INTEGER NOT NULL DEFAULT 1,
"descripcion" TEXT,
CONSTRAINT "pk_actividades" PRIMARY KEY("id"));
INSERT INTO actividades VALUES(1,'218','Consejo Ténico Trabajo en Gabinete',1.0,'U',8.0,NULL,NULL,NULL,1,NULL);
INSERT INTO actividades VALUES(2,'EC2025','Elaboración de Contrato',1.0,'U',2.0,NULL,NULL,NULL,1,NULL);
INSERT INTO actividades VALUES(3,NULL,'Preparación de la Documentación',1.0,'U',80.0,NULL,NULL,NULL,1,NULL);
INSERT INTO actividades VALUES(4,NULL,'Elaboración y Revisión de Certificcaciones',1.0,'U',8.0,NULL,NULL,NULL,1,NULL);
INSERT INTO actividades VALUES(5,'EP-A20250623','Elaboración de Permisología',1.0,'U',24.0,NULL,NULL,NULL,1,NULL);
INSERT INTO actividades VALUES(6,'RC-A20250623','Recepción de Contededor',1.0,'U',8.0,NULL,NULL,NULL,1,NULL);
INSERT INTO actividades VALUES(7,NULL,'Impresión y Acabado',1.0,'HH',4.0,NULL,NULL,NULL,1,NULL);
CREATE TABLE IF NOT EXISTS "actividadtipos" ("id" INTEGER NOT NULL,
"actividadtipo" VARCHAR(50),
"descripcion" VARCHAR(250),
"tasamaxima" REAL,
"tasaautorizadamfp" REAL,
"idactividadclase" TINYINT,
"idutilidadtipo" TINYINT,
CONSTRAINT "pk_actividadtipos" PRIMARY KEY("id"));
INSERT INTO actividadtipos VALUES(1,'PRODUCCIÓN DE BIENES','Actividad de producción de bienes, excepto agropecuarios, alta tecnología, informática, la ciencia e investigación.',25.0,NULL,1,1);
INSERT INTO actividadtipos VALUES(2,'PRODUCCIÓN AGROPECUARIA','Actividad de producción agropecuaria, excepto las producciones derivadas del azúcar que mantienen el tratamiento que se defina por este Ministerio. (*)',30.0,40.0,1,2);
INSERT INTO actividadtipos VALUES(3,'ACTIVIDADES DE SERVICIOS Y DE COMERCIALIZACIÓN','Actividades de servicios y de comercialización, exceptuando la alta tecnología, actividades de informática, la ciencia e investigación (incluidos los servicios agropecuarios).',15.0,NULL,2,1);
INSERT INTO actividadtipos VALUES(4,'EMPRESAS DE ALTA TECNOLOGÍA','Para empresas de alta tecnología, actividades de informática, la ciencia e investigación.',30.0,NULL,2,2);
CREATE TABLE IF NOT EXISTS "cargos" ("id" INTEGER NOT NULL,
"cargo" VARCHAR(250),
"catocupacional_id" VARCHAR(1),
"grupoescala" VARCHAR(5),
"complejidad" VARCHAR(1),
"salarioescala" INTEGER,
"tarifahoraria" NUMERIC(9, 6) NOT NULL,
"activo" TINYINT,
"created_at" DATETIME,
"updated_at" DATETIME,
CONSTRAINT "pk_cargos" PRIMARY KEY("id"));
INSERT INTO cargos VALUES(1,'DIRECTOR','C','XXV','A',10700,56.1385099999999965,1,NULL,NULL);
INSERT INTO cargos VALUES(2,'JEFE DE DEPARTAMENTO','C','XXIV','A',9400,49.3179429999999996,1,NULL,NULL);
INSERT INTO cargos VALUES(3,'Esp. Superior  Integral en Arquitectura y Obras Civiles (EP)','T','XXIII','A',9100,47.7439660000000003,1,NULL,'2024-05-07 19:40:19');
INSERT INTO cargos VALUES(4,'ESPECIALISTA B EN GESTIÓN DE CALIDAD (EP)','T','XXV','A',9100,47.7439660000000003,1,NULL,NULL);
INSERT INTO cargos VALUES(5,'ESPECIALISTA B EN GESTIÓN ECONÓMICA (EP)','T','XXV','A',9100,47.7439660000000003,1,NULL,NULL);
INSERT INTO cargos VALUES(6,'ESPECIALISTA SUPERIOR INTEGRAL','T','XX','A',8200,43.0220359999999999,1,NULL,NULL);
INSERT INTO cargos VALUES(7,'ESPECIALISTA A INTEGRAL','T','XIX','A',7900,41.4480590000000006,1,NULL,NULL);
INSERT INTO cargos VALUES(8,'ESPECIALISTA B INTEGRAL DE GEOMÁTICA Y TOPOGRAFÍA','T','XVIII','A',7600,39.8740820000000013,1,NULL,'2024-05-07 19:25:04');
INSERT INTO cargos VALUES(9,'ASESOR B JURÍDICO','T','XVI','A',7600,39.8740820000000013,1,NULL,NULL);
INSERT INTO cargos VALUES(10,'ESPECIALISTA B EN CIENCIAS INFORMÁTICAS','T','XI','A',7000,36.7261280000000027,1,NULL,'2024-05-08 12:47:57');
INSERT INTO cargos VALUES(11,'ESPECIALISTA B EN GESTIÓN COMERCIAL','T','XVI','A',7600,39.8740820000000013,1,NULL,NULL);
INSERT INTO cargos VALUES(12,'ESPECIALISTA B EN GESTIÓN DE LA CALIDAD','T','XVI','A',7600,39.8740820000000013,1,NULL,NULL);
INSERT INTO cargos VALUES(13,'ESPECIALISTA B EN GESTIÓN ECONÓMICA','T','XVI','A',7600,39.8740820000000013,1,NULL,NULL);
INSERT INTO cargos VALUES(14,'ESPECIALISTA C INTEGRAL','T','XV','A',6700,35.1521520000000009,1,NULL,NULL);
INSERT INTO cargos VALUES(15,'ESPECIALISTA C EN GESTIÓN DOCUMENTAL','T','XIV','A',7000,36.7261280000000027,1,NULL,NULL);
INSERT INTO cargos VALUES(16,'TÉCNICO EN ABASTECIMIENTO TÉCNICO MATERIAL (JB)','T','XII','A',6400,33.578173999999997,1,NULL,NULL);
INSERT INTO cargos VALUES(17,'TÉCNICO INTEGRAL EN ACABADO DEL SERVICIO','T','XI','A',5800,30.4302199999999984,1,NULL,'2024-05-07 19:17:31');
INSERT INTO cargos VALUES(18,'TÉCNICO A EN GESTIÓN ECONÓMICA','T','X','A',5800,30.4302199999999984,1,NULL,NULL);
INSERT INTO cargos VALUES(19,'TÉCNICO EN CIENCIAS INFORMÁTICAS','T','X','A',5800,30.4302199999999984,1,NULL,NULL);
INSERT INTO cargos VALUES(20,'TÉCNICO AUXILIAR ','T','IX','A',5300,27.8069249999999996,1,NULL,NULL);
INSERT INTO cargos VALUES(21,'TÉCNICO EN ABASTECIMIENTO TÉCNICO MATERIAL','T','IX','A',5500,28.8562429999999992,1,NULL,NULL);
INSERT INTO cargos VALUES(22,'SECRETARIA','T','VIII','A',5200,27.2822670000000009,1,NULL,NULL);
INSERT INTO cargos VALUES(23,'AGENTE DE SEGURIDAD Y PROTECCIÓN','S','V','A',4350,22.8226650000000006,1,NULL,NULL);
INSERT INTO cargos VALUES(24,'CADENERO PORTAMIRA DE TOPOGRAFÍA CHOFER','O','IV','A',4100,21.5110120000000009,1,NULL,NULL);
INSERT INTO cargos VALUES(25,'CHOFER C','O','IV','A',4500,23.609653999999999,1,NULL,NULL);
INSERT INTO cargos VALUES(26,'COCINERO INTEGRAL C','S','IV','A',4100,21.5110169999999989,1,NULL,NULL);
INSERT INTO cargos VALUES(27,'Cadenero Portamira C de Topogradfía','O','IV','A',4100,21.5110179999999999,1,NULL,'2024-05-07 19:35:44');
INSERT INTO cargos VALUES(28,'CHOFER D','O','III','A',3850,20.1993699999999982,1,NULL,NULL);
INSERT INTO cargos VALUES(29,'AYUDANTE GENERAL DE ELABORACIÓN','S','II','A',3600,18.8877230000000011,1,NULL,NULL);
INSERT INTO cargos VALUES(30,'CHOFER MOTO','O','II','A',3600,18.8877230000000011,1,NULL,NULL);
INSERT INTO cargos VALUES(31,'ENCARGADA DE RECEPCIÓN Y PIZARRA TELEFÓNICA','S','II','A',3600,18.8877230000000011,1,NULL,NULL);
INSERT INTO cargos VALUES(32,'AUXILIAR GENERAL DE SERVICIOS','S','I','A',3350,17.5760760000000004,1,NULL,NULL);
INSERT INTO cargos VALUES(33,'OBRERO','O','I','A',3350,17.5760760000000004,1,NULL,NULL);
INSERT INTO cargos VALUES(34,'ESPACIALISTA A INTEGRAL (CD)*','T','XIX','A',15800,82.8961180000000013,1,NULL,NULL);
INSERT INTO cargos VALUES(35,'ESPECIALISTA SUPERIOR INTEGRAL (EP, CD)*','T','XXIII','A',18200,95.4879329999999981,1,NULL,NULL);
INSERT INTO cargos VALUES(36,'ESPECIALISTA B EN GESTIÓN DE CAPITAL HUMANO','T','XXV','A',9100,47.7439660000000003,NULL,NULL,NULL);
INSERT INTO cargos VALUES(37,'Especialista Superior Integral en GeomÁtica y TopografÍa','T','XXII',NULL,9100,47.7439660000000003,NULL,'2024-05-07 19:21:47','2024-05-07 19:21:47');
INSERT INTO cargos VALUES(38,'Técnico Integral para Geomática y TopografÍa','T','XI',NULL,5800,30.4302199999999984,NULL,'2024-05-07 19:32:40','2024-05-07 19:32:40');
INSERT INTO cargos VALUES(39,'Técnico Auxiliar Integral para Geomática y TopografÍa','T','IX',NULL,5200,27.2822670000000009,NULL,'2024-05-07 19:34:02','2024-05-07 19:34:02');
INSERT INTO cargos VALUES(40,'Especialista B Integral en Servicios Ingenieros','T','XVII',NULL,7600,39.8740820000000013,NULL,'2024-05-07 19:37:20','2024-05-07 19:37:20');
INSERT INTO cargos VALUES(41,'Especialista C Integral en Servicios Ingenieros','T','XIV',NULL,6700,35.1521510000000034,NULL,'2024-05-07 19:38:32','2024-05-07 19:38:32');
INSERT INTO cargos VALUES(42,'Rellenador de Tóner Láser','T','XVIII',NULL,6900,44.25,NULL,NULL,NULL);
CREATE TABLE IF NOT EXISTS "catocupacionales" ("id" VARCHAR(1) NOT NULL,
"categoria" VARCHAR(25),
"nivel" TINYINT,
CONSTRAINT "pk_catocupacionales" PRIMARY KEY("id"));
INSERT INTO catocupacionales VALUES('A','ADMINISTRATIVO',3);
INSERT INTO catocupacionales VALUES('C','CUADRO',1);
INSERT INTO catocupacionales VALUES('O','OPERARIO',5);
INSERT INTO catocupacionales VALUES('S','SERVICIO',4);
INSERT INTO catocupacionales VALUES('T','TÉCNICO',2);
CREATE TABLE IF NOT EXISTS "equipotipos" ("id" VARCHAR(2) NOT NULL,
"equipotipo" VARCHAR(35) NOT NULL,
"idequipogrupo" TINYINT,
"idenergiagrupo" TINYINT, um TEXT,
CONSTRAINT "pk_equipotipos" PRIMARY KEY("id"));
INSERT INTO equipotipos VALUES('AE','AUTOS ELÉCTRICOS',1,1,'KM');
INSERT INTO equipotipos VALUES('EA','ALUMBRADO ARTIFICIAL',1,1,'HE');
INSERT INTO equipotipos VALUES('EC','EQUIPOS DE CLIMA',1,1,'HE');
INSERT INTO equipotipos VALUES('ED','EQUIPOS TECNOLÓGICO POR COMBUSTIÓN',2,2,'HE');
INSERT INTO equipotipos VALUES('EE','EQUIPOS ELECTRICOS',1,1,'HE');
INSERT INTO equipotipos VALUES('EG','EQUIPOS TOPOGRÁFICOS Y GEOMÁTICOS',1,1,'HE');
INSERT INTO equipotipos VALUES('EM','EQUIPOS AUTOMOTORES',3,2,'KM');
INSERT INTO equipotipos VALUES('EO','EQUIPOS OFIMÁTICA E INFORMÁTICOS',1,1,'HE');
INSERT INTO equipotipos VALUES('ET','EQUIPOS TECNOLÓGICOS ELÉCTRICOS',1,1,'HE');
CREATE TABLE IF NOT EXISTS "fichaequipos" ("id" INTEGER NOT NULL,
"ficha_id" INTEGER NOT NULL,
"equipo_id" INTEGER NOT NULL,
"idlistado" INTEGER,
"item" INTEGER NOT NULL,
"cantidad" REAL,
"umedida_id" VARCHAR(2) DEFAULT 'HE',
"tarifaunitaria" REAL,
"costo" REAL,
"mantenimiento" REAL,
"cantidadhe" REAL,
"depreciacion" REAL,
"descripcion" TEXT,
CONSTRAINT "pk_fichaequipos" PRIMARY KEY("id"));
INSERT INTO fichaequipos VALUES(1,1,1,NULL,1,2.0,'HE',NULL,189.508872520300002,24.7185485896040013,480.0,164.790323930689993,NULL);
INSERT INTO fichaequipos VALUES(2,1,2,NULL,2,6.0,'HE',NULL,864.864000000000032,78.6239999999999952,480.0,786.240000000000009,'Iluminación adecuada del local de trabajo');
INSERT INTO fichaequipos VALUES(3,1,3,NULL,3,1.0,'HE',NULL,3.74948700410400004,0.865266231716300016,48.0,2.88422077238770002,'Impresión de Documentación');
INSERT INTO fichaequipos VALUES(4,1,4,NULL,4,1.0,'HE',NULL,9.2252747252746996,1.53754578754580006,480.0,7.68772893772889975,'Climatización del parque técnologico');
INSERT INTO fichaequipos VALUES(5,1,5,NULL,5,3200.0,'KM',NULL,24766.3610880000014,2653.53868800000009,3540.0,22112.8224000000009,NULL);
INSERT INTO fichaequipos VALUES(6,1,6,NULL,6,1.0,'HE',NULL,0.249965753424659986,0.0576844046364589982,8.0,0.192281348788199996,NULL);
CREATE TABLE IF NOT EXISTS "fichainsumos" ("id" INTEGER NOT NULL,
"ficha_id" INTEGER NOT NULL,
"insumo_id" INTEGER NOT NULL,
"idlistado" INTEGER,
"item" INTEGER NOT NULL,
"factorconversion" REAL,
"cantidad" REAL,
"precio" REAL,
"costobase" REAL,
"costo" REAL,
"descripcion" TEXT,
hook_id TEXT,
CONSTRAINT "pk_fichainsumos" PRIMARY KEY("id"));
INSERT INTO fichainsumos VALUES(1,1,1,NULL,1,NULL,256.003199999999992,3.20999999999999996,NULL,821.770271999999977,'256.00 KW del equipo "Lámpara doble de tubos led de 40w"','[2]');
INSERT INTO fichainsumos VALUES(2,1,1,NULL,2,NULL,4.0,3.20999999999999996,NULL,12.8399999999999998,'4.00 KW del equipo "CÁMARA FOTOGRÁFICA"','[6]');
INSERT INTO fichainsumos VALUES(3,1,1,NULL,3,NULL,211.199999999999988,3.20999999999999996,NULL,677.951999999999998,'211.20 KW del equipo "MICROCOMPUTADORA"','[1]');
INSERT INTO fichainsumos VALUES(4,1,1,NULL,4,NULL,19.1999999999999992,3.20999999999999996,NULL,61.6319999999999979,'19.20 KW del equipo "IMPRESORA"','[3]');
INSERT INTO fichainsumos VALUES(5,1,1,NULL,5,NULL,720.0,3.20999999999999996,NULL,2311.19999999999981,'720.00 KW del equipo "EQUIPO DE CLIMA"','[4]');
INSERT INTO fichainsumos VALUES(6,1,2,NULL,6,NULL,1.0,12750.0,NULL,12750.0,NULL,NULL);
INSERT INTO fichainsumos VALUES(7,1,3,NULL,7,NULL,1000.0,9.0,NULL,9000.0,NULL,NULL);
INSERT INTO fichainsumos VALUES(8,1,4,NULL,8,NULL,320.0,16.3999999999999985,NULL,5248.0,'320.00 L del equipo "LADA NIVA 2100"','[5]');
INSERT INTO fichainsumos VALUES(9,1,5,NULL,9,NULL,1.06666666666669995,100.0,NULL,106.666666666669996,'1.07 L del equipo "LADA NIVA 2100"','[5]');
CREATE TABLE IF NOT EXISTS "fichapartidas" ("id" INTEGER NOT NULL,
"ficha_id" INTEGER NOT NULL,
"plantilla_id" INTEGER NOT NULL,
"importe" REAL,
"salarios" REAL,
"desglosarsalarios" TINYINT,
"aplicarcoeficiente" TINYINT,
"coeficiente" REAL,
"coeficienteaplicado" INTEGER,
"created_at" DATETIME,
"updated_at" DATETIME,
CONSTRAINT "pk_fichapartidas" PRIMARY KEY("id"));
INSERT INTO fichapartidas VALUES(1,1,1,30990.0609386666692,NULL,NULL,NULL,0.0,NULL,'2025-06-24T23:48:53.000000Z','2025-06-25T02:34:40.000000Z');
INSERT INTO fichapartidas VALUES(2,1,2,21750.0,NULL,NULL,NULL,0.0,NULL,'2025-06-24T23:48:53.000000Z','2025-06-24T23:48:53.000000Z');
INSERT INTO fichapartidas VALUES(3,1,3,5354.66666666666969,NULL,NULL,NULL,0.0,NULL,'2025-06-24T23:48:53.000000Z','2025-06-24T23:48:53.000000Z');
INSERT INTO fichapartidas VALUES(4,1,4,3885.394272,NULL,NULL,NULL,0.0,NULL,'2025-06-24T23:48:53.000000Z','2025-06-25T02:34:40.000000Z');
INSERT INTO fichapartidas VALUES(5,1,5,0.0,NULL,NULL,NULL,0.0,NULL,'2025-06-24T23:48:53.000000Z','2025-06-24T23:48:53.000000Z');
INSERT INTO fichapartidas VALUES(6,1,6,18956.247650317,NULL,NULL,NULL,0.0,NULL,'2025-06-24T23:48:53.000000Z','2025-06-24T23:48:53.000000Z');
INSERT INTO fichapartidas VALUES(7,1,7,26184.7586880030976,NULL,NULL,NULL,0.0,NULL,'2025-06-24T23:48:53.000000Z','2025-08-01T22:10:45.000000Z');
INSERT INTO fichapartidas VALUES(8,1,8,120.349999999999994,NULL,NULL,NULL,0.330000000000000015,NULL,'2025-06-24T23:48:53.000000Z','2025-06-24T23:48:53.000000Z');
INSERT INTO fichapartidas VALUES(9,1,10,76251.4172769867727,NULL,NULL,NULL,0.0,NULL,'2025-06-24T23:48:53.000000Z','2025-08-01T22:10:45.000000Z');
INSERT INTO fichapartidas VALUES(10,1,11,5250.0,NULL,NULL,NULL,0.330000000000000015,NULL,'2025-06-24T23:48:53.000000Z','2025-06-24T23:48:53.000000Z');
INSERT INTO fichapartidas VALUES(11,1,13,0.0,NULL,NULL,NULL,0.330000000000000015,NULL,'2025-06-24T23:48:53.000000Z','2025-06-24T23:48:53.000000Z');
INSERT INTO fichapartidas VALUES(12,1,15,168.229999999999989,NULL,NULL,NULL,0.0,NULL,'2025-06-24T23:48:53.000000Z','2025-06-24T23:48:53.000000Z');
INSERT INTO fichapartidas VALUES(13,1,16,134.721552076743506,NULL,NULL,NULL,0.0,NULL,'2025-06-24T23:48:53.000000Z','2025-06-24T23:48:53.000000Z');
INSERT INTO fichapartidas VALUES(14,1,17,4549.49943607607929,NULL,NULL,NULL,0.0,NULL,'2025-06-24T23:48:53.000000Z','2025-06-24T23:48:53.000000Z');
INSERT INTO fichapartidas VALUES(15,1,18,10102.450988152821,NULL,NULL,NULL,0.0,NULL,'2025-06-24T23:48:53.000000Z','2025-06-24T23:48:53.000000Z');
INSERT INTO fichapartidas VALUES(16,1,19,86353.8682651395938,NULL,NULL,NULL,0.0,NULL,'2025-06-24T23:48:53.000000Z','2025-08-01T22:10:45.000000Z');
INSERT INTO fichapartidas VALUES(17,1,20,12953.0802397709394,NULL,NULL,NULL,0.0,NULL,'2025-06-24T23:48:53.000000Z','2025-08-01T22:10:46.000000Z');
CREATE TABLE IF NOT EXISTS "ficharhumanos" ("id" INTEGER NOT NULL,
"ficha_id" INTEGER NOT NULL,
"actividad_id" INTEGER NOT NULL,
"idlistado" INTEGER,
"item" INTEGER NOT NULL,
"cantidad" SMALLINT,
"cargo_id" INTEGER,
"pagosadicionales" REAL,
"tiempo" REAL,
"salariodevengado" REAL,
"vacaciones" REAL,
"contribuciones" REAL,
"gastos" REAL,
"impuestos" REAL,
"costo" REAL,
"descripcion" TEXT,
"created_at" DATETIME,
"updated_at" DATETIME,
CONSTRAINT "pk_ficharhumanos" PRIMARY KEY("id"));
INSERT INTO ficharhumanos VALUES(1,1,1,NULL,1,1,2,NULL,8.0,394.543543999999997,35.8640081495999964,74.9632733600000023,4.24726172461229989,43.0407552149600007,430.407552149600007,NULL,'2025-06-24T23:48:54.000000Z','2025-08-02T14:42:15.000000Z');
INSERT INTO ficharhumanos VALUES(2,1,1,NULL,2,1,40,NULL,8.0,318.99265600000001,28.9964324303999987,60.6086046400000029,3.43395632463119993,34.798908843040003,347.989088430399988,NULL,'2025-06-24T23:48:54.000000Z','2025-08-02T14:42:15.000000Z');
INSERT INTO ficharhumanos VALUES(3,1,1,NULL,3,1,41,NULL,8.0,281.217208000000027,25.5626442072000017,53.4312695200000007,3.02730358158059997,30.6779852207200001,306.779852207200008,NULL,'2025-06-24T23:48:54.000000Z','2025-08-02T14:42:15.000000Z');
INSERT INTO ficharhumanos VALUES(4,1,2,NULL,4,1,9,NULL,8.0,318.99265600000001,28.9964324303999987,60.6086046400000029,3.43395632463119993,34.798908843040003,347.989088430399988,'Preparación y Elaboración de la Documentación para la Contratación del Servicio','2025-06-24T23:48:54.000000Z','2025-08-02T14:42:15.000000Z');
INSERT INTO ficharhumanos VALUES(5,1,3,NULL,5,1,2,NULL,48.0,2367.26126400000021,215.184048897600007,449.779640159999985,25.483570347674,258.244531289760004,2582.44531289760016,'Revisión y asesoramiento de la de las certificaciones.','2025-06-24T23:48:54.000000Z','2025-08-02T14:42:15.000000Z');
INSERT INTO ficharhumanos VALUES(6,1,4,NULL,6,1,40,NULL,256.0,10207.7649920000003,927.885837772799959,1939.47534848000009,109.886602388200003,1113.5650829773001,11135.6508297729997,'Elaboración y revision de las certificaciones','2025-06-24T23:48:54.000000Z','2025-08-02T14:42:15.000000Z');
INSERT INTO ficharhumanos VALUES(7,1,5,NULL,7,1,40,NULL,24.0,956.977968000000032,86.9892972912000033,181.825813920000001,10.3018689738940008,104.396726529120002,1043.96726529119996,'Para Anexo 5 y Licencia de Construcción de INOTU .','2025-06-24T23:48:54.000000Z','2025-08-02T14:42:15.000000Z');
INSERT INTO ficharhumanos VALUES(8,1,5,NULL,8,1,41,NULL,24.0,843.651623999999969,76.6879326215999981,160.293808560000002,9.08191074474190074,92.0339556621599967,920.339556621599968,'Para Anexo 5 y Licencia de Construcción de INOTU .','2025-06-24T23:48:54.000000Z','2025-08-02T14:42:15.000000Z');
INSERT INTO ficharhumanos VALUES(9,1,6,NULL,9,1,2,NULL,8.0,394.543543999999997,35.8640081495999964,74.9632733600000023,4.24726172461229989,43.0407552149600007,430.407552149600007,'Recepción del Contenedor en el puerto para revisión del equipamiento de los Sistemas de Riego','2025-06-24T23:48:54.000000Z','2025-08-02T14:42:15.000000Z');
INSERT INTO ficharhumanos VALUES(10,1,6,NULL,10,1,40,NULL,8.0,318.99265600000001,28.9964324303999987,60.6086046400000029,3.43395632463119993,34.798908843040003,347.989088430399988,'Recepción del Contenedor en el puerto para revisión del equipamiento de los Sistemas de Riego','2025-06-24T23:48:54.000000Z','2025-08-02T14:42:15.000000Z');
INSERT INTO ficharhumanos VALUES(11,1,7,NULL,11,1,17,NULL,32.0,973.767039999999951,88.5154239360000048,185.015737599999994,10.4826033541200001,106.228246393600002,1062.28246393600011,NULL,'2025-06-24T23:48:54.000000Z','2025-08-02T14:42:15.000000Z');
CREATE TABLE IF NOT EXISTS "fichas" ("id" INTEGER NOT NULL,
"codigo" VARCHAR(150),
"servicio" VARCHAR(150) NOT NULL,
"precio" REAL,
"identidad" VARCHAR(11),
"um" VARCHAR(2),
"cantidadfisica" REAL,
"pucapacidad" REAL,
"idperfilsalarial" TINYINT,
"idpreciometodo" TINYINT,
"actividadtipo_id" INTEGER,
"tasamaxima" REAL,
"idutilidadtipo" TINYINT,
"p100utilidades" REAL,
"p100impuestos" REAL,
"idactividadclase" TINYINT,
"coefmaxgi" REAL,
"elaboradopor_id" INTEGER,
"aprobadopor_id" INTEGER,
"fechaaprobado" DATETIME,
"p100vacaciones" REAL,
"p100contribuciones" REAL,
"p100gastos" REAL,
"p100impuestosft" REAL,
"empresa" VARCHAR(150),
"organismo" VARCHAR(100),
"ref" VARCHAR(50),
"user_id" INTEGER NOT NULL DEFAULT 1,
"created_at" DATETIME,
"updated_at" DATETIME, p100osde REAL, contribucionespecial REAL, argumentacion TEXT, valida INTEGER, cliente_id INTEGER,
CONSTRAINT "pk_fichas" PRIMARY KEY("id"));
INSERT INTO fichas VALUES(1,'PSIPULT-F20250623-COPIA','Prestación de Servicios Ingenieros PRODECAFE UBPC La Torcaza-COPIA',99306.9485049105278,'SERVICIO',NULL,1.0,NULL,NULL,NULL,4,NULL,NULL,15.0,10.0,NULL,NULL,NULL,5,'2025-04-24 00:00:00',9.08999999999999985,19.0,0.98680000000000001,5.0,NULL,NULL,NULL,1,'2025-06-24T23:48:53.000000Z','2025-08-02T14:42:15.000000Z',0.550000000000000044,NULL,NULL,0,1);
CREATE TABLE IF NOT EXISTS "fichasubpartidas" ("id" INTEGER NOT NULL,
"ficha_id" INTEGER NOT NULL,
"plantilla_id" INTEGER NOT NULL,
"costobase" REAL,
"importe" REAL,
"salarios" REAL,
"coeficiente" REAL,
"argumentacion" TEXT,
"created_at" DATETIME,
"updated_at" DATETIME,
CONSTRAINT "pk_fichasubpartidas" PRIMARY KEY("id"));
INSERT INTO fichasubpartidas VALUES(1,1,1,NULL,2759.34173301350256,NULL,NULL,NULL,'2025-06-24T23:48:54.000000Z','2025-08-01T22:10:45.000000Z');
INSERT INTO fichasubpartidas VALUES(2,1,2,NULL,23074.6169549895967,NULL,NULL,NULL,'2025-06-24T23:48:54.000000Z','2025-06-25T02:34:40.000000Z');
INSERT INTO fichasubpartidas VALUES(3,1,3,NULL,350.800000000000011,NULL,NULL,NULL,'2025-06-24T23:48:54.000000Z','2025-06-24T23:48:54.000000Z');
INSERT INTO fichasubpartidas VALUES(4,1,4,NULL,NULL,NULL,NULL,NULL,'2025-06-24T23:48:53.000000Z','2025-06-24T23:48:53.000000Z');
INSERT INTO fichasubpartidas VALUES(5,1,5,NULL,NULL,NULL,NULL,NULL,'2025-06-24T23:48:53.000000Z','2025-06-24T23:48:53.000000Z');
INSERT INTO fichasubpartidas VALUES(6,1,6,NULL,NULL,NULL,NULL,NULL,'2025-06-24T23:48:53.000000Z','2025-06-24T23:48:53.000000Z');
INSERT INTO fichasubpartidas VALUES(7,1,7,NULL,NULL,NULL,NULL,NULL,'2025-06-24T23:48:53.000000Z','2025-06-24T23:48:53.000000Z');
INSERT INTO fichasubpartidas VALUES(8,1,8,NULL,NULL,NULL,NULL,NULL,'2025-06-24T23:48:53.000000Z','2025-06-24T23:48:53.000000Z');
INSERT INTO fichasubpartidas VALUES(9,1,9,NULL,NULL,NULL,NULL,NULL,'2025-06-24T23:48:53.000000Z','2025-06-24T23:48:53.000000Z');
INSERT INTO fichasubpartidas VALUES(10,1,10,NULL,NULL,NULL,NULL,NULL,'2025-06-24T23:48:53.000000Z','2025-06-24T23:48:53.000000Z');
INSERT INTO fichasubpartidas VALUES(11,1,11,NULL,NULL,NULL,NULL,NULL,'2025-06-24T23:48:53.000000Z','2025-06-24T23:48:53.000000Z');
INSERT INTO fichasubpartidas VALUES(12,1,12,NULL,NULL,NULL,NULL,NULL,'2025-06-24T23:48:54.000000Z','2025-06-24T23:48:54.000000Z');
INSERT INTO fichasubpartidas VALUES(13,1,13,NULL,NULL,NULL,NULL,NULL,'2025-06-24T23:48:54.000000Z','2025-06-24T23:48:54.000000Z');
INSERT INTO fichasubpartidas VALUES(14,1,14,NULL,NULL,NULL,NULL,NULL,'2025-06-24T23:48:54.000000Z','2025-06-24T23:48:54.000000Z');
INSERT INTO fichasubpartidas VALUES(15,1,15,NULL,NULL,NULL,NULL,NULL,'2025-06-24T23:48:54.000000Z','2025-06-24T23:48:54.000000Z');
INSERT INTO fichasubpartidas VALUES(16,1,16,NULL,NULL,NULL,NULL,NULL,'2025-06-24T23:48:54.000000Z','2025-06-24T23:48:54.000000Z');
INSERT INTO fichasubpartidas VALUES(17,1,17,NULL,NULL,NULL,NULL,NULL,'2025-06-24T23:48:54.000000Z','2025-06-24T23:48:54.000000Z');
INSERT INTO fichasubpartidas VALUES(18,1,18,NULL,NULL,NULL,NULL,NULL,'2025-06-24T23:48:54.000000Z','2025-06-24T23:48:54.000000Z');
INSERT INTO fichasubpartidas VALUES(19,1,19,NULL,NULL,NULL,NULL,NULL,'2025-06-24T23:48:54.000000Z','2025-06-24T23:48:54.000000Z');
INSERT INTO fichasubpartidas VALUES(20,1,20,NULL,NULL,NULL,NULL,NULL,'2025-06-24T23:48:54.000000Z','2025-06-24T23:48:54.000000Z');
INSERT INTO fichasubpartidas VALUES(21,1,21,NULL,NULL,NULL,NULL,NULL,'2025-06-24T23:48:54.000000Z','2025-06-24T23:48:54.000000Z');
INSERT INTO fichasubpartidas VALUES(22,1,22,NULL,120.349999999999994,NULL,NULL,NULL,'2025-06-24T23:48:54.000000Z','2025-06-24T23:48:54.000000Z');
INSERT INTO fichasubpartidas VALUES(23,1,23,NULL,NULL,NULL,NULL,NULL,'2025-06-24T23:48:54.000000Z','2025-06-24T23:48:54.000000Z');
INSERT INTO fichasubpartidas VALUES(24,1,24,NULL,NULL,NULL,NULL,NULL,'2025-06-24T23:48:54.000000Z','2025-06-24T23:48:54.000000Z');
INSERT INTO fichasubpartidas VALUES(25,1,25,NULL,NULL,NULL,NULL,NULL,'2025-06-24T23:48:54.000000Z','2025-06-24T23:48:54.000000Z');
INSERT INTO fichasubpartidas VALUES(26,1,26,NULL,NULL,NULL,NULL,NULL,'2025-06-24T23:48:54.000000Z','2025-06-24T23:48:54.000000Z');
INSERT INTO fichasubpartidas VALUES(27,1,27,NULL,NULL,NULL,NULL,NULL,'2025-06-24T23:48:54.000000Z','2025-06-24T23:48:54.000000Z');
INSERT INTO fichasubpartidas VALUES(28,1,28,NULL,NULL,NULL,NULL,NULL,'2025-06-24T23:48:54.000000Z','2025-06-24T23:48:54.000000Z');
INSERT INTO fichasubpartidas VALUES(29,1,29,NULL,NULL,NULL,NULL,NULL,'2025-06-24T23:48:54.000000Z','2025-06-24T23:48:54.000000Z');
INSERT INTO fichasubpartidas VALUES(30,1,30,NULL,NULL,NULL,NULL,NULL,'2025-06-24T23:48:54.000000Z','2025-06-24T23:48:54.000000Z');
INSERT INTO fichasubpartidas VALUES(31,1,31,NULL,NULL,NULL,NULL,NULL,'2025-06-24T23:48:54.000000Z','2025-06-24T23:48:54.000000Z');
INSERT INTO fichasubpartidas VALUES(32,1,32,NULL,NULL,NULL,NULL,NULL,'2025-06-24T23:48:54.000000Z','2025-06-24T23:48:54.000000Z');
INSERT INTO fichasubpartidas VALUES(33,1,33,NULL,NULL,NULL,NULL,NULL,'2025-06-24T23:48:54.000000Z','2025-06-24T23:48:54.000000Z');
INSERT INTO fichasubpartidas VALUES(34,1,34,NULL,NULL,NULL,NULL,NULL,'2025-06-24T23:48:54.000000Z','2025-06-24T23:48:54.000000Z');
INSERT INTO fichasubpartidas VALUES(35,1,35,NULL,NULL,NULL,NULL,NULL,'2025-06-24T23:48:54.000000Z','2025-06-24T23:48:54.000000Z');
INSERT INTO fichasubpartidas VALUES(36,1,36,NULL,NULL,NULL,NULL,NULL,'2025-06-24T23:48:54.000000Z','2025-06-24T23:48:54.000000Z');
INSERT INTO fichasubpartidas VALUES(37,1,37,NULL,168.229999999999989,NULL,NULL,NULL,'2025-06-24T23:48:54.000000Z','2025-06-24T23:48:54.000000Z');
INSERT INTO fichasubpartidas VALUES(38,1,38,NULL,NULL,NULL,NULL,NULL,'2025-06-24T23:48:54.000000Z','2025-06-24T23:48:54.000000Z');
INSERT INTO fichasubpartidas VALUES(39,1,39,NULL,NULL,NULL,NULL,NULL,'2025-06-24T23:48:54.000000Z','2025-08-02T14:42:15.000000Z');
INSERT INTO fichasubpartidas VALUES(40,1,40,NULL,134.721552076743506,NULL,NULL,NULL,'2025-06-24T23:48:54.000000Z','2025-06-24T23:48:54.000000Z');
INSERT INTO fichasubpartidas VALUES(41,1,41,NULL,947.812382515850004,NULL,NULL,NULL,'2025-06-24T23:48:54.000000Z','2025-06-24T23:48:54.000000Z');
INSERT INTO fichasubpartidas VALUES(42,1,42,NULL,3601.68705356022974,NULL,NULL,NULL,'2025-06-24T23:48:54.000000Z','2025-06-24T23:48:54.000000Z');
INSERT INTO fichasubpartidas VALUES(43,1,43,NULL,NULL,NULL,NULL,NULL,'2025-06-24T23:48:54.000000Z','2025-06-24T23:48:54.000000Z');
INSERT INTO fichasubpartidas VALUES(44,1,44,NULL,5250.0,NULL,NULL,'Uso y explotación de Internet más telefonía corporativa','2025-06-24T23:48:54.000000Z','2025-06-24T23:48:54.000000Z');
CREATE TABLE IF NOT EXISTS "filtros" ("id" INTEGER NOT NULL,
"user_id" INTEGER NOT NULL,
"modulo_id" INTEGER NOT NULL,
"campo" VARCHAR(250) NOT NULL,
"signo" VARCHAR(50) NOT NULL,
"valor" TEXT,
"valor2" TEXT,
"descripcion" TEXT NOT NULL,
"created_at" TIMESTAMP,
"updated_at" TIMESTAMP,
CONSTRAINT "pk_filtros" PRIMARY KEY("id"));
CREATE TABLE IF NOT EXISTS "firmas" ("id" INTEGER NOT NULL,
"nombre" VARCHAR(50) NOT NULL,
"cargo" VARCHAR(50) NOT NULL,
"telefono" VARCHAR(50),
"correo" VARCHAR(50),
"activo" TINYINT DEFAULT 1,
"created_at" DATETIME,
"updated_at" DATETIME,
CONSTRAINT "pk_firmas" PRIMARY KEY("id"));
CREATE TABLE IF NOT EXISTS "generales" ("id" INTEGER NOT NULL,
"empresa" VARCHAR(250) NOT NULL,
"organismo" VARCHAR(250),
licencia BLOB, "ir" BLOB, p100utilidades REAL, p100impuestos REAL, p100vacaciones REAL, p100gastos REAL, p100contribuciones REAL, p100impuestosft REAL, actividadtipo_id INTEGER, p100osde REAL, p100especial REAL, contribucionespecial NUMERIC, argumentacion TEXT, fichaactiva INTEGER,
CONSTRAINT "pk_generales" PRIMARY KEY("id"));
INSERT INTO generales VALUES(1,'TRIAL','TRIAL','8Xi+7AgLqiVrUBE6+Ssl7rf9xs3PsZR/LXNCoNn4CbAogrsB7ZHG3hwjGsZgWN1lC4iXb0CoDVj/NReVv7vk7MMJ0mHGiujCK2QNHOfBv9+UVl/o/zugfSQ1GC+fCXMYF8rS1ouVftI4ngmo4p6aNPS43H0ATtzg6/9m0N7uXG+5cQMQXIFrp1+KbJBDWHwgGMG1i6gnwLKYbdLsfxToH6HasKK9AM+XO+jLb3BdakouL8OcOwDJEU0OnwrNt4G3Jbkv0BdGPyM652tm8Kn5yWiv2tNEPduiSs52bifxdFzD2+96iOEGvJ/XJ6Oa49u7yjnrxHmnaoD77mrQ5bfrT0bFluoJJ7jlGpKndSrxqhleRiA65xzUH8OKfwSzAU+wmEQgF93zxIn+y0Dd61U7KnpBQY3pXFyXpWzUoZIi3Ev2JwxrR7Fg8mKCj2BlESEW2kxH0Hxp0MR8ZrPcE7Ayzl968+rDz0vtRAZDxdmuLGkHQ2OazFz8mDSbDZwL2Lpa2u5JXVrC3m36TMP38aPLOorYqhFxuTLMtuupEZO0rqzXBEbunCJGhZHA9azZDXR+mr6ivnTXfR0Ajx/y6mQ8fXjflNh7+zZDaJpxc1vTBy66yrAXJf6s3mRJje+9OCHJ9PhpeUdFuImeNtO87jCcwiJayF0Elz5FSa0tYpp6uV60+qYRxjLAAxdE6+f7K8WiVixt3BPmz/+YzG1xchtqOcDJO4S7BTSUSQ+98evQdpUaoXJdgExQuyw6XtxAaSNWS6TRiha+OoZDW4GbPOKwEaGxJQIt3eBKpJ7lLAWYdAQ=','MQ==',15.0,5.0,9.08999999999999985,1.0,14.0,5.0,1,'',NULL,'','',1);
CREATE TABLE IF NOT EXISTS "insumogrupos" ("id" INTEGER NOT NULL,
"insumogrupo" VARCHAR(50),
"created_at" DATETIME,
"updated_at" DATETIME,
CONSTRAINT "pk_insumogrupos" PRIMARY KEY("id"));
INSERT INTO insumogrupos VALUES(1,'MATERIAS PRIMAS Y MATERIALES',NULL,NULL);
INSERT INTO insumogrupos VALUES(2,'COMBUSTIBLES Y LUBRICANTES',NULL,NULL);
INSERT INTO insumogrupos VALUES(3,'ENERGÍA',NULL,NULL);
INSERT INTO insumogrupos VALUES(4,'AGUA',NULL,NULL);
CREATE TABLE IF NOT EXISTS "insumos" ("id" INTEGER NOT NULL,
"codigo" VARCHAR(25),
"insumo" VARCHAR(50) NOT NULL,
"um" VARCHAR(2),
"umequipo" VARCHAR(2),
"preciounitario" REAL,
"insumotipo_id" INTEGER NOT NULL,
"activo" TINYINT DEFAULT 1,
CONSTRAINT "pk_insumos" PRIMARY KEY("id"));
INSERT INTO insumos VALUES(1,NULL,'ENERGÍA ELÉCTRICA','KW','HE',3.20999999999999996,3,0);
INSERT INTO insumos VALUES(2,'tn2025','Tóner Nuevo','U',NULL,12750.0,1,1);
INSERT INTO insumos VALUES(3,'HC2025','Hoja Carta','U',NULL,9.0,8,1);
INSERT INTO insumos VALUES(4,NULL,'GASOLINA MOTOR DE 90 OCTANOS','L','KM',24.3000000000000007,2,0);
INSERT INTO insumos VALUES(5,NULL,'LUBRICANTES DE MOTOR','L','KM',100.0,2,0);
CREATE TABLE IF NOT EXISTS "insumotipos" ("id" INTEGER NOT NULL,
"idinsumotipo" VARCHAR(2) NOT NULL,
"tipoinsumo" VARCHAR(100),
"insumogrupo_id" INTEGER, um TEXT,
CONSTRAINT "pk_insumotipos" PRIMARY KEY("id"));
INSERT INTO insumotipos VALUES(1,'RA','RECURSO AUXILIAR',1,'U');
INSERT INTO insumotipos VALUES(2,'RC','RECURSO COMBUSTIBLE ',2,'L');
INSERT INTO insumotipos VALUES(3,'RE','ENERGÍA ELÉCTRICA',3,'KW');
INSERT INTO insumotipos VALUES(4,'RH','HERRAMIENTAS',1,'U');
INSERT INTO insumotipos VALUES(5,'RJ','RECURSO COMPUESTO',1,'U');
INSERT INTO insumotipos VALUES(6,'RM','MATERIA PRIMA',1,'U');
INSERT INTO insumotipos VALUES(7,'RN','RECURSO NATURAL',4,'L');
INSERT INTO insumotipos VALUES(8,'RO','MATERIALES DE OFICINA',1,'U');
INSERT INTO insumotipos VALUES(9,'RS','RECURSO SEMIELABORADO',1,'U');
INSERT INTO insumotipos VALUES(10,'RU','ÚTILES ',1,'U');
CREATE TABLE IF NOT EXISTS "plantillafichas" ("idplantilla" TINYINT NOT NULL,
"plantilla" VARCHAR(250),
CONSTRAINT "pk_plantillafichas" PRIMARY KEY("idplantilla"));
INSERT INTO plantillafichas VALUES(1,'TOSTEO POR ÓRDENES');
INSERT INTO plantillafichas VALUES(2,'TOSTEO POR PROCESOS');
CREATE TABLE IF NOT EXISTS "plantillapartidas" ("id" INTEGER NOT NULL,
"idpartida" INTEGER NOT NULL,
"idpartidasuperior" INTEGER NOT NULL,
"fila" VARCHAR(5),
"concepto" VARCHAR(65),
"abreviatura" VARCHAR(4),
"tipo" TINYINT,
"item" TINYINT,
"grupo" TINYINT,
"activo" TINYINT,
"desglosarsalarios" TINYINT,
"desglosarpartida" INTEGER NOT NULL DEFAULT 1,
"aplicarcoeficiente" TINYINT,
"coeficiente" REAL,
"descripcion" TEXT,
"created_at" DATETIME,
"updated_at" DATETIME,
CONSTRAINT "pk_plantillapartidas" PRIMARY KEY("id"));
INSERT INTO plantillapartidas VALUES(1,100,1,'1','Gasto Material','CMAT',1,1,2,1,NULL,0,0,0.0,'Fila 1 Gasto Material: Considera los gastos de recursos materiales comprados y producidos, que se emplean en la producción, identificables directamente en los productos y servicios prestados por la empresa, en correspondencia con las normas de consumo y el ajuste de los importes de los subproductos y similares, cuando proceda. En el caso de los recursos materiales adquiridos se refleja el monto que se pague al suministrador (costo más margen comercial) y otros gastos en que se incurra hasta darles entrada en el almacén, y para los producidos por la propia entidad al costo de producción.',NULL,NULL);
INSERT INTO plantillapartidas VALUES(2,101,100,'1.1','De ello: Insumos (Materias Primas y Materiales)','CMP',2,2,2,1,NULL,0,0,0.0,'1.1. Insumos: las materias primas, materiales básicos y auxiliares, artículos de completamiento y semielaborados adquiridos.',NULL,NULL);
INSERT INTO plantillapartidas VALUES(3,102,100,'1.2','Combustibles y Lubricantes','CCL',3,3,2,1,NULL,0,0,0.0,'1.2.Combustibles y lubricantes utilizados para producir energía en el proceso productivo, incluye el valor de las tasas de recargo, según las normas técnicas establecidas.',NULL,NULL);
INSERT INTO plantillapartidas VALUES(4,103,100,'1.3','Energía','CEE',4,4,2,1,NULL,0,0,0.0,'1.3. Energía eléctrica utilizada en la producción, de acuerdo con la tarifa que paga la entidad, dividido entre la producción, según las normas técnicas establecidas.',NULL,NULL);
INSERT INTO plantillapartidas VALUES(5,104,100,'1.4','Agua','CAD',5,5,2,1,NULL,0,0,0.0,'1.4. El agua utilizada en la producción, de acuerdo con las tarifas vigentes, divido entre la producción, según las normas técnicas establecidas.',NULL,NULL);
INSERT INTO plantillapartidas VALUES(6,105,1,'2','Salario Directo o Retribución Directa','CMO',6,6,2,1,NULL,0,0,0.0,'Fila 2: Salarios: Se consignan el salario y las vacaciones (se entiende como tal lo que se establece legalmente por el Ministerio de Trabajo y Seguridad Social). Esta información se obtiene del modelo anexo Desglose del Salario Directo, el cual a su vez se elabora a partir de lo aprobado en la Carta Tecnológica que rige el proceso productivo o de servicio en cuestión.',NULL,NULL);
INSERT INTO plantillapartidas VALUES(7,106,1,'3','Otros Gastos Directos','OGD',7,7,2,1,NULL,1,0,0.0,'Fila 3: Otros gastos directos: Incluye los conceptos de gastos directos o identificables con una producción o servicio, entre los cuales se encuentran: los pagos por mantenimientos y reparaciones recibidos; la Depreciación de los activos fijos tangibles que intervienen directamente en el proceso y la amortización de activos fijos intangibles, así como otros conceptos definidos en las normas contables. Las partidas de Depreciación y Amortización, así como otras de mayor peso dentro de los otros gastos directos deben desglosarse.',NULL,NULL);
INSERT INTO plantillapartidas VALUES(8,107,1,'4','Gastos Asociados a la Producción','GAP',8,8,2,1,1,1,0,0.330000000000000015,'Fila 4: Gastos asociados a la producción y los servicios: Comprenden los importes de los gastos que se incurren en las actividades asociadas a la producción, no identificables con un producto o servicio determinado. Incluyen los gastos de las actividades de mantenimiento, reparaciones corrientes y explotación de equipos, dirección de la producción, control de calidad, depreciación de Activos Fijos Tangibles de producción y servicios auxiliares a esta, entre otros.',NULL,NULL);
INSERT INTO plantillapartidas VALUES(9,108,107,'4.1','De ello: Salarios','SGAP',9,9,1,0,1,0,0,0.330000000000000015,NULL,NULL,NULL);
INSERT INTO plantillapartidas VALUES(10,109,1,'5','TOTAL DE COSTOS (F1+F2+F3+F4)','TC',10,10,3,1,NULL,0,0,0.0,'Fila 5: Total de Costos: Suma de las filas 1, 2, 3, y 4.',NULL,NULL);
INSERT INTO plantillapartidas VALUES(11,110,1,'6','Gastos Generales y de Administración','GGA',11,11,2,1,1,1,0,0.330000000000000015,'Fila 6: Comprende gastos de materiales, combustible, energía, salarios, recargos laborales y sociales e impuestos, gastos de comunicaciones, transporte, depreciación y mantenimiento de equipos, muebles, enseres e inmuebles utilizados.',NULL,NULL);
INSERT INTO plantillapartidas VALUES(12,111,110,'6.1','De ello: Salarios','SGGA',12,12,1,0,1,0,0,0.330000000000000015,NULL,NULL,NULL);
INSERT INTO plantillapartidas VALUES(13,112,1,'7','Gastos de Distribución y Venta','GDV',13,13,2,1,1,1,1,0.330000000000000015,'Fila 7: La suma de los conceptos de gastos indirectos de las filas 4, 6 y 7, como norma no debe exceder del importe determinado aplicando el coeficiente autorizado de hasta 1,5 como máximo y por debajo de 1,0 en las actividades de servicios, el cual se aplica sobre el gasto de salario directo (Fila 2) para definir la cuantía total de los Gastos Indirectos que se utilizan en la confección de la Ficha. Para reconocer montos superiores deben consultar al MFP, previa demostración.',NULL,NULL);
INSERT INTO plantillapartidas VALUES(14,113,112,'7.1','De ello: Salarios','SGDV',14,14,1,0,1,0,0,0.330000000000000015,NULL,NULL,NULL);
INSERT INTO plantillapartidas VALUES(15,114,1,'8','Gastos Financieros','GFZ',15,15,2,1,NULL,1,0,0.0,'Fila 8: Gastos financieros: Comprende los gastos en que se incurra, por las operaciones financieras relacionadas con la producción o servicio para la que se elabora la Ficha, reconociendo solo los conceptos de intereses, comisiones bancarias y primas del seguro.',NULL,NULL);
INSERT INTO plantillapartidas VALUES(16,115,1,'9','Gastos por Financiamiento entregado a la OSDE','GFEO',16,16,2,1,NULL,1,0,0.0,'Fila 9: Gastos por financiamiento a la OSDE: Los gastos corrientes de las organizaciones superiores de dirección empresarial se financian a través de los aportes que con cargo a sus gastos realizan las entidades que la integran, según el Presupuesto aprobado para el ejercicio económico. Dicho importe no debe exceder del monto consignado por concepto de gastos generales y de administración.',NULL,NULL);
INSERT INTO plantillapartidas VALUES(17,116,1,'10','Gastos Tributarios','GTB',17,17,2,1,NULL,1,0,0.0,'Fila 10: Se consignan los importes que corresponden a los tributos Contribución a la Seguridad Social e Impuesto sobre la Utilización de la Fuerza de Trabajo, cuya base imponible es la suma del salario directo e indirecto, a la cual se le aplica el tipo impositivo aprobado para cada tributo, de acuerdo con la legislación tributaria. Incluye otros tributos autorizados por la legislación vigente. No se considera el importe por la Contribución al Desarrollo Local.',NULL,NULL);
INSERT INTO plantillapartidas VALUES(18,117,1,'11','TOTAL DE GASTOS (F6+F7+F8+F9+F10)','TG',18,18,3,1,NULL,0,0,0.0,'Fila 11: Se consigna el importe resultante de sumar las Filas 6+7+8+9+10.',NULL,NULL);
INSERT INTO plantillapartidas VALUES(19,118,1,'12','TOTAL DE COSTOS Y GASTOS (F5+F11)','TCG',19,19,3,1,NULL,0,0,0.0,'Fila 12: Es el importe del total de costos y gastos (suma de las Filas 6+11).',NULL,NULL);
INSERT INTO plantillapartidas VALUES(20,119,1,'13','Utilidad','UTL',20,20,4,1,NULL,0,0,0.0,'Fila 13: Se consigna el monto de utilidad que corresponda, tomando en cuenta el método de formación de precios. De no proceder la formación por correlación y utilizarse método de gastos se aplican los límites establecidos para el cálculo de la utilidad que se detalla en Anexo 2. De aplicarse la correlación, siempre que con ello no se generen subsidios, la masa de utilidad se determina al deducir del precio propuesto por correlación, previo análisis de las calidades equivalentes y el total de costos y gastos determinado con criterio de racionalidad.',NULL,NULL);
INSERT INTO plantillapartidas VALUES(21,120,1,'14','PRECIO O TARIFA (F12+F13)','PP',21,21,3,0,NULL,0,0,0.0,'Fila 14: Se consigna el importe resultante de adicionar al total de costos y gastos, el importe de utilidad que proceda (Fila 12+13).',NULL,NULL);
INSERT INTO plantillapartidas VALUES(22,121,1,'15','PRECIO O TARIFA UNITARIO AJUSTADO','PPU',22,22,4,0,NULL,0,0,0.0,'Fila 15: Se consigna el precio o tarifa en la expresión unitaria.',NULL,NULL);
INSERT INTO plantillapartidas VALUES(23,122,1,'16','Datos sobre precios de referencia','PREF',30,30,2,0,NULL,0,0,0.0,'Fila 16: Fila explicativa, que considera las bases de datos de referencia de precios y tarifas de comparables y similares, que pueden ser del mercado externo o interno según proceda en cada caso. Los elementos de esta fila pueden detallarse en otro Anexo. La base de datos sobre los precios referenciales debe precisarse y demostrarse mediante facturas, solicitud de información a otras entidades e informaciones resultantes de conciliaciones u otras vías que lo evidencien de manera objetiva y funcional, con criterio de racionalidad.',NULL,NULL);
CREATE TABLE IF NOT EXISTS "plantillasubpartidas" ("id" INTEGER NOT NULL,
"partida_id" INTEGER NOT NULL,
"idsubpartida" INTEGER NOT NULL,
"idpartida" INTEGER NOT NULL,
"fila" INTEGER,
"concepto" VARCHAR(120),
"tipo" TINYINT,
"editable" TINYINT DEFAULT 1,
"activo" TINYINT,
"created_at" DATETIME,
"updated_at" DATETIME,
CONSTRAINT "pk_plantillasubpartidas" PRIMARY KEY("id"));
INSERT INTO plantillasubpartidas VALUES(1,7,10601,106,1,'Pagos por mantenimientos y reparaciones recibidos',7,0,1,NULL,NULL);
INSERT INTO plantillasubpartidas VALUES(2,7,10602,106,2,'Depreciación de los activos fijos tangibles que intervienen directamente en el proceso',7,0,1,NULL,NULL);
INSERT INTO plantillasubpartidas VALUES(3,7,10603,106,3,'Amortización de activos fijos intangibles',7,1,1,NULL,NULL);
INSERT INTO plantillasubpartidas VALUES(4,7,10604,106,4,'Pruebas y control de calidad',7,1,1,NULL,NULL);
INSERT INTO plantillasubpartidas VALUES(5,7,10605,106,5,'Montaje y desmontaje de equipos',7,1,1,NULL,NULL);
INSERT INTO plantillasubpartidas VALUES(6,7,10606,106,6,'Gastos menores de materiales',7,1,1,NULL,NULL);
INSERT INTO plantillasubpartidas VALUES(7,7,10607,106,7,'Gastos relacionados con la limpieza del área productiva',7,1,1,NULL,NULL);
INSERT INTO plantillasubpartidas VALUES(8,7,10608,106,8,'Cargas y descargas de recursos materiales y equipos',7,1,1,NULL,NULL);
INSERT INTO plantillasubpartidas VALUES(9,7,10609,106,9,'Gastos de almacenaje de recursos materiales y equipos',7,1,1,NULL,NULL);
INSERT INTO plantillasubpartidas VALUES(10,7,10610,106,10,'Mermas del proceso de producción no comprendidos en los costos directos de materiales',7,1,1,NULL,NULL);
INSERT INTO plantillasubpartidas VALUES(11,7,10611,106,11,'Paradas tecnológicas de los equipos como parte del proceso de producción',7,1,1,NULL,NULL);
INSERT INTO plantillasubpartidas VALUES(12,7,10612,106,12,'Gastos de protección e higiene del trabajo de acuerdo con el plan elaborado',7,1,1,NULL,NULL);
INSERT INTO plantillasubpartidas VALUES(13,7,10613,106,13,'Servicios productivos recibidos para la ejecución de la producción no contenidos en los costos fijos',7,1,1,NULL,NULL);
INSERT INTO plantillasubpartidas VALUES(14,7,10614,106,14,'Gastos de dietas a trabajadores',7,1,1,NULL,NULL);
INSERT INTO plantillasubpartidas VALUES(15,7,10615,106,15,'Gastos de alojamiento y otros gastos asociados',7,1,1,NULL,NULL);
INSERT INTO plantillasubpartidas VALUES(16,7,10616,106,16,'Otros conceptos definidos en las normas contables',7,1,1,NULL,NULL);
INSERT INTO plantillasubpartidas VALUES(17,8,10701,107,1,'Gastos de las actividades de mantenimiento',8,1,1,NULL,NULL);
INSERT INTO plantillasubpartidas VALUES(18,8,10702,107,2,'Reparaciones corrientes',8,1,1,NULL,NULL);
INSERT INTO plantillasubpartidas VALUES(19,8,10703,107,3,'Explotación de equipos',8,1,1,NULL,NULL);
INSERT INTO plantillasubpartidas VALUES(20,8,10704,107,4,'Dirección de la producción',8,1,1,NULL,NULL);
INSERT INTO plantillasubpartidas VALUES(21,8,10705,107,5,'Control de calidad',8,1,1,NULL,NULL);
INSERT INTO plantillasubpartidas VALUES(22,8,10706,107,6,'Depreciación de Activos Fijos Tangibles de producción',8,1,1,NULL,NULL);
INSERT INTO plantillasubpartidas VALUES(23,8,10707,107,7,'Servicios auxiliares',8,1,1,NULL,NULL);
INSERT INTO plantillasubpartidas VALUES(24,8,10708,107,8,'Otros no identificables con un producto o servicio',8,1,1,NULL,NULL);
INSERT INTO plantillasubpartidas VALUES(25,11,11001,110,1,'Gastos del personal de dirección de la empresa',11,1,1,NULL,NULL);
INSERT INTO plantillasubpartidas VALUES(26,11,11002,110,2,'Gastos en comisión de servicios',11,1,1,NULL,NULL);
INSERT INTO plantillasubpartidas VALUES(27,11,11003,110,3,'Gastos de oficina, almacenes y talleres centrales',11,1,1,NULL,NULL);
INSERT INTO plantillasubpartidas VALUES(28,11,11004,110,4,'Amortización y depreciación de los activos fijos',11,1,1,NULL,NULL);
INSERT INTO plantillasubpartidas VALUES(29,11,11005,110,5,'Generales de Protección del trabajo',11,1,1,NULL,NULL);
INSERT INTO plantillasubpartidas VALUES(30,11,11006,110,6,'Preparación de cuadros',11,1,1,NULL,NULL);
INSERT INTO plantillasubpartidas VALUES(31,11,11007,110,7,'Tramitaciones legales',11,1,1,NULL,NULL);
INSERT INTO plantillasubpartidas VALUES(32,11,11008,110,8,'Gastos de protección',11,1,1,NULL,NULL);
INSERT INTO plantillasubpartidas VALUES(33,11,11009,110,9,'Mantenimiento de áreas verdes y otros',11,1,1,NULL,NULL);
INSERT INTO plantillasubpartidas VALUES(34,11,11010,110,10,'Mantenimientos y reparaciones corrientes de instalaciones y equipos de uso general',11,1,1,NULL,NULL);
INSERT INTO plantillasubpartidas VALUES(35,13,11201,112,1,'Gastos de distribución y venta',13,1,1,NULL,NULL);
INSERT INTO plantillasubpartidas VALUES(36,15,11401,114,1,'Intereses',15,1,1,NULL,NULL);
INSERT INTO plantillasubpartidas VALUES(37,15,11402,114,2,'Comisiones bancarias',15,1,1,NULL,NULL);
INSERT INTO plantillasubpartidas VALUES(38,15,11403,114,3,'Primas del seguro',15,1,1,NULL,NULL);
INSERT INTO plantillasubpartidas VALUES(39,15,11404,114,4,'Otras contribuciones de destino específico',15,1,1,NULL,NULL);
INSERT INTO plantillasubpartidas VALUES(40,16,11501,115,1,'Gastos corrientes de las organizaciones superiores de dirección empresarial',16,1,1,NULL,NULL);
INSERT INTO plantillasubpartidas VALUES(41,17,11601,116,1,'Impuesto sobre la Utilización de la Fuerza de Trabajo',17,0,1,NULL,NULL);
INSERT INTO plantillasubpartidas VALUES(42,17,11602,116,2,'Contribución a la Seguridad Social',17,0,1,NULL,NULL);
INSERT INTO plantillasubpartidas VALUES(43,17,11603,116,3,'Otros tributos autorizados',17,1,1,NULL,NULL);
INSERT INTO plantillasubpartidas VALUES(44,11,11011,110,11,'Gastos de Comunicaciones',12,1,1,'2024-05-07 16:11:10','2024-05-07 16:11:10');
CREATE TABLE IF NOT EXISTS "umedidas" ("id" VARCHAR(2) NOT NULL,
"unidadmedida" VARCHAR(50) NOT NULL,
"umdescripcion" VARCHAR(15),
CONSTRAINT "pk_umedidas" PRIMARY KEY("id"));
INSERT INTO umedidas VALUES('$','PESO','$');
INSERT INTO umedidas VALUES('$L','PESOS POR LITROS','$/l ');
INSERT INTO umedidas VALUES('$W','PESOS POR KILOWATT','$/kW');
INSERT INTO umedidas VALUES('1K','1 KILOMETRO','1 km');
INSERT INTO umedidas VALUES('AG','UNA AGUJA','una aguja');
INSERT INTO umedidas VALUES('AM','AMARRE','amarre');
INSERT INTO umedidas VALUES('BI','BIDON','bidón');
INSERT INTO umedidas VALUES('BL','BLOCK','blocs');
INSERT INTO umedidas VALUES('BS','BOLSA','bolsa');
INSERT INTO umedidas VALUES('BT','BOTELLA','botella');
INSERT INTO umedidas VALUES('C1','CIEN UNIDADES POR METRO','100 u/m');
INSERT INTO umedidas VALUES('C2','CIEN METROS CUADRADOS','100 m2');
INSERT INTO umedidas VALUES('C3','CIEN METROS CUBICOS','100 m3');
INSERT INTO umedidas VALUES('C4','CIEN TONELADAS METRICAS','100 t');
INSERT INTO umedidas VALUES('C5','CIEN TONELADAS METRICAS POR MILLA NAUTICA','100 t/mi naut');
INSERT INTO umedidas VALUES('C7','CIEN METROS CUBICOS POR MILLA NAUTICA','100 m3/mi naut');
INSERT INTO umedidas VALUES('CB','CUBETA','cubeta');
INSERT INTO umedidas VALUES('CC','UN CONTRACARRIL','1 contracarril');
INSERT INTO umedidas VALUES('CD','CUERDA','cuerda');
INSERT INTO umedidas VALUES('CJ','CAJA','caja');
INSERT INTO umedidas VALUES('CK','CIEN METROS CUBICOS POR KILOMETRO','100 m3/km');
INSERT INTO umedidas VALUES('CL','CILINDRO','cilindro');
INSERT INTO umedidas VALUES('CM','CIEN METROS','100 m');
INSERT INTO umedidas VALUES('CN','UNA CONEXION','una conexión');
INSERT INTO umedidas VALUES('CO','VARIAS TRAVIESAS UNIDAS CON LOS CARRILES FORMANDO ','un campo');
INSERT INTO umedidas VALUES('CP','CIEN PARES','100 pares');
INSERT INTO umedidas VALUES('CR','UN CARRIL','un carril');
INSERT INTO umedidas VALUES('CS','CIEN PESOS','$ 100');
INSERT INTO umedidas VALUES('CT','CIEN UNIDADES','100 u');
INSERT INTO umedidas VALUES('CU','CIEN UNIDADES','100 u');
INSERT INTO umedidas VALUES('D2','DIEZ METROS CUADRADOS','10 m2');
INSERT INTO umedidas VALUES('D3','DIEZ METROS CUBICOS','10 m3');
INSERT INTO umedidas VALUES('DC','DIEZ UNIDADES','10 u');
INSERT INTO umedidas VALUES('DK','DIEZ KILO VOLTS','10 kV');
INSERT INTO umedidas VALUES('DM','DIEZ METROS','10 m');
INSERT INTO umedidas VALUES('DO','DOCENA','docena');
INSERT INTO umedidas VALUES('DP','DOCENA DE PARES','12 pares');
INSERT INTO umedidas VALUES('DS','DIEZ PESOS','$ 10 pesos');
INSERT INTO umedidas VALUES('EP','EMPLOMADURA','emplomad');
INSERT INTO umedidas VALUES('ES','ESTUCHE','estuche');
INSERT INTO umedidas VALUES('FC','FRASCO','frasco');
INSERT INTO umedidas VALUES('FD','FARDO','fardo');
INSERT INTO umedidas VALUES('GL','GALON','galones');
INSERT INTO umedidas VALUES('GR','GRUESA','gruesa');
INSERT INTO umedidas VALUES('HA','HECTAREA','hectárea');
INSERT INTO umedidas VALUES('HE','HORAS EQUIPO','h/equipo');
INSERT INTO umedidas VALUES('HH','HORAS HOMBRE','h/hombre');
INSERT INTO umedidas VALUES('HJ','HOJA','hoja');
INSERT INTO umedidas VALUES('HL','CIEN LITROS','100 l');
INSERT INTO umedidas VALUES('JG','JUEGO','juego');
INSERT INTO umedidas VALUES('KG','KILOGRAMO','kg');
INSERT INTO umedidas VALUES('KH','KILOWATT POR HORA','kW/h');
INSERT INTO umedidas VALUES('KL','KILOMETROS POR LITRO ','km/l');
INSERT INTO umedidas VALUES('KM','KILOMETRO','km');
INSERT INTO umedidas VALUES('KV','MIL VOLTS','1000 v');
INSERT INTO umedidas VALUES('KW','KILOWATT','kW');
INSERT INTO umedidas VALUES('KZ','KILO VOLT AMPERE','kVA');
INSERT INTO umedidas VALUES('L','LITRO','litro');
INSERT INTO umedidas VALUES('LA','LATON','latón');
INSERT INTO umedidas VALUES('LB','LIBRA','libra');
INSERT INTO umedidas VALUES('LH','LITROS POR HORA','l/h');
INSERT INTO umedidas VALUES('LT','LITRO','litro');
INSERT INTO umedidas VALUES('M','METRO','m');
INSERT INTO umedidas VALUES('M1','METRO CUBICO POR METRO','m3/m');
INSERT INTO umedidas VALUES('M2','METRO CUADRADO','m2');
INSERT INTO umedidas VALUES('M3','METRO CUBICO','m3');
INSERT INTO umedidas VALUES('M4','CIEN METROS CUBICOS POR CIEN METROS','100 m3/100m');
INSERT INTO umedidas VALUES('M5','CIEN METROS CUBICOS POR METRO','100 m3/m');
INSERT INTO umedidas VALUES('M6','MIL METROS CUBICOS','1000 m3');
INSERT INTO umedidas VALUES('MD','MOLDE','molde');
INSERT INTO umedidas VALUES('MI','MIL UNIDADES','1000 u');
INSERT INTO umedidas VALUES('ML','METRO','m');
INSERT INTO umedidas VALUES('MM','MIL METROS CUADRADOS','1000 m2');
INSERT INTO umedidas VALUES('MO','MOTOR','unidad motor');
INSERT INTO umedidas VALUES('MP','MIL PIES','1000 pie');
INSERT INTO umedidas VALUES('MS','MIL PESOS','1000 pesos');
INSERT INTO umedidas VALUES('MU','MIL UNIDADES','1000 u');
INSERT INTO umedidas VALUES('MY','MILLA','milla');
INSERT INTO umedidas VALUES('P2','PIE CUADRADO','pie2');
INSERT INTO umedidas VALUES('P3','PIE CUBICO','pie3');
INSERT INTO umedidas VALUES('PA','PASOS','pasos');
INSERT INTO umedidas VALUES('PG','PLIEGO','pliego');
INSERT INTO umedidas VALUES('PI','PIE','pie');
INSERT INTO umedidas VALUES('PL','PLANCHA','plancha');
INSERT INTO umedidas VALUES('PN','UN PASO A NIVEL','1 paso nivel');
INSERT INTO umedidas VALUES('PQ','PAQUETE','paquete');
INSERT INTO umedidas VALUES('PR','PAR','par');
INSERT INTO umedidas VALUES('PS','PESO','$');
INSERT INTO umedidas VALUES('PT','PIE TABLA','pt');
INSERT INTO umedidas VALUES('PU','PULGADA','plg');
INSERT INTO umedidas VALUES('RE','RESMA','resma');
INSERT INTO umedidas VALUES('RO','ROLLO','rollo');
INSERT INTO umedidas VALUES('RU','RUEDA','rueda');
INSERT INTO umedidas VALUES('SB','SOBRE','sobre');
INSERT INTO umedidas VALUES('SC','SACO','saco');
INSERT INTO umedidas VALUES('SN','UNA SENAL','una señal');
INSERT INTO umedidas VALUES('T','TONELADA METRICA','t');
INSERT INTO umedidas VALUES('TB','TUBO','tubo');
INSERT INTO umedidas VALUES('TI','TIRA','tira');
INSERT INTO umedidas VALUES('TM','TONELADA METRICA','t');
INSERT INTO umedidas VALUES('TV','UNA TRAVIESA','una traviesa');
INSERT INTO umedidas VALUES('U','UNIDAD','u');
INSERT INTO umedidas VALUES('UG','UNA GUARDARRANA','una guardarrana');
INSERT INTO umedidas VALUES('UM','UNIDAD POR METRO','u/m');
INSERT INTO umedidas VALUES('UP','UN POSTE','un poste');
INSERT INTO umedidas VALUES('UR','UNA RANA','una rana');
CREATE TABLE IF NOT EXISTS "versiones" ("id" INTEGER NOT NULL,
"version" VARCHAR(15) NOT NULL,
"fecha" DATE NOT NULL,
"detalles" TEXT,
"created_at" DATETIME,
"updated_at" DATETIME,
CONSTRAINT "pk_versiones" PRIMARY KEY("id"));
INSERT INTO versiones VALUES(1,'1.0 Beta','2024-04-22','Primera Versión del Sistema que incluye la elaboración de Fichas de Costos para los Servicios, su exportación hacia un documento de Microsoft word para su impresión, así como la posibilidad de compartir Fichas con otros usuarios registrados.','2024-04-22 17:52:12','2024-04-22 17:54:06');
INSERT INTO versiones VALUES(2,'1.0.1 Beta','2024-04-29','Se incorporan las opciones de Exportar/Importar las Fichas individualmente Hacia/Desde un fichero encriptado con extensión .fik','2024-04-29 09:57:58','2024-04-29 09:57:58');
INSERT INTO versiones VALUES(3,'2.0','2025-03-16','Se amplían las posibilidades para los equipos al permitir vincular un equipo con múltiples insumos','2025-03-16 02:03:44','2025-03-16 02:01:50');
CREATE TABLE usuarios (
        nombre TEXT NOT NULL,
        ci TEXT PRIMARY KEY,
        cuenta TEXT NOT NULL
    );
CREATE TABLE equipos (
	id INTEGER,
	codigo VARCHAR,
	equipo VARCHAR,
	equipotipo_id VARCHAR,
	valorinicial REAL,
	"vidautil" REAL,
	valorresidual REAL,
	fechaactualizado DATE,
	activo TINYINT, umexplotacion TEXT, "indicemtto" REAL,
	CONSTRAINT pk_equipos PRIMARY KEY (id)
);
INSERT INTO equipos VALUES(1,'EO100007','MICROCOMPUTADORA','EO',2500.0,14560.0,0.680087051142546195,'2024-04-29',NULL,'HE',15.0);
INSERT INTO equipos VALUES(2,'LDTL-20250414','Lámpara doble de tubos led de 40w','EA',15000.0,50000.0,1350.0,'2025-04-14',NULL,'HE',10.0);
INSERT INTO equipos VALUES(3,'EO100008','IMPRESORA','EO',750.0,12480.0,0.102599179206566346,'2024-04-29',NULL,'HE',30.0);
INSERT INTO equipos VALUES(4,'EC100002','EQUIPO DE CLIMA','EC',500.0,31200.0,0.297619047619047616,'2024-04-29',NULL,'HE',20.0);
INSERT INTO equipos VALUES(5,'LN2-E20250623','LADA NIVA 2100','EM',25000.0,200000.0,130.0,'2025-06-23',NULL,'KM',20.0);
INSERT INTO equipos VALUES(6,'EO100010','CÁMARA FOTOGRÁFICA','EO',500.0,20800.0,0.068493150684931503,'2024-04-29',NULL,'HE',30.0);
CREATE TABLE IF NOT EXISTS "insumosxequipos" (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	equipo_id INTEGER,
	insumo_id INTEGER,
	indiceconsumo NUMERIC,
	precio NUMERIC,
	um TEXT, umconsumo TEXT);
INSERT INTO insumosxequipos VALUES(1,2,1,0.0888899999999999968,3.20999999999999996,'KW','KW/HE');
INSERT INTO insumosxequipos VALUES(2,1,1,0.220000000000000001,3.20999999999999996,'KW','KW/HE');
INSERT INTO insumosxequipos VALUES(3,3,1,0.400000000000000022,3.20999999999999996,'KW','KW/HE');
INSERT INTO insumosxequipos VALUES(4,6,1,0.5,3.20999999999999996,'KW','KW/HE');
INSERT INTO insumosxequipos VALUES(5,4,1,1.5,3.20999999999999996,'KW','KW/HE');
INSERT INTO insumosxequipos VALUES(6,5,4,10,16.3999999999999985,'L','KM/L');
INSERT INTO insumosxequipos VALUES(7,5,5,3000,100,'L','KM/L');
CREATE TABLE tempfichainsumos (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	"ficha_id" INTEGER,
	insumo_id INTEGER,
	idlistado INTEGER,
	item INTEGER,
	factorconversion REAL,
	cantidad REAL,
	precio REAL,
	costobase REAL,
	costo REAL,
	descripcion TEXT
, hook_id TEXT);
INSERT INTO tempfichainsumos VALUES(2196,1,1,NULL,1,NULL,1210.40319999999996,3.20999999999999996,NULL,3885.394272,'256.00 KW del equipo "Lámpara doble de tubos led de 40w"; 4.00 KW del equipo "CÁMARA FOTOGRÁFICA"; 211.20 KW del equipo "MICROCOMPUTADORA"; 19.20 KW del equipo "IMPRESORA"; 720.00 KW del equipo "EQUIPO DE CLIMA"',NULL);
INSERT INTO tempfichainsumos VALUES(2197,1,2,NULL,2,NULL,1.0,12750.0,NULL,12750.0,NULL,NULL);
INSERT INTO tempfichainsumos VALUES(2198,1,3,NULL,3,NULL,1000.0,9.0,NULL,9000.0,NULL,NULL);
INSERT INTO tempfichainsumos VALUES(2199,1,4,NULL,4,NULL,320.0,16.3999999999999985,NULL,5248.0,'320.00 L del equipo "LADA NIVA 2100"',NULL);
INSERT INTO tempfichainsumos VALUES(2200,1,5,NULL,5,NULL,1.06666666666669995,100.0,NULL,106.666666666669996,'1.07 L del equipo "LADA NIVA 2100"',NULL);
CREATE TABLE cronogramas (
	id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
	ficharhumano_id INTEGER NOT NULL,
	responsable TEXT,
	fechainicio TEXT,
	fechafin TEXT,
	dependencia_id INTEGER
);
INSERT INTO cronogramas VALUES(1,1,NULL,'2025-06-24','2025-06-25',NULL);
INSERT INTO cronogramas VALUES(2,2,NULL,'2025-06-25','2025-06-26',1);
INSERT INTO cronogramas VALUES(3,3,NULL,'2025-06-26','2025-06-27',2);
INSERT INTO cronogramas VALUES(4,4,NULL,'2025-06-27','2025-06-30',3);
INSERT INTO cronogramas VALUES(5,5,NULL,'2025-06-30','2025-07-08',4);
INSERT INTO cronogramas VALUES(6,6,NULL,'2025-07-08','2025-08-21',5);
INSERT INTO cronogramas VALUES(7,7,NULL,'2025-08-21','2025-08-26',6);
INSERT INTO cronogramas VALUES(8,8,NULL,'2025-08-26','2025-08-29',7);
INSERT INTO cronogramas VALUES(9,9,NULL,'2025-08-29','2025-09-01',8);
INSERT INTO cronogramas VALUES(10,10,NULL,'2025-09-01','2025-09-02',9);
INSERT INTO cronogramas VALUES(11,11,NULL,'2025-09-02','2025-09-08',10);
CREATE TABLE clientes (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            reeup TEXT,
                            cliente TEXT,
                            dpa TEXT,
                            nae TEXT,
                            subordinacion TEXT,
                            "tipoentidad_id" INTEGER,
                            ep TEXT,
                            clase TEXT,
                            codigo TEXT,
                            organismo TEXT,
                            direccion TEXT,
                            provincia_id INTEGER,
                            municipio_id INTEGER
                        , tipo TEXT);
INSERT INTO clientes VALUES(1,'22222','Empresa de Propaganda del Partido',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'PCC',NULL,NULL,NULL,NULL);
DELETE FROM sqlite_sequence;
INSERT INTO sqlite_sequence VALUES('tempfichainsumos',2200);
INSERT INTO sqlite_sequence VALUES('clientes',1);
INSERT INTO sqlite_sequence VALUES('insumosxequipos',7);
INSERT INTO sqlite_sequence VALUES('cronogramas',11);
CREATE INDEX "fk_actividadtipos_utilidadtipos" ON "actividadtipos" ("idutilidadtipo");
CREATE INDEX "fk_equipotipos_energiagrupos" ON "equipotipos" ("idenergiagrupo");
CREATE INDEX "PK_Fichas" ON "fichapartidas" ("ficha_id");
CREATE INDEX "FK_Fichas" ON "fichasubpartidas" ("ficha_id");
CREATE UNIQUE INDEX "el_insumo" ON "insumos" ("insumo","um");
COMMIT;
