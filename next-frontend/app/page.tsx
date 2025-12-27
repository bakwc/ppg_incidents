import { fetchDashboardStats, fetchIncidents, fetchYearStats, fetchCountries, fetchDateRange } from '@/lib/api';
import HomeClient from '@/components/HomeClient';

export default async function Home() {
  const baseFilter = { potentially_fatal: true, cause_confidence: 'maximum,high' };
  
  const totalIncidentsFilterPacks = [
    { name: 'Total', include: {}, exclude: {} }
  ];
  
  const primaryCausesFilterPacks = [
    { name: 'Total', include: { ...baseFilter }, exclude: {} },
    { name: 'Wrong Control Input', include: { ...baseFilter, primary_cause: 'wrong_control_input' }, exclude: {} },
    { name: 'Hardware Failure', include: { ...baseFilter, primary_cause: 'hardware_failure' }, exclude: {} },
    { name: 'Turbulence', include: { ...baseFilter, primary_cause: 'turbulence' }, exclude: {} },
    { name: 'Powerline Collision', include: { ...baseFilter, primary_cause: 'powerline_collision' }, exclude: {} },
    { name: 'Midair Collision', include: { ...baseFilter, primary_cause: 'midair_collision' }, exclude: {} },
    { name: 'Water Landing', include: { ...baseFilter, primary_cause: 'water_landing' }, exclude: {} },
    { name: 'Ground Starting', include: { ...baseFilter, primary_cause: 'ground_starting' }, exclude: {} },
    { name: 'Others', include: { ...baseFilter }, exclude: { primary_cause: 'wrong_control_input,hardware_failure,turbulence,powerline_collision,midair_collision,water_landing,ground_starting' } }
  ];

  const flightPhaseFilterPacks = [
    { name: 'Total', include: { ...baseFilter }, exclude: {} },
    { name: 'Ground', include: { ...baseFilter, flight_phase: 'ground' }, exclude: {} },
    { name: 'Takeoff', include: { ...baseFilter, flight_phase: 'takeoff' }, exclude: {} },
    { name: 'Flight', include: { ...baseFilter, flight_phase: 'flight' }, exclude: {} },
    { name: 'Landing', include: { ...baseFilter, flight_phase: 'landing' }, exclude: {} }
  ];

  const reserveFilterPacks = [
    { name: 'Total', include: { ...baseFilter }, exclude: { flight_phase: 'ground' } },
    { name: 'Attempted', include: { ...baseFilter, reserve_use: 'no_time,tangled,partially_opened,fully_opened' }, exclude: { flight_phase: 'ground' } },
    { name: 'FullyOpened', include: { ...baseFilter, reserve_use: 'fully_opened' }, exclude: { flight_phase: 'ground' } }
  ];

  const [totalIncidentsData, primaryCausesData, flightPhaseData, reserveData, yearData, recentIncidentsData, recentVideosData, countriesData, dateRangeData] = await Promise.all([
    fetchDashboardStats(totalIncidentsFilterPacks),
    fetchDashboardStats(primaryCausesFilterPacks),
    fetchDashboardStats(flightPhaseFilterPacks),
    fetchDashboardStats(reserveFilterPacks),
    fetchYearStats(baseFilter, {}),
    fetchIncidents(null, { order_by: '-date' }, 1),
    fetchIncidents(null, { has_video: 'true', order_by: '-date' }, 1),
    fetchCountries(),
    fetchDateRange()
  ]);

  const totalIncidents = totalIncidentsData['Total'] || 0;
  const potentiallyFatalIncidents = primaryCausesData['Total'] || 0;
  
  const countriesCount = countriesData.length;
  
  const dateRange = dateRangeData.min_date && dateRangeData.max_date
    ? `${new Date(dateRangeData.min_date).getFullYear()}-${new Date(dateRangeData.max_date).getFullYear()}`
    : 'N/A';

  const stats = {
    totalIncidents,
    potentiallyFatalIncidents,
    countriesCount,
    dateRange,
    primaryCauses: primaryCausesData,
    flightPhase: flightPhaseData,
    reserve: reserveData,
    years: yearData
  };

  const recentIncidents = recentIncidentsData.results.slice(0, 12);
  const recentVideos = recentVideosData.results.slice(0, 6);

  return <HomeClient stats={stats} recentIncidents={recentIncidents} recentVideos={recentVideos} />;
}
