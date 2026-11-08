import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: '', maxlength: 2000 },
    priceCents: {
      type: Number,
      required: true,
      min: 0,
      validate: { validator: Number.isInteger, message: 'priceCents must be an integer' },
    },
    imageUrl: { type: String, default: '' },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
      validate: { validator: Number.isInteger, message: 'stock must be an integer' },
    },
  },
  { timestamps: true },
);

export const Product = mongoose.model('Product', productSchema);
