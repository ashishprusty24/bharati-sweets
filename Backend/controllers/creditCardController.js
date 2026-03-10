const CreditCard = require("../models/CreditCard");

const getAllCards = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const cards = await CreditCard.find();
      resolve(cards);
    } catch (err) {
      reject({ status: 500, message: err.message });
    }
  });
};

const createCard = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      const card = new CreditCard(data);
      const newCard = await card.save();
      resolve(newCard);
    } catch (err) {
      reject({ status: 400, message: err.message });
    }
  });
};

module.exports = { getAllCards, createCard };
