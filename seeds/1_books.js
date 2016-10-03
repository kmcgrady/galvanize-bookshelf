'use strict';

exports.seed = function(knex) {
  return knex('books').del()
    .then(() => {
      return knex('books').insert([{
        id: 1,
        title: 'Here Comes the Sun',
        artist: 'The Beatles',
        created_at: new Date('2016-06-29 14:26:16 UTC'),
        updated_at: new Date('2016-06-29 14:26:16 UTC')
      }]);
    })
    .then(() => {
      return knex.raw(
        "SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));"
      );
    });
};
