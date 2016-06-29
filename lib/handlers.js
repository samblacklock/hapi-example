import Joi from 'joi';
import Boom from 'boom';
import uuid from 'uuid';
import fs from 'fs';

import CardStore from './cardStore';
import UserStore from './userStore';

const cardSchema = Joi.object().keys({
  name: Joi.string().min(3).max(50).required(),
  recipient_email: Joi.string().email().required(),
  sender_name: Joi.string().min(3).max(50).required(),
  sender_email: Joi.string().email().required(),
  card_image: Joi.string().regex(/.+\.(jpg|bmp|png|gif)\b/).required()
});

const loginSchema = Joi.object().keys({
  email: Joi.string().email().required(),
  password: Joi.string().max(32).required()
});

const registerSchema = Joi.object().keys({
  email: Joi.string().email().required(),
  password: Joi.string().max(32).required(),
  name: Joi.string().max(50).required()
});

const Handlers = {
  newCardHandler: (request, reply) => {
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
  },

  cardsHandler: (request, reply) => {
    reply.view('cards', { cards: getCards(request.auth.credentials.email) });
  },

  deleteCardHandler: (request, reply) => {
    delete CardStore[request.params.id];
    reply();
  },

  loginHandler: (request, reply) => {
    Joi.validate(request.payload, loginSchema, (err, val) => {
      if (err) {
        return reply(Boom.unauthorized('Credentials did not validate'))
      }
      UserStore.validateUser(val.email, val.password, (err, user) => {
        if (err) {
          return reply(err);
        }

        request.cookieAuth.set(user);
        reply.redirect('/cards');
      });
    });
  },

  logoutHandler: (request, reply) => {
    request.cookieAuth.clear();
    reply.redirect('/');
  },

  registerHandler: (request, reply) => {
    Joi.validate(request.payload, registerSchema, (err, val) => {
      if (err) {
        return reply(Boom.unauthorized('Credentials did not validate'))
      }
      UserStore.createUser(val.name, val.email, val.password, (err) => {
        if (err) {
          return reply(err);
        }

        reply.redirect('/cards');
      });
    });
  },

  uploadHandler: (request, reply) => {
    let image = request.payload.upload_image;

    if (image.bytes) {
      fs.link(image.path, 'public/images/cards/' + image.filename, () => {
        fs.unlink(image.path);
      })
    };

    reply.redirect('/cards');
  }
}

function getCards(email) {
  let cards = [];
  for (var key in CardStore.cards) {
    if(CardStore.cards[key].sender_email === email) {
      cards.push(CardStore.cards[key])
    }
  }

  return cards;
}

function saveCard(card) {
  let id = uuid.v1();
  card.id = id;
  CardStore.cards[id] = card;
}

function map_images() {
  return fs.readdirSync('./public/images/cards');
}

export default Handlers;
