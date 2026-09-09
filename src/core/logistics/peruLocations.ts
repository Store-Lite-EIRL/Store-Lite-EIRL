import ubigeos from './ubigeos.json';

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

export const PERU_LOCATIONS: Department[] = ubigeos as Department[];
