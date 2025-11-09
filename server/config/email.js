import nodemailer from 'nodemailer';

// Email configuration
const emailConfig = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
};

// Create transporter
export const transporter = nodemailer.createTransport(emailConfig);

// Verify transporter connection
transporter.verify((error) => {
  if (error) {
    console.error('Email transporter verification failed:', error);
  } else {
    console.log('Email transporter is ready to send messages');
  }
});

// Email templates
export const emailTemplates = {
  // User registration verification
  verifyEmail: (user, verificationLink) => ({
    subject: 'Verify Your Email - CareerConnect Lesotho',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Welcome to CareerConnect Lesotho!</h2>
        <p>Dear ${user.firstName} ${user.lastName},</p>
        <p>Thank you for registering with CareerConnect Lesotho. Please verify your email address to complete your registration.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p>If the button doesn't work, copy and paste this link in your browser:</p>
        <p style="word-break: break-all;">${verificationLink}</p>
        <p>This link will expire in 24 hours.</p>
        <br>
        <p>Best regards,<br>CareerConnect Lesotho Team</p>
      </div>
    `
  }),

  // Password reset
  passwordReset: (user, resetLink) => ({
    subject: 'Reset Your Password - CareerConnect Lesotho',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Password Reset Request</h2>
        <p>Dear ${user.firstName} ${user.lastName},</p>
        <p>We received a request to reset your password for your CareerConnect Lesotho account.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>If you didn't request this, please ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
        <br>
        <p>Best regards,<br>CareerConnect Lesotho Team</p>
      </div>
    `
  }),

  // Application submitted
  applicationSubmitted: (user, application) => ({
    subject: 'Application Submitted Successfully - CareerConnect Lesotho',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Application Submitted!</h2>
        <p>Dear ${user.firstName} ${user.lastName},</p>
        <p>Your application has been submitted successfully.</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0;">Application Details:</h3>
          <p><strong>Course:</strong> ${application.courseName}</p>
          <p><strong>Institution:</strong> ${application.institutionName}</p>
          <p><strong>Applied On:</strong> ${new Date(application.appliedAt).toLocaleDateString()}</p>
        </div>
        <p>You will be notified when your application status changes.</p>
        <br>
        <p>Best regards,<br>CareerConnect Lesotho Team</p>
      </div>
    `
  }),

  // Admission decision
  admissionDecision: (user, application) => ({
    subject: `Application Update - ${application.status === 'approved' ? 'Congratulations!' : 'Update'}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${application.status === 'approved' ? '#10b981' : '#ef4444'};">
          ${application.status === 'approved' ? 'Congratulations!' : 'Application Update'}
        </h2>
        <p>Dear ${user.firstName} ${user.lastName},</p>
        <p>Your application for <strong>${application.courseName}</strong> at <strong>${application.institutionName}</strong> has been ${application.status}.</p>
        ${application.notes ? `<p><strong>Additional Notes:</strong> ${application.notes}</p>` : ''}
        <br>
        <p>Best regards,<br>CareerConnect Lesotho Team</p>
      </div>
    `
  }),

  // Job application notification
  jobApplication: (user, job) => ({
    subject: 'New Job Opportunity - CareerConnect Lesotho',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Job Match Found!</h2>
        <p>Dear ${user.firstName} ${user.lastName},</p>
        <p>We found a job opportunity that matches your profile:</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0;">${job.title}</h3>
          <p><strong>Company:</strong> ${job.companyName}</p>
          <p><strong>Location:</strong> ${job.location}</p>
          <p><strong>Type:</strong> ${job.type}</p>
          <p><strong>Application Deadline:</strong> ${new Date(job.applicationDeadline).toLocaleDateString()}</p>
        </div>
        <p>Log in to your account to view more details and apply.</p>
        <br>
        <p>Best regards,<br>CareerConnect Lesotho Team</p>
      </div>
    `
  })
};

// Email service functions
export const emailService = {
  // Send email with template
  sendTemplateEmail: async (to, templateName, data) => {
    try {
      const template = emailTemplates[templateName];
      if (!template) {
        throw new Error(`Email template '${templateName}' not found`);
      }

      const emailContent = template(data.user, data.link || data.application || data.job);

      const mailOptions = {
        from: `"CareerConnect Lesotho" <${process.env.EMAIL_USER}>`,
        to,
        subject: emailContent.subject,
        html: emailContent.html
      };

      const result = await transporter.sendMail(mailOptions);
      console.log(`Email sent to ${to}: ${result.messageId}`);
      return result;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  },

  // Send custom email
  sendEmail: async (to, subject, html, text = '') => {
    try {
      const mailOptions = {
        from: `"CareerConnect Lesotho" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
        html
      };

      const result = await transporter.sendMail(mailOptions);
      console.log(`Email sent to ${to}: ${result.messageId}`);
      return result;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  },

  // Send bulk emails
  sendBulkEmails: async (recipients, templateName, dataGenerator) => {
    const results = [];
    
    for (const recipient of recipients) {
      try {
        const data = dataGenerator(recipient);
        const result = await emailService.sendTemplateEmail(recipient.email, templateName, data);
        results.push({ recipient, success: true, result });
      } catch (error) {
        results.push({ recipient, success: false, error: error.message });
      }
    }

    return results;
  }
};

export default emailService;