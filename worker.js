// �1�2�1�2�1�9�1�0 �1�9�1�0�1�9�1�2 �1�2�1�8�1�5�1�9�1�9�1�9
const TELEGRAM_TOKEN = 'Token bot';
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/`;

// �1�0�1�9�1�9 �1�9�1�9�1�9�1�0�1�9�1�4 �1�9�1�0�1�9�1�2
const BOT_USERNAME = 'Username bot';

// �1�9�1�9�1�0 �1�7�1�0�1�2�1�9 �1�9�1�7�1�9�1�4�1�0
const ADMIN_PASSWORD = 'pass';
let ADMIN_IDS = [];

// �1�6�1�4�1�9�1�9�6�8�1�1�1�9�1�4 �1�9�1�0�1�9�1�2
const MESSAGES = {
  welcome: "�9�9 �1�0�1�1 �1�9�1�0�1�9�1�2 �1�7�1�9�1�9�1�1 �1�2�1�4�1�2�1�1�6�8�1�9�1�4 �1�6�1�2�1�2 �1�4�1�9�1�7�1�4�1�7! �9�9\n\n�1�0�1�9 �1�9�1�4�1�0 �1�9�1�0�1�9�1�2 �1�9�1�4�6�8�1�2�1�2�1�9�1�0�1�4�1�7 �1�6�1�4�1�9�1�9�6�8�1�1�1�9�1�4 �1�0�1�4�1�0�1�9 �1�0�1�9 �1�7�1�9�1�9�1�1�6�8�1�1�1�9�1�4 �1�2�1�4�1�2�1�1�6�8�1�9�1�4 �1�9�1�4�1�4�1�9�1�7 �1�9�1�0�1�4�1�7.\n�9�5 �1�8�1�5�1�5�1�9�1�5 �1�4�1�9 �1�2�1�3�1�2�1�4�1�9 �1�9�1�9�1�1�1�9�1�8 �1�9�1�0�1�4�1�7 �1�4�1�9 /skip �1�9�1�9 �1�0�1�5�1�9�1�1�1�2�1�4�1�7.",
  help: "�9�3 �1�9�1�9�1�1�1�0�1�9�1�9�1�4 �1�9�1�0�1�9�1�2:\n/start - �1�2�1�9�1�2�1�7\n/skip - �1�9�1�7 �1�9�1�9�1�7�1�0\n/preview - �1�6�1�4�1�2�6�8�1�0�1�9�1�9�1�4�1�2 �1�2 �1�9�1�9�1�1�1�9�1�8\n/settarget - �1�2�1�0�1�6�1�4�1�9 �1�9�1�6�1�3�1�7 �1�6�1�4�1�2�6�8�1�5�1�9�1�4\n/help - �1�9�1�9�1�1�1�0�1�9�1�9\n/cancel - �1�8�1�8�1�2",
  admin_help: "�9�6 �1�6�1�0�1�8 �1�9�1�7�1�9�1�4�1�0:\n�9�7 �1�9�1�2�1�9�1�1�1�7�1�1 �1�6�1�4�1�9�1�9�6�8�1�1�1�9\n�9�6 �1�4�1�9�1�9�1�9\n�9�5 �1�9�1�9�1�9�1�0�1�9�1�9�1�0\n�7�4 �1�6�1�9�1�2�1�4",
};

// �1�2�1�7�1�9�1�4�1�5 �1�2�1�4�1�7�1�4�1�2�6�8�1�1�1�9
const State = Object.freeze({
  IDLE: 0,
  WAITING_FOR_IMAGE: 1,
  WAITING_FOR_CAPTION: 2,
  WAITING_FOR_BUTTON_LABEL: 3,
  WAITING_FOR_BUTTON_LINK: 4,
  WAITING_FOR_MORE_BUTTONS: 5,
  WAITING_FOR_TARGET: 6,
  WAITING_FOR_CONFIRMATION: 7,
  WAITING_FOR_ADMIN_PASSWORD: 8,
  ADMIN_PANEL: 9,
});

// �1�9�1�7�1�2�1�0�1�9�1�9�1�1�1�0�1�4�1�4 URL �1�0�1�9�1�9�1�4 �1�7�1�9�1�9�1�1�6�8�1�1�1�9
function isValidUrl(url) {
  const regex = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/\S*)?$/;
  if (regex.test(url)) {
    return url.match(/^https?:\/\//) ? url : `https://${url}`;
  }
  return false;
}

// �1�9�1�9�1�1�1�9�1�8 �1�6�1�4�1�9�1�9 �1�0�1�1 �1�2�1�8�1�5�1�9�1�9�1�9 �1�0�1�9 �1�9�1�7�1�4�1�9�1�4�1�2 �1�6�1�5�1�9
async function sendMessage(chatId, text, replyMarkup = null) {
  const payload = {
    chat_id: chatId,
    text: text
  };
  if (replyMarkup) payload.reply_markup = replyMarkup;
  
  const response = await fetch(`${TELEGRAM_API}sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!result.ok) {
    console.error(`Error sending message to ${chatId}: ${result.description}`);
    return handleTelegramError(chatId, new Error(result.description), '�1�9�1�9�1�1�1�9�1�8 �1�6�1�4�1�9�1�9');
  }
  console.log(`Message sent to ${chatId}: ${text}`);
  return result;
}

// �1�9�1�9�1�1�1�9�1�8 �1�2�1�3�1�2�1�4�1�9 �1�0�1�1 �1�2�1�8�1�5�1�9�1�9�1�9 �1�0�1�9 �1�9�1�7�1�4�1�9�1�4�1�2 �1�6�1�5�1�9
async function sendPhoto(chatId, photoFileId, caption = '', replyMarkup = null) {
  const payload = {
    chat_id: chatId,
    photo: photoFileId,
    caption: caption
  };
  if (replyMarkup) payload.reply_markup = replyMarkup;
  
  const response = await fetch(`${TELEGRAM_API}sendPhoto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!result.ok) {
    console.error(`Error sending photo to ${chatId}: ${result.description}`);
    return handleTelegramError(chatId, new Error(result.description), '�1�9�1�9�1�1�1�9�1�8 �1�7�1�9�1�1');
  }
  console.log(`Photo sent to ${chatId} with caption: ${caption}`);
  return result;
}

// �1�9�1�7�1�4�1�9�1�4�1�2 �1�6�1�5�1�9�1�1�1�9�1�4 �1�2�1�8�1�5�1�9�1�9�1�9
async function handleTelegramError(chatId, error, action) {
  console.error(`Telegram error in ${action}: ${error.message}`);
  await sendMessage(chatId, `�7�4 �1�6�1�5�1�9 �1�7�1�9 ${action}: ${error.message}`);
  throw error;
}

// �1�9�1�4�1�4�1�9�1�7 �1�7�1�9�1�9�1�1�6�8�1�1�1�9�1�4 �1�2�1�4�1�2�1�1�6�8�1�9�1�4
function createGlassButtons(buttons) {
  return {
    inline_keyboard: buttons.map(button => [{ text: button.label, url: button.link }]),
  };
}

// �1�8�1�6�1�4�1�9�1�1 �1�2 �1�0�1�9�1�0�1�4�1�9�1�0�1�4 �1�9�1�6�1�3�1�7 �1�6�1�4�1�2�6�8�1�5�1�9�1�4 �1�9�1�9�1�9�1�0�1�9
async function setUserTarget(userId, targetChat) {
  await BOT_DATA.put(`target_${userId}`, JSON.stringify({ target_chat: targetChat }));
  console.log(`Target set for user ${userId}: ${targetChat}`);
}

async function getUserTarget(userId) {
  const target = await BOT_DATA.get(`target_${userId}`);
  return target ? JSON.parse(target).target_chat : null;
}

// �1�8�1�6�1�4�1�9�1�1�6�8�1�1�1�9�1�0�1�4 �1�2 �1�0�1�9�1�0�1�4�1�9�1�0�1�4 �1�7�1�9�1�7�1�1�6�8�1�1�1�9 �1�9�1�0 KV
async function getUserState(userId) {
  const state = await BOT_DATA.get(`state_${userId}`);
  return state ? JSON.parse(state) : { state: State.IDLE, data: { buttons: [], current_button: {} } };
}

async function setUserState(userId, state, data) {
  console.log(`Setting state for user ${userId}: ${state}`);
  await BOT_DATA.put(`state_${userId}`, JSON.stringify({ state, data }));
}

async function saveMessage(uniqueId, data, userId) {
  const uniqueLink = `https://t.me/${BOT_USERNAME}?start=${uniqueId}`;
  const message = { ...data, unique_link: uniqueLink, created_by: userId, timestamp: new Date().toISOString() };
  await BOT_DATA.put(`message_${uniqueId}`, JSON.stringify(message));
  await BOT_DATA.put(`stats_${uniqueLink}`, JSON.stringify({ clicks: 0, last_clicked: new Date().toISOString() }));
  const userMessages = JSON.parse(await BOT_DATA.get(`user_messages_${userId}`) || '[]');
  userMessages.push(uniqueId);
  await BOT_DATA.put(`user_messages_${userId}`, JSON.stringify(userMessages));
}

async function getMessage(uniqueId) {
  const message = await BOT_DATA.get(`message_${uniqueId}`);
  return message ? JSON.parse(message) : null;
}

async function incrementClicks(uniqueLink) {
  const stats = JSON.parse(await BOT_DATA.get(`stats_${uniqueLink}`) || '{"clicks": 0}');
  stats.clicks += 1;
  stats.last_clicked = new Date().toISOString();
  await BOT_DATA.put(`stats_${uniqueLink}`, JSON.stringify(stats));
}

async function updateUserInfo(userId, username, firstName) {
  const user = JSON.parse(await BOT_DATA.get(`user_${userId}`) || '{}');
  user.user_id = userId;
  user.username = username || user.username;
  user.first_name = firstName || user.first_name;
  user.messages_created = (user.messages_created || 0);
  user.last_activity = new Date().toISOString();
  await BOT_DATA.put(`user_${userId}`, JSON.stringify(user));
}

async function incrementUserMessages(userId) {
  const user = JSON.parse(await BOT_DATA.get(`user_${userId}`));
  user.messages_created = (user.messages_created || 0) + 1;
  user.last_activity = new Date().toISOString();
  await BOT_DATA.put(`user_${userId}`, JSON.stringify(user));
}

// �1�1�1�0�1�7�1�8�1�9 �1�9�1�3�1�8�1�4 �1�7�1�9�1�6�1�2�1�9�1�1�1�2�6�8�1�1�1�9
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  console.log("Request received");
  if (request.method !== 'POST') {
    console.log("Method not allowed: ", request.method);
    return new Response('Method not allowed', { status: 405 });
  }

  const update = await request.json();
  console.log("Update received:", JSON.stringify(update));

  // �1�4�1�9 �1�9�1�9�1�7�1�0 �1�9�1�4�1�0�1�9�1�1 �1�4�1�6�1�7�1�4�1�2 �1�9�1�0 �1�4�1�2 �1�6�1�3�1�2�1�3�1�4 �1�0�1�9�1�2�1�1 �1�2 channel_post �1�0�1�0�1�9�1�2�1�1
  if (!update.message || update.channel_post) {
    console.log("Ignoring update: not a private chat message");
    return new Response('Ignoring non-private chat update', { status: 200 });
  }

  const chatId = update.message?.chat?.id;
  const userId = update.message?.from?.id;
  const text = update.message?.text;
  const photo = update.message?.photo;

  console.log("chatId:", chatId, "userId:", userId, "text:", text, "photo:", photo);

  if (!chatId || !userId) {
    console.log("Invalid update: chatId or userId missing");
    return new Response('Invalid update', { status: 400 });
  }

  await updateUserInfo(userId, update.message.from.username, update.message.from.first_name);

  let userState = await getUserState(userId);
  let { state, data } = userState;
  console.log(`User ${userId} current state: ${state}`);

  if (text?.startsWith('/start')) {
    const parts = text.split(' ');
    if (parts.length > 1) {
      const uniqueId = parts[1];
      const message = await getMessage(uniqueId);
      if (message) {
        await incrementClicks(message.unique_link);
        const buttons = createGlassButtons(message.buttons);
        if (message.image_file_id) {
          await sendPhoto(chatId, message.image_file_id, message.caption || '', buttons);
        } else {
          await sendMessage(chatId, message.caption || ' ', buttons);
        }
        return new Response('OK', { status: 200 });
      } else {
        await sendMessage(chatId, '�7�4 �1�6�1�4�1�9�1�9 �1�4�1�9�1�5�1�2 �1�0�1�2�1�7.\n' + MESSAGES.welcome);
      }
    }
    state = State.WAITING_FOR_IMAGE;
    data = { image_file_id: null, caption: null, buttons: [], current_button: {} };
    await setUserState(userId, state, data);
    const targetChat = await getUserTarget(userId);
    if (!targetChat) {
      await sendMessage(chatId, MESSAGES.welcome + '\n\n�7�2�1�5 �1�2�1�9�1�9 �1�1�1�0�1�2�1�0 �1�9�1�6�1�3�1�7 �1�6�1�4�1�2�6�8�1�5�1�9�1�4�1�4 �1�3�1�0�1�2 �1�0�1�9�1�9�1�7�1�4�1�7. �1�8�1�5�1�5�1�9�1�5 �1�0�1�9 /settarget �1�5�1�9�1�2�1�1 �1�4�1�9 �1�9�1�9�1�0�1�9�1�8 �1�6�1�2�1�7 �1�9�1�9 �1�3�1�0�1�2 �1�9�1�0�1�4�1�7.');
    } else {
      await sendMessage(chatId, MESSAGES.welcome + `\n\n�1�9�1�6�1�3�1�7 �1�6�1�4�1�2�6�8�1�5�1�9�1�4 �1�2�1�9�1�9: ${targetChat}`);
    }
  } else if (text === '/skip') {
    if (state === State.WAITING_FOR_IMAGE) {
      state = State.WAITING_FOR_CAPTION;
      await setUserState(userId, state, data);
      await sendMessage(chatId, '�1�2�1�3�1�2�1�4�1�9 �1�9�1�7 �1�2�1�7. �1�8�1�5�1�5�1�9�1�5 �1�9�1�6�1�2�1�0 �1�9�1�9 �1�2�1�9�1�9�1�7 �1�9�1�0�1�4�1�7 �1�4�1�9 /skip �1�0�1�5�1�9�1�1�1�2�1�4�1�7.');
    } else if (state === State.WAITING_FOR_CAPTION) {
      state = State.WAITING_FOR_BUTTON_LABEL;
      await setUserState(userId, state, data);
      await sendMessage(chatId, '�1�9�1�6�1�2�1�0 �1�9�1�7 �1�2�1�7. �1�8�1�5�1�5�1�9�1�5 �1�0�1�9�1�4�1�1�1�0 �1�7�1�9�1�9�1�1 �1�9�1�9 �1�2�1�9�1�9�1�7 �1�9�1�0�1�4�1�7:');
    }
  } else if (text === '/admin') {
    if (ADMIN_IDS.includes(userId)) {
      state = State.ADMIN_PANEL;
      await setUserState(userId, state, data);
      await sendAdminPanel(chatId);
    } else {
      state = State.WAITING_FOR_ADMIN_PASSWORD;
      await setUserState(userId, state, data);
      await sendMessage(chatId, '�1�8�1�5�1�5�1�9�1�5 �1�9�1�9�1�0 �1�7�1�0�1�2�1�9 �1�9�1�7�1�9�1�4�1�0 �1�9�1�9 �1�2�1�9�1�9�1�7 �1�9�1�0�1�4�1�7:');
    }
  } else if (text === '/settarget') {
    state = State.WAITING_FOR_TARGET;
    await setUserState(userId, state, data);
    await sendMessage(chatId, '�1�8�1�5�1�5�1�9�1�5 �1�2�1�0�1�9�1�1�1�1 �1�4�1�9 �1�0�1�9�1�9 �1�9�1�9�1�9�1�0�1�9�1�4 �1�5�1�9�1�2�1�1/�1�9�1�9�1�0�1�9�1�8 �1�9�1�6�1�3�1�7 �1�9�1�9 �1�2�1�9�1�9�1�7 �1�9�1�0�1�4�1�7 (�1�9�1�3�1�8 @channel �1�4�1�9 -123456):');
  } else if (text === '/help') {
    await sendMessage(chatId, MESSAGES.help);
  } else if (text === '/cancel') {
    state = State.IDLE;
    data = {};
    await setUserState(userId, state, data);
    await sendMessage(chatId, '�1�7�1�9�1�8�1�4�1�9�1�2 �1�8�1�8�1�2 �1�2�1�7. �1�0�1�9�1�9�1�4 �1�2�1�9�1�2�1�7 �1�9�1�4�1�7�1�7 /start �1�9�1�9 �1�0�1�5�1�9�1�1�1�2�1�4�1�7.');
  } else if (photo && state === State.WAITING_FOR_IMAGE) {
    data.image_file_id = photo[photo.length - 1].file_id;
    state = State.WAITING_FOR_CAPTION;
    await setUserState(userId, state, data);
    await sendMessage(chatId, '�7�3 �1�2�1�3�1�2�1�4�1�9 �1�7�1�9�1�4�1�9�1�5�1�2 �1�2�1�7. �1�8�1�5�1�5�1�9�1�5 �1�9�1�6�1�2�1�0 �1�9�1�9 �1�2�1�9�1�9�1�7 �1�9�1�0�1�4�1�7 �1�4�1�9 /skip �1�0�1�5�1�9�1�1�1�2�1�4�1�7.');
  } else if (text) {
    console.log(`Processing text input: ${text} in state ${state}`);
    if (state === State.WAITING_FOR_CAPTION) {
      data.caption = text;
      state = State.WAITING_FOR_BUTTON_LABEL;
      await setUserState(userId, state, data);
      await sendMessage(chatId, '�7�3 �1�9�1�6�1�2�1�0 �1�7�1�9�1�4�1�9�1�5�1�2 �1�2�1�7. �1�8�1�5�1�5�1�9�1�5 �1�0�1�9�1�4�1�1�1�0 �1�7�1�9�1�9�1�1 �1�9�1�9 �1�2�1�9�1�9�1�7 �1�9�1�0�1�4�1�7:');
    } else if (state === State.WAITING_FOR_BUTTON_LABEL) {
      data.current_button = { label: text };
      state = State.WAITING_FOR_BUTTON_LINK;
      await setUserState(userId, state, data);
      await sendMessage(chatId, '�7�3 �1�0�1�9�1�4�1�1�1�0 �1�7�1�9�1�4�1�9�1�5�1�2 �1�2�1�7. �1�8�1�5�1�5�1�9�1�5 �1�8�1�4�1�0�1�9 �1�7�1�9�1�9�1�1 �1�9�1�9 �1�2�1�9�1�9�1�7 �1�9�1�0�1�4�1�7:');
    } else if (state === State.WAITING_FOR_BUTTON_LINK) {
      const validUrl = isValidUrl(text);
      if (validUrl) {
        data.current_button.link = validUrl;
        data.buttons.push(data.current_button);
        data.current_button = {};
        state = State.WAITING_FOR_MORE_BUTTONS;
        await setUserState(userId, state, data);
        const markup = {
          keyboard: [['�1�9�1�5�1�0�1�2�1�7�1�0 �1�7�1�9�1�9�1�1 �1�7�1�4�1�5�1�9'], ['/preview']],
          resize_keyboard: true,
          one_time_keyboard: true
        };
        await sendMessage(chatId, `�7�3 �1�7�1�9�1�9�1�1 �1�9�1�4�1�9�1�5�1�1 �1�2�1�7 (${data.buttons.length}). �1�7�1�9�1�9�1�1 �1�7�1�4�1�5�1�9�1�1`, markup);
      } else {
        await sendMessage(chatId, '�7�4 �1�8�1�4�1�0�1�9 �1�0�1�9�1�9�1�7�1�2�1�0�1�9 �1�9�1�1�1�2. �1�8�1�5�1�5�1�9�1�5 �1�8�1�4�1�0�1�9 �1�9�1�7�1�2�1�0�1�9 (�1�9�1�3�1�8 https://...) �1�2�1�9�1�9�1�7 �1�9�1�0�1�4�1�7:');
      }
    } else if (state === State.WAITING_FOR_MORE_BUTTONS) {
      if (text === '�1�9�1�5�1�0�1�2�1�7�1�0 �1�7�1�9�1�9�1�1 �1�7�1�4�1�5�1�9') {
        data.current_button = {};
        state = State.WAITING_FOR_BUTTON_LABEL;
        await setUserState(userId, state, data);
        const markup = { remove_keyboard: true };
        await sendMessage(chatId, '�1�8�1�5�1�5�1�9�1�5 �1�0�1�9�1�4�1�1�1�0 �1�7�1�9�1�9�1�1 �1�4�1�7�1�4�1�7 �1�9�1�9 �1�2�1�9�1�9�1�7 �1�9�1�0�1�4�1�7:', markup);
      } else if (text === '/preview') {
        if (data.buttons.length > 0) {
          const targetChat = await getUserTarget(userId);
          if (targetChat) {
            data.target_chat = targetChat;
            state = State.WAITING_FOR_CONFIRMATION;
            await setUserState(userId, state, data);
            const buttons = createGlassButtons(data.buttons);
            const markup = {
              keyboard: [['�7�3 �1�2�1�9�1�4�1�4�1�7 �1�2 �1�9�1�9�1�1�1�9�1�8'], ['�7�4 �1�9�1�0�1�3�1�9�1�9�1�5']],
              resize_keyboard: true,
              one_time_keyboard: true
            };
            if (data.image_file_id) {
              await sendPhoto(chatId, data.image_file_id, data.caption || '�1�6�1�4�1�2�6�8�1�0�1�9�1�9�1�4�1�2', buttons);
            } else {
              await sendMessage(chatId, data.caption || '�1�6�1�4�1�2�6�8�1�0�1�9�1�9�1�4�1�2', buttons);
            }
            await sendMessage(chatId, `�1�4�1�4�1�9 �1�6�1�4�1�9�1�9 �1�9�1�9 �1�0�1�1 ${targetChat} �1�9�1�9�1�1�1�9�1�8 �1�9�1�0�1�9�1�1`, markup);
          } else {
            state = State.WAITING_FOR_TARGET;
            await setUserState(userId, state, data);
            const buttons = createGlassButtons(data.buttons);
            const markup = { remove_keyboard: true };
            if (data.image_file_id) {
              await sendPhoto(chatId, data.image_file_id, data.caption || '�1�6�1�4�1�2�6�8�1�0�1�9�1�9�1�4�1�2', buttons);
            } else {
              await sendMessage(chatId, data.caption || '�1�6�1�4�1�2�6�8�1�0�1�9�1�9�1�4�1�2', buttons);
            }
            await sendMessage(chatId, '�1�2�1�9�1�9 �1�1�1�0�1�2�1�0 �1�9�1�6�1�3�1�7 �1�6�1�4�1�2�6�8�1�5�1�9�1�4�1�4 �1�3�1�0�1�2 �1�0�1�9�1�9�1�7�1�4�1�7. �1�8�1�5�1�5�1�9�1�5 �1�2�1�0�1�9�1�1�1�1 �1�4�1�9 �1�0�1�9�1�9 �1�9�1�9�1�9�1�0�1�9�1�4 �1�5�1�9�1�2�1�1/�1�9�1�9�1�0�1�9�1�8 �1�9�1�6�1�3�1�7 �1�9�1�9 �1�2�1�9�1�9�1�7 �1�9�1�0�1�4�1�7:', markup);
          }
        } else {
          state = State.WAITING_FOR_BUTTON_LABEL;
          await setUserState(userId, state, data);
          await sendMessage(chatId, '�1�5�1�7�1�9�1�6�1�8 �1�4�1�9 �1�7�1�9�1�9�1�1 �1�8�1�9�1�0�1�9 �1�9�1�1�1�2. �1�8�1�5�1�5�1�9�1�5 �1�0�1�9�1�4�1�1�1�0 �1�7�1�9�1�9�1�1 �1�9�1�9 �1�2�1�9�1�9�1�7 �1�9�1�0�1�4�1�7:');
        }
      } else {
        await sendMessage(chatId, '�1�8�1�5�1�5�1�9�1�5 "�1�9�1�5�1�0�1�2�1�7�1�0 �1�7�1�9�1�9�1�1 �1�7�1�4�1�5�1�9" �1�4�1�9 "/preview" �1�9�1�9 �1�9�1�0�1�2�1�6�1�9�1�0 �1�9�1�0�1�4�1�7.');
      }
    } else if (state === State.WAITING_FOR_TARGET) {
      if (text.startsWith('@') || /^-\d+$/.test(text)) {
        await setUserTarget(userId, text);
        data.target_chat = text;
        state = State.WAITING_FOR_CONFIRMATION;
        await setUserState(userId, state, data);
        const markup = {
          keyboard: [['�7�3 �1�2�1�9�1�4�1�4�1�7 �1�2 �1�9�1�9�1�1�1�9�1�8'], ['�7�4 �1�9�1�0�1�3�1�9�1�9�1�5']],
          resize_keyboard: true,
          one_time_keyboard: true
        };
        await sendMessage(chatId, `�1�4�1�4�1�9 �1�6�1�4�1�9�1�9 �1�9�1�9 �1�0�1�1 ${text} �1�9�1�9�1�1�1�9�1�8 �1�9�1�0�1�9�1�1\n(�1�9�1�4�1�0 �1�9�1�6�1�3�1�7 �1�0�1�1�6�8�1�7�1�0�1�2�1�9�1�0 �1�6�1�4�1�2�6�8�1�5�1�9�1�4 �1�2�1�9�1�9 �1�3�1�0�1�2 �1�2�1�7 �1�2 �1�0�1�9�1�9�1�4 �1�6�1�4�1�9�1�9�6�8�1�1�1�9�1�4 �1�0�1�7�1�7�1�4 �1�1�1�9 �1�9�1�1�1�2�1�5�1�9�1�7�1�1 �1�9�1�4�6�8�1�2�1�1.)`, markup);
      } else {
        await sendMessage(chatId, '�7�4 �1�2�1�0�1�9�1�1�1�1 �1�0�1�9�1�9�1�7�1�2�1�0�1�9 �1�9�1�1�1�2. �1�8�1�5�1�5�1�9�1�5 �1�2�1�0�1�9�1�1�1�1 �1�4�1�9 �1�0�1�9�1�9 �1�9�1�9�1�9�1�0�1�9�1�4 �1�9�1�7�1�2�1�0�1�9 (�1�9�1�3�1�8 @username �1�4�1�9 -123456) �1�2�1�9�1�9�1�7 �1�9�1�0�1�4�1�7:');
      }
    } else if (state === State.WAITING_FOR_CONFIRMATION) {
      if (text === '�7�3 �1�2�1�9�1�4�1�4�1�7 �1�2 �1�9�1�9�1�1�1�9�1�8') {
        const uniqueId = Math.random().toString(36).substring(2, 10);
        const buttons = createGlassButtons(data.buttons);
        const markup = { remove_keyboard: true };
        try {
          if (data.image_file_id) {
            await sendPhoto(data.target_chat, data.image_file_id, data.caption || '', buttons);
          } else {
            await sendMessage(data.target_chat, data.caption || ' ', buttons);
          }
          await saveMessage(uniqueId, data, userId);
          await incrementUserMessages(userId);
          const uniqueLink = `https://t.me/${BOT_USERNAME}?start=${uniqueId}`;
          await sendMessage(chatId, `�7�3 �1�6�1�4�1�9�1�9 �1�9�1�9�1�1�1�9�1�8 �1�2�1�7!\n�1�8�1�4�1�0�1�9: ${uniqueLink}`, markup);
          state = State.WAITING_FOR_IMAGE;
          data = { image_file_id: null, caption: null, buttons: [], current_button: {} };
          await setUserState(userId, state, data);
          await sendMessage(chatId, MESSAGES.welcome);
        } catch (error) {
          await sendMessage(chatId, `�7�4 �1�6�1�5�1�9 �1�7�1�9 �1�9�1�9�1�1�1�9�1�8 �1�6�1�4�1�9�1�9: ${error.message}\n�1�8�1�5�1�5�1�9�1�5 �1�9�1�5�1�9�1�8�1�0 �1�2�1�2�1�4�1�7 �1�9�1�1 �1�9�1�0�1�9�1�2 �1�9�1�7�1�9�1�4�1�0 �1�9�1�1�1�2 �1�2 �1�7�1�1�1�2�1�9�1�1�1�4 �1�8�1�9�1�0�1�9 �1�9�1�9 �1�7�1�9�1�9�1�7.`, markup);
        }
      } else if (text === '�7�4 �1�9�1�0�1�3�1�9�1�9�1�5') {
        state = State.IDLE;
        data = {};
        await setUserState(userId, state, data);
        const markup = { remove_keyboard: true };
        await sendMessage(chatId, '�1�7�1�9�1�8�1�4�1�9�1�2 �1�8�1�8�1�2 �1�2�1�7.', markup);
      } else {
        await sendMessage(chatId, '�1�8�1�5�1�5�1�9�1�5 "�1�2�1�9�1�4�1�4�1�7 �1�2 �1�9�1�9�1�1�1�9�1�8" �1�4�1�9 "�1�9�1�0�1�3�1�9�1�9�1�5" �1�9�1�9 �1�9�1�0�1�2�1�6�1�9�1�0 �1�9�1�0�1�4�1�7.');
      }
    } else if (state === State.WAITING_FOR_ADMIN_PASSWORD) {
      if (text === ADMIN_PASSWORD) {
        ADMIN_IDS.push(userId);
        state = State.ADMIN_PANEL;
        await setUserState(userId, state, data);
        await sendAdminPanel(chatId);
      } else {
        await sendMessage(chatId, '�7�4 �1�9�1�9�1�0 �1�9�1�2�1�2�1�0�1�9�1�1 �1�9�1�1�1�2.');
        state = State.IDLE;
        await setUserState(userId, state, data);
      }
    } else if (state === State.ADMIN_PANEL) {
      await handleAdminPanel(chatId, text);
    }
  }

  await setUserState(userId, state, data);
  return new Response('OK', { status: 200 });
}

// �1�0�1�9�1�9�1�4�1�2 �1�6�1�0�1�8 �1�9�1�7�1�9�1�4�1�0
async function sendAdminPanel(chatId) {
  const markup = {
    keyboard: [['�9�7 �1�9�1�2�1�9�1�1�1�7�1�1 �1�6�1�4�1�9�1�9�6�8�1�1�1�9'], ['�9�6 �1�4�1�9�1�9�1�9'], ['�9�5 �1�9�1�9�1�9�1�0�1�9�1�9�1�0'], ['�7�4 �1�6�1�9�1�2�1�4 �1�9�1�0 �1�6�1�0�1�8 �1�9�1�7�1�9�1�4�1�0']],
    resize_keyboard: true,
    one_time_keyboard: true
  };
  await sendMessage(chatId, '�9�6 �1�6�1�0�1�8 �1�9�1�7�1�9�1�4�1�0:', markup);
}

// �1�9�1�7�1�4�1�9�1�4�1�2 �1�7�1�1�1�2�1�2�1�9�1�9�1�2 �1�6�1�0�1�8 �1�9�1�7�1�9�1�4�1�0
async function handleAdminPanel(chatId, text) {
  if (text === '�9�7 �1�9�1�2�1�9�1�1�1�7�1�1 �1�6�1�4�1�9�1�9�6�8�1�1�1�9') {
    const keys = await BOT_DATA.list({ prefix: 'message_' });
    let response = '�9�7 �1�6�1�4�1�9�1�9�6�8�1�1�1�9:\n\n';
    for (const key of keys.keys.slice(0, 10)) {
      const msg = JSON.parse(await BOT_DATA.get(key.name));
      const stats = JSON.parse(await BOT_DATA.get(`stats_${msg.unique_link}`));
      response += `�1�2�1�0�1�9�1�1�1�1: \`${key.name.split('_')[1]}\`\n�1�9�1�6�1�3�1�7: ${msg.target_chat}\n�1�9�1�8�1�4�1�9�6�8�1�1�1�9: ${stats.clicks}\n\n`;
    }
    await sendMessage(chatId, response || '�1�6�1�4�1�9�1�9�1�4 �1�4�1�9�1�5�1�2 �1�0�1�2�1�7.');
  } else if (text === '�9�6 �1�4�1�9�1�9�1�9') {
    const msgKeys = await BOT_DATA.list({ prefix: 'message_' });
    const statKeys = await BOT_DATA.list({ prefix: 'stats_' });
    const userKeys = await BOT_DATA.list({ prefix: 'user_' });
    let totalClicks = 0;
    for (const key of statKeys.keys) {
      const stats = JSON.parse(await BOT_DATA.get(key.name));
      totalClicks += stats.clicks;
    }
    await sendMessage(chatId, `�9�6 �1�4�1�9�1�9�1�9:\n�1�6�1�4�1�9�1�9�6�8�1�1�1�9: ${msgKeys.keys.length}\n�1�9�1�8�1�4�1�9�6�8�1�1�1�9: ${totalClicks}\n�1�9�1�9�1�9�1�0�1�9�1�9�1�0: ${userKeys.keys.length}`);
  } else if (text === '�9�5 �1�9�1�9�1�9�1�0�1�9�1�9�1�0') {
    const keys = await BOT_DATA.list({ prefix: 'user_' });
    let response = '�9�5 �1�9�1�9�1�9�1�0�1�9�1�9�1�0:\n\n';
    for (const key of keys.keys.slice(0, 10)) {
      const user = JSON.parse(await BOT_DATA.get(key.name));
      response += `${user.username || user.first_name} - �1�6�1�4�1�9�1�9�6�8�1�1�1�9: ${user.messages_created}\n`;
    }
    await sendMessage(chatId, response || '�1�9�1�9�1�9�1�0�1�9�1�4 �1�4�1�9�1�5�1�2 �1�0�1�2�1�7.');
  } else if (text === '�7�4 �1�6�1�9�1�2�1�4 �1�9�1�0 �1�6�1�0�1�8 �1�9�1�7�1�9�1�4�1�0') {
    await setUserState(chatId, State.IDLE, {});
    const markup = { remove_keyboard: true };
    await sendMessage(chatId, '�1�9�1�0 �1�6�1�0�1�8 �1�9�1�7�1�9�1�4�1�0 �1�6�1�9�1�9�1�4 �1�2�1�7�1�4�1�7.', markup);
  } else {
    await sendMessage(chatId, '�1�8�1�5�1�5�1�9�1�5 �1�9�1�0 �1�9�1�4�1�0�1�2�1�9�1�7 �1�0�1�4�1�9 �1�9�1�1�1�2�1�5�1�9�1�7�1�1 �1�9�1�0�1�4�1�7.');
  }
}