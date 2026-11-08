import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { Product } from '../src/models/Product.js';

const img = (seed) => `https://picsum.photos/seed/${seed}/600/400`;

const products = [
  { name: 'Wireless Headphones', description: 'Over-ear Bluetooth headphones with 30h battery.', priceCents: 8999, stock: 25 },
  { name: 'Mechanical Keyboard', description: 'Hot-swappable 75% keyboard with tactile switches.', priceCents: 11999, stock: 14 },
  { name: 'Ergonomic Mouse', description: 'Vertical wireless mouse, reduces wrist strain.', priceCents: 4599, stock: 40 },
  { name: 'USB-C Hub 7-in-1', description: 'HDMI, SD card, 3x USB-A and 100W power delivery.', priceCents: 3499, stock: 60 },
  { name: '27" 4K Monitor', description: 'IPS panel, 60Hz, USB-C input.', priceCents: 32999, stock: 6 },
  { name: 'Laptop Stand', description: 'Adjustable aluminium stand for 10-17" laptops.', priceCents: 2999, stock: 35 },
  { name: 'Webcam 1080p', description: 'Full HD webcam with dual microphones.', priceCents: 5499, stock: 18 },
  { name: 'Portable SSD 1TB', description: 'Pocket-size NVMe drive, up to 1000MB/s.', priceCents: 9999, stock: 12 },
  { name: 'Smart Desk Lamp', description: 'Dimmable LED lamp with colour temperature control.', priceCents: 3999, stock: 22 },
  { name: 'Noise-Cancelling Earbuds', description: 'True wireless earbuds with ANC and charging case.', priceCents: 12999, stock: 9 },
  { name: 'Desk Mat XL', description: 'Water-resistant 90x40cm desk mat.', priceCents: 1999, stock: 80 },
  { name: 'Limited Edition Mug', description: 'Collector ceramic mug. Only one left!', priceCents: 1499, stock: 1 },
  { name: 'Cable Organiser Kit', description: 'Velcro ties, clips and sleeves.', priceCents: 999, stock: 120 },
  { name: 'Sold-Out Gadget', description: 'Out of stock – useful for testing the empty state.', priceCents: 2499, stock: 0 },
].map((p, i) => ({ ...p, imageUrl: img(`store-${i + 1}`) }));

await mongoose.connect(env.MONGO_URI);
await Product.deleteMany({});
await Product.insertMany(products);
console.log(`Seeded ${products.length} products (one with stock 1, one with stock 0).`);
await mongoose.disconnect();
