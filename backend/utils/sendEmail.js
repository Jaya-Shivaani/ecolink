const nodemailer = require('nodemailer');

// Initialize Transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

/**
 * Generic Mail Sender
 */
const sendMail = async ({ to, subject, html, text }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('[MAIL SERVICE] EMAIL_USER or EMAIL_PASS not configured. Skipping email.');
    return false;
  }

  try {
    const transporter = createTransporter();
    const mailOptions = {
      from: `"EcoLink Marketplace" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text: text || '',
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[MAIL SERVICE] Email successfully sent to ${to}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[MAIL SERVICE ERROR] Failed to send email to ${to}:`, error.message);
    return false;
  }
};

/**
 * 1. Order Confirmation Email (To Customer)
 */
const sendOrderConfirmationEmail = async ({ order, user }) => {
  const itemsHtml = order.orderItems
    .map(
      (item) => `
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 10px 0; font-size: 14px; color: #1e293b;">
        <strong>${item.name}</strong>
      </td>
      <td style="padding: 10px 0; text-align: center; font-size: 14px; color: #64748b;">
        x${item.qty}
      </td>
      <td style="padding: 10px 0; text-align: right; font-size: 14px; color: #0f172a; font-weight: bold;">
        ₹${item.price * item.qty}
      </td>
    </tr>
  `
    )
    .join('');

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
      <div style="background: linear-gradient(135deg, #166534, #15803d); padding: 30px 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">EcoLink Marketplace</h1>
        <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;">Sustainable • Hyperlocal • Direct from Growers</p>
      </div>

      <div style="padding: 24px 28px;">
        <h2 style="font-size: 18px; color: #0f172a; margin-top: 0;">Order Confirmed! 🎉</h2>
        <p style="font-size: 14px; color: #475569; line-height: 1.6;">
          Hi <strong>${user?.name || 'Customer'}</strong>, thank you for supporting sustainable local producers! Your order has been placed successfully.
        </p>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px;">
            <span style="color: #64748b;">Order Reference ID:</span>
            <strong style="color: #0f172a; font-family: monospace;">#${order._id.toString().slice(-8).toUpperCase()}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px;">
            <span style="color: #64748b;">Payment Method:</span>
            <strong style="color: ${order.isPaid ? '#15803d' : '#d97706'};">${order.paymentMethod} (${order.isPaid ? 'Paid ✓' : 'Pending'})</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px;">
            <span style="color: #64748b;">Expected Delivery:</span>
            <strong style="color: #15803d;">${order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '4 Business Days'}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 13px;">
            <span style="color: #64748b;">Delivery Status:</span>
            <strong style="color: #2563eb;">${order.deliveryStatus || order.status || 'Processing'}</strong>
          </div>
        </div>

        <h3 style="font-size: 15px; color: #1e293b; margin-bottom: 10px; border-bottom: 2px solid #f1f5f9; padding-bottom: 6px;">Order Summary</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
          <thead>
            <tr style="text-align: left; color: #94a3b8; font-size: 12px; border-bottom: 1px solid #cbd5e1;">
              <th style="padding-bottom: 6px;">Item</th>
              <th style="padding-bottom: 6px; text-align: center;">Qty</th>
              <th style="padding-bottom: 6px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="border-top: 2px dashed #e2e8f0; padding-top: 12px; margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; font-size: 13px; color: #64748b; margin-bottom: 4px;">
            <span>Subtotal:</span>
            <span>₹${order.itemsPrice || order.totalPrice}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 13px; color: #64748b; margin-bottom: 6px;">
            <span>Shipping:</span>
            <span>${order.shippingPrice === 0 ? 'FREE' : `₹${order.shippingPrice}`}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; color: #0f172a; border-top: 1px solid #e2e8f0; padding-top: 8px;">
            <span>Grand Total:</span>
            <span style="color: #15803d;">₹${order.totalPrice}</span>
          </div>
        </div>

        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 14px; font-size: 13px; color: #166534; margin-bottom: 24px;">
          📍 <strong>Shipping Address:</strong><br />
          ${typeof order.shippingAddress === 'string' ? order.shippingAddress : (order.shippingAddress?.address || '') + ', ' + (order.shippingAddress?.city || '')}
        </div>

        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 30px;">
          Have questions? Reach out to support at <a href="mailto:${process.env.EMAIL_USER}" style="color: #15803d; text-decoration: none;">${process.env.EMAIL_USER}</a>
        </p>
      </div>
    </div>
  `;

  return sendMail({
    to: user.email,
    subject: `Order Confirmation #${order._id.toString().slice(-8).toUpperCase()} - EcoLink`,
    html,
  });
};

/**
 * 2. New Order Notification (To Seller)
 */
const sendSellerNewOrderEmail = async ({ order, seller, buyer }) => {
  if (!seller?.email) return false;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px;">
      <h2 style="color: #166534; margin-top: 0;">New Order Received! 🛒</h2>
      <p style="color: #334155; font-size: 14px;">
        Hello <strong>${seller.name || 'Seller'}</strong>, you have received a new order on EcoLink!
      </p>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; margin: 16px 0; font-size: 13px;">
        <div><strong>Order ID:</strong> #${order._id.toString().slice(-8).toUpperCase()}</div>
        <div><strong>Customer Name:</strong> ${buyer?.name || 'Customer'}</div>
        <div><strong>Total Value:</strong> ₹${order.totalPrice}</div>
        <div><strong>Payment Mode:</strong> ${order.paymentMethod}</div>
      </div>
      <p style="font-size: 13px; color: #64748b;">
        Please log in to your EcoLink Seller Dashboard to review the order details, prepare the package, and update dispatch tracking.
      </p>
    </div>
  `;

  return sendMail({
    to: seller.email,
    subject: `New EcoLink Order Received #${order._id.toString().slice(-8).toUpperCase()}`,
    html,
  });
};

/**
 * 3. Order Status Update Email (Shipped / Delivered)
 */
const sendOrderStatusEmail = async ({ order, user, newStatus }) => {
  if (!user?.email) return false;

  const statusColors = {
    Shipped: '#2563eb',
    Delivered: '#16a34a',
    Processing: '#f59e0b',
    Cancelled: '#dc2626',
  };

  const currentColor = statusColors[newStatus] || '#166534';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px;">
      <h2 style="color: #0f172a; margin-top: 0;">Order Status Update 📦</h2>
      <p style="color: #475569; font-size: 14px;">
        Hi <strong>${user.name || 'Customer'}</strong>, your order status has been updated:
      </p>
      <div style="text-align: center; margin: 20px 0;">
        <span style="display: inline-block; background-color: ${currentColor}; color: #ffffff; padding: 8px 18px; border-radius: 20px; font-weight: bold; font-size: 15px;">
          ${newStatus}
        </span>
      </div>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; font-size: 13px; color: #334155;">
        <div><strong>Order ID:</strong> #${order._id.toString().slice(-8).toUpperCase()}</div>
        <div><strong>Total Amount:</strong> ₹${order.totalPrice}</div>
        <div><strong>Delivery Address:</strong> ${typeof order.shippingAddress === 'string' ? order.shippingAddress : (order.shippingAddress?.address || '')}</div>
      </div>
    </div>
  `;

  return sendMail({
    to: user.email,
    subject: `Order #${order._id.toString().slice(-8).toUpperCase()} is now ${newStatus} - EcoLink`,
    html,
  });
};

/**
 * 4. Workshop / Event RSVP Ticket Email
 */
const sendWorkshopTicketEmail = async ({ event, user }) => {
  if (!user?.email) return false;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; background: #ffffff; border: 1px solid #bbf7d0; border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #15803d, #047857); padding: 24px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 22px;">🌱 Workshop RSVP Confirmed!</h1>
        <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">EcoLink Community Learning Network</p>
      </div>

      <div style="padding: 24px;">
        <p style="font-size: 14px; color: #334155;">Hi <strong>${user.name || 'Gardener'}</strong>,</p>
        <p style="font-size: 14px; color: #334155; line-height: 1.6;">
          You're all set! Your registration for <strong>"${event.title}"</strong> is confirmed.
        </p>

        <div style="background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 12px; padding: 18px; margin: 18px 0; font-size: 13px; color: #14532d;">
          <div style="margin-bottom: 6px;">📅 <strong>Date:</strong> ${new Date(event.date).toLocaleDateString()} at ${event.time}</div>
          <div style="margin-bottom: 6px;">📍 <strong>Format:</strong> ${event.locationType}</div>
          <div style="margin-bottom: 6px;">🔗 <strong>Venue / Link:</strong> ${event.address}</div>
          <div>🎟️ <strong>Admission Price:</strong> ${event.price === 0 ? 'FREE Admission' : `₹${event.price}`}</div>
        </div>

        <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
          ${event.description}
        </p>

        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px;">
          EcoLink Hyperlocal Community • Empowering Urban and Rural Micro-Growers
        </p>
      </div>
    </div>
  `;

  return sendMail({
    to: user.email,
    subject: `Confirmed RSVP: ${event.title} - EcoLink Community`,
    html,
  });
};

/**
 * 5. Password Reset OTP Email
 */
const sendPasswordResetOTPEmail = async ({ email, name, otp }) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #fafdfb;">
      <div style="text-align: center; margin-bottom: 16px;">
        <h2 style="color: #166534; margin: 0;">EcoLink Security</h2>
        <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Password Reset Verification Code</p>
      </div>
      <p style="font-size: 14px; color: #334155;">Hi <strong>${name || 'User'}</strong>,</p>
      <p style="font-size: 14px; color: #475569; line-height: 1.5;">
        You requested a password reset for your EcoLink account. Please use the following 6-digit verification code:
      </p>
      <div style="font-size: 28px; font-weight: bold; text-align: center; background-color: #f0fdf4; border: 2px dashed #16a34a; border-radius: 12px; padding: 14px; margin: 24px 0; color: #166534; letter-spacing: 6px;">
        ${otp}
      </div>
      <p style="color: #64748b; font-size: 12px; text-align: center;">
        This code is valid for 15 minutes. If you did not make this request, your account remains secure and you can ignore this email.
      </p>
    </div>
  `;

  return sendMail({
    to: email,
    subject: 'EcoLink Password Reset OTP Code',
    html,
  });
};

/**
 * 6. Plant Adoption / Swap Request Email (To Owner)
 */
const sendPlantAdoptionRequestEmail = async ({ listing, requester, owner }) => {
  if (!owner?.email) return false;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      <h2 style="color: #166534; margin-top: 0;">New Plant Request! 🌿</h2>
      <p style="font-size: 14px; color: #334155;">
        Hello <strong>${owner.name || 'Plant Lover'}</strong>,
      </p>
      <p style="font-size: 14px; color: #334155; line-height: 1.5;">
        <strong>${requester.name}</strong> has requested to adopt or exchange for your listing: <strong>"${listing.name}"</strong> (${listing.type}).
      </p>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; margin: 16px 0; font-size: 13px;">
        <div><strong>Requester:</strong> ${requester.name} (${requester.email})</div>
        <div><strong>Phone:</strong> ${requester.phoneNumber || 'Available on platform'}</div>
        <div><strong>Delivery Preference:</strong> ${listing.deliveryOption || 'Pickup Only'}</div>
      </div>
      <p style="font-size: 13px; color: #64748b;">
        Please log in to EcoLink Community Exchange to accept or coordinate the handover.
      </p>
    </div>
  `;

  return sendMail({
    to: owner.email,
    subject: `New Request for Plant: ${listing.name} - EcoLink`,
    html,
  });
};

module.exports = {
  sendMail,
  sendOrderConfirmationEmail,
  sendSellerNewOrderEmail,
  sendOrderStatusEmail,
  sendWorkshopTicketEmail,
  sendPasswordResetOTPEmail,
  sendPlantAdoptionRequestEmail,
};
