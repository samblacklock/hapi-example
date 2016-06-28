import Hapi from 'hapi';
import Inert from 'inert';
import Vision from 'vision';
import Joi from 'joi';
import Boom from 'boom';
import Good from 'good';

import uuid from 'uuid';
import fs from 'fs';

const server = new Hapi.Server();
const cards = loadCards();

server.connection({ port: 3000 });

server.register([Inert, Vision], (err) => {
  if (err) {
    throw err;
  }
});

server.register({
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
}, (err) => { if (err) { throw err } });

server.views({
  engines: {
    html: require('handlebars')
  },
  path: './templates'
});

server.ext('onPreResponse', (request, reply) => {
  if (request.response.isBoom) {
    return reply.view('error', request.response);
  }
  reply.continue();
});

//Routes

server.route({
  path: '/',
  method: 'GET',
  handler: {
    file: 'templates/index.html'
  }
});

server.route({
  path: '/assets/{path*}',
  method: 'GET',
  handler: {
    directory: {
      path: './public',
      listing: false
    }
  }
});

server.route({
  path: '/cards/new',
  method: ['GET', 'POST'],
  handler: newCardHandler
});

server.route({
  path: '/cards',
  method: 'GET',
  handler: cardsHandler
});

server.route({
  path: '/cards/{id}',
  method: 'DELETE',
  handler: deleteCardHandler
});

var cardSchema = Joi.object().keys({
  name: Joi.string().min(3).max(50).required(),
  recipient_email: Joi.string().email().required(),
  sender_name: Joi.string().min(3).max(50).required(),
  sender_email: Joi.string().email().required(),
  card_image: Joi.string().regex(/.+\.(jpg|bmp|png|gif)\b/).required()
});


//Handlers

function newCardHandler(request, reply) {
  if (request.method === 'get') {
    reply.view('new', { card_images: map_images() });
  } else {
    Joi.validate(request.payload, cardSchema, (err, val) => {
      if (err) {
        return reply(Boom.badRequest(err.details[0].message));
      }
      const card = {
        name: val.name,
        recipient_email: val.recipient_email,
        sender_name: val.sender_name,
        sender_email: val.sender_email,
        card_image: val.card_image
      };

      saveCard(card);
      reply.redirect('/cards');
    });
  }
};

function cardsHandler(request, reply) {
  reply.view('cards', { cards: cards });
}

function saveCard(card) {
  const id = uuid.v1();
  card.id = id;
  cards[id] = card;
}

function deleteCardHandler(request, reply) {
  delete cards[request.params.id];
  reply();
}

function loadCards() {
  let file = fs.readFileSync('./cards.json');
  return JSON.parse(file.toString());
}

function map_images() {
  return fs.readdirSync('./public/images/cards');
}



server.start(() => {
  console.log('Listening on ' + server.info.uri);
});
