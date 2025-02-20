import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cart, CartDocument } from './schema/cart.schema';
import { Model } from 'mongoose';
import { Product, ProductDocument } from 'src/product/schema/product.schema';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name)
    private readonly cartModel: Model<CartDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  async getCart(userId: string): Promise<Cart> {
    const cart = await this.cartModel.findOne({ userId });
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }
    return cart;
  }

  async addToCart(addToCartDto: AddToCartDto): Promise<Cart> {
    const product = await this.productModel
      .findOne({ _id: addToCartDto.productId })
      .lean();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    let cart = await this.cartModel.findOne({ user: addToCartDto.userId });

    if (!cart) {
      cart = new this.cartModel({
        user: addToCartDto.userId,
        items: [],
      });
    }

    // check exist products
    const existingItem = cart.items.find(
      (item) => item.product.toString() === addToCartDto.productId,
    );

    if (existingItem) {
      existingItem.quantity += addToCartDto.quantity;
    } else {
      cart.items.push({
        product: product,
        quantity: addToCartDto.quantity,
      });
    }

    // Calculate total price
    cart.totalPrice = await cart.items.reduce(async (sumPromise, item) => {
      return (await sumPromise) + item.quantity * product.price; //
    }, Promise.resolve(0));

    return cart.save();
  }

  async removeFromCart(userId: string, productId: string): Promise<Cart> {
    const cart = await this.cartModel.findOne({ user: userId });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const existingItemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId,
    );

    if (existingItemIndex === -1) {
      throw new NotFoundException('Product not found in cart');
    }

    cart.items.splice(existingItemIndex, 1);

    cart.totalPrice = await cart.items.reduce(async (sumPromise, item) => {
      const product = await this.productModel.findById(item.product).lean();

      if (product) {
        return (await sumPromise) + item.quantity * product.price;
      }
      return 0;
    }, Promise.resolve(0));

    return cart.save();
  }

  async updateItemQuantity(
    userId: string,
    productId: string,
    updateCartDto: UpdateCartDto,
  ): Promise<Cart> {
    const cart = await this.cartModel.findOne({ user: userId });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const item = cart.items.find(
      (item) => item.product.toString() === productId,
    );

    if (!item) {
      throw new NotFoundException('Item not found in cart');
    }

    item.quantity = updateCartDto.quantity;
    cart.totalPrice = await cart.items.reduce(async (sumPromise, item) => {
      const product = await this.productModel.findById(item.product).lean();

      if (product) {
        return (await sumPromise) + item.quantity * product.price;
      }
      return 0;
    }, Promise.resolve(0));

    return cart.save();
  }
}
