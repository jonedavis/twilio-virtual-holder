/**
 * Virtual Holder
 * Outbound dial a number and have it sit on the line until someone answers the call.
 *
 * sms.protected.js
 * This project does not handle inbound SMS messages.
 * Learn how to forward and respond to SMS messages at
 * https://www.twilio.com/blog/sms-forwarding-and-responding-using-twilio-and-javascript
 */
exports.handler = function (context, event, callback) {
  const twiml = new Twilio.twiml.MessagingResponse();
  twiml.message('This number does not accept text messages at this time.');

  callback(null, twiml);
};
