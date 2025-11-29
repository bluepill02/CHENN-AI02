import pincodeStops from '../data/pincodeStops.json';
import cmrlTimetable from '../data/cmrlTimetable.json';

export interface TransportData {
    busStops: string[];
    twitterQueries: string[];
    popularRoutes?: string[];
    metroStation?: {
        name: string;
        line: 'Blue Line' | 'Green Line' | 'Inter-Corridor';
        distance?: string; // Approximate
    };
    trainStation?: {
        name: string;
        line: 'South Line' | 'North Line' | 'West Line' | 'MRTS';
    };
}

// Mapping of Pincode to nearest Metro Station
const PINCODE_METRO_MAP: Record<string, { name: string; line: 'Blue Line' | 'Green Line' | 'Inter-Corridor' }> = {
    // Blue Line (Corridor 1)
    '600019': { name: 'Wimco Nagar / Tiruvottriyur', line: 'Blue Line' },
    '600081': { name: 'Tollgate / New Washermanpet', line: 'Blue Line' },
    '600021': { name: 'Washermanpet', line: 'Blue Line' },
    '600001': { name: 'High Court / Mannadi', line: 'Blue Line' },
    '600002': { name: 'Government Estate / LIC', line: 'Blue Line' },
    '600006': { name: 'Thousand Lights / AG-DMS', line: 'Blue Line' },
    '600018': { name: 'Teynampet', line: 'Blue Line' },
    '600035': { name: 'Nandanam / Saidapet', line: 'Blue Line' },
    '600015': { name: 'Little Mount / Saidapet', line: 'Blue Line' },
    '600032': { name: 'Guindy', line: 'Blue Line' },
    '600016': { name: 'Alandur / St. Thomas Mount', line: 'Blue Line' }, // Inter-change
    '600061': { name: 'Nanganallur Road', line: 'Blue Line' },
    '600027': { name: 'Chennai Airport / Meenambakkam', line: 'Blue Line' },

    // Green Line (Corridor 2)
    '600003': { name: 'Chennai Central', line: 'Green Line' }, // Inter-change
    '600008': { name: 'Egmore', line: 'Green Line' },
    '600031': { name: 'Nehru Park / Chetpet', line: 'Green Line' }, // Chetpet is nearby
    '600010': { name: 'Kilpauk Medical College', line: 'Green Line' },
    '600029': { name: 'Pachaiyappa\'s College / Aminjikarai', line: 'Green Line' },
    '600030': { name: 'Shenoy Nagar', line: 'Green Line' },
    '600102': { name: 'Anna Nagar East', line: 'Green Line' },
    '600040': { name: 'Anna Nagar Tower / Thirumangalam', line: 'Green Line' },
    '600107': { name: 'Koyambedu / CMBT', line: 'Green Line' },
    '600106': { name: 'Arumbakkam', line: 'Green Line' },
    '600026': { name: 'Vadapalani', line: 'Green Line' },
    '600083': { name: 'Ashok Nagar', line: 'Green Line' },
    '600097': { name: 'Ekkattuthangal', line: 'Green Line' },
    // Alandur & St Thomas Mount are already covered in Blue Line (Inter-change)

    // Phase 2 / Other Key Areas (Mapped to nearest existing or upcoming)
    '600051': { name: 'Madhavaram Milk Colony (Phase 2)', line: 'Inter-Corridor' },
    '600060': { name: 'Madhavaram (Phase 2)', line: 'Inter-Corridor' },
    '600049': { name: 'Villivakkam (Phase 2)', line: 'Inter-Corridor' },
    '600099': { name: 'Kolathur (Phase 2)', line: 'Inter-Corridor' },
    '600011': { name: 'Perambur (Phase 2)', line: 'Inter-Corridor' },
    '600023': { name: 'Ayanavaram (Phase 2)', line: 'Inter-Corridor' },
    '600034': { name: 'Nungambakkam (Phase 2)', line: 'Inter-Corridor' },
    '600042': { name: 'Velachery (Phase 2)', line: 'Inter-Corridor' },
    '600119': { name: 'Sholinganallur (Phase 2)', line: 'Inter-Corridor' },
    '603103': { name: 'SIPCOT (Phase 2)', line: 'Inter-Corridor' },
    '600020': { name: 'Adyar (Phase 2)', line: 'Inter-Corridor' },
    '600041': { name: 'Thiruvanmiyur (Phase 2)', line: 'Inter-Corridor' },
    '600113': { name: 'Taramani (Phase 2)', line: 'Inter-Corridor' },
    '600096': { name: 'Perungudi (Phase 2)', line: 'Inter-Corridor' },
    '600005': { name: 'Light House / Triplicane (Phase 2)', line: 'Inter-Corridor' },
    '600004': { name: 'Mylapore (Phase 2)', line: 'Inter-Corridor' },
    '600078': { name: 'K.K. Nagar (Phase 2)', line: 'Inter-Corridor' },
    '600116': { name: 'Porur (Phase 2)', line: 'Inter-Corridor' },
    '600056': { name: 'Iyyappanthangal (Phase 2)', line: 'Inter-Corridor' },
};

// Mapping of Pincode to nearest Suburban/MRTS Station
const PINCODE_TRAIN_MAP: Record<string, { name: string; line: 'South Line' | 'North Line' | 'West Line' | 'MRTS' }> = {
    // South Line (Beach - Tambaram - Chengalpattu)
    '600001': { name: 'Chennai Beach / Fort', line: 'South Line' },
    '600003': { name: 'Chennai Park', line: 'South Line' },
    '600008': { name: 'Egmore', line: 'South Line' },
    '600034': { name: 'Nungambakkam / Kodambakkam', line: 'South Line' },
    '600033': { name: 'Mambalam', line: 'South Line' },
    '600015': { name: 'Saidapet', line: 'South Line' },
    '600032': { name: 'Guindy', line: 'South Line' },
    '600016': { name: 'St. Thomas Mount', line: 'South Line' },
    '600114': { name: 'Pazhavanthangal', line: 'South Line' },
    '600027': { name: 'Meenambakkam / Tirusulam', line: 'South Line' },
    '600043': { name: 'Pallavaram', line: 'South Line' },
    '600044': { name: 'Chromepet', line: 'South Line' },
    '600045': { name: 'Tambaram / Sanatorium', line: 'South Line' },
    '600063': { name: 'Perungalathur', line: 'South Line' },
    '600048': { name: 'Vandalur', line: 'South Line' },
    '603202': { name: 'Guduvancheri', line: 'South Line' },
    '603001': { name: 'Chengalpattu', line: 'South Line' },

    // West Line (Central - Arakkonam)
    '600011': { name: 'Perambur / Loco Works', line: 'West Line' },
    '600023': { name: 'Ayanavaram', line: 'West Line' }, // Near Perambur
    '600049': { name: 'Villivakkam', line: 'West Line' },
    '600080': { name: 'Korattur', line: 'West Line' },
    '600050': { name: 'Pattaravakkam', line: 'West Line' },
    '600053': { name: 'Ambattur', line: 'West Line' },
    '600062': { name: 'Thirumullaivoyal', line: 'West Line' },
    '600109': { name: 'Annanur', line: 'West Line' },
    '600054': { name: 'Avadi', line: 'West Line' },
    '600071': { name: 'Hindu College', line: 'West Line' },
    '600072': { name: 'Pattabiram', line: 'West Line' },
    '602024': { name: 'Thiruninravur', line: 'West Line' },

    // North Line (Central - Gummidipoondi)
    '600021': { name: 'Washermanpet / Korukkupet', line: 'North Line' },
    '600081': { name: 'Tondiarpet', line: 'North Line' },
    '600019': { name: 'Tiruvottiyur / Wimco Nagar', line: 'North Line' },
    '600057': { name: 'Ennore / Kathivakkam', line: 'North Line' },
    '600120': { name: 'Attipattu', line: 'North Line' },
    '601203': { name: 'Minjur', line: 'North Line' },

    // MRTS (Beach - Velachery)
    // Beach & Fort covered in South Line (Inter-change)
    '600002': { name: 'Chintadripet', line: 'MRTS' },
    '600005': { name: 'Chepauk / Triplicane', line: 'MRTS' },
    '600004': { name: 'Light House / Mundakanni Amman Koil / Mylapore', line: 'MRTS' },
    '600028': { name: 'Greenways Road', line: 'MRTS' },
    '600085': { name: 'Kotturpuram', line: 'MRTS' },
    '600020': { name: 'Kasturibai Nagar / Indira Nagar', line: 'MRTS' },
    '600041': { name: 'Thiruvanmiyur', line: 'MRTS' },
    '600113': { name: 'Taramani', line: 'MRTS' },
    '600096': { name: 'Perungudi', line: 'MRTS' },
    '600042': { name: 'Velachery', line: 'MRTS' },
};

export const TransportService = {
    getTransportData(pincode: string): TransportData | null {
        const busData = (pincodeStops as any)[pincode];

        if (!busData) return null;

        const metroData = PINCODE_METRO_MAP[pincode];
        const trainData = PINCODE_TRAIN_MAP[pincode];

        return {
            busStops: busData.busStops || [],
            twitterQueries: busData.twitterQueries || [],
            popularRoutes: busData.popularRoutes || [],
            metroStation: metroData,
            trainStation: trainData
        };
    },

    getMetroTimetable(line: 'Blue Line' | 'Green Line' | 'Inter-Corridor', dayType: 'weekdays' | 'saturday' | 'sundayAndHolidays' = 'weekdays') {
        const schedule = (cmrlTimetable as any)[dayType];
        if (!schedule) return null;

        // Normalize line key
        let lineKey = '';
        if (line === 'Blue Line') lineKey = 'blueLine';
        else if (line === 'Green Line') lineKey = 'greenLine';
        else if (line === 'Inter-Corridor') lineKey = 'interCorridor';

        return schedule[lineKey] || null;
    }
};
