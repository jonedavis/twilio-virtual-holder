# Twilio Virtual Holder

Tired of waiting on the phone for someone that immediately places you on hold? Use this application to hold your spot in line, and prompt that person to call you back when they answer the call. This application works for simple phone trees, and will timeout if no one chooses to call you back within 30 minutes.

### How it works

1. Dial the `VIRTUAL_HOLDER_PHONE_NUMBER` you've provisioned.
2. Enter the phone number you would like to call at the prompt.
3. Hang up or stay on the line once you hear the Conference room music.
4. The person on the other end of the call will be brought into the Conference room.
5. You will receive a callback if you hung up the phone since you were placed on hold.

The application will make an outbound call to that phone number, attempting to bring them into the <Conference> room. When the person on the other end of the call answers, a <Gather> will play for ~30 minutes. The <Gather> says, "Press any key to call `{Your Name}`." Once that person presses any key, they will be brought into the <Conference> room. You will receive a call back from your `VIRTUAL_HOLDER_PHONE_NUMBER` if you hung up. Read the post on [SMS forwarding and responding using Twilio](https://www.twilio.com/blog/sms-forwarding-and-responding-using-twilio-and-javascript) to configure SMS routing.
  
If someone dials your `VIRTUAL_HOLDER_PHONE_NUMBER` it will automatically route to your `VIRTUAL_HOLDER_YOUR_PHONE_NUMBER` that you set in the `.env` file.

**Disclaimer**
Every phone tree or Interactive Voice Response (IVR) is different. This application may not work for complicated phone trees. You may need to modify this application to fit your needs. Did you make improvements? Consider creating a pull request so that others can benefit from your efforts. This application does not forward SMS messages to/from your personal phone number. 

### Environment variables

This project requires some environment variables to be set. To keep your tokens and secrets secure, make sure to not commit the `.env` file in git.

In your `.env` file, set the following values:

| Variable                           | Description                                                                                                                         | Required |
| :--------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------- | :------- |
| `VIRTUAL_HOLDER_PHONE_NUMBER`      | The number you dial to initiate the application. Provision one from [Console](https://www.twilio.com/console/phone-numbers/search). | Yes      |
| `VIRTUAL_HOLDER_CONFERENCE_NAME`   | The name of the Conference room for the application. There is no need to change this.                                               | Yes      |
| `VIRTUAL_HOLDER_YOUR_NAME`         | Your name. The person you're dialing will hear "Press any key to call {VIRTUAL_HOLDER_YOUR_NAME} back."                             | Yes      |
| `VIRTUAL_HOLDER_YOUR_PHONE_NUMBER` | This is your personal phone number.                                                                                                 | Yes      |

## Install the Twilio CLI

1. Install the [Twilio CLI](https://www.twilio.com/docs/twilio-cli/quickstart#install-twilio-cli)
2. Install the [serverless toolkit](https://www.twilio.com/docs/labs/serverless-toolkit/getting-started)

```shell
twilio plugins:install @twilio-labs/plugin-serverless
```

## Set up the application
1. Cone this repository
```shell
git clone https://github.com/jonedavis/twilio-virtual-holder.git
```
2. Run ```npm install```
3. Rename ```.env.example``` to ```.env```
4. Set you variables according to the [environment variables](#environment-variables) section above.

## Deploying

Deploy your functions and assets with either of the following commands. Note: you must run these commands from inside your project folder. [More details in the docs.](https://www.twilio.com/docs/labs/serverless-toolkit)

With the [Twilio CLI](https://www.twilio.com/docs/twilio-cli/quickstart):

```shell
twilio serverless:deploy
```

```shell
twilio phone-numbers:update <VIRTUAL_HOLDER_PHONE_NUMBER> 
--voice-url=https://twilio-virtual-holder-0000-dev.twil.io/call
--sms-url=https://twilio-virtual-holder-0000-dev.twil.io/sms
```

## Using the application
1. Call ```TWILIO_VIRTUAL_HOLDER_PHONE_NUMBER``` 
2. Enter the number you would like to dial.
   * Include the Country Code (e.g. 15555555555)
3. Listen to the prompt for your next set of instructions.
