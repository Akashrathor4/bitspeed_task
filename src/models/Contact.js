const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
      default: null,
    },
    email: {
      type: String,
      default: null,
    },
    linkedId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contact',
      default: null,
    },
    linkPrecedence: {
      type: String,
      enum: ['primary', 'secondary'],
      required: true,
      default: 'primary',
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  }
);

// Index for fast lookups
contactSchema.index({ email: 1 });
contactSchema.index({ phoneNumber: 1 });
contactSchema.index({ linkedId: 1 });

const Contact = mongoose.model('Contact', contactSchema);

module.exports = Contact;
