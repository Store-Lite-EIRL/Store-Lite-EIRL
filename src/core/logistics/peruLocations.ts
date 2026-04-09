// Full dataset of Peru Departments and Provinces with main Districts
export interface District {
  id: string;
  name: string;
}

export interface Province {
  id: string;
  name: string;
  districts: District[];
}

export interface Department {
  id: string;
  name: string;
  provinces: Province[];
}

export const PERU_LOCATIONS: Department[] = [
  {
    id: '01',
    name: 'AMAZONAS',
    provinces: [
      { id: '0101', name: 'CHACHAPOYAS', districts: [{ id: '010101', name: 'CHACHAPOYAS' }] },
      { id: '0102', name: 'BAGUA', districts: [{ id: '010201', name: 'BAGUA' }] },
      { id: '0103', name: 'BONGARA', districts: [{ id: '010301', name: 'JUMBILLA' }] },
      { id: '0104', name: 'CONDORCANQUI', districts: [{ id: '010401', name: 'NIEVA' }] },
      { id: '0105', name: 'LUYA', districts: [{ id: '010501', name: 'LAMUD' }] },
      { id: '0106', name: 'RODRIGUEZ DE MENDOZA', districts: [{ id: '010601', name: 'SAN NICOLAS' }] },
      { id: '0107', name: 'UTCUBAMBA', districts: [{ id: '010701', name: 'BAGUA GRANDE' }] }
    ]
  },
  {
    id: '02',
    name: 'ANCASH',
    provinces: [
      { id: '0201', name: 'HUARAZ', districts: [{ id: '020101', name: 'HUARAZ' }] },
      { id: '0202', name: 'AIJA', districts: [{ id: '020201', name: 'AIJA' }] },
      { id: '0218', name: 'SANTA', districts: [{ id: '021801', name: 'CHIMBOTE' }, { id: '021809', name: 'NUEVO CHIMBOTE' }] },
      { id: '0220', name: 'YUNGAY', districts: [{ id: '022001', name: 'YUNGAY' }] },
      { id: '0203', name: 'ANTONIO RAYMONDI', districts: [{ id: '020301', name: 'LLAMELLIN' }] },
      { id: '0204', name: 'ASUNCION', districts: [{ id: '020401', name: 'CHACAS' }] },
      { id: '0205', name: 'BOLOGNESI', districts: [{ id: '020501', name: 'CHIQUIAN' }] },
      { id: '0206', name: 'CARHUAZ', districts: [{ id: '020601', name: 'CARHUAZ' }] },
      { id: '0207', name: 'CARLOS FERMIN FITZCARRALD', districts: [{ id: '020701', name: 'SAN LUIS' }] },
      { id: '0208', name: 'CASMA', districts: [{ id: '020801', name: 'CASMA' }] },
      { id: '0209', name: 'CORONGO', districts: [{ id: '020901', name: 'CORONGO' }] },
      { id: '0210', name: 'HUARI', districts: [{ id: '021001', name: 'HUARI' }] },
      { id: '0211', name: 'HUARMEY', districts: [{ id: '021101', name: 'HUARMEY' }] },
      { id: '0212', name: 'HUAYLAS', districts: [{ id: '021201', name: 'CARAZ' }] },
      { id: '0213', name: 'MARISCAL LUZURIAGA', districts: [{ id: '021301', name: 'PISCOBAMBA' }] },
      { id: '0214', name: 'OCROS', districts: [{ id: '021401', name: 'OCROS' }] },
      { id: '0215', name: 'PALLASCA', districts: [{ id: '021501', name: 'CABANA' }] },
      { id: '0216', name: 'POMABAMBA', districts: [{ id: '021601', name: 'POMABAMBA' }] },
      { id: '0217', name: 'RECUAY', districts: [{ id: '021701', name: 'RECUAY' }] },
      { id: '0219', name: 'SIHUAS', districts: [{ id: '021901', name: 'SIHUAS' }] }
    ]
  },
  {
    id: '03',
    name: 'APURIMAC',
    provinces: [
      { id: '0301', name: 'ABANCAY', districts: [{ id: '030101', name: 'ABANCAY' }] },
      { id: '0302', name: 'ANDAHUAYLAS', districts: [{ id: '030201', name: 'ANDAHUAYLAS' }] },
      { id: '0303', name: 'ANTABAMBA', districts: [{ id: '030301', name: 'ANTABAMBA' }] },
      { id: '0304', name: 'AYMARAES', districts: [{ id: '030401', name: 'CHALHUANCA' }] },
      { id: '0305', name: 'COTABAMBAS', districts: [{ id: '030501', name: 'TAMBOBAMBA' }] },
      { id: '0306', name: 'CHINCHEROS', districts: [{ id: '030601', name: 'CHINCHEROS' }] },
      { id: '0307', name: 'GRAU', districts: [{ id: '030701', name: 'CHUQUIBAMBILLA' }] }
    ]
  },
  {
    id: '04',
    name: 'AREQUIPA',
    provinces: [
      { id: '0401', name: 'AREQUIPA', districts: [{ id: '040101', name: 'AREQUIPA' }, { id: '040102', name: 'ALTO SELVA ALEGRE' }, { id: '040103', name: 'CAYMA' }, { id: '040104', name: 'CERRO COLORADO' }, { id: '040122', name: 'YANAHUARA' }, { id: '040125', name: 'JOSE LUIS BUSTAMANTE Y RIVERO' }] },
      { id: '0402', name: 'CAMANA', districts: [{ id: '040201', name: 'CAMANA' }] },
      { id: '0403', name: 'CARAVELI', districts: [{ id: '040301', name: 'CARAVELI' }] },
      { id: '0404', name: 'CASTILLA', districts: [{ id: '040401', name: 'APLAO' }] },
      { id: '0405', name: 'CAYLLOMA', districts: [{ id: '040501', name: 'CHIVAY' }] },
      { id: '0406', name: 'CONDESUYOS', districts: [{ id: '040601', name: 'CHUQUIBAMBA' }] },
      { id: '0407', name: 'ISLAY', districts: [{ id: '040701', name: 'MOLLENDO' }] },
      { id: '0408', name: 'LA UNION', districts: [{ id: '040801', name: 'COTAHUASI' }] }
    ]
  },
  {
    id: '05',
    name: 'AYACUCHO',
    provinces: [
      { id: '0501', name: 'HUAMANGA', districts: [{ id: '050101', name: 'AYACUCHO' }] },
      { id: '0502', name: 'CANGALLO', districts: [{ id: '050201', name: 'CANGALLO' }] },
      { id: '0503', name: 'HUANCA SANCOS', districts: [{ id: '050301', name: 'SANCOS' }] },
      { id: '0504', name: 'HUANTA', districts: [{ id: '050401', name: 'HUANTA' }] },
      { id: '0505', name: 'LA MAR', districts: [{ id: '050501', name: 'SAN MIGUEL' }] },
      { id: '0506', name: 'LUCANAS', districts: [{ id: '050601', name: 'PUQUIO' }] },
      { id: '0507', name: 'PARINACOCHAS', districts: [{ id: '050701', name: 'CORACORA' }] },
      { id: '0508', name: 'PAUCAR DEL SARA SARA', districts: [{ id: '050801', name: 'PAUSA' }] },
      { id: '0509', name: 'SUCRE', districts: [{ id: '050901', name: 'QUEROBAMBA' }] },
      { id: '0510', name: 'VICTOR FAJARDO', districts: [{ id: '051001', name: 'HUANCAPI' }] },
      { id: '0511', name: 'VILCAS HUAMAN', districts: [{ id: '051101', name: 'VILCAS HUAMAN' }] }
    ]
  },
  {
    id: '06',
    name: 'CAJAMARCA',
    provinces: [
      { id: '0601', name: 'CAJAMARCA', districts: [{ id: '060101', name: 'CAJAMARCA' }] },
      { id: '0602', name: 'CAJABAMBA', districts: [{ id: '060201', name: 'CAJABAMBA' }] },
      { id: '0603', name: 'CELENDIN', districts: [{ id: '060301', name: 'CELENDIN' }] },
      { id: '0604', name: 'CHOTA', districts: [{ id: '060401', name: 'CHOTA' }] },
      { id: '0605', name: 'CONTUMAZA', districts: [{ id: '060501', name: 'CONTUMAZA' }] },
      { id: '0606', name: 'CUTERVO', districts: [{ id: '060601', name: 'CUTERVO' }] },
      { id: '0607', name: 'HUALGAYOC', districts: [{ id: '060701', name: 'BAMBAMARCA' }] },
      { id: '0608', name: 'JAEN', districts: [{ id: '060801', name: 'JAEN' }] },
      { id: '0609', name: 'SAN IGNACIO', districts: [{ id: '060901', name: 'SAN IGNACIO' }] },
      { id: '0610', name: 'SAN MARCOS', districts: [{ id: '061101', name: 'SAN PEDRO DE CHANCAY' }] },
      { id: '0611', name: 'SAN MIGUEL', districts: [{ id: '061101', name: 'SAN MIGUEL' }] },
      { id: '0612', name: 'SAN PABLO', districts: [{ id: '061201', name: 'SAN PABLO' }] },
      { id: '0613', name: 'SANTA CRUZ', districts: [{ id: '061301', name: 'SANTA CRUZ' }] }
    ]
  },
  {
    id: '07',
    name: 'CALLAO',
    provinces: [
      { id: '0701', name: 'CALLAO', districts: [{ id: '070101', name: 'CALLAO' }, { id: '070102', name: 'BELLAVISTA' }, { id: '070103', name: 'CARMEN DE LA LEGUA' }, { id: '070104', name: 'LA PERLA' }, { id: '070105', name: 'LA PUNTA' }, { id: '070106', name: 'VENTANILLA' }, { id: '070107', name: 'MI PERU' }] }
    ]
  },
  {
    id: '08',
    name: 'CUSCO',
    provinces: [
      { id: '0801', name: 'CUSCO', districts: [{ id: '080101', name: 'CUSCO' }, { id: '080108', name: 'WANCHAQ' }, { id: '080105', name: 'SAN SEBASTIAN' }, { id: '080104', name: 'SAN JERONIMO' }] },
      { id: '0802', name: 'ACOMAYO', districts: [{ id: '080201', name: 'ACOMAYO' }] },
      { id: '0803', name: 'ANTA', districts: [{ id: '080301', name: 'ANTA' }] },
      { id: '0804', name: 'CALCA', districts: [{ id: '080401', name: 'CALCA' }] },
      { id: '0805', name: 'CANAS', districts: [{ id: '080501', name: 'YANAOCA' }] },
      { id: '0806', name: 'CANCHIS', districts: [{ id: '080601', name: 'SICUANI' }] },
      { id: '0807', name: 'CHUMBIVILCAS', districts: [{ id: '080701', name: 'SANTO TOMAS' }] },
      { id: '0808', name: 'ESPINAR', districts: [{ id: '080801', name: 'YAURI' }] },
      { id: '0809', name: 'LA CONVENCION', districts: [{ id: '080901', name: 'SANTA ANA' }] },
      { id: '0810', name: 'PARURO', districts: [{ id: '081001', name: 'PARURO' }] },
      { id: '0811', name: 'PAUCARTAMBO', districts: [{ id: '081101', name: 'PAUCARTAMBO' }] },
      { id: '0812', name: 'QUISPICANCHI', districts: [{ id: '081201', name: 'URCOS' }] },
      { id: '0813', name: 'URUBAMBA', districts: [{ id: '081301', name: 'URUBAMBA' }, { id: '081304', name: 'MACHUPICCHU' }] }
    ]
  },
  {
    id: '09',
    name: 'HUANCAVELICA',
    provinces: [
      { id: '0901', name: 'HUANCAVELICA', districts: [{ id: '090101', name: 'HUANCAVELICA' }] },
      { id: '0902', name: 'ACOBAMBA', districts: [{ id: '090201', name: 'ACOBAMBA' }] },
      { id: '0903', name: 'ANGARAES', districts: [{ id: '090301', name: 'LIRCAY' }] },
      { id: '0904', name: 'CASTROVIRREYNA', districts: [{ id: '090401', name: 'CASTROVIRREYNA' }] },
      { id: '0905', name: 'CHURCAMPA', districts: [{ id: '090501', name: 'CHURCAMPA' }] },
      { id: '0906', name: 'HUAYTARA', districts: [{ id: '090601', name: 'HUAYTARA' }] },
      { id: '0907', name: 'TAYACAJA', districts: [{ id: '090701', name: 'PAMPAS' }] }
    ]
  },
  {
    id: '10',
    name: 'HUANUCO',
    provinces: [
      { id: '1001', name: 'HUANUCO', districts: [{ id: '100101', name: 'HUANUCO' }] },
      { id: '1002', name: 'AMBO', districts: [{ id: '100201', name: 'AMBO' }] },
      { id: '1003', name: 'DOS DE MAYO', districts: [{ id: '100301', name: 'LA UNION' }] },
      { id: '1004', name: 'HUACAYBAMBA', districts: [{ id: '100401', name: 'HUACAYBAMBA' }] },
      { id: '1005', name: 'HUAMALIES', districts: [{ id: '100501', name: 'LLATA' }] },
      { id: '1006', name: 'LEONCIO PRADO', districts: [{ id: '100601', name: 'RUPA-RUPA' }] },
      { id: '1007', name: 'MARAÑON', districts: [{ id: '100701', name: 'HUACRACHUCO' }] },
      { id: '1008', name: 'PACHITEA', districts: [{ id: '100801', name: 'PANAO' }] },
      { id: '1009', name: 'PUERTO INCA', districts: [{ id: '100901', name: 'PUERTO INCA' }] },
      { id: '1010', name: 'LAURICOCHA', districts: [{ id: '101001', name: 'JESUS' }] },
      { id: '1011', name: 'YAROWILCA', districts: [{ id: '101101', name: 'CHAVINILLO' }] }
    ]
  },
  {
    id: '11',
    name: 'ICA',
    provinces: [
      { id: '1101', name: 'ICA', districts: [{ id: '110101', name: 'ICA' }] },
      { id: '1102', name: 'CHINCHA', districts: [{ id: '110201', name: 'CHINCHA ALTA' }] },
      { id: '1103', name: 'NAZCA', districts: [{ id: '110301', name: 'NAZCA' }] },
      { id: '1104', name: 'PALPA', districts: [{ id: '110401', name: 'PALPA' }] },
      { id: '1105', name: 'PISCO', districts: [{ id: '110501', name: 'PISCO' }] }
    ]
  },
  {
    id: '12',
    name: 'JUNIN',
    provinces: [
      { id: '1201', name: 'HUANCAYO', districts: [{ id: '120101', name: 'HUANCAYO' }] },
      { id: '1202', name: 'CONCEPCION', districts: [{ id: '120201', name: 'CONCEPCION' }] },
      { id: '1203', name: 'CHANCHAMAYO', districts: [{ id: '120301', name: 'LA MERCED' }] },
      { id: '1204', name: 'JAUJA', districts: [{ id: '120401', name: 'JAUJA' }] },
      { id: '1205', name: 'JUNIN', districts: [{ id: '120501', name: 'JUNIN' }] },
      { id: '1206', name: 'SATIPO', districts: [{ id: '120601', name: 'SATIPO' }] },
      { id: '1207', name: 'TARMA', districts: [{ id: '120701', name: 'TARMA' }] },
      { id: '1208', name: 'YAULI', districts: [{ id: '120801', name: 'LA OROYA' }] },
      { id: '1209', name: 'CHUPACA', districts: [{ id: '120901', name: 'CHUPACA' }] }
    ]
  },
  {
    id: '13',
    name: 'LA LIBERTAD',
    provinces: [
      { id: '1301', name: 'TRUJILLO', districts: [{ id: '130101', name: 'TRUJILLO' }, { id: '130105', name: 'LA ESPERANZA' }, { id: '130111', name: 'VICTOR LARCO HERRERA' }] },
      { id: '1302', name: 'ASCOPE', districts: [{ id: '130201', name: 'ASCOPE' }] },
      { id: '1303', name: 'BOLIVAR', districts: [{ id: '130301', name: 'BOLIVAR' }] },
      { id: '1304', name: 'CHEPEN', districts: [{ id: '130401', name: 'CHEPEN' }] },
      { id: '1305', name: 'GRAN CHIMU', districts: [{ id: '130501', name: 'CASCAS' }] },
      { id: '1306', name: 'JULCAN', districts: [{ id: '130601', name: 'JULCAN' }] },
      { id: '1307', name: 'OTUZCO', districts: [{ id: '130701', name: 'OTUZCO' }] },
      { id: '1308', name: 'PACASMAYO', districts: [{ id: '130801', name: 'SAN PEDRO DE LLOC' }] },
      { id: '1309', name: 'PATAZ', districts: [{ id: '130901', name: 'TAYABAMBA' }] },
      { id: '1310', name: 'SANCHEZ CARRION', districts: [{ id: '131001', name: 'HUAMACHUCO' }] },
      { id: '1311', name: 'SANTIAGO DE CHUCO', districts: [{ id: '131101', name: 'SANTIAGO DE CHUCO' }] },
      { id: '1312', name: 'VIRU', districts: [{ id: '131201', name: 'VIRU' }] }
    ]
  },
  {
    id: '14',
    name: 'LAMBAYEQUE',
    provinces: [
      { id: '1401', name: 'CHICLAYO', districts: [{ id: '140101', name: 'CHICLAYO' }, { id: '140105', name: 'JOSE LEONARDO ORTIZ' }, { id: '140112', name: 'VICTORIA' }] },
      { id: '1402', name: 'FERREÑAFE', districts: [{ id: '140201', name: 'FERREÑAFE' }] },
      { id: '1403', name: 'LAMBAYEQUE', districts: [{ id: '140301', name: 'LAMBAYEQUE' }] }
    ]
  },
  {
    id: '15',
    name: 'LIMA',
    provinces: [
      { id: '1501', name: 'LIMA', districts: [{ id: '150101', name: 'LIMA' }, { id: '150121', name: 'MIRAFLORES' }, { id: '150129', name: 'SAN ISIDRO' }, { id: '150130', name: 'SAN JUAN DE LURIGANCHO' }, { id: '150138', name: 'SANTIAGO DE SURCO' }] },
      { id: '1502', name: 'BARRANCA', districts: [{ id: '150201', name: 'BARRANCA' }] },
      { id: '1503', name: 'CAJATAMBO', districts: [{ id: '150301', name: 'CAJATAMBO' }] },
      { id: '1504', name: 'CANTA', districts: [{ id: '150401', name: 'CANTA' }] },
      { id: '1505', name: 'CAÑETE', districts: [{ id: '150501', name: 'SAN VICENTE DE CAÑETE' }] },
      { id: '1506', name: 'HUARAL', districts: [{ id: '150601', name: 'HUARAL' }] },
      { id: '1507', name: 'HUAROCHIRI', districts: [{ id: '150701', name: 'MATUCANA' }] },
      { id: '1508', name: 'HUAURA', districts: [{ id: '150801', name: 'HUACHO' }] },
      { id: '1509', name: 'OYON', districts: [{ id: '150901', name: 'OYON' }] },
      { id: '1510', name: 'YAUYOS', districts: [{ id: '151001', name: 'YAUYOS' }] }
    ]
  },
  {
    id: '16',
    name: 'LORETO',
    provinces: [
      { id: '1601', name: 'MAYNAS', districts: [{ id: '160101', name: 'IQUITOS' }] },
      { id: '1602', name: 'ALTO AMAZONAS', districts: [{ id: '160201', name: 'YURIMAGUAS' }] },
      { id: '1603', name: 'LORETO', districts: [{ id: '160301', name: 'NAUTA' }] },
      { id: '1604', name: 'MARISCAL RAMON CASTILLA', districts: [{ id: '160401', name: 'RAMON CASTILLA' }] },
      { id: '1605', name: 'REQUENA', districts: [{ id: '160501', name: 'REQUENA' }] },
      { id: '1606', name: 'UCAYALI', districts: [{ id: '160601', name: 'CONTAMANA' }] },
      { id: '1607', name: 'DATEM DEL MARAÑON', districts: [{ id: '160701', name: 'BARRANCA' }] },
      { id: '1608', name: 'PUTUMAYO', districts: [{ id: '160801', name: 'PUTUMAYO' }] }
    ]
  },
  {
    id: '17',
    name: 'MADRE DE DIOS',
    provinces: [
      { id: '1701', name: 'TAMBOPATA', districts: [{ id: '170101', name: 'TAMBOPATA' }] },
      { id: '1702', name: 'MANU', districts: [{ id: '170201', name: 'MANU' }] },
      { id: '1703', name: 'TAHUAMANU', districts: [{ id: '170301', name: 'IÑAPARI' }] }
    ]
  },
  {
    id: '18',
    name: 'MOQUEGUA',
    provinces: [
      { id: '1801', name: 'MARISCAL NIETO', districts: [{ id: '180101', name: 'MOQUEGUA' }] },
      { id: '1802', name: 'GENERAL SANCHEZ CERRO', districts: [{ id: '180201', name: 'OMATE' }] },
      { id: '1803', name: 'ILO', districts: [{ id: '180301', name: 'ILO' }] }
    ]
  },
  {
    id: '19',
    name: 'PASCO',
    provinces: [
      { id: '1901', name: 'PASCO', districts: [{ id: '190101', name: 'CHAUPIMARCA' }] },
      { id: '1902', name: 'DANIEL ALCIDES CARRION', districts: [{ id: '190201', name: 'YANAHUANCA' }] },
      { id: '1903', name: 'OXAPAMPA', districts: [{ id: '190301', name: 'OXAPAMPA' }] }
    ]
  },
  {
    id: '20',
    name: 'PIURA',
    provinces: [
      { id: '2001', name: 'PIURA', districts: [{ id: '200101', name: 'PIURA' }, { id: '200104', name: 'CASTILLA' }] },
      { id: '2002', name: 'AYABACA', districts: [{ id: '200201', name: 'AYABACA' }] },
      { id: '2003', name: 'HUANCABAMBA', districts: [{ id: '200301', name: 'HUANCABAMBA' }] },
      { id: '2004', name: 'MORROPON', districts: [{ id: '200401', name: 'CHULUCANAS' }] },
      { id: '2005', name: 'PAITA', districts: [{ id: '200501', name: 'PAITA' }] },
      { id: '2006', name: 'SULLANA', districts: [{ id: '200601', name: 'SULLANA' }] },
      { id: '2007', name: 'TALARA', districts: [{ id: '200701', name: 'PARIÑAS' }] },
      { id: '2008', name: 'SECHURA', districts: [{ id: '200801', name: 'SECHURA' }] }
    ]
  },
  {
    id: '21',
    name: 'PUNO',
    provinces: [
      { id: '2101', name: 'PUNO', districts: [{ id: '210101', name: 'PUNO' }] },
      { id: '2102', name: 'AZANGARO', districts: [{ id: '210201', name: 'AZANGARO' }] },
      { id: '2103', name: 'CARABAYA', districts: [{ id: '210301', name: 'MACUSANI' }] },
      { id: '2104', name: 'CHUCUITO', districts: [{ id: '210401', name: 'JULI' }] },
      { id: '2105', name: 'EL COLLAO', districts: [{ id: '210501', name: 'ILAVE' }] },
      { id: '2106', name: 'HUANCANE', districts: [{ id: '210601', name: 'HUANCANE' }] },
      { id: '2107', name: 'LAMPA', districts: [{ id: '210701', name: 'LAMPA' }] },
      { id: '2108', name: 'MELGAR', districts: [{ id: '210801', name: 'AYAVIRI' }] },
      { id: '2109', name: 'MOHO', districts: [{ id: '210901', name: 'MOHO' }] },
      { id: '2110', name: 'SAN ANTONIO DE PUTINA', districts: [{ id: '211001', name: 'PUTINA' }] },
      { id: '2111', name: 'SAN ROMAN', districts: [{ id: '211101', name: 'JULIACA' }] },
      { id: '2112', name: 'SANDIA', districts: [{ id: '211201', name: 'SANDIA' }] },
      { id: '2113', name: 'YUNGUYO', districts: [{ id: '211301', name: 'YUNGUYO' }] }
    ]
  },
  {
    id: '22',
    name: 'SAN MARTIN',
    provinces: [
      { id: '2201', name: 'MOYOBAMBA', districts: [{ id: '220101', name: 'MOYOBAMBA' }] },
      { id: '2202', name: 'BELLAVISTA', districts: [{ id: '220201', name: 'BELLAVISTA' }] },
      { id: '2203', name: 'EL DORADO', districts: [{ id: '220301', name: 'SAN JOSE DE SISA' }] },
      { id: '2204', name: 'HUALLAGA', districts: [{ id: '220401', name: 'SAPOSOA' }] },
      { id: '2205', name: 'LAMAS', districts: [{ id: '220501', name: 'LAMAS' }] },
      { id: '2206', name: 'MARISCAL CACERES', districts: [{ id: '220601', name: 'JUANJUI' }] },
      { id: '2207', name: 'PICOTA', districts: [{ id: '220701', name: 'PICOTA' }] },
      { id: '2208', name: 'RIOJA', districts: [{ id: '220801', name: 'RIOJA' }] },
      { id: '2209', name: 'SAN MARTIN', districts: [{ id: '220901', name: 'TARAPOTO' }] },
      { id: '2210', name: 'TOCACHE', districts: [{ id: '221001', name: 'TOCACHE' }] }
    ]
  },
  {
    id: '23',
    name: 'TACNA',
    provinces: [
      { id: '2301', name: 'TACNA', districts: [{ id: '230101', name: 'TACNA' }] },
      { id: '2302', name: 'CANDARAVE', districts: [{ id: '230201', name: 'CANDARAVE' }] },
      { id: '2303', name: 'JORGE BASADRE', districts: [{ id: '230301', name: 'LOCUMBA' }] },
      { id: '2304', name: 'TARATA', districts: [{ id: '230401', name: 'TARATA' }] }
    ]
  },
  {
    id: '24',
    name: 'TUMBES',
    provinces: [
      { id: '2401', name: 'TUMBES', districts: [{ id: '240101', name: 'TUMBES' }] },
      { id: '2402', name: 'CONTRALMIRANTE VILLAR', districts: [{ id: '240201', name: 'ZORRITOS' }] },
      { id: '2403', name: 'ZARUMILLA', districts: [{ id: '240301', name: 'ZARUMILLA' }] }
    ]
  },
  {
    id: '25',
    name: 'UCAYALI',
    provinces: [
      { id: '2501', name: 'CORONEL PORTILLO', districts: [{ id: '250101', name: 'CALLERIA' }, { id: '250107', name: 'YARINACOCHA' }] },
      { id: '2502', name: 'ATALAYA', districts: [{ id: '250201', name: 'RAYMONDI' }] },
      { id: '2503', name: 'PADRE ABAD', districts: [{ id: '250301', name: 'PADRE ABAD' }] },
      { id: '2504', name: 'PURUS', districts: [{ id: '250401', name: 'PURUS' }] }
    ]
  }
];
