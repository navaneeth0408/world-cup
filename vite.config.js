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
          } else {
            next();
          }
        });
      }
    }
  ]
})
