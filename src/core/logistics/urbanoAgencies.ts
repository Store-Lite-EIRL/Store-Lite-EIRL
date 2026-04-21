export interface UrbanoAgency {
  id: string;
  name: string;
  address: string;
  districtId: string; // Linked to Peru Locations ID
}

export const URBANO_AGENCIES: UrbanoAgency[] = [
  // LIMA
  { id: 'U001', name: 'Agencia Centro de Lima', address: 'Jr. Cuzco 600', districtId: '150101' },
  {
    id: 'U002',
    name: 'Agencia ATE - Vitarte',
    address: 'Av. Nicolas Ayllon 2500',
    districtId: '150103',
  },
  { id: 'U003', name: 'Agencia Barranco', address: 'Av. Grau 120', districtId: '150104' },
  { id: 'U004', name: 'Agencia Breña', address: 'Av. Arica 800', districtId: '150105' },
  { id: 'U005', name: 'Agencia Chorrillos', address: 'Av. Huaylas 500', districtId: '150108' },
  {
    id: 'U006',
    name: 'Agencia Comas - Tupac Amaru',
    address: 'Av. Tupac Amaru 1200',
    districtId: '150110',
  },
  {
    id: 'U007',
    name: 'Agencia Independencia',
    address: 'Av. Carlos Izaguirre 200',
    districtId: '150112',
  },
  {
    id: 'U008',
    name: 'Agencia La Victoria - Mexico',
    address: 'Av. Mexico 1500',
    districtId: '150115',
  },
  {
    id: 'U009',
    name: 'Agencia Miraflores',
    address: 'Av. Petit Thouars 4500',
    districtId: '150121',
  },
  {
    id: 'U010',
    name: 'Agencia SJL - Proceres',
    address: 'Av. Proceres de la Independencia 1000',
    districtId: '150130',
  },
  {
    id: 'U011',
    name: 'Agencia SMP - Habich',
    address: 'Av. Eduardo de Habich 300',
    districtId: '150133',
  },
  { id: 'U012', name: 'Agencia San Miguel', address: 'Av. La Marina 2000', districtId: '150134' },
  {
    id: 'U013',
    name: 'Agencia Surco - Higuereta',
    address: 'Av. Aviacion 4800',
    districtId: '150138',
  },
  {
    id: 'U014',
    name: 'Agencia Villa El Salvador',
    address: 'Av. Revolucion 1200',
    districtId: '150140',
  },

  // AREQUIPA
  { id: 'U015', name: 'Agencia Arequipa Central', address: 'Av. Parra 200', districtId: '040101' },
  {
    id: 'U016',
    name: 'Agencia Cerro Colorado',
    address: 'Av. Aviacion km 6',
    districtId: '040104',
  },
  { id: 'U017', name: 'Agencia Paucarpata', address: 'Av. Jesus 1200', districtId: '040111' },

  // CUSCO
  {
    id: 'U018',
    name: 'Agencia Cusco - Wanchaq',
    address: 'Av. Garcilaso 300',
    districtId: '080108',
  },
  {
    id: 'U019',
    name: 'Agencia Cusco Centro',
    address: 'Calle Meson de la Estrella 150',
    districtId: '080101',
  },

  // TRUJILLO
  {
    id: 'U020',
    name: 'Agencia Trujillo Central',
    address: 'Av. Espana 2000',
    districtId: '130101',
  },
  { id: 'U021', name: 'Agencia Victor Larco', address: 'Av. Larco 1200', districtId: '130111' },

  // PIURA
  {
    id: 'U022',
    name: 'Agencia Piura Central',
    address: 'Av. Sanchez Cerro 1000',
    districtId: '200101',
  },
  { id: 'U023', name: 'Agencia Castilla', address: 'Av. Guardia Civil 400', districtId: '200104' },
];
