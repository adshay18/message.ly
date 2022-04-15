const express = require('express');
const router = new express.Router();
const ExpressError = require('../expressError');
const db = require('../db');
const { BCRYPT_WORK_FACTOR, SECRET_KEY } = require('../config');
const jwt = require('jsonwebtoken');

const User = require('../models/user');

/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/

router.post('/login', async (req, res, next) => {
	try {
		const { username, password } = req.body;
		if (!username || !password) {
			throw new ExpressError('Username and password required', 400);
		}
		const results = await db.query(
			`SELECT username, password
            FROM users
            WHERE username = $1`,
			[ username ]
		);
		const user = results.rows[0];
		if (user) {
			if (User.authenticate(username, password)) {
				User.updateLoginTimestamp(user.username);
				const token = jwt.sign({ username }, SECRET_KEY);
				return res.json({ token });
			} else {
				throw new ExpressError('Incorrect password, plesae try again', 400);
			}
		}
		throw new ExpressError('Username not found', 400);
	} catch (e) {
		return next(e);
	}
});

/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */

router.post('/register', async (req, res, next) => {
	try {
		const { username, password, first_name, last_name, phone } = req.body;
		if (!username || !password) {
			throw new ExpressError('Username and password required.', 400);
		}
		if (!first_name || !last_name) {
			throw new ExpressError('First and last name required.', 400);
		}
		if (!phone) {
			throw new ExpressError('Phone number required.', 400);
		}
		User.register({ username, password, first_name, last_name, phone });
		let token = jwt.sign({ username }, SECRET_KEY);
		User.updateLoginTimestamp(username);
		return res.json({ token });
	} catch (e) {
		return next(e);
	}
});

module.exports = router;
