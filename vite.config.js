import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { exec, execFile } from 'child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'save-results-middleware',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.method === 'POST' && req.url === '/api/save-results') {
            let body = '';
            req.on('data', chunk => {
              body += chunk.toString();
            });
            req.on('end', () => {
              try {
                const data = JSON.parse(body);
                const filePath = path.resolve(__dirname, 'src/data/match_results.json');
                fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true }));
              } catch (err) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: err.message }));
              }
            });
          } else if (req.method === 'POST' && req.url === '/api/request-ai-update') {
            let body = '';
            req.on('data', chunk => {
              body += chunk.toString();
            });
            req.on('end', () => {
              try {
                const { matchId } = JSON.parse(body);
                const configPath = path.resolve(__dirname, 'src/data/agent_config.json');
                if (!fs.existsSync(configPath)) {
                  throw new Error('agent_config.json not found');
                }
                const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                const conversationId = config.conversationId;
                if (!conversationId) {
                  throw new Error('conversationId not found in config');
                }

                const agentApiBat = "C:\\Users\\DELL\\.gemini\\antigravity\\bin\\agentapi.bat";
                const promptContent = `Please search the web for the real-world match result of match ID: ${matchId} and update the app.`;

                execFile(agentApiBat, ['send-message', conversationId, promptContent], (error, stdout, stderr) => {
                  if (error) {
                    console.error(`exec error: ${error}`);
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: error.message }));
                    return;
                  }
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: true }));
                });
              } catch (err) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: err.message }));
              }
            });
          } else if (req.method === 'POST' && req.url === '/api/save-team-strengths') {
            let body = '';
            req.on('data', chunk => {
              body += chunk.toString();
            });
            req.on('end', () => {
              try {
                const {
                  teamId,
                  teamName,
                  fifaRanking,
                  fifaScore,
                  marketValue,
                  squadScore,
                  continentalScore,
                  historyScore,
                  worldCupRecentScore
                } = JSON.parse(body);

                const findTeamKey = (id, name, obj) => {
                  const keys = Object.keys(obj);
                  const normalize = (str) => {
                    if (!str) return '';
                    return str.toLowerCase()
                      .normalize("NFD")
                      .replace(/[\u0300-\u036f]/g, "")
                      .replace(/[^a-z0-9]/g, "")
                      .trim();
                  };
                  const normId = normalize(id);
                  const normName = normalize(name);
                  const specialMappings = {
                    'usa': 'unitedstates',
                    'drcongo': 'drcongo',
                    'bosniaandherzegovina': 'bosniaandherzegovina',
                    'capeverde': 'capeverde',
                    'curacao': 'curacao',
                    'saudiarabia': 'saudiarabia',
                    'southafrica': 'southafrica',
                    'southkorea': 'southkorea',
                    'turkiye': 'turkiye',
                  };
                  return keys.find(key => {
                    const normKey = normalize(key);
                    if (normKey === normId || normKey === normName) return true;
                    if (specialMappings[normId] && normKey === specialMappings[normId]) return true;
                    if (specialMappings[normName] && normKey === specialMappings[normName]) return true;
                    return false;
                  }) || name;
                };

                // Update fifa_ranking.json
                const fifaPath = path.resolve(__dirname, 'src/data/fifa_ranking.json');
                const fifaData = JSON.parse(fs.readFileSync(fifaPath, 'utf8'));
                const fifaKey = findTeamKey(teamId, teamName, fifaData);
                if (!fifaData[fifaKey]) fifaData[fifaKey] = {};
                if (fifaRanking !== undefined) fifaData[fifaKey].rank = Number(fifaRanking);
                if (fifaScore !== undefined) fifaData[fifaKey].fifaScore = Number(fifaScore);
                fs.writeFileSync(fifaPath, JSON.stringify(fifaData, null, 2), 'utf8');

                // Update squad_strength.json
                const squadPath = path.resolve(__dirname, 'src/data/squad_strength.json');
                const squadData = JSON.parse(fs.readFileSync(squadPath, 'utf8'));
                const squadKey = findTeamKey(teamId, teamName, squadData);
                if (!squadData[squadKey]) squadData[squadKey] = {};
                if (marketValue !== undefined) squadData[squadKey].marketValue = Number(marketValue);
                if (squadScore !== undefined) squadData[squadKey].squadScore = Number(squadScore);
                fs.writeFileSync(squadPath, JSON.stringify(squadData, null, 2), 'utf8');

                // Update continental_performance.json
                const continentalPath = path.resolve(__dirname, 'src/data/continental_performance.json');
                const continentalData = JSON.parse(fs.readFileSync(continentalPath, 'utf8'));
                const continentalKey = findTeamKey(teamId, teamName, continentalData);
                if (!continentalData[continentalKey]) continentalData[continentalKey] = {};
                if (continentalScore !== undefined) continentalData[continentalKey].continentalScore = Number(continentalScore);
                fs.writeFileSync(continentalPath, JSON.stringify(continentalData, null, 2), 'utf8');

                // Update wc_history.json
                const historyPath = path.resolve(__dirname, 'src/data/wc_history.json');
                const historyData = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
                const historyKey = findTeamKey(teamId, teamName, historyData);
                if (!historyData[historyKey]) historyData[historyKey] = {};
                if (historyScore !== undefined) historyData[historyKey].historyScore = Number(historyScore);
                fs.writeFileSync(historyPath, JSON.stringify(historyData, null, 2), 'utf8');

                // Update recent_wc_performance.json
                const recentWcPath = path.resolve(__dirname, 'src/data/recent_wc_performance.json');
                const recentWcData = JSON.parse(fs.readFileSync(recentWcPath, 'utf8'));
                const recentWcKey = findTeamKey(teamId, teamName, recentWcData);
                if (!recentWcData[recentWcKey]) recentWcData[recentWcKey] = {};
                if (worldCupRecentScore !== undefined) recentWcData[recentWcKey].wcRecentScore = Number(worldCupRecentScore);
                fs.writeFileSync(recentWcPath, JSON.stringify(recentWcData, null, 2), 'utf8');

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true }));
              } catch (err) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: err.message }));
              }
            });
          } else if (req.method === 'POST' && req.url === '/api/save-simulation') {
            let body = '';
            req.on('data', chunk => {
              body += chunk.toString();
            });
            req.on('end', () => {
              try {
                const data = JSON.parse(body);
                const dirPath = path.resolve(__dirname, 'simulation_results');
                if (!fs.existsSync(dirPath)) {
                  fs.mkdirSync(dirPath, { recursive: true });
                }
                const files = fs.readdirSync(dirPath);
                let maxSimNum = 0;
                files.forEach(file => {
                  const match = file.match(/^sim_(\d+)\.json$/);
                  if (match) {
                    const num = parseInt(match[1], 10);
                    if (num > maxSimNum) {
                      maxSimNum = num;
                    }
                  }
                });
                const nextSimNum = maxSimNum + 1;
                const enrichedData = {
                  title: `sim ${nextSimNum}`,
                  simulation_number: nextSimNum,
                  results: data
                };
                const filename = `sim_${nextSimNum}.json`;
                const filePath = path.resolve(dirPath, filename);
                fs.writeFileSync(filePath, JSON.stringify(enrichedData, null, 2), 'utf8');

                // Regenerate prediction_percentages.json based on all simulation files
                try {
                  const simFiles = fs.readdirSync(dirPath).filter(f => f.match(/^sim_(\d+)\.json$/));
                  const totalSims = simFiles.length;
                  if (totalSims > 0) {
                    const matchAggregates = {};
                    const progressionCounts = {};

                    const squadsPath = path.resolve(__dirname, 'src/data/current_squads.json');
                    let teamIdToName = {};
                    if (fs.existsSync(squadsPath)) {
                      const squadsData = JSON.parse(fs.readFileSync(squadsPath, 'utf8'));
                      squadsData.forEach(t => {
                        teamIdToName[t.id] = t.name;
                      });
                    }

                    const ensureTeamInitialized = (name) => {
                      if (!name) return;
                      if (!progressionCounts[name]) {
                        progressionCounts[name] = {
                          roundOf32: 0,
                          roundOf16: 0,
                          quarterFinal: 0,
                          semiFinal: 0,
                          final: 0,
                          champion: 0
                        };
                      }
                    };

                    simFiles.forEach(file => {
                      try {
                        const sFilePath = path.resolve(dirPath, file);
                        const simContent = JSON.parse(fs.readFileSync(sFilePath, 'utf8'));
                        const results = simContent.results || {};

                        // 1. Group Stage
                        if (results.groupMatches) {
                          results.groupMatches.forEach(m => {
                            const homeId = m.homeTeam;
                            const awayId = m.awayTeam;
                            const homeName = teamIdToName[homeId] || homeId;
                            const awayName = teamIdToName[awayId] || awayId;

                            const sorted = [homeName, awayName].sort();
                            const team1 = sorted[0];
                            const team2 = sorted[1];
                            const key = `${team1.replace(/\s+/g, '_')}_vs_${team2.replace(/\s+/g, '_')}`;

                            if (!matchAggregates[key]) {
                              matchAggregates[key] = {
                                homeTeam: team1,
                                awayTeam: team2,
                                homeWins: 0,
                                draws: 0,
                                awayWins: 0
                              };
                            }

                            const homeScore = m.homeScore;
                            const awayScore = m.awayScore;

                            if (homeName === team1) {
                              if (homeScore > awayScore) {
                                matchAggregates[key].homeWins++;
                              } else if (homeScore < awayScore) {
                                matchAggregates[key].awayWins++;
                              } else {
                                matchAggregates[key].draws++;
                              }
                            } else {
                              if (homeScore < awayScore) {
                                matchAggregates[key].homeWins++;
                              } else if (homeScore > awayScore) {
                                matchAggregates[key].awayWins++;
                              } else {
                                matchAggregates[key].draws++;
                              }
                            }
                          });
                        }

                        // Knockout Match Processor
                        const processKnockoutMatch = (m) => {
                          if (!m || !m.t1 || !m.t2) return;
                          const name1 = m.t1.name;
                          const name2 = m.t2.name;

                          const sorted = [name1, name2].sort();
                          const team1 = sorted[0];
                          const team2 = sorted[1];
                          const key = `${team1.replace(/\s+/g, '_')}_vs_${team2.replace(/\s+/g, '_')}`;

                          if (!matchAggregates[key]) {
                            matchAggregates[key] = {
                              homeTeam: team1,
                              awayTeam: team2,
                              homeWins: 0,
                              draws: 0,
                              awayWins: 0
                            };
                          }

                          const winnerName = m.winner?.name;
                          if (winnerName === team1) {
                            matchAggregates[key].homeWins++;
                          } else if (winnerName === team2) {
                            matchAggregates[key].awayWins++;
                          } else {
                            matchAggregates[key].draws++;
                          }
                        };

                        // 2. Knockouts
                        if (results.roundOf32) results.roundOf32.forEach(processKnockoutMatch);
                        if (results.roundOf16) results.roundOf16.forEach(processKnockoutMatch);
                        if (results.quarterFinals) results.quarterFinals.forEach(processKnockoutMatch);
                        if (results.semiFinals) results.semiFinals.forEach(processKnockoutMatch);
                        if (results.final) processKnockoutMatch(results.final);
                        if (results.thirdPlace) processKnockoutMatch(results.thirdPlace);

                        // 3. Progression
                        const r32Teams = new Set();
                        if (results.roundOf32) {
                          results.roundOf32.forEach(m => {
                            if (m.t1?.name) r32Teams.add(m.t1.name);
                            if (m.t2?.name) r32Teams.add(m.t2.name);
                          });
                        }
                        r32Teams.forEach(name => {
                          ensureTeamInitialized(name);
                          progressionCounts[name].roundOf32++;
                        });

                        const r16Teams = new Set();
                        if (results.roundOf16) {
                          results.roundOf16.forEach(m => {
                            if (m.t1?.name) r16Teams.add(m.t1.name);
                            if (m.t2?.name) r16Teams.add(m.t2.name);
                          });
                        }
                        r16Teams.forEach(name => {
                          ensureTeamInitialized(name);
                          progressionCounts[name].roundOf16++;
                        });

                        const qfTeams = new Set();
                        if (results.quarterFinals) {
                          results.quarterFinals.forEach(m => {
                            if (m.t1?.name) qfTeams.add(m.t1.name);
                            if (m.t2?.name) qfTeams.add(m.t2.name);
                          });
                        }
                        qfTeams.forEach(name => {
                          ensureTeamInitialized(name);
                          progressionCounts[name].quarterFinal++;
                        });

                        const sfTeams = new Set();
                        if (results.semiFinals) {
                          results.semiFinals.forEach(m => {
                            if (m.t1?.name) sfTeams.add(m.t1.name);
                            if (m.t2?.name) sfTeams.add(m.t2.name);
                          });
                        }
                        sfTeams.forEach(name => {
                          ensureTeamInitialized(name);
                          progressionCounts[name].semiFinal++;
                        });

                        const finalTeams = new Set();
                        if (results.final) {
                          if (results.final.t1?.name) finalTeams.add(results.final.t1.name);
                          if (results.final.t2?.name) finalTeams.add(results.final.t2.name);
                        }
                        finalTeams.forEach(name => {
                          ensureTeamInitialized(name);
                          progressionCounts[name].final++;
                        });

                        if (results.winner?.name) {
                          ensureTeamInitialized(results.winner.name);
                          progressionCounts[results.winner.name].champion++;
                        }
                      } catch (e) {
                        console.error('Error processing sim file:', file, e);
                      }
                    });

                    const predictions = {};
                    Object.entries(matchAggregates).forEach(([key, agg]) => {
                      predictions[key] = {
                        homeTeam: agg.homeTeam,
                        awayTeam: agg.awayTeam,
                        homeWinPercentage: Math.round((agg.homeWins / totalSims) * 100),
                        drawPercentage: Math.round((agg.draws / totalSims) * 100),
                        awayWinPercentage: Math.round((agg.awayWins / totalSims) * 100),
                        homeWins: agg.homeWins,
                        draws: agg.draws,
                        awayWins: agg.awayWins
                      };
                    });

                    const progression = {};
                    Object.entries(progressionCounts).forEach(([name, counts]) => {
                      progression[name] = {
                        roundOf32: Math.round((counts.roundOf32 / totalSims) * 100),
                        roundOf16: Math.round((counts.roundOf16 / totalSims) * 100),
                        quarterFinal: Math.round((counts.quarterFinal / totalSims) * 100),
                        semiFinal: Math.round((counts.semiFinal / totalSims) * 100),
                        final: Math.round((counts.final / totalSims) * 100),
                        champion: Math.round((counts.champion / totalSims) * 100)
                      };
                    });

                    const outputData = {
                      generatedAt: new Date().toISOString(),
                      totalSimulations: totalSims,
                      predictions,
                      progression
                    };

                    const outputPath = path.resolve(__dirname, 'src/data/prediction_percentages.json');
                    fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf8');
                  }
                } catch (e) {
                  console.error('Failed to update prediction percentages:', e);
                }

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, filename, simulation: `sim ${nextSimNum}` }));
              } catch (err) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: err.message }));
              }
            });
          } else {
            next();
          }
        });
      }
    }
  ]
})
