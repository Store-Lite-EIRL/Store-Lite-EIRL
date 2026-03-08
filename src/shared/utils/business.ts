export const getSectorIcon = (sector: string | null | undefined): string => {
  if (!sector) {
    return 'business';
  }

  // Specific mapping for defined BUSINESS_SECTORS
  const exactMappings: Record<string, string> = {
    Servicios: 'work',
    Comercio: 'store',
    Tecnología: 'computer',
    'Alimentos y Bebidas': 'restaurant',
    Construcción: 'engineering',
    Manufactura: 'factory',
    Educación: 'school',
    Salud: 'local_hospital',
    Turismo: 'flight',
    Otro: 'business',
  };

  // 1. Try exact match
  if (exactMappings[sector]) {
    return exactMappings[sector];
  }

  const lowerSector = sector.toLowerCase();

  // 2. Fallback: Try case-insensitive match against keys
  const foundKey = Object.keys(exactMappings).find((key) => key.toLowerCase() === lowerSector);
  if (foundKey) {
    return exactMappings[foundKey];
  }

  // 3. Fallback: Existing keyword matching for legacy/other data
  const keywordMappings: Record<string, string> = {
    servicio: 'work',
    tienda: 'store',
    comercio: 'store',
    tecnologia: 'computer',
    tecnología: 'computer',
    alimento: 'restaurant',
    restaurant: 'restaurant',
    construccion: 'engineering',
    construcción: 'engineering',
    manufactura: 'factory',
    educacion: 'school',
    educación: 'school',
    salud: 'local_hospital',
    turismo: 'flight',
  };

  for (const [key, icon] of Object.entries(keywordMappings)) {
    if (lowerSector.includes(key)) {
      return icon;
    }
  }

  return 'business';
};
