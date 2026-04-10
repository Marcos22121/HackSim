import { defineConfig } from 'vite';
import os from 'os';

export default defineConfig({
  plugins: [
    {
      name: 'get-username',
      configureServer(server) {
        server.middlewares.use('/api/username', (req, res) => {
          const username = os.userInfo().username || process.env.USERNAME || process.env.USER || 'BlueCode_Hacker';
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ username }));
        });
      }
    }
  ]
});
