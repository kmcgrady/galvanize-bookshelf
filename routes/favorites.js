/* eslint-disable camelcase */

'use strict';

const boom = require('boom');
const express = require('express');
const jwt = require('jsonwebtoken');
const knex = require('../knex');
const { camelizeKeys, decamelizeKeys } = require('humps');

const ev = require('express-validation');
const validations = require('../validations/favorites');

// eslint-disable-next-line new-cap
const router = express.Router();

const authorize = function(req, res, next) {
  jwt.verify(req.cookies.token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return next(boom.create(401, 'Unauthorized'));
    }

    req.token = decoded;

    next();
  });
};

router.get('/favorites/check', authorize, (req, res, next) => {
  knex('favorites')
    .where('book_id', req.query.bookId)
    .then((favorites) => res.send(favorites.length > 0))
    .catch((err) => next(err));
});

router.get('/favorites', authorize, (req, res, next) => {
  const { userId } = req.token;

  knex('favorites')
    .innerJoin('books', 'books.id', 'favorites.book_id')
    .where('favorites.user_id', userId)
    .orderBy('books.title', 'ASC')
    .then((rows) => {
      const favorites = camelizeKeys(rows);

      res.send(favorites);
    })
    .catch((err) => {
      next(err);
    });
});

router.post('/favorites', authorize, ev(validations.post), (req, res, next) => {
  const { userId } = req.token;
  const { bookId } = req.body;

  // if (!userId) {
  //   return next(boom.create(400, ''));
  // }
  //
  // if (!bookId) {
  //   return next(boom.create(400, ''));
  // }

  const insertFavorite = { userId, bookId };

  knex('favorites')
    .insert(decamelizeKeys(insertFavorite), '*')
    .then((rows) => {
      const favorite = camelizeKeys(rows[0]);

      res.send(favorite);
    })
  .catch((err) => {
    next(err);
  });
});

router.delete('/favorites', authorize, (req, res, next) => {
  const { userId } = req.token;
  const { bookId } = req.body;

  let favorite;

  if (isNaN(bookId)) {
    return next(boom.create(400, 'Book ID must be an Integer'));
  }

  knex('favorites')
    .where({ book_id: bookId, user_id: userId })
    .first()
    .then((row) => {
      if (!row) {
        throw boom.create(404, 'Favorite not found');
      }

      favorite = camelizeKeys(row);

      return knex('favorites')
        .del()
        .where({ book_id: bookId, user_id: userId });
    })
    .then(() => {
      delete favorite.id;
      res.send(favorite);
    })
    .catch((err) => {
      next(err);
    });
});

module.exports = router;
