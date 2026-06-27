// Detailed data for previous World Cup appearances and legendary winning squads.

export const historicalAppearancesMap = {
  argentina: [2022, 1986],
  brazil: [2002, 1970],
  netherlands: [2010, 1974],
  belgium: [2018],
  croatia: [2022, 2018],
  senegal: [2002],
  ghana: [2010],
  england: [2006, 1966],
  france: [2018, 1998],
  germany: [2014, 1990],
  spain: [2010]
};

export const historicalSquads = {
  'brazil-2002': {
    teamName: 'Brazil',
    year: 2002,
    formation: '3-4-3',
    description: 'The unstoppable trio of the 3 R\'s (Ronaldo, Rivaldo, Ronaldinho) led Brazil to their fifth title with a perfect record.',
    players: [
      { name: 'Marcos', position: 'GK', number: 1 },
      { name: 'Lucio', position: 'DF', number: 3 },
      { name: 'Roque Junior', position: 'DF', number: 4 },
      { name: 'Edmilson', position: 'DF', number: 5 },
      { name: 'Cafu', position: 'MF', number: 2 },
      { name: 'Gilberto Silva', position: 'MF', number: 8 },
      { name: 'Kleberson', position: 'MF', number: 15 },
      { name: 'Roberto Carlos', position: 'MF', number: 6 },
      { name: 'Ronaldinho', position: 'FW', number: 11 },
      { name: 'Rivaldo', position: 'FW', number: 10 },
      { name: 'Ronaldo', position: 'FW', number: 9 }
    ]
  },
  'brazil-1970': {
    teamName: 'Brazil',
    year: 1970,
    formation: '4-3-3',
    description: 'Often cited as the greatest football team of all time, redefining the beautiful game with Pelé in his final World Cup.',
    players: [
      { name: 'Félix', position: 'GK', number: 1 },
      { name: 'Carlos Alberto', position: 'DF', number: 4 },
      { name: 'Brito', position: 'DF', number: 2 },
      { name: 'Piazza', position: 'DF', number: 3 },
      { name: 'Everaldo', position: 'DF', number: 6 },
      { name: 'Clodoaldo', position: 'MF', number: 5 },
      { name: 'Gérson', position: 'MF', number: 8 },
      { name: 'Rivelino', position: 'MF', number: 11 },
      { name: 'Jairzinho', position: 'FW', number: 7 },
      { name: 'Tostão', position: 'FW', number: 9 },
      { name: 'Pelé', position: 'FW', number: 10 }
    ]
  },
  'argentina-2022': {
    teamName: 'Argentina',
    year: 2022,
    formation: '4-3-3',
    description: 'Cemented Lionel Messi\'s legacy in a thrilling final victory over France, ending a 36-year World Cup drought for Argentina.',
    players: [
      { name: 'Emiliano Martinez', position: 'GK', number: 23 },
      { name: 'Nahuel Molina', position: 'DF', number: 26 },
      { name: 'Cristian Romero', position: 'DF', number: 13 },
      { name: 'Nicolas Otamendi', position: 'DF', number: 19 },
      { name: 'Nicolas Tagliafico', position: 'DF', number: 3 },
      { name: 'Rodrigo De Paul', position: 'MF', number: 7 },
      { name: 'Enzo Fernandez', position: 'MF', number: 24 },
      { name: 'Alexis Mac Allister', position: 'MF', number: 20 },
      { name: 'Angel Di Maria', position: 'FW', number: 11 },
      { name: 'Lionel Messi', position: 'FW', number: 10 },
      { name: 'Julian Alvarez', position: 'FW', number: 9 }
    ]
  },
  'argentina-1986': {
    teamName: 'Argentina',
    year: 1986,
    formation: '3-5-1-1',
    description: 'Defined by the pure genius of Diego Maradona, including the "Hand of God" and the "Goal of the Century" against England.',
    players: [
      { name: 'Nery Pumpido', position: 'GK', number: 18 },
      { name: 'Jose Luis Brown', position: 'DF', number: 5 },
      { name: 'Oscar Ruggeri', position: 'DF', number: 19 },
      { name: 'Jose Luis Cuciuffo', position: 'DF', number: 9 },
      { name: 'Ricardo Giusti', position: 'MF', number: 14 },
      { name: 'Sergio Batista', position: 'MF', number: 2 },
      { name: 'Hector Enrique', position: 'MF', number: 12 },
      { name: 'Julio Olarticoechea', position: 'MF', number: 16 },
      { name: 'Jorge Burruchaga', position: 'MF', number: 7 },
      { name: 'Diego Maradona', position: 'FW', number: 10 },
      { name: 'Jorge Valdano', position: 'FW', number: 11 }
    ]
  },
  'france-2018': {
    teamName: 'France',
    year: 2018,
    formation: '4-2-3-1',
    description: 'A highly explosive and balanced squad that took the world by storm, highlighted by a teenage Kylian Mbappé.',
    players: [
      { name: 'Hugo Lloris', position: 'GK', number: 1 },
      { name: 'Benjamin Pavard', position: 'DF', number: 2 },
      { name: 'Raphael Varane', position: 'DF', number: 4 },
      { name: 'Samuel Umtiti', position: 'DF', number: 5 },
      { name: 'Lucas Hernandez', position: 'DF', number: 21 },
      { name: 'Paul Pogba', position: 'MF', number: 6 },
      { name: 'N\'Golo Kante', position: 'MF', number: 13 },
      { name: 'Kylian Mbappe', position: 'FW', number: 10 },
      { name: 'Antoine Griezmann', position: 'FW', number: 7 },
      { name: 'Blaise Matuidi', position: 'MF', number: 14 },
      { name: 'Olivier Giroud', position: 'FW', number: 9 }
    ]
  },
  'france-1998': {
    teamName: 'France',
    year: 1998,
    formation: '4-3-2-1',
    description: 'The "Rainbow Team" that won on home soil, spearheaded by Zidane\'s two final headers and an impregnable defense.',
    players: [
      { name: 'Fabien Barthez', position: 'GK', number: 16 },
      { name: 'Lilian Thuram', position: 'DF', number: 15 },
      { name: 'Marcel Desailly', position: 'DF', number: 8 },
      { name: 'Laurent Blanc', position: 'DF', number: 5 },
      { name: 'Bixente Lizarazu', position: 'DF', number: 3 },
      { name: 'Didier Deschamps', position: 'MF', number: 7 },
      { name: 'Christian Karembeu', position: 'MF', number: 19 },
      { name: 'Emmanuel Petit', position: 'MF', number: 17 },
      { name: 'Zinedine Zidane', position: 'MF', number: 10 },
      { name: 'Youri Djorkaeff', position: 'MF', number: 6 },
      { name: 'Stephane Guivarc\'h', position: 'FW', number: 9 }
    ]
  },
  'germany-2014': {
    teamName: 'Germany',
    year: 2014,
    formation: '4-2-3-1',
    description: 'A masterfully unified squad that claimed the trophy in South America, famously defeating hosts Brazil 7-1.',
    players: [
      { name: 'Manuel Neuer', position: 'GK', number: 1 },
      { name: 'Philipp Lahm', position: 'DF', number: 16 },
      { name: 'Jerome Boateng', position: 'DF', number: 20 },
      { name: 'Mats Hummels', position: 'DF', number: 5 },
      { name: 'Benedikt Höwedes', position: 'DF', number: 4 },
      { name: 'Bastian Schweinsteiger', position: 'MF', number: 7 },
      { name: 'Toni Kroos', position: 'MF', number: 18 },
      { name: 'Thomas Müller', position: 'FW', number: 13 },
      { name: 'Mesut Özil', position: 'MF', number: 8 },
      { name: 'Mario Götze', position: 'MF', number: 19 },
      { name: 'Miroslav Klose', position: 'FW', number: 11 }
    ]
  },
  'spain-2010': {
    teamName: 'Spain',
    year: 2010,
    formation: '4-3-3',
    description: 'The absolute pinnacle of the "Tiki-Taka" passing style, winning three consecutive international major trophies.',
    players: [
      { name: 'Iker Casillas', position: 'GK', number: 1 },
      { name: 'Sergio Ramos', position: 'DF', number: 15 },
      { name: 'Gerard Pique', position: 'DF', number: 3 },
      { name: 'Carles Puyol', position: 'DF', number: 5 },
      { name: 'Joan Capdevila', position: 'DF', number: 11 },
      { name: 'Sergio Busquets', position: 'MF', number: 16 },
      { name: 'Xabi Alonso', position: 'MF', number: 14 },
      { name: 'Xavi', position: 'MF', number: 8 },
      { name: 'Andres Iniesta', position: 'MF', number: 6 },
      { name: 'Pedro', position: 'FW', number: 18 },
      { name: 'David Villa', position: 'FW', number: 7 }
    ]
  },
  'netherlands-1974': {
    teamName: 'Netherlands',
    year: 1974,
    formation: '4-3-3',
    description: 'The masters of Cruyff\'s "Total Football" who changed the tactical landscape of football forever.',
    players: [
      { name: 'Jan Jongbloed', position: 'GK', number: 8 },
      { name: 'Wim Suurbier', position: 'DF', number: 20 },
      { name: 'Wim Rijsbergen', position: 'DF', number: 17 },
      { name: 'Arie Haan', position: 'DF', number: 2 },
      { name: 'Ruud Krol', position: 'DF', number: 12 },
      { name: 'Wim Jansen', position: 'MF', number: 6 },
      { name: 'Johan Neeskens', position: 'MF', number: 13 },
      { name: 'Wim van Hanegem', position: 'MF', number: 3 },
      { name: 'Johnny Rep', position: 'FW', number: 16 },
      { name: 'Johan Cruyff', position: 'FW', number: 14 },
      { name: 'Rob Rensenbrink', position: 'FW', number: 15 }
    ]
  },
  'netherlands-2010': {
    teamName: 'Netherlands',
    year: 2010,
    formation: '4-2-3-1',
    description: 'Reached the final in South Africa, narrowly losing to Spain in extra time after a dramatic campaign.',
    players: [
      { name: 'Maarten Stekelenburg', position: 'GK', number: 1 },
      { name: 'Gregory van der Wiel', position: 'DF', number: 2 },
      { name: 'John Heitinga', position: 'DF', number: 3 },
      { name: 'Joris Mathijsen', position: 'DF', number: 4 },
      { name: 'Giovanni van Bronckhorst', position: 'DF', number: 5 },
      { name: 'Mark van Bommel', position: 'MF', number: 6 },
      { name: 'Nigel de Jong', position: 'MF', number: 8 },
      { name: 'Wesley Sneijder', position: 'MF', number: 10 },
      { name: 'Arjen Robben', position: 'FW', number: 11 },
      { name: 'Dirk Kuyt', position: 'FW', number: 7 },
      { name: 'Robin van Persie', position: 'FW', number: 9 }
    ]
  },
  'belgium-2018': {
    teamName: 'Belgium',
    year: 2018,
    formation: '3-4-2-1',
    description: 'The "Golden Generation" achieved Belgium\'s best-ever World Cup finish, defeating Brazil and securing third place.',
    players: [
      { name: 'Thibaut Courtois', position: 'GK', number: 1 },
      { name: 'Toby Alderweireld', position: 'DF', number: 2 },
      { name: 'Vincent Kompany', position: 'DF', number: 4 },
      { name: 'Jan Vertonghen', position: 'DF', number: 5 },
      { name: 'Thomas Meunier', position: 'MF', number: 15 },
      { name: 'Axel Witsel', position: 'MF', number: 6 },
      { name: 'Kevin De Bruyne', position: 'MF', number: 7 },
      { name: 'Yannick Carrasco', position: 'MF', number: 11 },
      { name: 'Eden Hazard', position: 'FW', number: 10 },
      { name: 'Dries Mertens', position: 'FW', number: 14 },
      { name: 'Romelu Lukaku', position: 'FW', number: 9 }
    ]
  },
  'croatia-2018': {
    teamName: 'Croatia',
    year: 2018,
    formation: '4-2-3-1',
    description: 'Led by Ballon d\'Or winner Luka Modrić, they showed incredible resilience with three extra-time wins to reach the final.',
    players: [
      { name: 'Danijel Subasic', position: 'GK', number: 23 },
      { name: 'Sime Vrsaljko', position: 'DF', number: 2 },
      { name: 'Dejan Lovren', position: 'DF', number: 6 },
      { name: 'Domagoj Vida', position: 'DF', number: 21 },
      { name: 'Ivan Strinic', position: 'DF', number: 3 },
      { name: 'Ivan Rakitic', position: 'MF', number: 7 },
      { name: 'Marcelo Brozovic', position: 'MF', number: 11 },
      { name: 'Luka Modric', position: 'MF', number: 10 },
      { name: 'Ante Rebic', position: 'FW', number: 18 },
      { name: 'Ivan Perisic', position: 'FW', number: 4 },
      { name: 'Mario Mandzukic', position: 'FW', number: 17 }
    ]
  },
  'croatia-2022': {
    teamName: 'Croatia',
    year: 2022,
    formation: '4-3-3',
    description: 'Defeated tournament favorites Brazil in the quarter-finals and beat Morocco to claim a proud third place.',
    players: [
      { name: 'Dominik Livakovic', position: 'GK', number: 1 },
      { name: 'Josip Juranovic', position: 'DF', number: 22 },
      { name: 'Dejan Lovren', position: 'DF', number: 6 },
      { name: 'Josko Gvardiol', position: 'DF', number: 20 },
      { name: 'Borna Sosa', position: 'DF', number: 19 },
      { name: 'Luka Modric', position: 'MF', number: 10 },
      { name: 'Marcelo Brozovic', position: 'MF', number: 11 },
      { name: 'Mateo Kovacic', position: 'MF', number: 8 },
      { name: 'Andrej Kramaric', position: 'FW', number: 9 },
      { name: 'Marko Livaja', position: 'FW', number: 14 },
      { name: 'Ivan Perisic', position: 'FW', number: 4 }
    ]
  },
  'senegal-2002': {
    teamName: 'Senegal',
    year: 2002,
    formation: '4-4-2',
    description: 'Stunned holders France in the opening match and became only the second African nation to reach the quarter-finals.',
    players: [
      { name: 'Tony Sylva', position: 'GK', number: 1 },
      { name: 'Lamine Diatta', position: 'DF', number: 13 },
      { name: 'Papa Malick Diop', position: 'DF', number: 4 },
      { name: 'Alassane N\'Dour', position: 'DF', number: 2 },
      { name: 'Omar Daf', position: 'DF', number: 17 },
      { name: 'Salif Diao', position: 'MF', number: 15 },
      { name: 'Aliou Cisse', position: 'MF', number: 6 },
      { name: 'Papa Bouba Diop', position: 'MF', number: 19 },
      { name: 'Khalilou Fadiga', position: 'MF', number: 10 },
      { name: 'El Hadji Diouf', position: 'FW', number: 11 },
      { name: 'Henri Camara', position: 'FW', number: 7 }
    ]
  },
  'ghana-2010': {
    teamName: 'Ghana',
    year: 2010,
    formation: '4-2-3-1',
    description: 'Enthralled the African continent by reaching the quarter-finals, missing a semi-final berth by the narrowest of margins.',
    players: [
      { name: 'Richard Kingson', position: 'GK', number: 22 },
      { name: 'John Paintsil', position: 'DF', number: 4 },
      { name: 'John Mensah', position: 'DF', number: 5 },
      { name: 'Isaac Vorsah', position: 'DF', number: 15 },
      { name: 'Hans Sarpei', position: 'DF', number: 2 },
      { name: 'Anthony Annan', position: 'MF', number: 6 },
      { name: 'Kevin-Prince Boateng', position: 'MF', number: 23 },
      { name: 'Kwadwo Asamoah', position: 'MF', number: 13 },
      { name: 'Samuel Inkoom', position: 'FW', number: 7 },
      { name: 'Andre Ayew', position: 'FW', number: 10 },
      { name: 'Asamoah Gyan', position: 'FW', number: 3 }
    ]
  },
  'england-2006': {
    teamName: 'England',
    year: 2006,
    formation: '4-4-2',
    description: 'The star-studded "Golden Generation" featuring Gerrard, Lampard, Beckham, Rooney, and Ferdinand.',
    players: [
      { name: 'Paul Robinson', position: 'GK', number: 1 },
      { name: 'Gary Neville', position: 'DF', number: 2 },
      { name: 'Rio Ferdinand', position: 'DF', number: 5 },
      { name: 'John Terry', position: 'DF', number: 6 },
      { name: 'Ashley Cole', position: 'DF', number: 3 },
      { name: 'David Beckham', position: 'MF', number: 7 },
      { name: 'Steven Gerrard', position: 'MF', number: 4 },
      { name: 'Frank Lampard', position: 'MF', number: 8 },
      { name: 'Paul Scholes', position: 'MF', number: 11 },
      { name: 'Wayne Rooney', position: 'FW', number: 9 },
      { name: 'Michael Owen', position: 'FW', number: 10 }
    ]
  },
  'england-1966': {
    teamName: 'England',
    year: 1966,
    formation: '4-4-2',
    description: 'The legendary "Wingless Wonders" captained by Bobby Moore that won England\'s first and only World Cup on home soil.',
    players: [
      { name: 'Gordon Banks', position: 'GK', number: 1 },
      { name: 'George Cohen', position: 'DF', number: 2 },
      { name: 'Jack Charlton', position: 'DF', number: 5 },
      { name: 'Bobby Moore', position: 'DF', number: 6 },
      { name: 'Ray Wilson', position: 'DF', number: 3 },
      { name: 'Nobby Stiles', position: 'MF', number: 4 },
      { name: 'Alan Ball', position: 'MF', number: 7 },
      { name: 'Bobby Charlton', position: 'MF', number: 9 },
      { name: 'Martin Peters', position: 'MF', number: 11 },
      { name: 'Geoff Hurst', position: 'FW', number: 10 },
      { name: 'Roger Hunt', position: 'FW', number: 21 }
    ]
  },
  'germany-1990': {
    teamName: 'Germany',
    year: 1990,
    formation: '3-5-2',
    description: 'Captained by Lothar Matthäus, a tactically supreme West German side claimed their third World Cup title in Italy.',
    players: [
      { name: 'Bodo Illgner', position: 'GK', number: 1 },
      { name: 'Klaus Augenthaler', position: 'DF', number: 5 },
      { name: 'Jürgen Kohler', position: 'DF', number: 4 },
      { name: 'Guido Buchwald', position: 'DF', number: 6 },
      { name: 'Thomas Berthold', position: 'MF', number: 14 },
      { name: 'Andreas Brehme', position: 'MF', number: 3 },
      { name: 'Thomas Häßler', position: 'MF', number: 8 },
      { name: 'Lothar Matthäus', position: 'MF', number: 10 },
      { name: 'Stefan Reuter', position: 'MF', number: 2 },
      { name: 'Jürgen Klinsmann', position: 'FW', number: 18 },
      { name: 'Rudi Völler', position: 'FW', number: 9 }
    ]
  }
};

export const getHistoricalTeamDetails = (teamId, swapId, originalTeams = []) => {
  if (!swapId) return null;
  const parts = swapId.split('-');
  const year = parseInt(parts[parts.length - 1], 10);
  
  // Find name from original teams list
  const countryObj = originalTeams.find(t => t.id === teamId);
  const teamName = countryObj ? countryObj.name : (teamId.charAt(0).toUpperCase() + teamId.slice(1));

  // Check predefined squads in historicalSquads
  const predefined = historicalSquads[swapId];
  if (predefined) {
    return {
      id: swapId,
      year,
      teamName: predefined.teamName,
      formation: predefined.formation,
      players: predefined.players,
      description: predefined.description
    };
  }

  // Fallback generation
  const baseSquad = countryObj?.squad || [];
  const generatedPlayers = baseSquad.length > 0
    ? baseSquad.map(p => ({
        name: `${p.name} (${year})`,
        position: p.position,
        number: p.number
      }))
    : [
        { name: `${teamName} Classic GK`, position: 'GK', number: 1 },
        { name: `${teamName} Classic DF1`, position: 'DF', number: 2 },
        { name: `${teamName} Classic DF2`, position: 'DF', number: 3 },
        { name: `${teamName} Classic MF1`, position: 'MF', number: 8 },
        { name: `${teamName} Classic MF2`, position: 'MF', number: 10 },
        { name: `${teamName} Classic FW1`, position: 'FW', number: 9 },
        { name: `${teamName} Classic FW2`, position: 'FW', number: 11 }
      ];

  return {
    id: swapId,
    year,
    teamName,
    formation: '4-3-3',
    players: generatedPlayers,
    description: `${teamName} squad from the ${year} World Cup.`
  };
};
