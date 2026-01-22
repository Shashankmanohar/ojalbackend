import nodemailer from 'nodemailer';

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

// Send email function
export const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `Ojal <${process.env.EMAIL_FROM}>`,
      to: options.email,
      subject: options.subject,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending failed:', error);
    throw new Error('Email could not be sent');
  }
};

// OTP email template for password reset
export const getOTPEmailTemplate = (otp, userName) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f9f9f9;
        }
        .content {
          background-color: white;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .otp-box {
          background-color: #f0f8ff;
          border: 2px dashed #4CAF50;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          margin: 20px 0;
        }
        .otp-code {
          font-size: 32px;
          font-weight: bold;
          color: #4CAF50;
          letter-spacing: 8px;
          font-family: 'Courier New', monospace;
        }
        .warning {
          background-color: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 12px;
          margin: 15px 0;
        }
        .footer {
          margin-top: 20px;
          font-size: 12px;
          color: #666;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="content">
          <h2>Password Reset OTP</h2>
          <p>Hi ${userName || 'there'},</p>
          <p>You requested to reset your password. Use the OTP below to proceed:</p>
          
          <div class="otp-box">
            <p style="margin: 0; font-size: 14px; color: #666;">Your OTP Code</p>
            <div class="otp-code">${otp}</div>
          </div>
          
          <div class="warning">
            <strong>⏰ Important:</strong> This OTP will expire in <strong>10 minutes</strong>.
          </div>
          
          <p>If you didn't request a password reset, please ignore this email and ensure your account is secure.</p>
          <p>Best regards,<br>Ojal Team</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply.</p>
          <p>For security reasons, never share this OTP with anyone.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Order confirmation email template
export const getOrderConfirmationEmailTemplate = (order, userName) => {
  const itemsHtml = order.orderItems
    .map(
      (item) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        <strong>${item.title}</strong><br>
        <span style="color: #666; font-size: 14px;">Qty: ${item.quantity}</span>
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
        ₹${item.price.toFixed(2)}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
        ₹${(item.price * item.quantity).toFixed(2)}
      </td>
    </tr>
  `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f9f9f9;
        }
        .content {
          background-color: white;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 8px 8px 0 0;
          text-align: center;
        }
        .order-id {
          background-color: #f0f8ff;
          border-left: 4px solid #4CAF50;
          padding: 15px;
          margin: 20px 0;
          font-size: 16px;
        }
        .items-table {
          width: 100%;
          margin: 20px 0;
          border-collapse: collapse;
        }
        .items-table th {
          background-color: #f5f5f5;
          padding: 12px;
          text-align: left;
          border-bottom: 2px solid #ddd;
        }
        .total-section {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 2px solid #ddd;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
        }
        .grand-total {
          font-size: 20px;
          font-weight: bold;
          color: #4CAF50;
          padding: 15px;
          background-color: #f0f8ff;
          border-radius: 5px;
          margin-top: 10px;
        }
        .address-box {
          background-color: #f9f9f9;
          padding: 15px;
          border-radius: 5px;
          margin: 15px 0;
        }
        .footer {
          margin-top: 20px;
          font-size: 12px;
          color: #666;
          text-align: center;
        }
        .success-icon {
          font-size: 48px;
          color: #4CAF50;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="success-icon">✓</div>
          <h1 style="margin: 10px 0;">Order Confirmed!</h1>
          <p style="margin: 5px 0;">Thank you for your purchase</p>
        </div>
        <div class="content">
          <p>Hi ${userName || "there"},</p>
          <p>Great news! Your order has been confirmed and is being processed.</p>
          
          <div class="order-id">
            <strong>Order ID:</strong> ${order._id}<br>
            <strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })}
          </div>

          <h3>Order Items</h3>
          <table class="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th style="text-align: right;">Price</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="total-section">
            <div class="total-row">
              <span>Items Total:</span>
              <span>₹${order.pricing.itemsPrice.toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>Tax:</span>
              <span>₹${order.pricing.taxPrice.toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>Shipping:</span>
              <span>₹${order.pricing.shippingPrice.toFixed(2)}</span>
            </div>
            <div class="grand-total">
              <div style="display: flex; justify-content: space-between;">
                <span>Grand Total:</span>
                <span>₹${order.pricing.totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <h3>Shipping Address</h3>
          <div class="address-box">
            <strong>${order.shippingAddress.fullName}</strong><br>
            ${order.shippingAddress.addressLine1}<br>
            ${order.shippingAddress.addressLine2 ? order.shippingAddress.addressLine2 + "<br>" : ""}
            ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}<br>
            ${order.shippingAddress.country}<br>
            Phone: ${order.shippingAddress.phone}
          </div>

          <p>We'll send you another email once your order has been shipped.</p>
          <p>Best regards,<br>Ojal Team</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply.</p>
          <p>If you have any questions, please contact our support team.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Order cancellation email template
export const getOrderCancellationEmailTemplate = (order, userName) => {
  const itemsHtml = order.orderItems
    .map(
      (item) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        <strong>${item.title}</strong><br>
        <span style="color: #666; font-size: 14px;">Qty: ${item.quantity}</span>
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
        ₹${(item.price * item.quantity).toFixed(2)}
      </td>
    </tr>
  `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f9f9f9;
        }
        .content {
          background-color: white;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
          padding: 20px;
          border-radius: 8px 8px 0 0;
          text-align: center;
        }
        .order-id {
          background-color: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 15px;
          margin: 20px 0;
          font-size: 16px;
        }
        .items-table {
          width: 100%;
          margin: 20px 0;
          border-collapse: collapse;
        }
        .items-table th {
          background-color: #f5f5f5;
          padding: 12px;
          text-align: left;
          border-bottom: 2px solid #ddd;
        }
        .refund-info {
          background-color: #d4edda;
          border-left: 4px solid #28a745;
          padding: 15px;
          margin: 20px 0;
          border-radius: 5px;
        }
        .footer {
          margin-top: 20px;
          font-size: 12px;
          color: #666;
          text-align: center;
        }
        .cancel-icon {
          font-size: 48px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="cancel-icon">✕</div>
          <h1 style="margin: 10px 0;">Order Cancelled</h1>
          <p style="margin: 5px 0;">Your order has been cancelled successfully</p>
        </div>
        <div class="content">
          <p>Hi ${userName || "there"},</p>
          <p>Your order has been cancelled as requested.</p>
          
          <div class="order-id">
            <strong>Order ID:</strong> ${order._id}<br>
            <strong>Cancelled On:</strong> ${new Date(order.cancelledAt).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })}
          </div>

          <h3>Cancelled Items</h3>
          <table class="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="refund-info">
            <strong>💰 Refund Information</strong><br>
            <p style="margin: 10px 0 0 0;">
              ${order.paymentInfo.paymentStatus === "completed"
      ? `Your refund of <strong>₹${order.pricing.totalPrice.toFixed(2)}</strong> will be processed within 5-7 business days to your original payment method.`
      : "No payment was processed for this order, so no refund is necessary."
    }
            </p>
          </div>

          <p>If you have any questions about this cancellation, please don't hesitate to contact our support team.</p>
          <p>We hope to serve you again soon!</p>
          <p>Best regards,<br>Ojal Team</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply.</p>
          <p>For assistance, please contact our support team.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

