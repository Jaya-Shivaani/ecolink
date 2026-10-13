const ForumPost = require('../models/Community');
const PlantListing = require('../models/PlantListing');
const Event = require('../models/Event');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Testimonial = require('../models/Testimonial');
const {
  sendWorkshopTicketEmail,
  sendPlantAdoptionRequestEmail,
} = require('../utils/sendEmail');

// ==================== FORUM METHODS ====================

// @desc    Create a forum post
// @route   POST /api/community/posts
// @access  Private
exports.createPost = async (req, res) => {
  try {
    let { title, content, tags } = req.body;
    title = title ? title.trim() : '';
    content = content ? content.trim() : '';

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Post title and content are required' });
    }

    const post = new ForumPost({
      user: req.user._id,
      title,
      content,
      tags: tags || ['Gardening'],
    });

    const createdPost = await post.save();
    res.status(201).json({ success: true, post: createdPost });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get all forum posts
// @route   GET /api/community/posts
// @access  Private
exports.getPosts = async (req, res) => {
  try {
    const posts = await ForumPost.find()
      .populate('user', 'name roles')
      .populate('comments.user', 'name roles')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: posts.length, posts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add comment to post
// @route   POST /api/community/posts/:id/comments
// @access  Private
exports.addComment = async (req, res) => {
  try {
    let { content } = req.body;
    content = content ? content.trim() : '';

    if (!content) {
      return res.status(400).json({ success: false, message: 'Comment content cannot be empty' });
    }

    const post = await ForumPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const comment = {
      user: req.user._id,
      name: req.user.name,
      content,
    };

    post.comments.push(comment);
    await post.save();

    res.status(201).json({ success: true, post });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Like / Unlike a post
// @route   PUT /api/community/posts/:id/like
// @access  Private
exports.likePost = async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const alreadyLiked = post.likes.includes(req.user._id);

    if (alreadyLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== req.user._id.toString());
    } else {
      post.likes.push(req.user._id);
    }

    await post.save();
    res.json({ success: true, post });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ==================== PLANT ADOPTION & EXCHANGE METHODS ====================

// @desc    Create a plant swap or adoption listing
// @route   POST /api/community/plants
// @access  Private (Any Customer / User)
exports.createPlantListing = async (req, res) => {
  try {
    const {
      type,
      name,
      description,
      image,
      condition,
      exchangeFor,
      validityDays,
      isUrgent,
      deliveryOption = 'Pickup Only',
      deliveryCharge = 0,
    } = req.body;

    const days = Math.max(1, parseInt(validityDays, 10) || 30);
    const validUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const parsedDeliveryCharge = Math.max(0, parseFloat(deliveryCharge) || 0);

    const location = {
      type: 'Point',
      coordinates: req.user?.location?.coordinates || [77.8700, 9.1700],
    };

    const listing = new PlantListing({
      user: req.user._id,
      type,
      name,
      description,
      image: image || '/assets/products/product-placeholder.svg',
      condition: condition || 'Healthy',
      exchangeFor: type === 'Exchange' ? exchangeFor : '',
      location,
      status: 'Available',
      validityDays: days,
      validUntil,
      isUrgent: !!isUrgent,
      deliveryOption: deliveryOption || 'Pickup Only',
      deliveryCharge: deliveryOption === 'Pickup Only' ? 0 : parsedDeliveryCharge,
    });

    const createdListing = await listing.save();
    const populated = await PlantListing.findById(createdListing._id)
      .populate('user', 'name email phoneNumber address location')
      .populate('interestedUsers', 'name email phoneNumber address location')
      .lean();
    res.status(201).json({ success: true, listing: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all plant listings (adoption/exchange)
// @route   GET /api/community/plants
// @access  Public / Optional Private
exports.getPlantListings = async (req, res) => {
  try {
    const { type, status, validityFilter } = req.query;
    let query = {};

    if (type) query.type = type;
    if (status) query.status = status;

    const now = new Date();

    // Auto-update expired Available listings in background (non-blocking)
    PlantListing.updateMany(
      {
        status: 'Available',
        validUntil: { $exists: true, $ne: null, $lt: now },
      },
      {
        $set: { status: 'Expired' },
      }
    ).exec().catch(() => {});

    if (validityFilter === 'active') {
      query.status = 'Available';
    } else if (validityFilter === 'expiringSoon') {
      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      query.status = 'Available';
      query.validUntil = { $gte: now, $lte: threeDaysFromNow };
    } else if (validityFilter === 'expired') {
      query.status = 'Expired';
    }

    const listings = await PlantListing.find(query)
      .populate('user', 'name email phoneNumber address location')
      .populate('interestedUsers', 'name email phoneNumber address location')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, count: listings.length, listings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Register interest in a plant listing
// @route   PUT /api/community/plants/:id/request
// @access  Private (Any Customer / User)
exports.requestPlant = async (req, res) => {
  try {
    const listing = await PlantListing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Plant listing not found' });
    }

    if (listing.user.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot request your own plant' });
    }

    if (listing.status === 'Completed') {
      return res.status(400).json({ success: false, message: 'This plant has already been adopted/exchanged' });
    }

    if (listing.status === 'Expired' || (listing.validUntil && new Date() > new Date(listing.validUntil))) {
      listing.status = 'Expired';
      await listing.save();
      return res.status(400).json({
        success: false,
        message: 'This plant listing has expired and is no longer valid. You can ask the owner to renew or extend the validity.',
      });
    }

    const alreadyRequested = listing.interestedUsers.some(
      (u) => (u._id || u).toString() === req.user._id.toString()
    );

    if (alreadyRequested) {
      return res.status(400).json({ success: false, message: 'You have already requested this plant' });
    }

    listing.interestedUsers.push(req.user._id);
    await listing.save();

    // Create Notification for the listing owner
    try {
      const isExchange = listing.type === 'Exchange';
      await Notification.create({
        recipient: listing.user,
        sender: req.user._id,
        type: isExchange ? 'exchange_request' : 'adoption_request',
        title: isExchange ? `🌱 Swap Offer: ${listing.name}` : `🌿 Adoption Request: ${listing.name}`,
        message: `${req.user.name} requested to ${isExchange ? 'trade with' : 'adopt'} your plant.`,
        plantListing: listing._id,
        link: isExchange ? '/adoption#exchange' : '/adoption',
        meta: {
          senderName: req.user.name,
          senderPhone: req.user.phoneNumber || '',
          senderEmail: req.user.email || '',
          plantName: listing.name,
        },
      });
    } catch (notifErr) {
      console.error('Failed to create in-app notification:', notifErr);
    }

    // Send real email to listing owner (non-blocking)
    try {
      const ownerUser = await User.findById(listing.user);
      if (ownerUser) {
        sendPlantAdoptionRequestEmail({
          listing,
          requester: req.user,
          owner: ownerUser,
        }).catch(() => {});
      }
    } catch (mailErr) {
      console.error('[Plant Mail Notification Error]:', mailErr.message);
    }

    const updatedListing = await PlantListing.findById(listing._id)
      .populate('user', 'name email phoneNumber address location')
      .populate('interestedUsers', 'name email phoneNumber address location');

    res.json({ success: true, message: 'Request submitted to plant owner!', listing: updatedListing });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Complete / Close a listing and award points
// @route   PUT /api/community/plants/:id/complete
// @access  Private (Owner only)
exports.completePlantListing = async (req, res) => {
  try {
    const listing = await PlantListing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Plant listing not found' });
    }

    if (listing.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    listing.status = 'Completed';
    await listing.save();

    // Reward owner sustainability score
    const user = await User.findById(req.user._id);
    if (user) {
      if (!user.sustainabilityScore) {
        user.sustainabilityScore = { plantsAdopted: 0, plantsExchanged: 0, ordersCompleted: 0 };
      }
      if (listing.type === 'Adoption') {
        user.sustainabilityScore.plantsAdopted = (user.sustainabilityScore.plantsAdopted || 0) + 1;
      } else {
        user.sustainabilityScore.plantsExchanged = (user.sustainabilityScore.plantsExchanged || 0) + 1;
      }
      await user.save();
    }

    // Notify interested users that this plant was finalized
    if (listing.interestedUsers && listing.interestedUsers.length > 0) {
      try {
        const notificationsToCreate = listing.interestedUsers.map((requesterId) => ({
          recipient: requesterId,
          sender: req.user._id,
          type: 'adoption_completed',
          title: `✅ Plant "${listing.name}" Adoption Completed`,
          message: `The plant listing "${listing.name}" has now been successfully adopted/exchanged. Thank you for participating in community greening!`,
          plantListing: listing._id,
          link: '/adoption',
        }));
        await Notification.insertMany(notificationsToCreate);
      } catch (notifErr) {
        console.error('Failed to notify requesters on completion:', notifErr);
      }
    }

    const updatedListing = await PlantListing.findById(listing._id)
      .populate('user', 'name email phoneNumber address location')
      .populate('interestedUsers', 'name email phoneNumber address location');

    res.json({ success: true, message: 'Listing completed successfully! Sustainability metrics updated.', listing: updatedListing });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Extend / Renew listing validity
// @route   PUT /api/community/plants/:id/extend
// @access  Private (Owner only)
exports.extendPlantListingValidity = async (req, res) => {
  try {
    const listing = await PlantListing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Plant listing not found' });
    }

    if (listing.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized to modify this listing' });
    }

    const daysToAdd = parseInt(req.body.days, 10) || 15;
    const now = new Date();
    const currentExpiry = listing.validUntil && new Date(listing.validUntil) > now
      ? new Date(listing.validUntil)
      : now;

    listing.validUntil = new Date(currentExpiry.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    listing.validityDays = (listing.validityDays || 0) + daysToAdd;
    if (listing.status === 'Expired') {
      listing.status = 'Available';
    }

    await listing.save();
    const populated = await PlantListing.findById(listing._id).populate('user', 'name email phoneNumber address location');
    res.json({
      success: true,
      message: `Listing validity extended by ${daysToAdd} days! Valid until ${listing.validUntil.toLocaleDateString()}`,
      listing: populated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete / Remove a plant listing
// @route   DELETE /api/community/plants/:id
// @access  Private (Owner or Admin)
exports.deletePlantListing = async (req, res) => {
  try {
    const listing = await PlantListing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Plant listing not found' });
    }

    const isOwner = listing.user.toString() === req.user._id.toString();
    const isAdmin = req.user.roles?.admin;

    if (!isOwner && !isAdmin) {
      return res.status(401).json({ success: false, message: 'Not authorized to remove this listing' });
    }

    await PlantListing.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Plant listing removed successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ==================== EVENT / WORKSHOP METHODS ====================

// Helper: Check whether an event/workshop is expired
const isEventExpired = (event) => {
  if (!event || !event.date) return false;

  const eventDate = new Date(event.date);
  if (isNaN(eventDate.getTime())) return false;

  const now = new Date();

  // If the event date is strictly before today's start date (00:00:00 local/server), it is definitely expired
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfEventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());

  if (startOfEventDay < startOfToday) {
    return true;
  }

  // If the event is in the future (after today), it is active
  if (startOfEventDay > startOfToday) {
    return false;
  }

  // If the event is TODAY, check the time if provided
  if (event.time && typeof event.time === 'string') {
    let timeStr = event.time;
    if (timeStr.toLowerCase().includes('to')) {
      timeStr = timeStr.split(/to/i)[1].trim();
    } else if (timeStr.includes('-')) {
      timeStr = timeStr.split('-')[1].trim();
    }

    const match = timeStr.match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?/i);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const meridian = match[3] ? match[3].toUpperCase() : null;

      if (meridian === 'PM' && hours < 12) hours += 12;
      if (meridian === 'AM' && hours === 12) hours = 0;

      const eventEndTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        hours,
        minutes,
        0,
        0
      );

      return eventEndTime < now;
    }
  }

  // If the event is today and no specific time could be parsed, consider expired after today
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return endOfToday < now;
};

// Helper: Delete expired events and decouple references
const deleteExpiredEventsHelper = async () => {
  try {
    const allEvents = await Event.find({});
    const expiredEventIds = [];

    for (const evt of allEvents) {
      if (isEventExpired(evt)) {
        expiredEventIds.push(evt._id);
      }
    }

    if (expiredEventIds.length > 0) {
      await Event.deleteMany({ _id: { $in: expiredEventIds } });
      await Testimonial.updateMany(
        { event: { $in: expiredEventIds } },
        { $set: { event: null } }
      ).catch(() => {});
      console.log(`[Auto-Cleanup] Deleted ${expiredEventIds.length} expired workshop(s).`);
    }

    return expiredEventIds.length;
  } catch (err) {
    console.error('Error cleaning up expired events:', err);
    return 0;
  }
};

exports.deleteExpiredEventsHelper = deleteExpiredEventsHelper;

// @desc    Create an event/workshop
// @route   POST /api/community/events
// @access  Private (Seller/Admin only)
exports.createEvent = async (req, res) => {
  try {
    const { title, description, date, time, locationType, address, price, image } = req.body;

    const eventDate = new Date(date);
    if (isNaN(eventDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Please provide a valid date' });
    }

    const event = new Event({
      organizer: req.user._id,
      title,
      description,
      date: eventDate,
      time,
      locationType,
      address,
      price: Number(price) || 0,
      image,
    });

    if (isEventExpired(event)) {
      return res.status(400).json({ success: false, message: 'Cannot create a workshop in the past or expired date/time' });
    }

    const createdEvent = await event.save();
    res.status(201).json({ success: true, event: createdEvent });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all events (Automatically deletes expired workshops first)
// @route   GET /api/community/events
// @access  Public / Optional Private
exports.getEvents = async (req, res) => {
  try {
    // Delete any expired events before querying
    await deleteExpiredEventsHelper();

    const events = await Event.find()
      .populate('organizer', 'name email sellerProfile')
      .sort({ date: 1 });
    res.json({ success: true, count: events.length, events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a specific workshop/event
// @route   DELETE /api/community/events/:id
// @access  Private (Organizer or Admin)
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event/workshop not found' });
    }

    const isOrganizer = event.organizer.toString() === req.user._id.toString();
    const isAdmin = req.user.roles?.admin;

    if (!isOrganizer && !isAdmin) {
      return res.status(401).json({ success: false, message: 'Not authorized to delete this event/workshop' });
    }

    await Event.findByIdAndDelete(req.params.id);
    await Testimonial.updateMany({ event: req.params.id }, { $set: { event: null } }).catch(() => {});

    res.json({ success: true, message: 'Workshop deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Clean up all expired events manually
// @route   DELETE /api/community/events/expired/cleanup
// @access  Private (Seller/Admin)
exports.cleanupExpiredEvents = async (req, res) => {
  try {
    const deletedCount = await deleteExpiredEventsHelper();
    res.json({
      success: true,
      message: `Cleaned up ${deletedCount} expired workshop(s)`,
      deletedCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    RSVP for an event
// @route   PUT /api/community/events/:id/register
// @access  Private
exports.registerEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (isEventExpired(event)) {
      await Event.findByIdAndDelete(event._id);
      return res.status(400).json({ success: false, message: 'This workshop has already expired and ended' });
    }

    if (event.attendees.includes(req.user._id)) {
      return res.status(400).json({ success: false, message: 'Already registered for this event' });
    }

    event.attendees.push(req.user._id);
    await event.save();

    // Send Workshop Registration Ticket Email (non-blocking)
    try {
      sendWorkshopTicketEmail({ event, user: req.user }).catch(() => {});
    } catch (ticketErr) {
      console.error('[Workshop Ticket Mail Error]:', ticketErr.message);
    }

    res.json({ success: true, message: 'Successfully registered for this event', event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

