const express = require('express');
const messageController = require('../controllers/message.controller');
const router = express.Router();
const upload = require('../middlewares/upload.middleware');

// POST /api/messages/text
router.post('/text', messageController.createMessageText);

// POST /api/messages/file
router.post('/file', upload.uploadd, messageController.createMessageFile);

// POST /api/messages/image
router.post('/image', upload.uploadd, messageController.createMessageImage);

// POST /api/messages/text/reply
router.post('/text/reply',  messageController.createMessageTextReply);

// POST /api/messages/file/reply
router.post('/file/reply', upload.uploadd, messageController.createMessageFileReply);

// POST /api/messages/image/reply

router.post('/image/reply', upload.uploadd, messageController.createMessageImageReply);

// POST /api/messages/pinned
router.post('/pinned', messageController.createdMessagePinned);

// POST /api/messages/unpin/:messageID
router.post('/unpin/:messageID', messageController.unPinMessage);

// GET /api/messages/:chatID
router.get('/:chatID', messageController.getMessagesByChatID);

// PUT /api/messages/:messageID/status
router.put('/:messageID/status', messageController.updateMessageStatus);

// GET /api/messages/last/:chatID
router.get('/last/:chatID', messageController.getLastMessageByChatID);

// GET /api/messages/images/:chatID
router.get('/images/:chatID', messageController.getAllImageMessagesByChatID);

// GET /api/messages/files/:chatID
router.get('/files/:chatID', messageController.getAllFileMessagesByChatID);

// GET /api/messages/links/:chatID
router.get('/links/:chatID', messageController.getAllLinkMessagesByChatID);

// GET /api/messages/search/:chatID?keyword=...
router.get('/search/:chatID', messageController.searchMessagesInChat);

// DELETE /api/messages/:messageID
router.delete('/:messageID', messageController.deleteMessageByID);

// GET /api/messages/pinned/:chatID
router.get('/pinned/:chatID', messageController.getPinnedMessagesInChat);

// PUT /api/messages/lastread/:chatID
router.put('/lastread/:chatID', messageController.updateLastReadAt);

// GET /api/messages/faqSections
router.get('/sections/faqSections', messageController.getSections);

// POST /api/messages/faqAsk
router.post('/faqAsk', messageController.createMessageChatAI);

module.exports = router;