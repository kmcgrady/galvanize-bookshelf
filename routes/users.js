/* eslint-disable max-len */
/* eslint-disable new-cap */
/* eslint-disable max-len*/
'use strict';

const bcrypt = require('bcrypt-as-promised');
const boom = require('boom');
const express = require('express');
const ev = require('express-validation');
const validations = require('../validations/users');
const knex = require('../knex');
const { camelizeKeys, decamelizeKeys } = require('humps');

// eslint-disable-next-line new-cap
const router = express.Router();

router.post('/users', ev(validations.post), (req, res, next) => {
  const { firstName, lastName, email, password } = req.body;

  knex('users')
    .select(knex.raw('1=1'))
    .where('email', email)
    .then((result) => {
      if (result.length > 0) {
        return next(boom.create(400, 'Email already exists'));
      }
      bcrypt.hash(password, 12)
        .then((hashedPassword) => {
          const insertUser = { firstName, lastName, email, hashedPassword };

          return knex('users').insert(decamelizeKeys(insertUser), '*');
        })
        .then((rows) => {
          const user = camelizeKeys(rows[0]);

          delete user.hashedPassword;

          res.send(user);
        })
        .catch((err) => {
          next(err);
        });
    });
});

module.exports = router;
