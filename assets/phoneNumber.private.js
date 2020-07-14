/**
 * Convert the user's input into an object that we can use to run a
 * few convenience methods on such as valid input and allowing for a
 * better text to speech output.
 */
const AwesomePhoneNumber = require('awesome-phonenumber');

module.exports = class PhoneNumber {
  constructor(number = '') {
    this._number = '';
    this._pn = new AwesomePhoneNumber('');
    this.number = number;
  }

  set number(number) {
    if (!number.startsWith('+')) {
      number = `+${number}`;
    }

    if (!AwesomePhoneNumber(number).isValid()) {
      throw new Error('Invalid phone number');
    }

    this._number = number;
    this._pn = new AwesomePhoneNumber(this._number);
  }

  get number() {
    return this._pn.getNumber();
  }

  get numberToSpeech() {
    return this.number.split('').join(' ');
  }

  get isValid() {
    return this._pn.isValid();
  }
};
