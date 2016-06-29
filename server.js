import Hapi from 'hapi';
import Inert from 'inert';
import Vision from 'vision';
import Good from 'good';
import HapiAuthCookie from 'hapi-auth-cookie';

import Routes from './lib/routes';
import CardStore from './lib/cardStore';
import UserStore from './lib/userStore';

const server = new Hapi.Server();

CardStore.initialize();
UserStore.initialize();

server.connection({ port: 3000 });

server.register([Inert, Vision], (err) => {
  if (err) {
    throw err;
  }
});

/*server.register({
  register: Good,
  options: {
    opsInterval: 5000,
    reporters: [
      {
        reporter: require('good-file'),
        events: { ops: '*' },
        config: {
          path: './logs',
          prefix: 'hapi-process',
          rotate: 'daily'
        }
      },
      {
        reporter: require('good-file'),
        events: { response: '*' },
        config: {
          path: './logs',
          prefix: 'hapi-requests',
          rotate: 'daily'
        }
      },
      {
        reporter: require('good-file'),
        events: { error: '*' },
        config: {
          path: './logs',
          prefix: 'hapi-error',
          rotate: 'daily'
        }
      }
    ]
  },
}, (err) => { if (err) { throw err } });*/

server.register(HapiAuthCookie, (err) => {
  if (err) {
    console.log(err)
  }

  server.auth.strategy('default', 'cookie', {
    password: 'minimum-32-characters-password1234567890',
    redirectTo: '/login',
    isSecure: false
  });

  server.auth.default('default');
});

server.views({
  engines: {
    html: require('handlebars')
  },
  path: './templates'
});

server.ext('onPreResponse', (request, reply) => {
  if (request.response.isBoom) {
    console.log(request.response)
    return reply.view('error', request.response);
  }
  reply.continue();
});

server.route(Routes);

server.start(() => {
  console.log('Listening on ' + server.info.uri);
});
