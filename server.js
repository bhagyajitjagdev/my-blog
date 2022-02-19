const http = require('http');
const app = require('./app');

const port = process.env.PORT || 4000;
app.set('port', port);

const server = http.createServer(app);

server.listen(port, () => {
  console.log(`Server Started On Port:- http://localhost:${port} in ${process.env.NODE_ENV} mode`);
});
