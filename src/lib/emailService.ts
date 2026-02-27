import emailjs from '@emailjs/browser';

/**
 * EmailJS Configuration
 * 
 * Setup Instructions:
 * 1. Go to https://www.emailjs.com and create a free account
 * 2. Add an email service (Gmail, Outlook, etc.)
 * 3. Create email templates for:
 *    - Round Active (when predictions open)
 *    - Round Final (when results are published)
 * 4. Get your Public Key from EmailJS dashboard
 * 5. Update the environment variables below
 * 
 * Free Tier: 200 emails/month (plenty for 8 players × 2 notifications × 10 rounds = 160/month)
 */

// Environment variables - Add these to your .env file
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'your_service_id';
const EMAILJS_TEMPLATE_ROUND_ACTIVE = import.meta.env.VITE_EMAILJS_TEMPLATE_ROUND_ACTIVE || 'template_round_active';
const EMAILJS_TEMPLATE_ROUND_FINAL = import.meta.env.VITE_EMAILJS_TEMPLATE_ROUND_FINAL || 'template_round_final';
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'your_public_key';

export interface EmailNotificationData {
  roundNumber: number;
  roundType: 'regular' | 'postponed';
  deadline?: string;
  appUrl: string;
}

const formatEmailDeadline = (deadline?: string): string | undefined => {
  if (!deadline) {
    return undefined;
  }

  const parsedDate = new Date(deadline);
  if (Number.isNaN(parsedDate.getTime())) {
    return undefined;
  }

  const datePart = parsedDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
  });
  const timePart = parsedDate
    .toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
    .replace(' ', '')
    .toLowerCase();

  return `${datePart} ${timePart}`;
};

/**
 * Send notification when round becomes active (predictions open)
 */
export const sendRoundActiveNotification = async (
  playerEmail: string,
  playerName: string,
  data: EmailNotificationData
): Promise<boolean> => {
  try {
    if (!playerEmail) {
      console.error('❌ Missing recipient email for round active notification');
      return false;
    }

    const templateParams = {
      to_email: playerEmail,
      to_name: playerName,
      email: playerEmail,
      name: playerName,
      user_email: playerEmail,
      user_name: playerName,
      round_number: data.roundNumber,
      round_type: data.roundType === 'postponed' ? 'Postponed Game' : `Round ${data.roundNumber}`,
      deadline: formatEmailDeadline(data.deadline) || 'Check app for deadline',
      app_url: data.appUrl,
      subject: `🎯 ${data.roundType === 'postponed' ? 'Postponed Game' : `Round ${data.roundNumber}`} - Make Your Predictions!`,
    };

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ROUND_ACTIVE,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );

    console.log('✅ Email sent to', playerEmail, response.status);
    return true;
  } catch (error) {
    console.error('❌ Failed to send email to', playerEmail, error);
    return false;
  }
};

/**
 * Send notification when round is finalized (results published)
 */
export const sendRoundFinalNotification = async (
  playerEmail: string,
  playerName: string,
  data: EmailNotificationData
): Promise<boolean> => {
  try {
    if (!playerEmail) {
      console.error('❌ Missing recipient email for round final notification');
      return false;
    }

    const templateParams = {
      to_email: playerEmail,
      to_name: playerName,
      email: playerEmail,
      name: playerName,
      user_email: playerEmail,
      user_name: playerName,
      round_number: data.roundNumber,
      round_type: data.roundType === 'postponed' ? 'Postponed Game' : `Round ${data.roundNumber}`,
      app_url: data.appUrl,
      subject: `🏆 ${data.roundType === 'postponed' ? 'Postponed Game' : `Round ${data.roundNumber}`} - Results Are In!`,
    };

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ROUND_FINAL,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );

    console.log('✅ Email sent to', playerEmail, response.status);
    return true;
  } catch (error) {
    console.error('❌ Failed to send email to', playerEmail, error);
    return false;
  }
};

/**
 * Send notifications to all players
 */
export const notifyAllPlayers = async (
  players: Array<{ email: string; name: string }>,
  type: 'active' | 'final',
  data: EmailNotificationData
): Promise<{ success: number; failed: number }> => {
  const results = await Promise.allSettled(
    players.map(player =>
      type === 'active'
        ? sendRoundActiveNotification(player.email, player.name, data)
        : sendRoundFinalNotification(player.email, player.name, data)
    )
  );

  const success = results.filter(r => r.status === 'fulfilled' && r.value).length;
  const failed = results.length - success;

  return { success, failed };
};

/**
 * Check if EmailJS is properly configured
 */
export const isEmailServiceConfigured = (): boolean => {
  return (
    EMAILJS_SERVICE_ID !== 'your_service_id' &&
    EMAILJS_PUBLIC_KEY !== 'your_public_key' &&
    EMAILJS_TEMPLATE_ROUND_ACTIVE !== 'template_round_active' &&
    EMAILJS_TEMPLATE_ROUND_FINAL !== 'template_round_final'
  );
};
