/**
 * Comprehensive Countries Data with States and Cities
 * Hierarchical structure: Country → State/Province → City
 * Includes flags, phone codes, and regional information
 */

const COUNTRIES_DATA = {
  countries: [
    {
      name: "Pakistan",
      code: "PK",
      flag: "🇵🇰",
      phoneCode: "+92",
      region: "Asia",
      popular: true,
      states: [
        {
          name: "Punjab",
          code: "PB",
          cities: ["Lahore", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Gujranwala", "Sialkot", "Bahawalpur", "Sargodha", "Gujrat"]
        },
        {
          name: "Sindh",
          code: "SD",
          cities: ["Karachi", "Hyderabad", "Sukkur", "Larkana", "Nawabshah", "Mirpurkhas", "Jacobabad", "Shikarpur"]
        },
        {
          name: "Khyber Pakhtunkhwa",
          code: "KP",
          cities: ["Peshawar", "Mardan", "Abbottabad", "Mingora", "Kohat", "Dera Ismail Khan", "Bannu", "Swat"]
        },
        {
          name: "Balochistan",
          code: "BA",
          cities: ["Quetta", "Gwadar", "Turbat", "Khuzdar", "Sibi", "Zhob", "Loralai"]
        },
        {
          name: "Azad Kashmir",
          code: "JK",
          cities: ["Muzaffarabad", "Mirpur", "Rawalakot", "Bagh", "Kotli"]
        },
        {
          name: "Gilgit-Baltistan",
          code: "GB",
          cities: ["Gilgit", "Skardu", "Hunza", "Chilas", "Ghanche"]
        }
      ]
    },
    {
      name: "India",
      code: "IN",
      flag: "🇮🇳",
      phoneCode: "+91",
      region: "Asia",
      popular: true,
      states: [
        {
          name: "Maharashtra",
          code: "MH",
          cities: ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad", "Thane", "Solapur"]
        },
        {
          name: "Delhi",
          code: "DL",
          cities: ["New Delhi", "North Delhi", "South Delhi", "East Delhi", "West Delhi"]
        },
        {
          name: "Karnataka",
          code: "KA",
          cities: ["Bangalore", "Mysore", "Hubli", "Mangalore", "Belgaum"]
        },
        {
          name: "Tamil Nadu",
          code: "TN",
          cities: ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"]
        },
        {
          name: "Gujarat",
          code: "GJ",
          cities: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar"]
        },
        {
          name: "West Bengal",
          code: "WB",
          cities: ["Kolkata", "Howrah", "Durgapur", "Siliguri", "Asansol"]
        },
        {
          name: "Uttar Pradesh",
          code: "UP",
          cities: ["Lucknow", "Kanpur", "Ghaziabad", "Agra", "Varanasi", "Meerut", "Allahabad"]
        }
      ]
    },
    {
      name: "United States",
      code: "US",
      flag: "🇺🇸",
      phoneCode: "+1",
      region: "Americas",
      popular: true,
      states: [
        {
          name: "California",
          code: "CA",
          cities: ["Los Angeles", "San Francisco", "San Diego", "San Jose", "Sacramento", "Fresno", "Oakland"]
        },
        {
          name: "Texas",
          code: "TX",
          cities: ["Houston", "Dallas", "Austin", "San Antonio", "Fort Worth", "El Paso"]
        },
        {
          name: "Florida",
          code: "FL",
          cities: ["Miami", "Orlando", "Tampa", "Jacksonville", "Fort Lauderdale"]
        },
        {
          name: "New York",
          code: "NY",
          cities: ["New York City", "Buffalo", "Rochester", "Albany", "Syracuse"]
        },
        {
          name: "Illinois",
          code: "IL",
          cities: ["Chicago", "Aurora", "Naperville", "Joliet", "Rockford"]
        },
        {
          name: "Pennsylvania",
          code: "PA",
          cities: ["Philadelphia", "Pittsburgh", "Allentown", "Erie", "Reading"]
        },
        {
          name: "Ohio",
          code: "OH",
          cities: ["Columbus", "Cleveland", "Cincinnati", "Toledo", "Akron"]
        }
      ]
    },
    {
      name: "United Kingdom",
      code: "GB",
      flag: "🇬🇧",
      phoneCode: "+44",
      region: "Europe",
      popular: true,
      states: [
        {
          name: "England",
          code: "ENG",
          cities: ["London", "Birmingham", "Manchester", "Leeds", "Liverpool", "Newcastle", "Sheffield", "Bristol"]
        },
        {
          name: "Scotland",
          code: "SCT",
          cities: ["Edinburgh", "Glasgow", "Aberdeen", "Dundee", "Inverness"]
        },
        {
          name: "Wales",
          code: "WLS",
          cities: ["Cardiff", "Swansea", "Newport", "Wrexham", "Barry"]
        },
        {
          name: "Northern Ireland",
          code: "NIR",
          cities: ["Belfast", "Derry", "Lisburn", "Newry", "Armagh"]
        }
      ]
    },
    {
      name: "Canada",
      code: "CA",
      flag: "🇨🇦",
      phoneCode: "+1",
      region: "Americas",
      popular: true,
      states: [
        {
          name: "Ontario",
          code: "ON",
          cities: ["Toronto", "Ottawa", "Mississauga", "Hamilton", "London", "Kitchener"]
        },
        {
          name: "Quebec",
          code: "QC",
          cities: ["Montreal", "Quebec City", "Laval", "Gatineau", "Longueuil"]
        },
        {
          name: "British Columbia",
          code: "BC",
          cities: ["Vancouver", "Victoria", "Surrey", "Burnaby", "Richmond"]
        },
        {
          name: "Alberta",
          code: "AB",
          cities: ["Calgary", "Edmonton", "Red Deer", "Lethbridge", "Medicine Hat"]
        },
        {
          name: "Manitoba",
          code: "MB",
          cities: ["Winnipeg", "Brandon", "Steinbach", "Thompson", "Portage la Prairie"]
        }
      ]
    },
    {
      name: "Australia",
      code: "AU",
      flag: "🇦🇺",
      phoneCode: "+61",
      region: "Oceania",
      popular: true,
      states: [
        {
          name: "New South Wales",
          code: "NSW",
          cities: ["Sydney", "Newcastle", "Wollongong", "Central Coast", "Maitland"]
        },
        {
          name: "Victoria",
          code: "VIC",
          cities: ["Melbourne", "Geelong", "Ballarat", "Bendigo", "Frankston"]
        },
        {
          name: "Queensland",
          code: "QLD",
          cities: ["Brisbane", "Gold Coast", "Sunshine Coast", "Townsville", "Cairns"]
        },
        {
          name: "Western Australia",
          code: "WA",
          cities: ["Perth", "Mandurah", "Bunbury", "Albany", "Geraldton"]
        },
        {
          name: "South Australia",
          code: "SA",
          cities: ["Adelaide", "Mount Gambier", "Whyalla", "Murray Bridge"]
        }
      ]
    },
    {
      name: "United Arab Emirates",
      code: "AE",
      flag: "🇦🇪",
      phoneCode: "+971",
      region: "Asia",
      popular: true,
      states: [
        {
          name: "Dubai",
          code: "DU",
          cities: ["Dubai", "Deira", "Bur Dubai", "Jumeirah", "Dubai Marina"]
        },
        {
          name: "Abu Dhabi",
          code: "AZ",
          cities: ["Abu Dhabi", "Al Ain", "Ruwais", "Liwa"]
        },
        {
          name: "Sharjah",
          code: "SH",
          cities: ["Sharjah", "Kalba", "Khor Fakkan", "Dibba Al-Hisn"]
        },
        {
          name: "Ajman",
          code: "AJ",
          cities: ["Ajman", "Manama"]
        },
        {
          name: "Ras Al Khaimah",
          code: "RK",
          cities: ["Ras Al Khaimah", "Digdaga", "Khatt"]
        }
      ]
    },
    {
      name: "Saudi Arabia",
      code: "SA",
      flag: "🇸🇦",
      phoneCode: "+966",
      region: "Asia",
      popular: true,
      states: [
        {
          name: "Riyadh",
          code: "01",
          cities: ["Riyadh", "Al Kharj", "Diriyah", "Dawadmi"]
        },
        {
          name: "Makkah",
          code: "02",
          cities: ["Jeddah", "Mecca", "Taif", "Rabigh"]
        },
        {
          name: "Madinah",
          code: "03",
          cities: ["Medina", "Yanbu", "Al Ula", "Badr"]
        },
        {
          name: "Eastern Province",
          code: "04",
          cities: ["Dammam", "Dhahran", "Al Khobar", "Jubail", "Al Ahsa"]
        }
      ]
    },
    {
      name: "China",
      code: "CN",
      flag: "🇨🇳",
      phoneCode: "+86",
      region: "Asia",
      popular: false,
      states: [
        {
          name: "Beijing",
          code: "BJ",
          cities: ["Beijing", "Chaoyang", "Haidian", "Dongcheng"]
        },
        {
          name: "Shanghai",
          code: "SH",
          cities: ["Shanghai", "Pudong", "Huangpu", "Xuhui"]
        },
        {
          name: "Guangdong",
          code: "GD",
          cities: ["Guangzhou", "Shenzhen", "Dongguan", "Foshan"]
        }
      ]
    },
    {
      name: "Germany",
      code: "DE",
      flag: "🇩🇪",
      phoneCode: "+49",
      region: "Europe",
      popular: false,
      states: [
        {
          name: "Bavaria",
          code: "BY",
          cities: ["Munich", "Nuremberg", "Augsburg", "Regensburg"]
        },
        {
          name: "North Rhine-Westphalia",
          code: "NW",
          cities: ["Cologne", "Dortmund", "Essen", "Düsseldorf"]
        },
        {
          name: "Berlin",
          code: "BE",
          cities: ["Berlin", "Charlottenburg", "Kreuzberg", "Mitte"]
        }
      ]
    },
    {
      name: "France",
      code: "FR",
      flag: "🇫🇷",
      phoneCode: "+33",
      region: "Europe",
      popular: false,
      states: [
        {
          name: "Île-de-France",
          code: "IDF",
          cities: ["Paris", "Versailles", "Boulogne-Billancourt", "Argenteuil"]
        },
        {
          name: "Provence-Alpes-Côte d'Azur",
          code: "PAC",
          cities: ["Marseille", "Nice", "Toulon", "Aix-en-Provence"]
        },
        {
          name: "Auvergne-Rhône-Alpes",
          code: "ARA",
          cities: ["Lyon", "Grenoble", "Saint-Étienne", "Villeurbanne"]
        }
      ]
    },
    {
      name: "Japan",
      code: "JP",
      flag: "🇯🇵",
      phoneCode: "+81",
      region: "Asia",
      popular: false,
      states: [
        {
          name: "Tokyo",
          code: "13",
          cities: ["Tokyo", "Shibuya", "Shinjuku", "Minato"]
        },
        {
          name: "Osaka",
          code: "27",
          cities: ["Osaka", "Sakai", "Higashiosaka", "Toyonaka"]
        },
        {
          name: "Kyoto",
          code: "26",
          cities: ["Kyoto", "Uji", "Kameoka", "Joyo"]
        }
      ]
    },
    {
      name: "Brazil",
      code: "BR",
      flag: "🇧🇷",
      phoneCode: "+55",
      region: "Americas",
      popular: false,
      states: [
        {
          name: "São Paulo",
          code: "SP",
          cities: ["São Paulo", "Campinas", "Santos", "São Bernardo do Campo"]
        },
        {
          name: "Rio de Janeiro",
          code: "RJ",
          cities: ["Rio de Janeiro", "Niterói", "Duque de Caxias", "Nova Iguaçu"]
        },
        {
          name: "Minas Gerais",
          code: "MG",
          cities: ["Belo Horizonte", "Uberlândia", "Contagem", "Juiz de Fora"]
        }
      ]
    },
    {
      name: "Mexico",
      code: "MX",
      flag: "🇲🇽",
      phoneCode: "+52",
      region: "Americas",
      popular: false,
      states: [
        {
          name: "Mexico City",
          code: "CMX",
          cities: ["Mexico City", "Iztapalapa", "Gustavo A. Madero", "Álvaro Obregón"]
        },
        {
          name: "Jalisco",
          code: "JAL",
          cities: ["Guadalajara", "Zapopan", "Tlaquepaque", "Tonalá"]
        },
        {
          name: "Nuevo León",
          code: "NL",
          cities: ["Monterrey", "Guadalupe", "San Nicolás de los Garza", "Apodaca"]
        }
      ]
    },
    {
      name: "Italy",
      code: "IT",
      flag: "🇮🇹",
      phoneCode: "+39",
      region: "Europe",
      popular: false,
      states: [
        {
          name: "Lazio",
          code: "LAZ",
          cities: ["Rome", "Latina", "Guidonia Montecelio", "Fiumicino"]
        },
        {
          name: "Lombardy",
          code: "LOM",
          cities: ["Milan", "Brescia", "Monza", "Bergamo"]
        },
        {
          name: "Campania",
          code: "CAM",
          cities: ["Naples", "Salerno", "Giugliano in Campania", "Torre del Greco"]
        }
      ]
    },
    {
      name: "Spain",
      code: "ES",
      flag: "🇪🇸",
      phoneCode: "+34",
      region: "Europe",
      popular: false,
      states: [
        {
          name: "Madrid",
          code: "MD",
          cities: ["Madrid", "Móstoles", "Alcalá de Henares", "Fuenlabrada"]
        },
        {
          name: "Catalonia",
          code: "CT",
          cities: ["Barcelona", "Hospitalet de Llobregat", "Badalona", "Terrassa"]
        },
        {
          name: "Andalusia",
          code: "AN",
          cities: ["Seville", "Málaga", "Córdoba", "Granada"]
        }
      ]
    },
    {
      name: "South Korea",
      code: "KR",
      flag: "🇰🇷",
      phoneCode: "+82",
      region: "Asia",
      popular: false,
      states: [
        {
          name: "Seoul",
          code: "11",
          cities: ["Seoul", "Gangnam", "Jongno", "Songpa"]
        },
        {
          name: "Busan",
          code: "26",
          cities: ["Busan", "Haeundae", "Suyeong", "Busanjin"]
        },
        {
          name: "Incheon",
          code: "28",
          cities: ["Incheon", "Yeonsu", "Namdong", "Bupyeong"]
        }
      ]
    },
    {
      name: "Turkey",
      code: "TR",
      flag: "🇹🇷",
      phoneCode: "+90",
      region: "Asia",
      popular: false,
      states: [
        {
          name: "Istanbul",
          code: "34",
          cities: ["Istanbul", "Kadıköy", "Beşiktaş", "Üsküdar"]
        },
        {
          name: "Ankara",
          code: "06",
          cities: ["Ankara", "Çankaya", "Keçiören", "Yenimahalle"]
        },
        {
          name: "Izmir",
          code: "35",
          cities: ["Izmir", "Konak", "Bornova", "Karşıyaka"]
        }
      ]
    },
    {
      name: "Egypt",
      code: "EG",
      flag: "🇪🇬",
      phoneCode: "+20",
      region: "Africa",
      popular: false,
      states: [
        {
          name: "Cairo",
          code: "C",
          cities: ["Cairo", "Giza", "Heliopolis", "Nasr City"]
        },
        {
          name: "Alexandria",
          code: "ALX",
          cities: ["Alexandria", "Borg El Arab", "Montaza", "Gomrok"]
        },
        {
          name: "Giza",
          code: "GZ",
          cities: ["Giza", "6th of October City", "Sheikh Zayed City"]
        }
      ]
    },
    {
      name: "South Africa",
      code: "ZA",
      flag: "🇿🇦",
      phoneCode: "+27",
      region: "Africa",
      popular: false,
      states: [
        {
          name: "Gauteng",
          code: "GT",
          cities: ["Johannesburg", "Pretoria", "Soweto", "Benoni"]
        },
        {
          name: "Western Cape",
          code: "WC",
          cities: ["Cape Town", "Stellenbosch", "Paarl", "George"]
        },
        {
          name: "KwaZulu-Natal",
          code: "KZN",
          cities: ["Durban", "Pietermaritzburg", "Richards Bay", "Newcastle"]
        }
      ]
    },
    {
      name: "Nigeria",
      code: "NG",
      flag: "🇳🇬",
      phoneCode: "+234",
      region: "Africa",
      popular: false,
      states: [
        {
          name: "Lagos",
          code: "LA",
          cities: ["Lagos", "Ikeja", "Lekki", "Victoria Island"]
        },
        {
          name: "Federal Capital Territory",
          code: "FC",
          cities: ["Abuja", "Gwagwalada", "Kuje", "Bwari"]
        },
        {
          name: "Kano",
          code: "KN",
          cities: ["Kano", "Fagge", "Dala", "Nassarawa"]
        }
      ]
    },
    {
      name: "Singapore",
      code: "SG",
      flag: "🇸🇬",
      phoneCode: "+65",
      region: "Asia",
      popular: false,
      states: [
        {
          name: "Central Region",
          code: "CR",
          cities: ["Singapore", "Orchard", "Marina Bay", "Chinatown"]
        }
      ]
    },
    {
      name: "Malaysia",
      code: "MY",
      flag: "🇲🇾",
      phoneCode: "+60",
      region: "Asia",
      popular: false,
      states: [
        {
          name: "Kuala Lumpur",
          code: "KL",
          cities: ["Kuala Lumpur", "KLCC", "Bukit Bintang", "Cheras"]
        },
        {
          name: "Selangor",
          code: "SEL",
          cities: ["Shah Alam", "Petaling Jaya", "Subang Jaya", "Klang"]
        },
        {
          name: "Penang",
          code: "PNG",
          cities: ["George Town", "Butterworth", "Bayan Lepas", "Bukit Mertajam"]
        }
      ]
    },
    {
      name: "Indonesia",
      code: "ID",
      flag: "🇮🇩",
      phoneCode: "+62",
      region: "Asia",
      popular: false,
      states: [
        {
          name: "Jakarta",
          code: "JK",
          cities: ["Jakarta", "Central Jakarta", "South Jakarta", "West Jakarta"]
        },
        {
          name: "West Java",
          code: "JB",
          cities: ["Bandung", "Bekasi", "Depok", "Bogor"]
        },
        {
          name: "East Java",
          code: "JI",
          cities: ["Surabaya", "Malang", "Mojokerto", "Pasuruan"]
        }
      ]
    },
    {
      name: "Thailand",
      code: "TH",
      flag: "🇹🇭",
      phoneCode: "+66",
      region: "Asia",
      popular: false,
      states: [
        {
          name: "Bangkok",
          code: "BKK",
          cities: ["Bangkok", "Chatuchak", "Bang Khen", "Lat Krabang"]
        },
        {
          name: "Chiang Mai",
          code: "CM",
          cities: ["Chiang Mai", "San Sai", "Hang Dong", "Mae Rim"]
        },
        {
          name: "Phuket",
          code: "PK",
          cities: ["Phuket", "Kathu", "Thalang", "Patong"]
        }
      ]
    },
    {
      name: "Bangladesh",
      code: "BD",
      flag: "🇧🇩",
      phoneCode: "+880",
      region: "Asia",
      popular: false,
      states: [
        {
          name: "Dhaka",
          code: "DH",
          cities: ["Dhaka", "Gazipur", "Narayanganj", "Savar"]
        },
        {
          name: "Chittagong",
          code: "CH",
          cities: ["Chittagong", "Cox's Bazar", "Comilla", "Feni"]
        },
        {
          name: "Khulna",
          code: "KH",
          cities: ["Khulna", "Jessore", "Satkhira", "Bagerhat"]
        }
      ]
    },
    {
      name: "Philippines",
      code: "PH",
      flag: "🇵🇭",
      phoneCode: "+63",
      region: "Asia",
      popular: false,
      states: [
        {
          name: "Metro Manila",
          code: "MM",
          cities: ["Manila", "Quezon City", "Makati", "Taguig"]
        },
        {
          name: "Cebu",
          code: "CEB",
          cities: ["Cebu City", "Mandaue", "Lapu-Lapu", "Talisay"]
        },
        {
          name: "Davao",
          code: "DAV",
          cities: ["Davao City", "Tagum", "Panabo", "Digos"]
        }
      ]
    },
    {
      name: "Vietnam",
      code: "VN",
      flag: "🇻🇳",
      phoneCode: "+84",
      region: "Asia",
      popular: false,
      states: [
        {
          name: "Hanoi",
          code: "HN",
          cities: ["Hanoi", "Ha Dong", "Long Bien", "Cau Giay"]
        },
        {
          name: "Ho Chi Minh",
          code: "SG",
          cities: ["Ho Chi Minh City", "Thu Duc", "Binh Thanh", "Tan Binh"]
        },
        {
          name: "Da Nang",
          code: "DN",
          cities: ["Da Nang", "Hai Chau", "Thanh Khe", "Son Tra"]
        }
      ]
    },
    {
      name: "Argentina",
      code: "AR",
      flag: "🇦🇷",
      phoneCode: "+54",
      region: "Americas",
      popular: false,
      states: [
        {
          name: "Buenos Aires",
          code: "BA",
          cities: ["Buenos Aires", "La Plata", "Mar del Plata", "Bahía Blanca"]
        },
        {
          name: "Córdoba",
          code: "CB",
          cities: ["Córdoba", "Villa María", "Río Cuarto", "San Francisco"]
        },
        {
          name: "Santa Fe",
          code: "SF",
          cities: ["Rosario", "Santa Fe", "Rafaela", "Venado Tuerto"]
        }
      ]
    },
    {
      name: "Netherlands",
      code: "NL",
      flag: "🇳🇱",
      phoneCode: "+31",
      region: "Europe",
      popular: false,
      states: [
        {
          name: "North Holland",
          code: "NH",
          cities: ["Amsterdam", "Haarlem", "Zaanstad", "Alkmaar"]
        },
        {
          name: "South Holland",
          code: "ZH",
          cities: ["Rotterdam", "The Hague", "Leiden", "Zoetermeer"]
        },
        {
          name: "Utrecht",
          code: "UT",
          cities: ["Utrecht", "Amersfoort", "Veenendaal", "Nieuwegein"]
        }
      ]
    },
    {
      name: "New Zealand",
      code: "NZ",
      flag: "🇳🇿",
      phoneCode: "+64",
      region: "Oceania",
      popular: false,
      states: [
        {
          name: "Auckland",
          code: "AUK",
          cities: ["Auckland", "Manukau", "North Shore", "Waitakere"]
        },
        {
          name: "Wellington",
          code: "WGN",
          cities: ["Wellington", "Lower Hutt", "Upper Hutt", "Porirua"]
        },
        {
          name: "Canterbury",
          code: "CAN",
          cities: ["Christchurch", "Timaru", "Ashburton", "Rangiora"]
        }
      ]
    }
  ]
};

// Helper functions for data access
const GeoDataHelper = {
  /**
   * Get all countries sorted by popularity and name
   */
  getAllCountries() {
    return [...COUNTRIES_DATA.countries].sort((a, b) => {
      if (a.popular && !b.popular) return -1;
      if (!a.popular && b.popular) return 1;
      return a.name.localeCompare(b.name);
    });
  },

  /**
   * Get countries filtered by search term
   */
  searchCountries(searchTerm) {
    const term = searchTerm.toLowerCase();
    return this.getAllCountries().filter(country => 
      country.name.toLowerCase().includes(term) ||
      country.code.toLowerCase().includes(term) ||
      country.phoneCode.includes(term)
    );
  },

  /**
   * Get country by code
   */
  getCountryByCode(code) {
    return COUNTRIES_DATA.countries.find(c => c.code === code);
  },

  /**
   * Get states for a country
   */
  getStatesForCountry(countryCode) {
    const country = this.getCountryByCode(countryCode);
    return country ? country.states : [];
  },

  /**
   * Search states within a country
   */
  searchStates(countryCode, searchTerm) {
    const states = this.getStatesForCountry(countryCode);
    const term = searchTerm.toLowerCase();
    return states.filter(state => 
      state.name.toLowerCase().includes(term) ||
      state.code.toLowerCase().includes(term)
    );
  },

  /**
   * Get cities for a state
   */
  getCitiesForState(countryCode, stateName) {
    const country = this.getCountryByCode(countryCode);
    if (!country) return [];
    
    const state = country.states.find(s => s.name === stateName);
    return state ? state.cities : [];
  },

  /**
   * Search cities within a state
   */
  searchCities(countryCode, stateName, searchTerm) {
    const cities = this.getCitiesForState(countryCode, stateName);
    const term = searchTerm.toLowerCase();
    return cities.filter(city => city.toLowerCase().includes(term));
  },

  /**
   * Get regional grouping
   */
  getCountriesByRegion() {
    const regions = {};
    COUNTRIES_DATA.countries.forEach(country => {
      if (!regions[country.region]) {
        regions[country.region] = [];
      }
      regions[country.region].push(country);
    });
    return regions;
  }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { COUNTRIES_DATA, GeoDataHelper };
}
