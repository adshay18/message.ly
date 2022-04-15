const Message = require('../models/message');
const ExpressError = require('../expressError');
const User = require('../models/user');
const express = require('express');

const router = new express.Router();
/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get('/:id', async (req, res, next) => {
	try {
		const results = await Message.get(req.params.id);
		const message = results.rows[0];
		if (!message) {
			throw new ExpressError('Message not found', 404);
		}
		const loggedInUsername = req.body.username;
		if (message.from_user.username !== loggedInUsername || message.to_user.username !== loggedInUsername) {
			throw new ExpressError('Access denied, can only access your own messages', 203);
		}
		return res.json({ message });
	} catch (e) {
		return next(e);
	}
});

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post('/', async (req, res, next) => {
	try {
		const results = await Message.create(req.user.username, req.body.to_username, req.body.body);
		const message = results.rows[0];
		return res.json({ message });
	} catch (e) {
		return next;
	}
});

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/
router.post('/:id/read', async (req, res, next) => {
	try {
		const results = await Message.markRead(req.params.id);
		const message = results.rows[0];
		return res.json({ message });
	} catch (e) {
		return next(e);
	}
});

module.exports = router;
