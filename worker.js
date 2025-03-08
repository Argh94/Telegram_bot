// توکن ربات تلگرام
const TELEGRAM_TOKEN = 'Token bot';
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/`;

// نام کاربری ربات
const BOT_USERNAME = 'Username bot';

// رمز عبور ادمین
const ADMIN_PASSWORD = 'pass';
let ADMIN_IDS = [];

// پیام‌های ربات
const MESSAGES = {
  welcome: "🌟 به ربات دکمه شیشه‌ای خوش آمدید! 🌟\n\nبا این ربات می‌توانید پیام‌های زیبا با دکمه‌های شیشه‌ای ایجاد کنید.\n📝 لطفاً یک تصویر ارسال کنید یا /skip را بفرستید.",
  help: "🔍 راهنمای ربات:\n/start - شروع\n/skip - رد کردن\n/preview - پیش‌نمایش و ارسال\n/settarget - تنظیم مقصد پیش‌فرض\n/help - راهنما\n/cancel - لغو",
  admin_help: "🔐 پنل ادمین:\n📋 مشاهده پیام‌ها\n📊 آمار\n👥 کاربران\n❌ خروج",
};

// تعریف وضعیت‌ها
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

// اعتبارسنجی URL برای دکمه‌ها
function isValidUrl(url) {
  const regex = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/\S*)?$/;
  if (regex.test(url)) {
    return url.match(/^https?:\/\//) ? url : `https://${url}`;
  }
  return false;
}

// ارسال پیام به تلگرام با مدیریت خطا
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
    return handleTelegramError(chatId, new Error(result.description), 'ارسال پیام');
  }
  console.log(`Message sent to ${chatId}: ${text}`);
  return result;
}

// ارسال تصویر به تلگرام با مدیریت خطا
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
    return handleTelegramError(chatId, new Error(result.description), 'ارسال عکس');
  }
  console.log(`Photo sent to ${chatId} with caption: ${caption}`);
  return result;
}

// مدیریت خطاهای تلگرام
async function handleTelegramError(chatId, error, action) {
  console.error(`Telegram error in ${action}: ${error.message}`);
  await sendMessage(chatId, `❌ خطا در ${action}: ${error.message}`);
  throw error;
}

// ایجاد دکمه‌های شیشه‌ای
function createGlassButtons(buttons) {
  return {
    inline_keyboard: buttons.map(button => [{ text: button.label, url: button.link }]),
  };
}

// ذخیره و بازیابی مقصد پیش‌فرض کاربر
async function setUserTarget(userId, targetChat) {
  await BOT_DATA.put(`target_${userId}`, JSON.stringify({ target_chat: targetChat }));
  console.log(`Target set for user ${userId}: ${targetChat}`);
}

async function getUserTarget(userId) {
  const target = await BOT_DATA.get(`target_${userId}`);
  return target ? JSON.parse(target).target_chat : null;
}

// ذخیره‌سازی و بازیابی داده‌ها از KV
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

// هندلر اصلی درخواست‌ها
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

  // چک کردن اینکه آپدیت از چت خصوصی باشه و channel_post نباشه
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
        await sendMessage(chatId, '❌ پیام یافت نشد.\n' + MESSAGES.welcome);
      }
    }
    state = State.WAITING_FOR_IMAGE;
    data = { image_file_id: null, caption: null, buttons: [], current_button: {} };
    await setUserState(userId, state, data);
    const targetChat = await getUserTarget(userId);
    if (!targetChat) {
      await sendMessage(chatId, MESSAGES.welcome + '\n\n⚠️ شما هنوز مقصد پیش‌فرضی ثبت نکردید. لطفاً با /settarget گروه یا کانال خود را ثبت کنید.');
    } else {
      await sendMessage(chatId, MESSAGES.welcome + `\n\nمقصد پیش‌فرض شما: ${targetChat}`);
    }
  } else if (text === '/skip') {
    if (state === State.WAITING_FOR_IMAGE) {
      state = State.WAITING_FOR_CAPTION;
      await setUserState(userId, state, data);
      await sendMessage(chatId, 'تصویر رد شد. لطفاً کپشن را وارد کنید یا /skip بفرستید.');
    } else if (state === State.WAITING_FOR_CAPTION) {
      state = State.WAITING_FOR_BUTTON_LABEL;
      await setUserState(userId, state, data);
      await sendMessage(chatId, 'کپشن رد شد. لطفاً برچسب دکمه را وارد کنید:');
    }
  } else if (text === '/admin') {
    if (ADMIN_IDS.includes(userId)) {
      state = State.ADMIN_PANEL;
      await setUserState(userId, state, data);
      await sendAdminPanel(chatId);
    } else {
      state = State.WAITING_FOR_ADMIN_PASSWORD;
      await setUserState(userId, state, data);
      await sendMessage(chatId, 'لطفاً رمز عبور ادمین را وارد کنید:');
    }
  } else if (text === '/settarget') {
    state = State.WAITING_FOR_TARGET;
    await setUserState(userId, state, data);
    await sendMessage(chatId, 'لطفاً شناسه یا نام کاربری گروه/کانال مقصد را وارد کنید (مثل @channel یا -123456):');
  } else if (text === '/help') {
    await sendMessage(chatId, MESSAGES.help);
  } else if (text === '/cancel') {
    state = State.IDLE;
    data = {};
    await setUserState(userId, state, data);
    await sendMessage(chatId, 'عملیات لغو شد. برای شروع مجدد /start را بفرستید.');
  } else if (photo && state === State.WAITING_FOR_IMAGE) {
    data.image_file_id = photo[photo.length - 1].file_id;
    state = State.WAITING_FOR_CAPTION;
    await setUserState(userId, state, data);
    await sendMessage(chatId, '✅ تصویر دریافت شد. لطفاً کپشن را وارد کنید یا /skip بفرستید.');
  } else if (text) {
    console.log(`Processing text input: ${text} in state ${state}`);
    if (state === State.WAITING_FOR_CAPTION) {
      data.caption = text;
      state = State.WAITING_FOR_BUTTON_LABEL;
      await setUserState(userId, state, data);
      await sendMessage(chatId, '✅ کپشن دریافت شد. لطفاً برچسب دکمه را وارد کنید:');
    } else if (state === State.WAITING_FOR_BUTTON_LABEL) {
      data.current_button = { label: text };
      state = State.WAITING_FOR_BUTTON_LINK;
      await setUserState(userId, state, data);
      await sendMessage(chatId, '✅ برچسب دریافت شد. لطفاً لینک دکمه را وارد کنید:');
    } else if (state === State.WAITING_FOR_BUTTON_LINK) {
      const validUrl = isValidUrl(text);
      if (validUrl) {
        data.current_button.link = validUrl;
        data.buttons.push(data.current_button);
        data.current_button = {};
        state = State.WAITING_FOR_MORE_BUTTONS;
        await setUserState(userId, state, data);
        const markup = {
          keyboard: [['افزودن دکمه دیگر'], ['/preview']],
          resize_keyboard: true,
          one_time_keyboard: true
        };
        await sendMessage(chatId, `✅ دکمه اضافه شد (${data.buttons.length}). دکمه دیگر؟`, markup);
      } else {
        await sendMessage(chatId, '❌ لینک نامعتبر است. لطفاً لینک معتبر (مثل https://...) وارد کنید:');
      }
    } else if (state === State.WAITING_FOR_MORE_BUTTONS) {
      if (text === 'افزودن دکمه دیگر') {
        data.current_button = {};
        state = State.WAITING_FOR_BUTTON_LABEL;
        await setUserState(userId, state, data);
        const markup = { remove_keyboard: true };
        await sendMessage(chatId, 'لطفاً برچسب دکمه جدید را وارد کنید:', markup);
      } else if (text === '/preview') {
        if (data.buttons.length > 0) {
          const targetChat = await getUserTarget(userId);
          if (targetChat) {
            data.target_chat = targetChat;
            state = State.WAITING_FOR_CONFIRMATION;
            await setUserState(userId, state, data);
            const buttons = createGlassButtons(data.buttons);
            const markup = {
              keyboard: [['✅ تایید و ارسال'], ['❌ انصراف']],
              resize_keyboard: true,
              one_time_keyboard: true
            };
            if (data.image_file_id) {
              await sendPhoto(chatId, data.image_file_id, data.caption || 'پیش‌نمایش', buttons);
            } else {
              await sendMessage(chatId, data.caption || 'پیش‌نمایش', buttons);
            }
            await sendMessage(chatId, `آیا پیام را به ${targetChat} ارسال کنم؟`, markup);
          } else {
            state = State.WAITING_FOR_TARGET;
            await setUserState(userId, state, data);
            const buttons = createGlassButtons(data.buttons);
            const markup = { remove_keyboard: true };
            if (data.image_file_id) {
              await sendPhoto(chatId, data.image_file_id, data.caption || 'پیش‌نمایش', buttons);
            } else {
              await sendMessage(chatId, data.caption || 'پیش‌نمایش', buttons);
            }
            await sendMessage(chatId, 'شما هنوز مقصد پیش‌فرضی ثبت نکردید. لطفاً شناسه یا نام کاربری گروه/کانال مقصد را وارد کنید:', markup);
          }
        } else {
          state = State.WAITING_FOR_BUTTON_LABEL;
          await setUserState(userId, state, data);
          await sendMessage(chatId, 'حداقل یک دکمه لازم است. لطفاً برچسب دکمه را وارد کنید:');
        }
      } else {
        await sendMessage(chatId, 'لطفاً "افزودن دکمه دیگر" یا "/preview" را انتخاب کنید.');
      }
    } else if (state === State.WAITING_FOR_TARGET) {
      if (text.startsWith('@') || /^-\d+$/.test(text)) {
        await setUserTarget(userId, text);
        data.target_chat = text;
        state = State.WAITING_FOR_CONFIRMATION;
        await setUserState(userId, state, data);
        const markup = {
          keyboard: [['✅ تایید و ارسال'], ['❌ انصراف']],
          resize_keyboard: true,
          one_time_keyboard: true
        };
        await sendMessage(chatId, `آیا پیام را به ${text} ارسال کنم؟\n(این مقصد به‌عنوان پیش‌فرض شما ثبت شد و برای پیام‌های بعدی هم استفاده می‌شه.)`, markup);
      } else {
        await sendMessage(chatId, '❌ شناسه نامعتبر است. لطفاً شناسه یا نام کاربری معتبر (مثل @username یا -123456) وارد کنید:');
      }
    } else if (state === State.WAITING_FOR_CONFIRMATION) {
      if (text === '✅ تایید و ارسال') {
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
          await sendMessage(chatId, `✅ پیام ارسال شد!\nلینک: ${uniqueLink}`, markup);
          state = State.WAITING_FOR_IMAGE;
          data = { image_file_id: null, caption: null, buttons: [], current_button: {} };
          await setUserState(userId, state, data);
          await sendMessage(chatId, MESSAGES.welcome);
        } catch (error) {
          await sendMessage(chatId, `❌ خطا در ارسال پیام: ${error.message}\nلطفاً مطمئن شوید که ربات ادمین است و دسترسی لازم را دارد.`, markup);
        }
      } else if (text === '❌ انصراف') {
        state = State.IDLE;
        data = {};
        await setUserState(userId, state, data);
        const markup = { remove_keyboard: true };
        await sendMessage(chatId, 'عملیات لغو شد.', markup);
      } else {
        await sendMessage(chatId, 'لطفاً "تایید و ارسال" یا "انصراف" را انتخاب کنید.');
      }
    } else if (state === State.WAITING_FOR_ADMIN_PASSWORD) {
      if (text === ADMIN_PASSWORD) {
        ADMIN_IDS.push(userId);
        state = State.ADMIN_PANEL;
        await setUserState(userId, state, data);
        await sendAdminPanel(chatId);
      } else {
        await sendMessage(chatId, '❌ رمز اشتباه است.');
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

// نمایش پنل ادمین
async function sendAdminPanel(chatId) {
  const markup = {
    keyboard: [['📋 مشاهده پیام‌ها'], ['📊 آمار'], ['👥 کاربران'], ['❌ خروج از پنل ادمین']],
    resize_keyboard: true,
    one_time_keyboard: true
  };
  await sendMessage(chatId, '🔐 پنل ادمین:', markup);
}

// مدیریت دستورات پنل ادمین
async function handleAdminPanel(chatId, text) {
  if (text === '📋 مشاهده پیام‌ها') {
    const keys = await BOT_DATA.list({ prefix: 'message_' });
    let response = '📋 پیام‌ها:\n\n';
    for (const key of keys.keys.slice(0, 10)) {
      const msg = JSON.parse(await BOT_DATA.get(key.name));
      const stats = JSON.parse(await BOT_DATA.get(`stats_${msg.unique_link}`));
      response += `شناسه: \`${key.name.split('_')[1]}\`\nمقصد: ${msg.target_chat}\nکلیک‌ها: ${stats.clicks}\n\n`;
    }
    await sendMessage(chatId, response || 'پیامی یافت نشد.');
  } else if (text === '📊 آمار') {
    const msgKeys = await BOT_DATA.list({ prefix: 'message_' });
    const statKeys = await BOT_DATA.list({ prefix: 'stats_' });
    const userKeys = await BOT_DATA.list({ prefix: 'user_' });
    let totalClicks = 0;
    for (const key of statKeys.keys) {
      const stats = JSON.parse(await BOT_DATA.get(key.name));
      totalClicks += stats.clicks;
    }
    await sendMessage(chatId, `📊 آمار:\nپیام‌ها: ${msgKeys.keys.length}\nکلیک‌ها: ${totalClicks}\nکاربران: ${userKeys.keys.length}`);
  } else if (text === '👥 کاربران') {
    const keys = await BOT_DATA.list({ prefix: 'user_' });
    let response = '👥 کاربران:\n\n';
    for (const key of keys.keys.slice(0, 10)) {
      const user = JSON.parse(await BOT_DATA.get(key.name));
      response += `${user.username || user.first_name} - پیام‌ها: ${user.messages_created}\n`;
    }
    await sendMessage(chatId, response || 'کاربری یافت نشد.');
  } else if (text === '❌ خروج از پنل ادمین') {
    await setUserState(chatId, State.IDLE, {});
    const markup = { remove_keyboard: true };
    await sendMessage(chatId, 'از پنل ادمین خارج شدید.', markup);
  } else {
    await sendMessage(chatId, 'لطفاً از کیبورد زیر استفاده کنید.');
  }
}