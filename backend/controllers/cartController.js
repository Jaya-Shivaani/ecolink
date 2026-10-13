const Cart = require('../models/Cart');
const Product = require('../models/Product');

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate({
      path: 'items.product',
      select: 'name price images category stock isEcoFriendly seller',
      populate: { path: 'seller', select: 'name sellerProfile location' },
    });

    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    // Format items payload for frontend compatibility
    const items = cart.items
      .filter((item) => item.product != null)
      .map((item) => ({
        _id: item.product._id,
        name: item.product.name,
        price: item.product.price,
        images: item.product.images,
        category: item.product.category,
        stock: item.product.stock,
        isEcoFriendly: item.product.isEcoFriendly,
        seller: item.product.seller,
        qty: item.qty,
      }));

    res.json({ success: true, cart: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add item to cart or update quantity
// @route   POST /api/cart
// @access  Private
exports.addToCart = async (req, res) => {
  try {
    const { productId, qty = 1 } = req.body;
    const numQty = Number(qty);

    if (isNaN(numQty) || numQty <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be a positive number' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Self-purchase prevention: seller cannot add their own product to cart
    if (product.seller.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot purchase your own product.',
      });
    }

    if (product.stock < numQty) {
      return res.status(400).json({ success: false, message: 'Requested quantity exceeds available stock' });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product && item.product.toString() === productId.toString()
    );

    if (itemIndex > -1) {
      const newQty = cart.items[itemIndex].qty + numQty;
      if (product.stock < newQty) {
        return res.status(400).json({ success: false, message: 'Total cart quantity exceeds stock' });
      }
      cart.items[itemIndex].qty = newQty;
      cart.items[itemIndex].price = product.price;
    } else {
      cart.items.push({
        product: productId,
        qty: numQty,
        price: product.price,
      });
    }

    await cart.save();

    // Return populated cart
    return exports.getCart(req, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update quantity of specific item in cart
// @route   PUT /api/cart/:productId
// @access  Private
exports.updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { qty } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.stock < qty) {
      return res.status(400).json({ success: false, message: 'Requested quantity exceeds available stock' });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product && item.product.toString() === productId.toString()
    );

    if (itemIndex > -1) {
      if (qty <= 0) {
        cart.items.splice(itemIndex, 1);
      } else {
        cart.items[itemIndex].qty = Number(qty);
      }
      await cart.save();
    }

    return exports.getCart(req, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:productId
// @access  Private
exports.removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    let cart = await Cart.findOne({ user: req.user._id });

    if (cart) {
      cart.items = cart.items.filter(
        (item) => item.product && item.product.toString() !== productId.toString()
      );
      await cart.save();
    }

    return exports.getCart(req, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Clear entire cart
// @route   DELETE /api/cart
// @access  Private
exports.clearCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    res.json({ success: true, cart: [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
