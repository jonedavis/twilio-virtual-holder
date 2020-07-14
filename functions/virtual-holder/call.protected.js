/**
 * Virtual Holder
 * Outbound dial a number and have it sit on the line until someone answers the call.
 *
 * call.protected.js
 * Kickoff point to application.
 * The application checks who is calling.
 * If the inbound caller is you, you are prompted to input a number to dial.
 * If the inbound caller in not you, that call is directed to your personal phone number.
 */
exports.handler = async function (context, event, callback) {
  const twiml = new Twilio.twiml.VoiceResponse();

  // Someone is calling you. Connect that person to your personal number.
  if (event.From !== context.VIRTUAL_HOLDER_YOUR_PHONE_NUMBER) {
    twiml.dial(context.VIRTUAL_HOLDER_YOUR_PHONE_NUMBER);
    callback(null, twiml);
  }

  // Prompt to <Gather> the number for outbound call.
  const gather = twiml.gather({
    timeout: 30,
    finishOnKey: '#',
    action: '/virtual-holder/conference',
  });

  gather.say(
    `Enter the number you would like to call. Press the # when you're done.`
  );

  callback(null, twiml);
};
