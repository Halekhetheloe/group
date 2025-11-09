import { emailService } from '../config/email.js';
import { db } from '../config/firebase-admin.js';
import { collections } from '../config/database.js';

export const sendBulkNotifications = async (req, res) => {
  try {
    // Only admin can send bulk notifications
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Only administrators can send bulk notifications'
      });
    }

    const { userRole, subject, message, template } = req.body;

    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_REQUIRED_FIELDS',
        message: 'Subject and message are required'
      });
    }

    let query = db.collection(collections.USERS).where('status', '==', 'active');

    if (userRole) {
      query = query.where('role', '==', userRole);
    }

    const usersSnapshot = await query.get();

    if (usersSnapshot.empty) {
      return res.status(404).json({
        success: false,
        error: 'NO_USERS_FOUND',
        message: 'No users found matching the criteria'
      });
    }

    const results = [];
    let successCount = 0;
    let failureCount = 0;

    // Send emails in batches to avoid overwhelming the email service
    const batchSize = 10;
    const users = [];

    usersSnapshot.forEach(doc => {
      users.push(doc.data());
    });

    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      const batchPromises = batch.map(user => 
        emailService.sendEmail(
          user.email,
          subject,
          message,
          message // plain text version
        ).then(result => ({
          user: { id: user.id, email: user.email },
          success: true,
          messageId: result.messageId
        })).catch(error => ({
          user: { id: user.id, email: user.email },
          success: false,
          error: error.message
        }))
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Count successes and failures
      batchResults.forEach(result => {
        if (result.success) {
          successCount++;
        } else {
          failureCount++;
        }
      });

      // Small delay between batches to avoid rate limiting
      if (i + batchSize < users.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    res.json({
      success: true,
      message: `Bulk notification sent. Success: ${successCount}, Failed: ${failureCount}`,
      summary: {
        total: users.length,
        success: successCount,
        failure: failureCount
      },
      results
    });

  } catch (error) {
    console.error('Send bulk notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'BULK_NOTIFICATION_FAILED',
      message: 'Failed to send bulk notifications'
    });
  }
};

export const sendCustomEmail = async (req, res) => {
  try {
    // Only admin can send custom emails
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Only administrators can send custom emails'
      });
    }

    const { to, subject, message } = req.body;

    if (!to || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_REQUIRED_FIELDS',
        message: 'To, subject, and message are required'
      });
    }

    const result = await emailService.sendEmail(to, subject, message, message);

    res.json({
      success: true,
      message: 'Email sent successfully',
      messageId: result.messageId
    });

  } catch (error) {
    console.error('Send custom email error:', error);
    res.status(500).json({
      success: false,
      error: 'EMAIL_SEND_FAILED',
      message: 'Failed to send email'
    });
  }
};

export const getEmailTemplates = async (req, res) => {
  try {
    // Only admin can access email templates
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Only administrators can access email templates'
      });
    }

    const templates = {
      verifyEmail: {
        name: 'Email Verification',
        description: 'Sent when a user registers to verify their email address',
        variables: ['user', 'verificationLink']
      },
      passwordReset: {
        name: 'Password Reset',
        description: 'Sent when a user requests a password reset',
        variables: ['user', 'resetLink']
      },
      applicationSubmitted: {
        name: 'Application Submitted',
        description: 'Sent when a student submits a course application',
        variables: ['user', 'application']
      },
      admissionDecision: {
        name: 'Admission Decision',
        description: 'Sent when an institution makes an admission decision',
        variables: ['user', 'application']
      },
      jobApplication: {
        name: 'Job Opportunity',
        description: 'Sent to students when matching job opportunities are found',
        variables: ['user', 'job']
      }
    };

    res.json({
      success: true,
      templates
    });

  } catch (error) {
    console.error('Get email templates error:', error);
    res.status(500).json({
      success: false,
      error: 'TEMPLATES_FETCH_FAILED',
      message: 'Failed to fetch email templates'
    });
  }
};

export const testEmailService = async (req, res) => {
  try {
    // Only admin can test email service
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Only administrators can test email service'
      });
    }

    const testEmail = req.user.email;

    const testResult = await emailService.sendEmail(
      testEmail,
      'Test Email - CareerConnect Lesotho',
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Test Email</h2>
          <p>This is a test email from CareerConnect Lesotho.</p>
          <p>If you received this email, the email service is working correctly.</p>
          <br>
          <p>Sent at: ${new Date().toLocaleString()}</p>
        </div>
      `,
      'This is a test email from CareerConnect Lesotho. If you received this email, the email service is working correctly.'
    );

    res.json({
      success: true,
      message: 'Test email sent successfully',
      messageId: testResult.messageId
    });

  } catch (error) {
    console.error('Test email service error:', error);
    res.status(500).json({
      success: false,
      error: 'EMAIL_TEST_FAILED',
      message: 'Failed to send test email'
    });
  }
};

export const getEmailStats = async (req, res) => {
  try {
    // Only admin can access email statistics
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Only administrators can access email statistics'
      });
    }

    // In a production environment, you would query your email service provider's API
    // or store email sending statistics in your database
    
    const stats = {
      sentToday: 0,
      sentThisWeek: 0,
      sentThisMonth: 0,
      deliveryRate: '98.5%',
      bounceRate: '1.2%'
    };

    // This is a placeholder - implement actual statistics based on your email service
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sentEmailsSnapshot = await db.collection('email_logs')
      .where('sentAt', '>=', today)
      .get();

    stats.sentToday = sentEmailsSnapshot.size;

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Get email stats error:', error);
    res.status(500).json({
      success: false,
      error: 'EMAIL_STATS_FETCH_FAILED',
      message: 'Failed to fetch email statistics'
    });
  }
};