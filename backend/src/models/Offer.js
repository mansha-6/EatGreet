const mongoose = require('mongoose');

// We export the Schema, NOT the model, for multi-tenant support
const offerSchema = new mongoose.Schema({
    title: { type: String },
    subtitle: { type: String },
    code: { type: String },
    type: { type: String, enum: ['video', 'image', 'color'], default: 'color' },
    bg: { type: String, default: 'bg-[#FD6941]' },
    text: { type: String, default: 'text-white' },
    src: { type: String }, // For video/image URL
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
    applicableItems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' }], // Specific items the offer applies to
    discountPercentage: { type: Number, default: 0 } // Discount amount in percentage
}, {
    timestamps: true,
    collection: 'offers' // Match naming convention for tenant collections
});

module.exports = offerSchema;
