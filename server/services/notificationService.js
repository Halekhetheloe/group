import { emailService as emailConfig } from '../config/email.js';
import { db } from '../config/firebase-admin.js';
import { collections } from '../config/database.js';

class EmailService {
  constructor() {
    this.transporter = emailConfig.transporter;
    this.templates = emailConfig.emailTemplates;
  }

  // Send email with template
  async sendTemplateEmail(to, templateName, data) {
    try {
      const template = this.templates[templateName];
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

      const result = await this.transporter.sendMail(mailOptions);
      
      // Log email sent
      await this.logEmailSent(to, templateName, result.messageId, true);
      
      console.log(`Email sent to ${to}: ${result.messageId}`);
      return result;
    } catch (error) {
      // Log email failure
      await this.logEmailSent(to, templateName, null, false, error.message);
      
      console.error('Error sending email:', error);
      throw error;
    }
  }

  // Send custom email
  async sendEmail(to, subject, html, text = '') {
    try {
      const mailOptions = {
        from: `"CareerConnect Lesotho" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
        html
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      // Log email sent
      await this.logEmailSent(to, 'custom', result.messageId, true);
      
      console.log(`Email sent to ${to}: ${result.messageId}`);
      return result;
    } catch (error) {
      // Log email failure
      await this.logEmailSent(to, 'custom', null, false, error.message);
      
      console.error('Error sending email:', error);
      throw error;
    }
  }

  // Send bulk emails
  async sendBulkEmails(recipients, templateName, dataGenerator) {
    const results = [];
    const batchSize = 10; // Send 10 emails at a time to avoid rate limiting
    
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      const batchPromises = batch.map(recipient => 
        this.sendTemplateEmail(recipient.email, templateName, dataGenerator(recipient))
          .then(result => ({
            recipient,
            success: true,
            messageId: result.messageId
          }))
          .catch(error => ({
            recipient,
            success: false,
            error: error.message
          }))
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Add delay between batches to avoid rate limiting
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  // Send application status update
  async sendApplicationStatusUpdate(application, student, course, institution, status) {
    try {
      const templateName = 'admissionDecision';
      const data = {
        user: student,
        application: {
          courseName: course.name,
          institutionName: institution.name,
          status: status,
          notes: application.notes || ''
        }
      };

      return await this.sendTemplateEmail(student.email, templateName, data);
    } catch (error) {
      console.error('Error sending application status update:', error);
      throw error;
    }
  }

  // Send job match notification
  async sendJobMatchNotification(student, job, company, matchScore) {
    try {
      const templateName = 'jobApplication';
      const data = {
        user: student,
        job: {
          title: job.title,
          companyName: company.name,
          location: job.location,
          type: job.type,
          applicationDeadline: job.applicationDeadline
        }
      };

      return await this.sendTemplateEmail(student.email, templateName, data);
    } catch (error) {
      console.error('Error sending job match notification:', error);
      throw error;
    }
  }

  // Send password reset email
  async sendPasswordReset(user, resetLink) {
    try {
      const templateName = 'passwordReset';
      const data = {
        user,
        link: resetLink
      };

      return await this.sendTemplateEmail(user.email, templateName, data);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }

  // Send email verification
  async sendEmailVerification(user, verificationLink) {
    try {
      const templateName = 'verifyEmail';
      const data = {
        user,
        link: verificationLink
      };

      return await this.sendTemplateEmail(user.email, templateName, data);
    } catch (error) {
      console.error('Error sending email verification:', error);
      throw error;
    }
  }

  // Send application confirmation
  async sendApplicationConfirmation(student, application, course, institution) {
    try {
      const templateName = 'applicationSubmitted';
      const data = {
        user: student,
        application: {
          courseName: course.name,
          institutionName: institution.name,
          appliedAt: application.appliedAt
        }
      };

      return await this.sendTemplateEmail(student.email, templateName, data);
    } catch (error) {
      console.error('Error sending application confirmation:', error);
      throw error;
    }
  }

  // Log email sent to database
  async logEmailSent(to, template, messageId, success, error = null) {
    try {
      const emailLog = {
        to,
        template,
        messageId,
        success,
        error,
        sentAt: new Date()
      };

      await db.collection('email_logs').add(emailLog);
    } catch (logError) {
      console.error('Error logging email:', logError);
      // Don't throw error for logging failures
    }
  }

  // Get email statistics
  async getEmailStats(days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const snapshot = await db.collection('email_logs')
        .where('sentAt', '>=', startDate)
        .get();

      const stats = {
        total: snapshot.size,
        successful: 0,
        failed: 0,
        byTemplate: {},
        byDay: {}
      };

      snapshot.forEach(doc => {
        const log = doc.data();
        
        if (log.success) {
          stats.successful++;
        } else {
          stats.failed++;
        }

        // Count by template
        stats.byTemplate[log.template] = (stats.byTemplate[log.template] || 0) + 1;

        // Count by day
        const day = log.sentAt.toDate().toISOString().split('T')[0];
        stats.byDay[day] = (stats.byDay[day] || 0) + 1;
      });

      stats.successRate = stats.total > 0 ? (stats.successful / stats.total) * 100 : 0;

      return stats;
    } catch (error) {
      console.error('Error getting email stats:', error);
      throw error;
    }
  }

  // Verify email service configuration
  async verifyConfiguration() {
    try {
      await this.transporter.verify();
      return {
        success: true,
        message: 'Email service is properly configured'
      };
    } catch (error) {
      return {
        success: false,
        message: `Email service configuration error: ${error.message}`
      };
    }
  }
}

export default new EmailService();