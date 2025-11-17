import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Diagnostic function to check email configuration
export const checkEmailConfig = () => {
  const config = {
    hasUser: !!process.env.SMTP_USER,
    hasPass: !!process.env.SMTP_PASS,
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || '587',
    secure: process.env.SMTP_SECURE === 'true',
    userEmail: process.env.SMTP_USER ? process.env.SMTP_USER.substring(0, 3) + '***' : 'NOT SET',
  };
  
  console.log('📧 Email Configuration Check:');
  console.log('   SMTP_USER:', config.hasUser ? `Set (${config.userEmail})` : '❌ NOT SET');
  console.log('   SMTP_PASS:', config.hasPass ? '✅ Set' : '❌ NOT SET');
  console.log('   SMTP_HOST:', config.host);
  console.log('   SMTP_PORT:', config.port);
  console.log('   SMTP_SECURE:', config.secure);
  
  return config;
};

// Check config on module load
checkEmailConfig();

// Create transporter - can be configured with SMTP settings
// For production, you'll need to configure this with actual email service credentials
// Examples: Gmail, SendGrid, Mailgun, AWS SES, etc.
const createTransporter = () => {
  // Default: use Gmail SMTP (requires app password)
  // You can also use other services like SendGrid, Mailgun, AWS SES, etc.
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER, // Your email
      pass: process.env.SMTP_PASS, // Your app password or SMTP password
    },
    // Additional options for better deliverability
    tls: {
      // Do not fail on invalid certs (helps with some email providers)
      rejectUnauthorized: false,
    },
    // Connection timeout
    connectionTimeout: 60000,
    // Socket timeout
    socketTimeout: 60000,
    // Greeting timeout
    greetingTimeout: 30000,
    // Pool connections for better performance
    pool: true,
    maxConnections: 1,
    maxMessages: 3,
  });

  return transporter;
};

// Send approval email
export const sendApprovalEmail = async (bookingRequest, event) => {
  try {
    // Skip email if SMTP is not configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('⚠️ Email not configured. Skipping email send. Set SMTP_USER and SMTP_PASS environment variables to enable emails.');
      return { success: false, message: 'Email not configured' };
    }

    console.log('📧 Attempting to send approval email...');
    console.log(`   To: ${bookingRequest.organizerEmail}`);
    console.log(`   From: ${process.env.SMTP_USER}`);
    console.log(`   SMTP Host: ${process.env.SMTP_HOST || 'smtp.gmail.com'}`);
    console.log(`   SMTP Port: ${process.env.SMTP_PORT || '587'}`);

    const transporter = createTransporter();

    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP server connection verified');

    // Format date and time for email
    const formatDateTime = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    // Clean subject line (remove emoji in some email clients that might flag it)
    const emailSubject = `Event Booking Approved: ${bookingRequest.title}`;
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px 8px 0 0;
            text-align: center;
          }
          .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 8px 8px;
          }
          .info-box {
            background: white;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
            border-left: 4px solid #667eea;
          }
          .label {
            font-weight: bold;
            color: #667eea;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎉 Event Booking Approved!</h1>
        </div>
        <div class="content">
          <p>Dear ${bookingRequest.organizerName},</p>
          
          <p>Great news! Your event booking request has been <strong>approved</strong>.</p>
          
          <div class="info-box">
            <p><span class="label">Event Title:</span> ${bookingRequest.title}</p>
            <p><span class="label">Organization:</span> ${bookingRequest.organizationName}</p>
            <p><span class="label">Date:</span> ${formatDateTime(bookingRequest.startTime).split(',')[0]}</p>
            <p><span class="label">Start Time:</span> ${new Date(bookingRequest.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
            <p><span class="label">End Time:</span> ${new Date(bookingRequest.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
            <p><span class="label">Auditorium/Hall:</span> ${bookingRequest.auditoriumName}</p>
            ${bookingRequest.location ? `<p><span class="label">Location:</span> ${bookingRequest.location}</p>` : ''}
          </div>

          ${bookingRequest.adminNotes ? `
            <div class="info-box">
              <p><span class="label">Admin Notes:</span></p>
              <p>${bookingRequest.adminNotes}</p>
            </div>
          ` : ''}

          ${event && event._id ? `
            <p>Your event has been created and is now visible on the campus events page.</p>
            ${bookingRequest.registrationFormUrl ? `<p><strong>Registration Form:</strong> <a href="${bookingRequest.registrationFormUrl}">${bookingRequest.registrationFormUrl}</a></p>` : ''}
          ` : ''}

          <p>If you have any questions or need to make changes, please contact the admin.</p>
          
          <p>Best regards,<br>NaviGo Admin Team</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </body>
      </html>
    `;

    // Create plain text version of the email (important for deliverability)
    const emailText = `
🎉 Event Booking Approved!

Dear ${bookingRequest.organizerName},

Great news! Your event booking request has been approved.

Event Details:
- Event Title: ${bookingRequest.title}
- Organization: ${bookingRequest.organizationName}
- Date: ${formatDateTime(bookingRequest.startTime).split(',')[0]}
- Start Time: ${new Date(bookingRequest.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
- End Time: ${new Date(bookingRequest.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
- Auditorium/Hall: ${bookingRequest.auditoriumName}
${bookingRequest.location ? `- Location: ${bookingRequest.location}` : ''}
${bookingRequest.adminNotes ? `\nAdmin Notes:\n${bookingRequest.adminNotes}\n` : ''}
${event && event._id ? `\nYour event has been created and is now visible on the campus events page.` : ''}
${bookingRequest.registrationFormUrl ? `\nRegistration Form: ${bookingRequest.registrationFormUrl}` : ''}

If you have any questions or need to make changes, please contact the admin.

Best regards,
NaviGo Admin Team

---
This is an automated email. Please do not reply to this message.
    `.trim();

    const mailOptions = {
      from: `"NaviGo Admin" <${process.env.SMTP_USER}>`, // Properly formatted from address
      to: bookingRequest.organizerEmail,
      subject: emailSubject,
      text: emailText, // Plain text version (critical for spam filters)
      html: emailHtml,
      // Additional headers to improve deliverability
      headers: {
        'X-Mailer': 'NaviGo Event Management System',
        'X-Priority': '1',
        'Importance': 'high',
      },
      // Reply-to header
      replyTo: `"NaviGo Admin" <${process.env.SMTP_USER}>`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Approval email sent successfully!`);
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Response: ${info.response}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Error sending approval email:`);
    console.error(`   Error Message: ${error.message}`);
    console.error(`   Error Code: ${error.code || 'N/A'}`);
    if (error.response) {
      console.error(`   SMTP Response: ${error.response}`);
    }
    if (error.command) {
      console.error(`   Failed Command: ${error.command}`);
    }
    console.error(`   Full Error:`, error);
    // Don't throw error - email failure shouldn't block approval
    return { success: false, error: error.message, code: error.code };
  }
};

// Send rejection email (optional)
export const sendRejectionEmail = async (bookingRequest) => {
  try {
    // Skip email if SMTP is not configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('⚠️ Email not configured. Skipping email send.');
      return { success: false, message: 'Email not configured' };
    }

    const transporter = createTransporter();

    const emailSubject = `Event Booking Request: ${bookingRequest.title}`;
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: #dc3545;
            color: white;
            padding: 20px;
            border-radius: 8px 8px 0 0;
            text-align: center;
          }
          .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 8px 8px;
          }
          .info-box {
            background: white;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
            border-left: 4px solid #dc3545;
          }
          .label {
            font-weight: bold;
            color: #dc3545;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Event Booking Request</h1>
        </div>
        <div class="content">
          <p>Dear ${bookingRequest.organizerName},</p>
          
          <p>We regret to inform you that your event booking request could not be approved at this time.</p>
          
          ${bookingRequest.adminNotes ? `
            <div class="info-box">
              <p><span class="label">Reason:</span></p>
              <p>${bookingRequest.adminNotes}</p>
            </div>
          ` : ''}

          <p>If you have any questions, please contact the admin.</p>
          
          <p>Best regards,<br>NaviGo Admin Team</p>
        </div>
      </body>
      </html>
    `;

    // Create plain text version of the rejection email
    const emailText = `
Event Booking Request

Dear ${bookingRequest.organizerName},

We regret to inform you that your event booking request could not be approved at this time.

${bookingRequest.adminNotes ? `Reason:\n${bookingRequest.adminNotes}\n` : ''}
If you have any questions, please contact the admin.

Best regards,
NaviGo Admin Team

---
This is an automated email. Please do not reply to this message.
    `.trim();

    const mailOptions = {
      from: `"NaviGo Admin" <${process.env.SMTP_USER}>`, // Properly formatted from address
      to: bookingRequest.organizerEmail,
      subject: emailSubject,
      text: emailText, // Plain text version (critical for spam filters)
      html: emailHtml,
      // Additional headers to improve deliverability
      headers: {
        'X-Mailer': 'NaviGo Event Management System',
        'X-Priority': '1',
        'Importance': 'normal',
      },
      replyTo: `"NaviGo Admin" <${process.env.SMTP_USER}>`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Rejection email sent to ${bookingRequest.organizerEmail}:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Error sending rejection email:`, error);
    return { success: false, error: error.message };
  }
};

