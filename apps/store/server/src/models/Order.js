import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    priceCents: { type: Number, required: true },
    qty: { type: Number, required: true },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: { type: [orderItemSchema], required: true },
    totalCents: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    paymentIntentId: { type: String, unique: true, sparse: true },
    // Internal bookkeeping (not part of the public contract, stripped from JSON):
    fulfillmentClaimed: { type: Boolean, default: false },
    failureReason: { type: String },
    refundId: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.fulfillmentClaimed;
        delete ret.__v;
        return ret;
      },
    },
  },
);

export const Order = mongoose.model('Order', orderSchema);
