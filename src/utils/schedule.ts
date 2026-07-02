import scheduleData from '../data/schedule.json';
import { teams as initialTeams } from '../data/worldcup2026';

// Helper to convert "June 12 Friday" or "Jun 29 Monday" -> "2026-06-12"
export const parseScheduleDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const clean = dateStr.trim().replace(/\s+/g, ' ');
  const parts = clean.split(' ');
  if (parts.length < 2) return '';
  const monthName = parts[0].toLowerCase();
  const day = parseInt(parts[1], 10);
  const month = monthName.startsWith('jul') ? '07' : '06';
  const dayStr = String(day).padStart(2, '0');
  return `2026-${month}-${dayStr}`;
};

// Helper to convert "12.30 AM" or "7:30 AM" -> "00:30" or "07:30"
export const parseScheduleTime = (timeStr: string): string => {
  if (!timeStr) return '00:00';
  const clean = timeStr.trim().replace(/\s+/g, '').replace('.', ':').toLowerCase();
  const isPM = clean.includes('pm');
  const isAM = clean.includes('am');
  const timePart = clean.replace('am', '').replace('pm', '');
  
  const parts = timePart.split(':');
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1] ? parseInt(parts[1], 10) : 0;
  
  if (isPM && hours < 12) {
    hours += 12;
  }
  if (isAM && hours === 12) {
    hours = 0;
  }
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

// Convert parsed date ("2026-06-17") and time ("22:30") from IST to UTC
export const getUTCDateTimeFromIST = (dateStr: string, timeStr: string): { date: string, time: string } => {
  if (!dateStr) return { date: '', time: '' };
  const [y, m, d] = dateStr.split('-').map(Number);
  const [h, min] = (timeStr || '00:00').split(':').map(Number);
  
  // Construct Date object in UTC using the IST fields
  const utcDate = new Date(Date.UTC(y, m - 1, d, h, min, 0));
  
  // Subtract 5 hours and 30 minutes (IST is UTC+5:30, so we subtract to get UTC)
  utcDate.setUTCMinutes(utcDate.getUTCMinutes() - 330);
  
  const year = utcDate.getUTCFullYear();
  const month = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(utcDate.getUTCDate()).padStart(2, '0');
  const hours = String(utcDate.getUTCHours()).padStart(2, '0');
  const minutes = String(utcDate.getUTCMinutes()).padStart(2, '0');
  
  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`
  };
};

// Helper to resolve location from schedule.json to venue ID
const locationToVenueId: { [key: string]: string } = {
  'Mexico City': 'azteca',
  'Zapopan': 'akron',
  'Guadalajara': 'akron',
  'Toronto': 'bmo',
  'Los Angeles': 'sofi',
  'Santa Clara': 'levis',
  'New Jersey': 'metlife',
  'Foxborough': 'gillette',
  'Vancouver': 'bcplace',
  'Houston': 'nrg',
  'Arlington': 'attstadium',
  'Philadelphia': 'lincoln',
  'Atlanta': 'mercedesbenz',
  'Seattle': 'lumen',
  'Miami': 'hardrock',
  'Kansas City': 'arrowhead'
};

export const resolveVenueId = (location: string): string => {
  return locationToVenueId[location] || location.toLowerCase().replace(/[^a-z0-9]/g, '');
};

// Helper to resolve team name to team ID from worldcup2026 teams list
export const resolveTeamId = (teamName: string, teamsList: any[] = initialTeams): string => {
  if (!teamName) return 'tbd';
  const cleanStr = (s: string) => s.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
  let target = cleanStr(teamName);
  if (target === 'turkey') target = 'turkiye';
  const found = teamsList.find(t => cleanStr(t.name) === target || cleanStr(t.id) === target || cleanStr(t.code) === target);
  return found ? found.id : teamName; // Fallback to teamName (placeholder) if not a real team
};

// Timezone conversions
export const getLocalDateString = (dateStr: string, timeStr: string, tz: string): string => {
  if (!dateStr) return '';
  const isoStr = `${dateStr}T${timeStr || '00:00'}:00Z`;
  const date = new Date(isoStr);
  if (isNaN(date.getTime())) return dateStr;
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const parts = formatter.formatToParts(date);
    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;
    return `${year}-${month}-${day}`;
  } catch (e) {
    return dateStr;
  }
};

export const formatLocalDateStr = (localDateStr: string): string => {
  if (!localDateStr) return '';
  const [y, m, d] = localDateStr.split('-');
  const dateObj = new Date(Date.UTC(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10)));
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric', 
    timeZone: 'UTC' 
  };
  return dateObj.toLocaleDateString('en-GB', options);
};

export const formatLocalTime = (dateStr: string, timeStr: string, tz: string): string => {
  if (!dateStr) return timeStr;
  const isoStr = `${dateStr}T${timeStr || '00:00'}:00Z`;
  const date = new Date(isoStr);
  if (isNaN(date.getTime())) return timeStr;
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    return formatter.format(date).toUpperCase();
  } catch (e) {
    return timeStr;
  }
};

export const getTodayLocalDateString = (tz: string): string => {
  const date = new Date();
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const parts = formatter.formatToParts(date);
    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;
    return `${year}-${month}-${day}`;
  } catch (e) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
};

// Required helper functions:
// 1. getMatchesByDate()
export const getMatchesByDate = (matches: any[], dateStr: string, tz: string): any[] => {
  if (dateStr === 'ALL') return matches;
  return matches.filter(m => {
    const localDate = getLocalDateString(m.date, m.time, tz);
    return localDate === dateStr;
  });
};

// 2. sortMatchesChronologically()
export const sortMatchesChronologically = (matches: any[]): any[] => {
  return [...matches].sort((a, b) => {
    const dateComp = a.date.localeCompare(b.date);
    if (dateComp !== 0) return dateComp;
    return a.time.localeCompare(b.time);
  });
};

// 3. formatMatchDate()
export const formatMatchDate = (dateStr: string, timeStr: string, tz: string): string => {
  const localDate = getLocalDateString(dateStr, timeStr, tz);
  return formatLocalDateStr(localDate);
};

// 4. formatKickoffTime()
export const formatKickoffTime = (dateStr: string, timeStr: string, tz: string): string => {
  return formatLocalTime(dateStr, timeStr, tz);
};

export const formatMatchDateTimeShort = (dateStr: string, timeStr: string, tz: string): string => {
  if (!dateStr) return '';
  const isoStr = `${dateStr}T${timeStr || '00:00'}:00Z`;
  const date = new Date(isoStr);
  if (isNaN(date.getTime())) return dateStr;
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    return formatter.format(date);
  } catch (e) {
    return dateStr;
  }
};

export const getMatchStage = (matchId: number): string => {
  if (matchId <= 72) return 'Group Stage';
  if (matchId <= 88) return 'Round of 32';
  if (matchId <= 96) return 'Round of 16';
  if (matchId <= 100) return 'Quarter-finals';
  if (matchId <= 102) return 'Semi-finals';
  if (matchId === 103) return 'Third Place';
  return 'Final';
};

// Central merge of schedule.json and match results
export const getMergedMatches = (resultsList: any[] = [], teamsList: any[] = initialTeams): any[] => {
  return scheduleData.map(sched => {
    const matchId = `m${sched.match_id}`;
    const parsedDateIST = parseScheduleDate(sched.date);
    const parsedTimeIST = parseScheduleTime(sched.time);
    const { date: parsedDate, time: parsedTime } = getUTCDateTimeFromIST(parsedDateIST, parsedTimeIST);
    const venueId = resolveVenueId(sched.location);
    
    // Parse team names from match_details: "Team A vs Team B"
    let homeTeamNamePlaceholder = '';
    let awayTeamNamePlaceholder = '';
    
    if (sched.match_details.includes(' vs ')) {
      const parts = sched.match_details.split(' vs ');
      homeTeamNamePlaceholder = parts[0].trim();
      awayTeamNamePlaceholder = parts[1].trim();
      // If it contains a stage prefix (e.g. "Round of 32: Group A runner-up vs ..."), extract it
      if (homeTeamNamePlaceholder.includes(':')) {
        const colonParts = homeTeamNamePlaceholder.split(':');
        homeTeamNamePlaceholder = colonParts[1].trim();
      }
    } else {
      homeTeamNamePlaceholder = sched.match_details;
      awayTeamNamePlaceholder = 'TBD';
    }

    const homeTeamId = resolveTeamId(homeTeamNamePlaceholder, teamsList);
    const awayTeamId = resolveTeamId(awayTeamNamePlaceholder, teamsList);
    
    // Find matching result or simulation result from resultsList
    const result = resultsList.find(r => r.id === matchId);
    
    // Determine the group
    let group = '';
    if (sched.match_id <= 72) {
      // Find the group from the resolved teams
      const team = teamsList.find(t => t.id === homeTeamId || t.id === awayTeamId);
      group = team ? team.group : '';
    } else {
      // Knockout stage representation
      if (sched.match_id <= 88) group = 'R32';
      else if (sched.match_id <= 96) group = 'R16';
      else if (sched.match_id <= 100) group = 'QF';
      else if (sched.match_id <= 102) group = 'SF';
      else if (sched.match_id === 103) group = '3RD';
      else group = 'F';
    }
    
    return {
      id: matchId,
      match_id: sched.match_id,
      date: parsedDate,
      time: parsedTime,
      venue: venueId,
      group: group,
      status: result?.status || 'upcoming',
      homeScore: result?.homeScore !== undefined ? result.homeScore : null,
      awayScore: result?.awayScore !== undefined ? result.awayScore : null,
      scorers: result?.scorers || [],
      cards: result?.cards || [],
      playerOfMatch: result?.playerOfMatch || '',
      stats: result?.stats || null,
      highlightUrl: result?.highlightUrl || '',
      // Use resolved team IDs from result if it exists and is knockout, else fall back to schedule.json resolved IDs
      homeTeam: (sched.match_id > 72 && result?.homeTeam) ? result.homeTeam : homeTeamId,
      awayTeam: (sched.match_id > 72 && result?.awayTeam) ? result.awayTeam : awayTeamId,
      stage: getMatchStage(sched.match_id),
      location: sched.location,
      winner: result?.winner || null,
      winnerId: result?.winnerId || null
    };
  });
};
