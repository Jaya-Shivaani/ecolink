const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: 6,
      select: false,
    },
    phoneNumber: {
      type: String,
      default: '',
    },
    address: {
      type: String,
      default: '',
    },
    // Multi-role system: one account can be buyer + seller + admin
    roles: {
      buyer:  { type: Boolean, default: true },
      seller: { type: Boolean, default: false },
      admin:  { type: Boolean, default: false },
    },
    // Seller application status
    sellerStatus: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected'],
      default: 'none',
    },
    // Firebase UID for Google Auth integration
    firebaseUid: {
      type: String,
      default: '',
    },
    // For hyperlocal searching
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [77.8700, 9.1700], // Default to Kovilpatti coordinates
      },
    },
    // Seller details (populated when user applies to sell)
    sellerProfile: {
      businessName: { type: String, default: '' },
      category: {
        type: String,
        enum: [
          'Home Grower',
          'Nursery',
          'Women Entrepreneur',
          'Self Help Group (SHG)',
          'Artisan',
          'Organic Farm',
          'Small Business',
          '',
        ],
        default: '',
      },
      description: { type: String, default: '' },
      story: { type: String, default: '' },
      isVerified: { type: Boolean, default: false },
      isSHG: { type: Boolean, default: false },
      isWomenEntrepreneur: { type: Boolean, default: false },
      rating: { type: Number, default: 0 },
      totalReviews: { type: Number, default: 0 },
      upiId: {
        type: String,
        default: '',
        validate: {
          validator: function (v) {
            if (!v || v.trim() === '') return true;
            return /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(v.trim());
          },
          message: 'Please enter a valid UPI ID (example@bankhandle).',
        },
      },
      logo: { type: String, default: '' },
      license: { type: String, default: '' },
      businessAddress: { type: String, default: '' },
      sellerType: {
        type: String,
        enum: [
          'Farmer',
          'SHG Member',
          'Nursery Owner',
          'Reseller',
          'Home Grower',
          'Artisan',
          'Organic Farm',
          'Small Business',
          'Other',
          '',
        ],
        default: '',
      },
      locationVerification: {
        status: {
          type: String,
          enum: ['None', 'Pending', 'Verified', 'Mismatch'],
          default: 'None',
        },
        enteredCoordinates: {
          type: [Number],
          default: [],
        },
        detectedCoordinates: {
          type: [Number],
          default: [],
        },
        distanceKm: {
          type: Number,
          default: 0,
        },
        verifiedAt: {
          type: Date,
        },
      },
      productSource: {
        sourceType: {
          type: String,
          enum: [
            'Own Farm',
            'SHG Production',
            'Purchased from Farmer',
            'Authorized Supplier',
            'Other',
            '',
          ],
          default: '',
        },
        sourceName: { type: String, default: '' },
        sourceLocation: { type: String, default: '' },
        description: { type: String, default: '' },
        declarationAccepted: { type: Boolean, default: false },
        verificationStatus: {
          type: String,
          enum: ['None', 'Pending', 'Verified', 'Rejected'],
          default: 'None',
        },
        verifiedAt: { type: Date },
        adminNotes: { type: String, default: '' },
      },
    },
    // Sustainability Metrics
    sustainabilityScore: {
      plantsSold: { type: Number, default: 0 },
      plantsAdopted: { type: Number, default: 0 },
      plantsExchanged: { type: Number, default: 0 },
      ordersCompleted: { type: Number, default: 0 },
    },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  },
  { timestamps: true }
);

// Geo Index for location query
UserSchema.index({ location: '2dsphere' });

// Encrypt password using bcrypt
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
