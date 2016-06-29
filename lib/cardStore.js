import fs from 'fs';

let CardStore = {
  cards: {},
  initialize: function() {
    CardStore.cards = loadCards();
  }
}

function loadCards() {
  let file = fs.readFileSync('./cards.json');
  return JSON.parse(file.toString());
}

export default CardStore;
