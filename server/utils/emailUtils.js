import { emailService } from '../config/email.js';

// Email validation
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const normalizeEmail = (email) => {
  return email.toLowerCase().trim();
};

// Email template utilities
export const generateEmailVerificationTemplate = (user, verificationLink) => {
  return {
    subject: 'Verify Your Email - CareerConnect Lesotho',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0;">CareerConnect Lesotho</h1>
          <p style="color: #6b7280; margin: 5px 0;">Your Pathway to Success</p>
        </div>
        
        <h2 style="color: #1f2937; margin-bottom: 20px;">Verify Your Email Address</h2>
        
        <p style="color: #4b5563; line-height: 1.6; margin-bottom: 25px;">
          Hello <strong>${user.firstName} ${user.lastName}</strong>,
        </p>
        
        <p style="color: #4b5563; line-height: 1.6; margin-bottom: 25px;">
          Thank you for registering with CareerConnect Lesotho! To complete your registration and start exploring educational and career opportunities, please verify your email address by clicking the button below:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" 
             style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; 
                    border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
            Verify Email Address
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; margin-bottom: 25px;">
          If the button doesn't work, you can also copy and paste the following link in your browser:
        </p>
        
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin-bottom: 25px;">
          <p style="color: #374151; word-break: break-all; margin: 0; font-size: 14px;">
            ${verificationLink}
          </p>
        </div>
        
        <p style="color: #ef4444; font-size: 14px; margin-bottom: 25px;">
          <strong>Important:</strong> This verification link will expire in 24 hours.
        </p>
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            If you didn't create an account with CareerConnect Lesotho, please ignore this email.
          </p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
            © ${new Date().getFullYear()} CareerConnect Lesotho. All rights reserved.<br>
            Connecting students with institutions and career opportunities across Lesotho.
          </p>
        </div>
      </div>
    `
  };
};

export const generatePasswordResetTemplate = (user, resetLink) => {
  return {
    subject: 'Reset Your Password - CareerConnect Lesotho',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0;">CareerConnect Lesotho</h1>
          <p style="color: #6b7280; margin: 5px 0;">Your Pathway to Success</p>
        </div>
        
        <h2 style="color: #1f2937; margin-bottom: 20px;">Password Reset Request</h2>
        
        <p style="color: #4b5563; line-height: 1.6; margin-bottom: 25px;">
          Hello <strong>${user.firstName} ${user.lastName}</strong>,
        </p>
        
        <p style="color: #4b5563; line-height: 1.6; margin-bottom: 25px;">
          We received a request to reset your password for your CareerConnect Lesotho account. Click the button below to create a new password:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" 
             style="background-color: #dc2626; color: white; padding: 12px 30px; text-decoration: none; 
                    border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
            Reset Password
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; margin-bottom: 25px;">
          If you didn't request this reset, you can safely ignore this email. Your password will remain unchanged.
        </p>
        
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin-bottom: 25px;">
          <p style="color: #374151; word-break: break-all; margin: 0; font-size: 14px;">
            ${resetLink}
          </p>
        </div>
        
        <p style="color: #ef4444; font-size: 14px; margin-bottom: 25px;">
          <strong>Note:</strong> This reset link will expire in 1 hour for security reasons.
        </p>
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            For security reasons, please do not share this email with anyone.
          </p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
            © ${new Date().getFullYear()} CareerConnect Lesotho. All rights reserved.
          </p>
        </div>
      </div>
    `
  };
};

export const generateApplicationStatusTemplate = (user, application) => {
  const statusColors = {
    approved: '#10b981',
    rejected: '#ef4444',
    waitlisted: '#f59e0b',
    pending: '#6b7280'
  };

  const statusMessages = {
    approved: 'Congratulations! Your application has been approved.',
    rejected: 'Your application has been reviewed.',
    waitlisted: 'Your application has been waitlisted.',
    pending: 'Your application is being reviewed.'
  };

  return {
    subject: `Application Update - ${application.status === 'approved' ? 'Congratulations!' : 'Status Update'}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0;">CareerConnect Lesotho</h1>
          <p style="color: #6b7280; margin: 5px 0;">Your Pathway to Success</p>
        </div>
        
        <h2 style="color: ${statusColors[application.status]}; margin-bottom: 20px; text-align: center;">
          ${application.status === 'approved' ? '🎉 Congratulations!' : 'Application Update'}
        </h2>
        
        <p style="color: #4b5563; line-height: 1.6; margin-bottom: 25px;">
          Hello <strong>${user.firstName} ${user.lastName}</strong>,
        </p>
        
        <p style="color: #4b5563; line-height: 1.6; margin-bottom: 25px;">
          ${statusMessages[application.status]}
        </p>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid ${statusColors[application.status]}; margin-bottom: 25px;">
          <h3 style="color: #1f2937; margin: 0 0 10px 0;">Application Details</h3>
          <p style="color: #4b5563; margin: 5px 0;"><strong>Course:</strong> ${application.courseName}</p>
          <p style="color: #4b5563; margin: 5px 0;"><strong>Institution:</strong> ${application.institutionName}</p>
          <p style="color: #4b5563; margin: 5px 0;"><strong>Status:</strong> 
            <span style="color: ${statusColors[application.status]}; font-weight: bold; text-transform: capitalize;">
              ${application.status}
            </span>
          </p>
          <p style="color: #4b5563; margin: 5px 0;"><strong>Applied On:</strong> ${new Date(application.appliedAt).toLocaleDateString()}</p>
        </div>
        
        ${application.notes ? `
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin-bottom: 25px;">
            <h4 style="color: #92400e; margin: 0 0 10px 0;">Additional Notes:</h4>
            <p style="color: #92400e; margin: 0; line-height: 1.5;">${application.notes}</p>
          </div>
        ` : ''}
        
        ${application.status === 'approved' ? `
          <div style="background-color: #d1fae5; padding: 15px; border-radius: 6px; margin-bottom: 25px;">
            <p style="color: #065f46; margin: 0; font-weight: bold;">
              Next Steps: The institution will contact you with further instructions regarding enrollment.
            </p>
          </div>
        ` : ''}
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            You can view your application status anytime by logging into your CareerConnect account.
          </p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
            © ${new Date().getFullYear()} CareerConnect Lesotho. All rights reserved.
          </p>
        </div>
      </div>
    `
  };
};

// Email sending utilities
export const sendEmail = async (to, subject, html, text = '') => {
  try {
    const mailOptions = {
      from: `"CareerConnect Lesotho" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html
    };

    const result = await emailService.transporter.sendMail(mailOptions);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};

export const sendBulkEmail = async (recipients, subject, html, text = '') => {
  const results = [];
  
  for (const recipient of recipients) {
    try {
      const result = await sendEmail(recipient, subject, html, text);
      results.push({ recipient, success: true, ...result });
    } catch (error) {
      results.push({ recipient, success: false, error: error.message });
    }
  }
  
  return results;
};

// Email rate limiting
export const checkEmailRateLimit = async (email, type) => {
  // This would typically check against a rate limiting service or database
  // For now, we'll implement a simple in-memory solution
  const rateLimits = {
    password_reset: { limit: 3, window: 3600000 }, // 3 per hour
    verification: { limit: 5, window: 3600000 },   // 5 per hour
    notification: { limit: 10, window: 3600000 }   // 10 per hour
  };

  // In production, this would be stored in Redis or similar
  return { allowed: true, remaining: rateLimits[type]?.limit || 5 };
};

// Email template rendering
export const renderTemplate = (template, data) => {
  let rendered = template;
  
  Object.keys(data).forEach(key => {
    const placeholder = `{{${key}}}`;
    const value = data[key] || '';
    rendered = rendered.replace(new RegExp(placeholder, 'g'), value);
  });
  
  return rendered;
};

// Email validation and sanitization
export const sanitizeEmailContent = (content) => {
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/g, '')
    .replace(/on\w+='[^']*'/g, '')
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '');
};

// Export all utilities
export default {
  isValidEmail,
  normalizeEmail,
  generateEmailVerificationTemplate,
  generatePasswordResetTemplate,
  generateApplicationStatusTemplate,
  sendEmail,
  sendBulkEmail,
  checkEmailRateLimit,
  renderTemplate,
  sanitizeEmailContent
};