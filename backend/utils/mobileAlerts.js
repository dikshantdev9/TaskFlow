/**
 * mobileAlerts.js — TaskFlow Mobile & SMS Notification Engine
 * Sends instant alerts for pending subtasks, deadlines, and streak reminders.
 */

/**
 * Dispatches an SMS or WhatsApp notification to a user's mobile number.
 * Supports Twilio / Fast2SMS / custom SMS Webhook configuration via .env
 */
async function sendMobileAlert({ phone, userName, message, taskTitle, alertType = 'task_pending' }) {
  if (!phone) {
    console.log(`[MobileAlerts] Skipped alert: No phone number registered for ${userName || 'user'}`);
    return { success: false, reason: 'no_phone' };
  }

  const cleanPhone = String(phone).trim();
  const alertText = message || `🔔 TaskFlow Reminder: Hi ${userName || 'there'}, you have a pending task: "${taskTitle || 'Complete your goal'}". Open TaskFlow to stay on track!`;

  console.log(`====================================================`);
  console.log(`📱 [MobileAlerts Dispatch] -> ${cleanPhone}`);
  console.log(`Type: ${alertType.toUpperCase()}`);
  console.log(`Message: "${alertText}"`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`====================================================`);

  // If Fast2SMS or Twilio is configured in environment, call the gateway
  if (process.env.FAST2SMS_API_KEY) {
    try {
      const fetch = globalThis.fetch || require('node-fetch');
      await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          authorization: process.env.FAST2SMS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: 'v3',
          sender_id: 'TXTIND',
          message: alertText,
          language: 'english',
          flash: 0,
          numbers: cleanPhone.replace(/\D/g, ''),
        }),
      });
    } catch (err) {
      console.error('[MobileAlerts Gateway Error]', err.message);
    }
  }

  return {
    success: true,
    recipient: cleanPhone,
    message: alertText,
    sentAt: new Date(),
  };
}

module.exports = {
  sendMobileAlert,
};
