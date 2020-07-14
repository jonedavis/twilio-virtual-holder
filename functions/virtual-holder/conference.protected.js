/**
 * Virtual Holder
 * Outbound dial a number and have it sit on the line until someone answers the call.
 *
 * conference.protected.js
 * Create Conference room and join participants to call.
 */

/**
 * Parse input from /call (call.protected.js).
 * Input requires valid country code.
 * @param {Context} context Context passed from Serverless handler.
 * @param {string} digits numbers entered in keypad up to #.
 * @return {VoiceResponse} The valid Conference room TwiML the users will sit in.
 */
function parseInput(context, digits) {
  const PhoneNumber = require(Runtime.getAssets()['/phoneNumber.js'].path);
  let twiml = new Twilio.twiml.VoiceResponse();

  try {
    // Create a valid number out of input.
    const pn = new PhoneNumber(digits);

    // Create Conference room.
    twiml = createConferenceRoom(context, pn);

    return twiml;
  } catch {
    twiml.say(`You've entered an invalid number. Please try again.`);
    twiml.redirect('/virtual-holder/call');

    return twiml;
  }
}

/**
 * Create Conference room for participants.
 * Participant 1 is the App Owner
 * Participant 2 is the number that the App Owner is calling.
 * @param {Context} context Context passed from Serverless handler.
 * @param {PhoneNumber} pn Phone number object created from keypad input.
 * @return {VoiceResponse} The valid Conference room Twiml the users will sit in.
 */
function createConferenceRoom(context, pn) {
  const twiml = new Twilio.twiml.VoiceResponse();

  twiml.say(`
    Calling ${pn.numberToSpeech}.
    You can hang up when you hear the music, or you can stay on the line.
  `);

  twiml
    .dial({
      hangupOnStar: true,
      action: '/virtual-holder/conference?callback=dial',
    })
    .conference(
      {
        startConferenceOnEnter: true,
        endConferenceOnExit: false,
        maxParticipants: 2,
        statusCallback: `/virtual-holder/conference?callback=join&to=${pn.number}`,
        statusCallbackEvent: 'join',
      },
      context.VIRTUAL_HOLDER_CONFERENCE_NAME
    );

  return twiml;
}

/**
 * Call the number Participant 1 entered into phone keypad.
 * @param {Context} context Context passed from Serverless handler.
 * @param {string} number Phone number passed into callback query string.
 */
async function createOutboundCall(context, number) {
  try {
    const client = context.getTwilioClient();
    const path = `https://${context.DOMAIN_NAME}${context.PATH}`;

    // Outbound dial the number the user entered.
    await client.calls.create({
      url: `${path}?callback=dial`,
      to: number,
      from: context.VIRTUAL_HOLDER_PHONE_NUMBER,
    });
  } catch (e) {
    console.log('Error on creating outbound call to participant.', e);
  }
}

/**
 * Create a loop using <Gather> that says 'Press any key top call back {App Owner's Name}
 * Pressing any key will then move to the <Dial> verb
 * @param {Context} context Context passed from Serverless handler.
 * @return {VoiceResponse} TwiML <Gather> and <Dial> to callback App Owner
 */
function promptParticipantToCallAppOwner(context) {
  const twiml = new Twilio.twiml.VoiceResponse();
  const gather = twiml.gather({
    action: '/virtual-holder/conference?callback=outbound-dial',
    numDigits: 1,
    timeout: 1800, // 30 minutes
  });

  gather.say(
    `Press any key to call back ${context.VIRTUAL_HOLDER_YOUR_NAME}.`,
    {
      loop: 900, // ~30 minutes
    }
  );

  twiml.dial(
    {
      hangupOnStar: true,
      action: '/virtual-holder/conference?callback=outbound-dial',
    },
    context.VIRTUAL_HOLDER_PHONE_NUMBER
  );

  return twiml;
}

/**
 * Retrieve the participants in the Conference
 * @param {Context} context Context passed from Serverless handler.
 * @param {string} sid Conference Sid
 * @return {[Participants]} The participants in the Conference.
 */
async function getParticipants(context, sid) {
  try {
    const client = context.getTwilioClient();
    const participants = await client.conferences(sid).participants.list();

    return participants;
  } catch (e) {
    console.log('Error fetching participants.', e);
  }
}

/**
 * Callback Participant 1 (App Owner) if they have hung up since call started.
 * @param {Context} context Context passed from Serverless handler.
 */
async function callbackParticipant(context) {
  try {
    const client = context.getTwilioClient();
    const path = `https://${context.DOMAIN_NAME}${context.PATH}`;

    await client.calls.create({
      url: `${path}?callback=dial-conference`,
      to: context.VIRTUAL_HOLDER_YOUR_PHONE_NUMBER,
      from: context.VIRTUAL_HOLDER_PHONE_NUMBER,
    });
  } catch (e) {
    console.log('Error when calling participant.', e);
  }
}

/*
 * Main function to handle flow of application.
 */
exports.handler = async function (context, event, callback) {
  // The phone number was gathered. Handle the input.
  if (!event.callback) {
    const twiml = parseInput(context, event.Digits);

    return callback(null, twiml);
  }

  // A participant has joined the Conference
  if (event.callback === 'join') {
    // Prevent from attempting to call the same participant twice.
    if (event.SequenceNumber === '1' && event.to) {
      await createOutboundCall(context, event.to);

      return callback();
    }

    // Participant 2 has joined the call.
    // Check if Participant 1 (App Owner) is in call.
    const participants = await getParticipants(context, event.ConferenceSid);
    if (participants.length === 1) {
      // Outbound dial to bring into Conference.
      await callbackParticipant(context);
    }

    return callback();
  }

  // Return TwiML that <Say>s "Press any key to call {name} back."
  if (event.callback === 'dial') {
    const twiml = promptParticipantToCallAppOwner(context);

    return callback(null, twiml);
  }

  // Participant 2 opted to call the user back.
  if (event.callback === 'outbound-dial') {
    const twiml = new Twilio.twiml.VoiceResponse();

    twiml.say(`Calling ${context.VIRTUAL_HOLDER_YOUR_NAME}`);
    twiml.dial().conference(
      {
        statusCallback: `/virtual-holder/conference?callback=join`,
        statusCallbackEvent: 'join',
      },
      context.VIRTUAL_HOLDER_CONFERENCE_NAME
    );

    return callback(null, twiml);
  }

  // Bring Participant 1 (App Owner) into the Conference.
  if (event.callback === 'dial-conference') {
    // End Conference if Participant 1 hangs up.
    const twiml = new Twilio.twiml.VoiceResponse();
    twiml
      .dial()
      .conference(
        { endConferenceOnExit: true },
        context.VIRTUAL_HOLDER_CONFERENCE_NAME
      );

    return callback(null, twiml);
  }

  return callback();
};
