export const COUNTRY_TO_CODE = {
  'Afghanistan': 'AF', 'Albania': 'AL', 'Algeria': 'DZ', 'Argentina': 'AR',
  'Australia': 'AU', 'Austria': 'AT', 'Belgium': 'BE', 'Brazil': 'BR',
  'Bulgaria': 'BG', 'Canada': 'CA', 'Chile': 'CL', 'China': 'CN',
  'Colombia': 'CO', 'Croatia': 'HR', 'Czech Republic': 'CZ', 'Czechia': 'CZ',
  'Denmark': 'DK', 'Egypt': 'EG', 'Estonia': 'EE', 'Finland': 'FI',
  'France': 'FR', 'Germany': 'DE', 'Greece': 'GR', 'Hungary': 'HU',
  'Iceland': 'IS', 'India': 'IN', 'Indonesia': 'ID', 'Ireland': 'IE',
  'Israel': 'IL', 'Italy': 'IT', 'Japan': 'JP', 'Kenya': 'KE',
  'Latvia': 'LV', 'Lithuania': 'LT', 'Luxembourg': 'LU', 'Malaysia': 'MY',
  'Mexico': 'MX', 'Morocco': 'MA', 'Netherlands': 'NL', 'New Zealand': 'NZ',
  'Norway': 'NO', 'Pakistan': 'PK', 'Peru': 'PE', 'Philippines': 'PH',
  'Poland': 'PL', 'Portugal': 'PT', 'Romania': 'RO', 'Russia': 'RU',
  'Saudi Arabia': 'SA', 'Serbia': 'RS', 'Singapore': 'SG', 'Slovakia': 'SK',
  'Slovenia': 'SI', 'South Africa': 'ZA', 'South Korea': 'KR', 'Spain': 'ES',
  'Sweden': 'SE', 'Switzerland': 'CH', 'Taiwan': 'TW', 'Thailand': 'TH',
  'Turkey': 'TR', 'Ukraine': 'UA', 'United Arab Emirates': 'AE',
  'United Kingdom': 'GB', 'United States': 'US', 'USA': 'US', 'UK': 'GB',
  'Venezuela': 'VE', 'Vietnam': 'VN',
  'Armenia': 'AM', 'Azerbaijan': 'AZ', 'Bahrain': 'BH', 'Bangladesh': 'BD',
  'Belarus': 'BY', 'Bosnia and Herzegovina': 'BA', 'Costa Rica': 'CR',
  'Cuba': 'CU', 'Cyprus': 'CY', 'Dominican Republic': 'DO', 'Ecuador': 'EC',
  'Georgia': 'GE', 'Iran': 'IR', 'Iraq': 'IQ', 'Jamaica': 'JM',
  'Jordan': 'JO', 'Kazakhstan': 'KZ', 'Kosovo': 'XK', 'Kuwait': 'KW',
  'Lebanon': 'LB', 'Malta': 'MT', 'Moldova': 'MD', 'Montenegro': 'ME',
  'Nepal': 'NP', 'Nigeria': 'NG', 'North Macedonia': 'MK', 'Oman': 'OM',
  'Panama': 'PA', 'Puerto Rico': 'PR', 'Qatar': 'QA', 'Sri Lanka': 'LK',
  'UAE': 'AE', 'Uzbekistan': 'UZ',
};

export const getCountryFlag = (countryName) => {
  if (!countryName) return null;
  const code = COUNTRY_TO_CODE[countryName];
  if (!code) return null;
  return String.fromCodePoint(...[...code].map(c => 0x1F1E6 + c.charCodeAt(0) - 65));
};

export const getCountryCode = (countryName) => {
  return COUNTRY_TO_CODE[countryName] || countryName?.slice(0, 2).toUpperCase();
};

export const getFlag = (code) => {
  if (!code || code.length !== 2) return '';
  const codePoints = [...code.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65);
  return String.fromCodePoint(...codePoints);
};

