const Product = require('../models/Product');
const User = require('../models/User');

// @desc    Get all products (with filters, search, and hyperlocal location)
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res) => {
  try {
    const {
      keyword,
      category,
      yieldType,
      minPrice,
      maxPrice,
      difficulty,
      sunlight,
      water,
      indoorOutdoor,
      latitude,
      longitude,
      maxDistance = 15, // default 15km
    } = req.query;

    let query = { isApproved: true };

    // Search keyword
    if (keyword) {
      query.name = { $regex: keyword, $options: 'i' };
    }

    // Category filter with smart alias support
    if (category) {
      const lowerCat = category.trim().toLowerCase();
      if (lowerCat.includes('decor') || lowerCat.includes('ornamental')) {
        query.$or = [
          { category: 'Decorative / Ornamental Plants' },
          { yieldType: 'Decorative / Ornamental' },
        ];
      } else if (
        lowerCat === 'plants' ||
        lowerCat === 'plants & seeds' ||
        lowerCat === 'indoor plants' ||
        lowerCat === 'outdoor plants'
      ) {
        query.category = {
          $in: [
            'Decorative / Ornamental Plants',
            'Long-Term Yield Plants',
            'Short-Term Yield Plants',
            'Medicinal Plants',
            'Indoor Plants',
            'Outdoor Plants',
            'Plants & Seeds',
            'Plants',
          ],
        };
      } else if (
        lowerCat === 'fertilizers' ||
        lowerCat === 'fertilizer' ||
        lowerCat.includes('compost')
      ) {
        query.category = {
          $in: ['Fertilizers', 'Organic Compost', 'Garden Tools'],
        };
      } else if (
        lowerCat === 'eco products' ||
        lowerCat === 'eco-products' ||
        lowerCat === 'eco_products' ||
        lowerCat === 'eco'
      ) {
        query.category = {
          $in: [
            'Eco-Products',
            'Banana Fibre Bags',
            'Palm Leaf Products',
            'Coconut Coir Products',
            'Bamboo Crafts',
            'Jute Products',
          ],
        };
      } else if (
        lowerCat === 'fmcg' ||
        lowerCat.includes('fmcg') ||
        lowerCat.includes('natural') ||
        lowerCat.includes('farm')
      ) {
        query.category = {
          $in: [
            'FMCG / Farm & Natural Products',
            'FMCG / Natural Products',
            'Herbal Soaps',
            'Essential Oils',
          ],
        };
      } else if (lowerCat.includes('craft') || lowerCat.includes('banana') || lowerCat.includes('bag')) {
        query.category = {
          $in: ['Banana Fibre Bags', 'Eco-Products'],
        };
      } else if (lowerCat.includes('long-term') || lowerCat.includes('long term')) {
        query.$or = [
          { category: 'Long-Term Yield Plants' },
          { yieldType: 'Long-Term Yield' },
        ];
      } else if (lowerCat.includes('short-term') || lowerCat.includes('short term')) {
        query.$or = [
          { category: 'Short-Term Yield Plants' },
          { yieldType: 'Short-Term Yield' },
        ];
      } else if (lowerCat.includes('medicinal') || lowerCat.includes('herb')) {
        query.$or = [
          { category: 'Medicinal Plants' },
          { yieldType: 'Medicinal' },
        ];
      } else if (lowerCat === 'seeds' || lowerCat === 'seed') {
        query.category = 'Seeds';
      } else {
        const escaped = category.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        query.category = { $regex: new RegExp(`^${escaped}$`, 'i') };
      }
    }

    // Yield Type filter
    if (yieldType) {
      const lowerYield = yieldType.trim().toLowerCase();
      if (lowerYield.includes('decor') || lowerYield.includes('ornamental')) {
        query.yieldType = 'Decorative / Ornamental';
      } else if (lowerYield.includes('long')) {
        query.yieldType = 'Long-Term Yield';
      } else if (lowerYield.includes('short')) {
        query.yieldType = 'Short-Term Yield';
      } else if (lowerYield.includes('medicinal')) {
        query.yieldType = 'Medicinal';
      } else {
        const escapedYield = yieldType.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        query.yieldType = { $regex: new RegExp(`^${escapedYield}$`, 'i') };
      }
    }

    // Price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Plant-specific filters
    if (difficulty) {
      query['plantInfo.difficultyLevel'] = difficulty;
    }
    if (sunlight) {
      query['plantInfo.sunlightRequirement'] = sunlight;
    }
    if (water) {
      query['plantInfo.waterRequirement'] = water;
    }
    if (indoorOutdoor) {
      query['plantInfo.indoorOutdoor'] = indoorOutdoor;
    }

    // Hyperlocal Location Filter
    if (latitude && longitude) {
      try {
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);

        // Find sellers within maxDistance (converted to meters)
        const nearbySellers = await User.find({
          location: {
            $near: {
              $geometry: { type: 'Point', coordinates: [lng, lat] },
              $maxDistance: maxDistance * 1000,
            },
          },
        })
          .select('_id')
          .lean();

        const sellerIds = nearbySellers.map((seller) => seller._id);

        // Only restrict by seller if nearby sellers actually have products matching the current filter
        if (sellerIds.length > 0) {
          const testQuery = { ...query, seller: { $in: sellerIds } };
          const hasMatchingProducts = await Product.exists(testQuery);
          if (hasMatchingProducts) {
            query.seller = { $in: sellerIds };
          }
        }
      } catch (geoError) {
        console.error('Geospatial query error, querying without distance filter:', geoError.message);
        // Fallback: don't restrict query.seller, just log error
      }
    }

    const products = await Product.find(query)
      .populate('seller', 'name email sellerProfile location')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, count: products.length, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, message: 'Invalid product ID or product not found' });
    }

    const product = await Product.findById(id).populate(
      'seller',
      'name email sellerProfile location address phoneNumber'
    );

    if (product) {
      res.json({ success: true, product });
    } else {
      res.status(404).json({ success: false, message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private (Seller only)
exports.createProduct = async (req, res) => {
  try {
    let {
      name,
      description,
      price,
      images,
      category,
      yieldType,
      stock,
      plantInfo,
      isEcoFriendly,
      sourceVerification,
    } = req.body;

    name = name ? name.trim() : '';
    description = description ? description.trim() : '';
    category = category ? category.trim() : '';

    if (!name || !description || !category) {
      return res.status(400).json({ success: false, message: 'Name, description, and category are required' });
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      return res.status(400).json({ success: false, message: 'Price must be a positive number' });
    }

    const numStock = Number(stock !== undefined ? stock : 10);
    if (isNaN(numStock) || numStock < 0) {
      return res.status(400).json({ success: false, message: 'Stock must be 0 or greater' });
    }

    // Derive or assign yieldType if not explicitly provided
    let finalYieldType = yieldType || '';
    if (!finalYieldType) {
      if (category === 'Long-Term Yield Plants') finalYieldType = 'Long-Term Yield';
      else if (category === 'Short-Term Yield Plants') finalYieldType = 'Short-Term Yield';
      else if (category === 'Medicinal Plants') finalYieldType = 'Medicinal';
      else if (category === 'Decorative / Ornamental Plants') finalYieldType = 'Decorative / Ornamental';
    }

    const product = new Product({
      seller: req.user._id,
      name,
      description,
      price: numPrice,
      images: images && Array.isArray(images) && images.length > 0 ? images : undefined,
      category,
      yieldType: finalYieldType,
      stock: numStock,
      plantInfo: plantInfo || {},
      isEcoFriendly: !!isEcoFriendly,
      sourceVerification: sourceVerification || {},
    });

    const createdProduct = await product.save();
    res.status(201).json({ success: true, product: createdProduct });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private (Seller only)
exports.updateProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      images,
      category,
      yieldType,
      stock,
      plantInfo,
      isEcoFriendly,
      sourceVerification,
    } = req.body;

    const product = await Product.findById(req.params.id);

    if (product) {
      if (product.seller.toString() !== req.user._id.toString() && !req.user.roles.admin) {
        return res.status(401).json({ success: false, message: 'Not authorized' });
      }

      if (name !== undefined) {
        if (!name.trim()) return res.status(400).json({ success: false, message: 'Product name cannot be empty' });
        product.name = name.trim();
      }
      if (description !== undefined) {
        if (!description.trim()) return res.status(400).json({ success: false, message: 'Product description cannot be empty' });
        product.description = description.trim();
      }
      if (category !== undefined) {
        if (!category.trim()) return res.status(400).json({ success: false, message: 'Category cannot be empty' });
        product.category = category.trim();
      }
      if (yieldType !== undefined) {
        product.yieldType = yieldType;
      }
      if (price !== undefined) {
        const numPrice = Number(price);
        if (isNaN(numPrice) || numPrice <= 0) return res.status(400).json({ success: false, message: 'Price must be a positive number' });
        product.price = numPrice;
      }
      if (stock !== undefined) {
        const numStock = Number(stock);
        if (isNaN(numStock) || numStock < 0) return res.status(400).json({ success: false, message: 'Stock must be 0 or greater' });
        product.stock = numStock;
      }

      if (images) product.images = images;
      if (plantInfo) product.plantInfo = plantInfo;
      if (isEcoFriendly !== undefined) product.isEcoFriendly = !!isEcoFriendly;
      if (sourceVerification !== undefined) product.sourceVerification = sourceVerification;

      const updatedProduct = await product.save();
      res.json({ success: true, product: updatedProduct });
    } else {
      res.status(404).json({ success: false, message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private (Seller or Admin only)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      if (product.seller.toString() !== req.user._id.toString() && !req.user.roles.admin) {
        return res.status(401).json({ success: false, message: 'Not authorized' });
      }

      await Product.findByIdAndDelete(req.params.id);
      res.json({ success: true, message: 'Product removed' });
    } else {
      res.status(404).json({ success: false, message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a product review
// @route   POST /api/products/:id/reviews
// @access  Private (Buyer only)
exports.createProductReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const product = await Product.findById(req.params.id);

    if (product) {
      const alreadyReviewed = product.reviews.find(
        (r) => r.user.toString() === req.user._id.toString()
      );

      if (alreadyReviewed) {
        return res.status(400).json({ success: false, message: 'Product already reviewed' });
      }

      const review = {
        name: req.user.name,
        rating: Number(rating),
        comment,
        user: req.user._id,
      };

      product.reviews.push(review);
      await product.updateRating();

      res.status(201).json({ success: true, message: 'Review added' });
    } else {
      res.status(404).json({ success: false, message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// In-memory cache for categories with timestamp
let cachedCategories = null;
let lastCategoryFetchTime = 0;
const CATEGORY_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// @desc    Get all product categories dynamically
// @route   GET /api/products/categories
// @access  Public
exports.getCategories = async (req, res) => {
  try {
    const now = Date.now();
    if (cachedCategories && now - lastCategoryFetchTime < CATEGORY_CACHE_TTL) {
      return res.json({ success: true, count: cachedCategories.length, categories: cachedCategories });
    }

    const baseCategories = [
      'Decorative / Ornamental Plants',
      'Long-Term Yield Plants',
      'Short-Term Yield Plants',
      'Medicinal Plants',
      'Seeds',
      'Fertilizers',
      'Banana Fibre Bags',
      'Eco-Products',
      'FMCG / Farm & Natural Products',
    ];

    const dbCategories = await Product.distinct('category');
    // Merge base categories with any other categories in database uniquely
    cachedCategories = Array.from(new Set([...baseCategories, ...dbCategories])).filter(Boolean);
    lastCategoryFetchTime = now;

    res.json({ success: true, count: cachedCategories.length, categories: cachedCategories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

