import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { Cart } from '../models/Cart.js';
import { Order } from '../models/Order.js';

let mongod;

export async function startDb() {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await Promise.all([User, Product, Cart, Order].map((m) => m.init())); // make sure unique indexes exist
}

export async function stopDb() {
  await mongoose.disconnect();
  await mongod.stop();
}

export async function clearDb() {
  await Promise.all(Object.values(mongoose.connection.collections).map((c) => c.deleteMany({})));
}

export async function registerUser(app, overrides = {}) {
  const credentials = {
    name: 'Test User',
    email: `user${Math.random().toString(36).slice(2)}@example.com`,
    password: 'password123',
    ...overrides,
  };
  const res = await request(app).post('/api/auth/register').send(credentials);
  return { token: res.body.token, user: res.body.user, credentials, res };
}

export const makeProduct = (overrides = {}) =>
  Product.create({
    name: 'Widget',
    description: 'A fine widget',
    priceCents: 1000,
    imageUrl: 'https://example.com/widget.png',
    stock: 5,
    ...overrides,
  });

export const bearer = (token) => ({ Authorization: `Bearer ${token}` });
