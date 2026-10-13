const crypto = require('crypto');
const Razorpay = require('razorpay');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Setting = require('../models/Setting');
const Cart = require('../models/Cart');
const {
  sendOrderConfirmationEmail,
  sendSellerNewOrderEmail,
  sendOrderStatusEmail,
} = require('../utils/sendEmail');

// Helper: Calculate dynamic expected delivery date (based on DB Setting or default 4 days)
async function calculateExpectedDeliveryDate(orderDate = new Date()) {
  let deliveryDays = 4;
  try {
    const setting = await Setting.findOne({
      key: { $in: ['estimatedDeliveryDays', 'deliveryEstimateDays', 'defaultDeliveryDays'] },
    });
    if (setting && setting.value != null && !isNaN(Number(setting.value))) {
      deliveryDays = Math.max(1, Number(setting.value));
    }
  } catch (err) {
    deliveryDays = 4;
  }
  const expectedDate = new Date(orderDate);
  expectedDate.setDate(expectedDate.getDate() + deliveryDays);
  return expectedDate;
}

// @desc    Get Razorpay Key for frontend client initialization
// @route   GET /api/orders/razorpay/key
// @access  Private (Buyer)
exports.getRazorpayKey = async (req, res) => {
  try {
    const key = process.env.RAZORPAY_KEY_ID;
    if (!key) {
      return res.status(500).json({ success: false, message: 'Razorpay Key ID is not configured' });
    }
    res.json({ success: true, key });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create Razorpay Order (calculates amount securely on backend)
// @route   POST /api/orders/razorpay/create-order
// @access  Private (Buyer)
exports.createRazorpayOrder = async (req, res) => {
  try {
    const { orderItems, shippingAddress, isGift, giftDetails } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ success: false, message: 'No order items' });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ success: false, message: 'Razorpay credentials not configured on server' });
    }

    // Validate products from DB and calculate true subtotal securely
    let calculatedSubtotal = 0;
    const validatedItems = [];

    for (const item of orderItems) {
      const prod = await Product.findById(item.product);
      if (!prod) {
        return res.status(404).json({ success: false, message: `Product not found: ${item.name || item.product}` });
      }

      // Self-purchase prevention: buyer cannot purchase their own product
      if (prod.seller.toString() === req.user._id.toString()) {
        return res.status(400).json({
          success: false,
          message: `You cannot purchase your own product: "${prod.name}".`,
        });
      }

      const itemQty = Number(item.qty) || 1;
      if (prod.stock < itemQty) {
        return res.status(400).json({ success: false, message: `Stock exceeded for "${prod.name}". Available: ${prod.stock}` });
      }
      calculatedSubtotal += prod.price * itemQty;
      validatedItems.push({
        product: prod._id,
        name: prod.name,
        qty: itemQty,
        price: prod.price,
        image: prod.images && prod.images[0] ? prod.images[0] : '',
      });
    }

    const shippingPrice = calculatedSubtotal > 1000 ? 0 : 50;
    const finalTotal = calculatedSubtotal + shippingPrice;

    // Razorpay amount is in paise (1 INR = 100 paise)
    const amountInPaise = Math.round(finalTotal * 100);

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const receiptId = `rcpt_${Date.now().toString().slice(-8)}_${req.user._id.toString().slice(-6)}`;
    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: receiptId,
      notes: {
        buyerId: req.user._id.toString(),
        buyerEmail: req.user.email || '',
      },
    };

    const rzpOrder = await razorpay.orders.create(options);

    res.json({
      success: true,
      orderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
      subtotal: calculatedSubtotal,
      shippingPrice,
      totalPrice: finalTotal,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify Razorpay Payment Signature and Create Order
// @route   POST /api/orders/razorpay/verify-payment
// @access  Private (Buyer)
exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderItems,
      shippingAddress,
      isGift,
      giftDetails,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing Razorpay payment identifiers' });
    }

    // 1. Verify HMAC SHA256 signature
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature. Verification failed.',
      });
    }

    // 2. Prevent duplicate order creation on duplicate requests/retries
    const existingOrder = await Order.findOne({ razorpayPaymentId: razorpay_payment_id });
    if (existingOrder) {
      return res.json({
        success: true,
        order: existingOrder,
        alreadyProcessed: true,
        message: 'Order already processed',
      });
    }

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ success: false, message: 'No order items' });
    }

    let shippingAddressStr = '';
    if (typeof shippingAddress === 'string') {
      shippingAddressStr = shippingAddress.trim();
    } else if (typeof shippingAddress === 'object' && shippingAddress !== null) {
      const parts = [
        shippingAddress.address,
        shippingAddress.city,
        shippingAddress.postalCode,
        shippingAddress.country,
        shippingAddress.phoneNumber ? `Phone: ${shippingAddress.phoneNumber}` : '',
      ].filter((p) => p && String(p).trim() !== '');
      shippingAddressStr = parts.join(', ').trim();
    }

    if (!shippingAddressStr) {
      return res.status(400).json({ success: false, message: 'Please provide a complete shipping address' });
    }

    // 3. Recalculate true amount strictly on backend
    let calculatedSubtotal = 0;
    const validatedOrderItems = [];

    for (const item of orderItems) {
      const prod = await Product.findById(item.product);
      if (!prod) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }

      // Self-purchase prevention: buyer cannot purchase their own product
      if (prod.seller.toString() === req.user._id.toString()) {
        return res.status(400).json({
          success: false,
          message: `You cannot purchase your own product: "${prod.name}".`,
        });
      }

      const itemQty = Number(item.qty) || 1;
      if (prod.stock < itemQty) {
        return res.status(400).json({ success: false, message: `Stock exceeded for "${prod.name}"` });
      }
      calculatedSubtotal += prod.price * itemQty;
      validatedOrderItems.push({
        product: prod._id,
        name: prod.name,
        qty: itemQty,
        price: prod.price,
        image: prod.images && prod.images[0] ? prod.images[0] : (item.image || ''),
      });
    }

    const shippingPrice = calculatedSubtotal > 1000 ? 0 : 50;
    const finalTotal = calculatedSubtotal + shippingPrice;

    // 4. Determine seller and SHG details
    const firstProduct = await Product.findById(validatedOrderItems[0].product);
    const sellerId = firstProduct.seller;

    const sellerUser = await User.findById(sellerId);
    const isSHGOrder = !!(
      sellerUser?.sellerProfile?.isSHG ||
      sellerUser?.sellerProfile?.category === 'Self Help Group (SHG)' ||
      sellerUser?.sellerProfile?.sellerType === 'SHG Member'
    );

    let commissionRate = 0;
    let commissionAmount = 0;
    let sellerEarnings = Number(finalTotal) || 0;

    if (isSHGOrder) {
      let shgRate = 5;
      try {
        const commSetting = await Setting.findOne({ key: 'shgCommissionPercentage' });
        if (commSetting && commSetting.value != null) {
          shgRate = Number(commSetting.value);
        }
      } catch (err) {
        shgRate = 5;
      }
      commissionRate = shgRate;
      commissionAmount = Math.round(((finalTotal * commissionRate) / 100) * 100) / 100;
      sellerEarnings = Math.max(0, Math.round((finalTotal - commissionAmount) * 100) / 100);
    }

    // 5. Calculate dynamic expected delivery date and create confirmed Paid order in database
    const expectedDeliveryDate = await calculateExpectedDeliveryDate();

    const order = new Order({
      buyer: req.user._id,
      seller: sellerId,
      orderItems: validatedOrderItems,
      shippingAddress: shippingAddressStr,
      paymentMethod: 'Online Payment (Razorpay)',
      paymentStatus: 'Paid',
      paidAmount: finalTotal,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      shippingPrice,
      totalPrice: finalTotal,
      status: 'Placed',
      expectedDeliveryDate,
      isGift: !!isGift,
      giftDetails: giftDetails || {},
      trackingUpdates: [
        {
          status: 'Placed',
          comment: `Payment of ₹${finalTotal} verified successfully via Razorpay (Payment ID: ${razorpay_payment_id})`,
        },
      ],
      isSHGOrder,
      commissionRate,
      commissionAmount,
      sellerEarnings,
    });

    const createdOrder = await order.save();

    // 6. Safely update inventory stock
    for (const item of validatedOrderItems) {
      const prod = await Product.findById(item.product);
      if (prod) {
        prod.stock = Math.max(0, prod.stock - item.qty);
        await prod.save();
      }
    }

    // 7. Clear buyer cart in DB
    try {
      let cart = await Cart.findOne({ user: req.user._id });
      if (cart) {
        cart.items = [];
        await cart.save();
      }
    } catch (e) {
      // Non-blocking
    }

    // 8. Trigger real email notifications (non-blocking)
    try {
      sendOrderConfirmationEmail({ order: createdOrder, user: req.user }).catch(() => {});
      if (sellerUser) {
        sendSellerNewOrderEmail({ order: createdOrder, seller: sellerUser, buyer: req.user }).catch(() => {});
      }
    } catch (mailErr) {
      console.error('[Order Mail Notification Error]:', mailErr.message);
    }

    res.status(201).json({ success: true, order: createdOrder });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private (Buyer)
exports.createOrder = async (req, res) => {
  try {
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      shippingPrice,
      totalPrice,
      isGift,
      giftDetails,
    } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ success: false, message: 'No order items' });
    }

    let shippingAddressStr = '';
    if (typeof shippingAddress === 'string') {
      shippingAddressStr = shippingAddress.trim();
    } else if (typeof shippingAddress === 'object' && shippingAddress !== null) {
      const parts = [
        shippingAddress.address,
        shippingAddress.city,
        shippingAddress.postalCode,
        shippingAddress.country,
        shippingAddress.phoneNumber ? `Phone: ${shippingAddress.phoneNumber}` : '',
      ].filter((p) => p && String(p).trim() !== '');
      shippingAddressStr = parts.join(', ').trim();
    }

    if (!shippingAddressStr) {
      return res.status(400).json({ success: false, message: 'Please provide a complete shipping address' });
    }

    // Verify product availability, stock, and self-purchase for all items
    for (const item of orderItems) {
      const prod = await Product.findById(item.product);
      if (!prod) {
        return res.status(404).json({ success: false, message: `Product not found` });
      }

      // Self-purchase prevention: buyer cannot purchase their own product
      if (prod.seller.toString() === req.user._id.toString()) {
        return res.status(400).json({
          success: false,
          message: `You cannot purchase your own product: "${prod.name}".`,
        });
      }

      if (prod.stock < item.qty) {
        return res.status(400).json({ success: false, message: `Stock exceeded for product "${prod.name}"` });
      }
    }

    // Determine the seller (assuming all items are from the same seller for simplicity)
    const firstProduct = await Product.findById(orderItems[0].product);
    const sellerId = firstProduct.seller;

    // Fetch seller to check if SHG member
    const sellerUser = await User.findById(sellerId);
    const isSHGOrder = !!(
      sellerUser?.sellerProfile?.isSHG ||
      sellerUser?.sellerProfile?.category === 'Self Help Group (SHG)' ||
      sellerUser?.sellerProfile?.sellerType === 'SHG Member'
    );

    let commissionRate = 0;
    let commissionAmount = 0;
    let sellerEarnings = Number(totalPrice) || 0;

    if (isSHGOrder) {
      let shgRate = 5;
      try {
        const commSetting = await Setting.findOne({ key: 'shgCommissionPercentage' });
        if (commSetting && commSetting.value != null) {
          shgRate = Number(commSetting.value);
        }
      } catch (err) {
        shgRate = 5;
      }
      commissionRate = shgRate;
      commissionAmount = Math.round(((totalPrice * commissionRate) / 100) * 100) / 100;
      sellerEarnings = Math.max(0, Math.round((totalPrice - commissionAmount) * 100) / 100);
    }

    // Calculate dynamic expected delivery date & create Order
    const expectedDeliveryDate = await calculateExpectedDeliveryDate();

    const order = new Order({
      buyer: req.user._id,
      seller: sellerId,
      orderItems,
      shippingAddress: shippingAddressStr,
      paymentMethod,
      shippingPrice,
      totalPrice,
      status: 'Placed',
      expectedDeliveryDate,
      isGift: !!isGift,
      giftDetails: giftDetails || {},
      trackingUpdates: [{ status: 'Placed', comment: 'Order placed successfully' }],
      isSHGOrder,
      commissionRate,
      commissionAmount,
      sellerEarnings,
    });

    const createdOrder = await order.save();

    // Decrement inventory stock
    for (const item of orderItems) {
      const prod = await Product.findById(item.product);
      if (prod) {
        prod.stock = Math.max(0, prod.stock - item.qty);
        await prod.save();
      }
    }

    // Trigger real email notifications (non-blocking)
    try {
      sendOrderConfirmationEmail({ order: createdOrder, user: req.user }).catch(() => {});
      if (sellerUser) {
        sendSellerNewOrderEmail({ order: createdOrder, seller: sellerUser, buyer: req.user }).catch(() => {});
      }
    } catch (mailErr) {
      console.error('[Order Mail Notification Error]:', mailErr.message);
    }

    res.status(201).json({ success: true, order: createdOrder });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('buyer', 'name email phoneNumber')
      .populate('seller', 'name email sellerProfile location address phoneNumber');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check if the requesting user is the buyer, seller, or admin
    if (
      order.buyer._id.toString() !== req.user._id.toString() &&
      order.seller._id.toString() !== req.user._id.toString() &&
      !req.user.roles.admin
    ) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get logged in buyer orders
// @route   GET /api/orders/myorders
// @access  Private (Buyer)
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user._id })
      .populate('seller', 'name email sellerProfile')
      .sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get seller received orders
// @route   GET /api/orders/sellerorders
// @access  Private (Seller)
exports.getSellerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ seller: req.user._id })
      .populate('buyer', 'name email phoneNumber')
      .sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (Seller or Admin)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, comment } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.seller.toString() !== req.user._id.toString() && !req.user.roles.admin) {
      return res.status(401).json({ success: false, message: 'Not authorized to change order status' });
    }

    // Do not allow updating status if already cancelled
    if (order.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update status of a cancelled order. This order was cancelled and cannot be processed or shipped.',
      });
    }

    order.status = status;
    order.trackingUpdates.push({
      status,
      comment: comment || `Status updated to ${status}`,
    });

    if (status === 'Cancelled') {
      order.cancelledAt = Date.now();
      order.cancelledBy = req.user._id;
      order.cancellationReason = req.body.cancellationReason || 'Cancelled by seller/admin';
      order.cancellationNote = req.body.cancellationNote || '';

      if (order.paymentStatus === 'Paid') {
        order.paymentStatus = 'Refund Pending';
      }

      // Restore stock idempotently
      if (!order.stockRestored && Array.isArray(order.orderItems)) {
        for (const item of order.orderItems) {
          const prodId = item.product?._id || item.product;
          if (prodId && item.qty > 0) {
            await Product.findByIdAndUpdate(prodId, { $inc: { stock: item.qty } });
          }
        }
        order.stockRestored = true;
      }
    } else if (status === 'Delivered') {
      order.deliveredAt = Date.now();
      order.paymentStatus = 'Paid'; // Assumed completed on delivery if COD

      // Update sustainability metrics of the seller
      const seller = await User.findById(order.seller);
      if (seller) {
        seller.sustainabilityScore.ordersCompleted += 1;
        // Count number of plants in order (checking category for Plants)
        let plantsCount = 0;
        for (const item of order.orderItems) {
          const prod = await Product.findById(item.product);
          if (prod && prod.category.toLowerCase().includes('plant')) {
            plantsCount += item.qty;
          }
        }
        seller.sustainabilityScore.plantsSold += plantsCount;
        await seller.save();
      }
    }

    await order.save();

    // Send order status email to buyer (non-blocking)
    try {
      const buyerUser = await User.findById(order.buyer);
      if (buyerUser) {
        sendOrderStatusEmail({ order, user: buyerUser, newStatus: status }).catch(() => {});
      }
    } catch (statusMailErr) {
      console.error('[Order Status Mail Error]:', statusMailErr.message);
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel order by buyer
// @route   PATCH /api/orders/:id/cancel
// @access  Private (Buyer)
exports.cancelOrder = async (req, res) => {
  try {
    const { cancellationReason, cancellationNote } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // 1. Verify order belongs to the authenticated buyer
    if (order.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to cancel this order. Only the buyer who placed the order can cancel it.',
      });
    }

    // 2. Prevent cancelling an already cancelled order
    if (order.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'This order is already cancelled.',
      });
    }

    // 3. Validate eligibility: Buyer can only cancel before Shipped/Dispatched
    // Eligible statuses: 'Placed', 'Accepted', 'Processing'
    const cancellableStatuses = ['Placed', 'Accepted', 'Processing'];
    if (!cancellableStatuses.includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled once it has reached "${order.status}" status. Cancellation is only allowed before shipment.`,
      });
    }

    // 4. Update order status and record cancellation metadata
    const previousStatus = order.status;
    order.status = 'Cancelled';
    order.cancellationReason = cancellationReason || 'Changed my mind';
    order.cancellationNote = cancellationNote ? cancellationNote.trim() : '';
    order.cancelledBy = req.user._id;
    order.cancelledAt = new Date();

    // Append to tracking updates
    order.trackingUpdates.push({
      status: 'Cancelled',
      comment: `Order cancelled by buyer from "${previousStatus}". Reason: ${order.cancellationReason}${
        order.cancellationNote ? ` - ${order.cancellationNote}` : ''
      }`,
      timestamp: new Date(),
    });

    // 5. Payment status update
    if (order.paymentStatus === 'Paid') {
      order.paymentStatus = 'Refund Pending';
    } else if (order.paymentStatus === 'Pending') {
      order.paymentStatus = 'Failed';
    }

    // 6. Restore purchased product stock back to inventory (idempotent check)
    if (!order.stockRestored && Array.isArray(order.orderItems)) {
      for (const item of order.orderItems) {
        const prodId = item.product?._id || item.product;
        if (prodId && item.qty > 0) {
          await Product.findByIdAndUpdate(prodId, {
            $inc: { stock: item.qty },
          });
        }
      }
      order.stockRestored = true;
    }

    await order.save();

    // 7. Send notification email to buyer (non-blocking)
    try {
      sendOrderStatusEmail({
        order,
        user: req.user,
        newStatus: 'Cancelled',
      }).catch(() => {});
    } catch (e) {}

    return res.json({
      success: true,
      message: 'Order cancelled successfully. Product stock has been restored.',
      order,
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
