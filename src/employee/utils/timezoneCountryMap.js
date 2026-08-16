// utils/timezoneCountryMap.js
export const timezoneCountryMap = {
  // Asia
  'Asia/Kolkata': 'India',
  'Asia/Dubai': 'UAE',
  'Asia/Shanghai': 'China',
  'Asia/Tokyo': 'Japan',
  'Asia/Singapore': 'Singapore',
  'Asia/Kuala_Lumpur': 'Malaysia',
  'Asia/Bangkok': 'Thailand',
  'Asia/Ho_Chi_Minh': 'Vietnam',
  'Asia/Seoul': 'South Korea',
  'Asia/Taipei': 'Taiwan',
  'Asia/Hong_Kong': 'Hong Kong',
  'Asia/Macau': 'Macau',
  'Asia/Manila': 'Philippines',
  'Asia/Jakarta': 'Indonesia',
  'Asia/Baghdad': 'Iraq',
  'Asia/Riyadh': 'Saudi Arabia',
  'Asia/Kuwait': 'Kuwait',
  'Asia/Qatar': 'Qatar',
  'Asia/Bahrain': 'Bahrain',
  'Asia/Muscat': 'Oman',
  'Asia/Amman': 'Jordan',
  'Asia/Beirut': 'Lebanon',
  'Asia/Damascus': 'Syria',
  'Asia/Jerusalem': 'Israel',
  'Asia/Gaza': 'Palestine',
  
  // Middle East
  'Asia/Tehran': 'Iran',
  'Asia/Baku': 'Azerbaijan',
  'Asia/Tbilisi': 'Georgia',
  'Asia/Yerevan': 'Armenia',
  
  // Central Asia
  'Asia/Tashkent': 'Uzbekistan',
  'Asia/Almaty': 'Kazakhstan',
  'Asia/Bishkek': 'Kyrgyzstan',
  'Asia/Dushanbe': 'Tajikistan',
  'Asia/Ashgabat': 'Turkmenistan',
  
  // South Asia
  'Asia/Karachi': 'Pakistan',
  'Asia/Dhaka': 'Bangladesh',
  'Asia/Kathmandu': 'Nepal',
  'Asia/Colombo': 'Sri Lanka',
  'Asia/Kabul': 'Afghanistan',
  'Asia/Maldives': 'Maldives',
  
  // Africa
  'Africa/Cairo': 'Egypt',
  'Africa/Johannesburg': 'South Africa',
  'Africa/Lagos': 'Nigeria',
  'Africa/Nairobi': 'Kenya',
  'Africa/Casablanca': 'Morocco',
  'Africa/Tunis': 'Tunisia',
  'Africa/Algiers': 'Algeria',
  'Africa/Accra': 'Ghana',
  
  // Europe
  'Europe/London': 'United Kingdom',
  'Europe/Paris': 'France',
  'Europe/Berlin': 'Germany',
  'Europe/Rome': 'Italy',
  'Europe/Madrid': 'Spain',
  'Europe/Lisbon': 'Portugal',
  'Europe/Amsterdam': 'Netherlands',
  'Europe/Brussels': 'Belgium',
  'Europe/Zurich': 'Switzerland',
  'Europe/Vienna': 'Austria',
  'Europe/Stockholm': 'Sweden',
  'Europe/Oslo': 'Norway',
  'Europe/Copenhagen': 'Denmark',
  'Europe/Helsinki': 'Finland',
  'Europe/Warsaw': 'Poland',
  'Europe/Prague': 'Czech Republic',
  'Europe/Budapest': 'Hungary',
  'Europe/Athens': 'Greece',
  'Europe/Istanbul': 'Turkey',
  'Europe/Moscow': 'Russia',
  'Europe/Kiev': 'Ukraine',
  'Europe/Bucharest': 'Romania',
  'Europe/Sofia': 'Bulgaria',
  'Europe/Belgrade': 'Serbia',
  'Europe/Zagreb': 'Croatia',
  
  // North America
  'America/New_York': 'United States',
  'America/Chicago': 'United States',
  'America/Denver': 'United States',
  'America/Los_Angeles': 'United States',
  'America/Toronto': 'Canada',
  'America/Vancouver': 'Canada',
  'America/Montreal': 'Canada',
  'America/Mexico_City': 'Mexico',
  'America/Panama': 'Panama',
  
  // South America
  'America/Sao_Paulo': 'Brazil',
  'America/Buenos_Aires': 'Argentina',
  'America/Santiago': 'Chile',
  'America/Bogota': 'Colombia',
  'America/Lima': 'Peru',
  'America/Caracas': 'Venezuela',
  
  // Australia & Oceania
  'Australia/Sydney': 'Australia',
  'Australia/Melbourne': 'Australia',
  'Australia/Perth': 'Australia',
  'Australia/Adelaide': 'Australia',
  'Australia/Brisbane': 'Australia',
  'Pacific/Auckland': 'New Zealand',
  'Pacific/Fiji': 'Fiji',
};

export const getCountryFromTimezone = (timezone) => {
  if (!timezone) return 'Unknown';
  
  // Direct match
  if (timezoneCountryMap[timezone]) {
    return timezoneCountryMap[timezone];
  }
  
  // Try partial match (e.g., if timezone is "America/New_York" but we only have "America/NewYork")
  const timezoneParts = timezone.split('/');
  if (timezoneParts.length >= 2) {
    const region = timezoneParts[0];
    const city = timezoneParts[1];
    
    // Try to match by region (e.g., "America" -> "United States")
    const regionMap = {
      'America': 'United States',
      'Europe': 'Europe',
      'Asia': 'Asia',
      'Africa': 'Africa',
      'Australia': 'Australia',
      'Pacific': 'Pacific',
    };
    
    // If we have a region match, use it
    if (regionMap[region]) {
      return regionMap[region];
    }
  }
  
  return 'Unknown';
};