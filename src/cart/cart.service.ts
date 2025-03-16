import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cart, CartDocument } from './schema/cart.schema';
import { Model } from 'mongoose';
import { Product, ProductDocument } from 'src/product/schema/product.schema';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private readonly cartModel: Model<CartDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  async addToCart(addToCartDto: AddToCartDto): Promise<Cart> {
    const { userId, productId, quantity } = addToCartDto;

    const product = await this.productModel.findById(productId);
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    if (product.stockQuantity < quantity) {
      throw new BadRequestException(
        `Not enough stock for product ${product.name}. Available: ${product.stockQuantity}`,
      );
    }

    let cart = await this.cartModel.findOne({ user: userId });
    if (!cart) {
      cart = new this.cartModel({
        user: userId,
        items: [],
      });
    }

    const existingItemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId,
    );

    if (existingItemIndex > -1) {
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;
      if (product.stockQuantity < newQuantity) {
        throw new BadRequestException(
          `Cannot add more items. Only ${product.stockQuantity} units of ${product.name} are available in stock (${cart.items[existingItemIndex].quantity} already in cart)`,
        );
      }
      cart.items[existingItemIndex].quantity = newQuantity;
    } else {
      cart.items.push({
        product: productId as any,
        quantity,
      });
    }

    await this.updateCartTotal(cart);
    return cart.save();
  }

  async getCart(userId: string): Promise<Cart> {
    try {
      const cart = await this.cartModel
        .findOne({ user: userId })
        .populate({
          path: 'items.product',
          select: 'name price images stockQuantity promotionId',
          populate: {
            path: 'promotionId',
            select: 'discountRate startDate endDate isActive',
          },
        })
        .lean()
        .exec();

      if (cart) {
        return this.processCartItems(cart);
      }

      return await this.cartModel.create({
        user: userId,
        items: [],
        totalPrice: 0,
      });
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw new BadRequestException(
          `Cart validation error: ${error.message}`,
        );
      }
      throw error;
    }
  }

  async updateItemQuantity(
    userId: string,
    productId: string,
    updateCartDto: UpdateCartDto,
  ): Promise<Cart> {
    const { quantity } = updateCartDto;

    const product = await this.productModel.findById(productId);
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    if (product.stockQuantity < quantity) {
      throw new BadRequestException(
        `Not enough stock for product ${product.name}. Available: ${product.stockQuantity}`,
      );
    }

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

    cart.items[existingItemIndex].quantity = quantity;
    await this.updateCartTotal(cart);
    return cart.save();
  }

  private async updateCartTotal(cart: CartDocument): Promise<void> {
    let totalPrice = 0;

    for (const item of cart.items) {
      const product = await this.productModel
        .findById(item.product)
        .populate('promotionId', 'discountRate startDate endDate isActive');

      if (product) {
        let itemPrice = product.price;

        if (product.promotionId && product.promotionId['isActive']) {
          const now = new Date();
          const startDate = new Date(product.promotionId['startDate']);
          const endDate = new Date(product.promotionId['endDate']);

          if (now >= startDate && now <= endDate) {
            itemPrice =
              product.price -
              (product.price * product.promotionId['discountRate']) / 100;
          }
        }

        totalPrice += itemPrice * item.quantity;
      }
    }

    cart.totalPrice = Math.round(totalPrice * 100) / 100;
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
    await this.updateCartTotal(cart);
    return cart.save();
  }

  private processCartItems(cart: any): Cart {
    const now = new Date();
    const cartObject =
      typeof cart.toObject === 'function' ? cart.toObject() : cart;

    cartObject.items = cartObject.items.map((item) => {
      if (item.product.promotionId && item.product.promotionId.isActive) {
        const startDate = new Date(item.product.promotionId.startDate);
        const endDate = new Date(item.product.promotionId.endDate);

        if (now >= startDate && now <= endDate) {
          const discountedPrice =
            item.product.price -
            (item.product.price * item.product.promotionId.discountRate) / 100;

          return {
            ...item,
            product: {
              ...item.product,
              originalPrice: item.product.price,
              discountedPrice: Math.round(discountedPrice * 100) / 100,
            },
          };
        }
      }

      return {
        ...item,
        product: {
          ...item.product,
          originalPrice: item.product.price,
          discountedPrice: item.product.price,
        },
      };
    });

    return cartObject;
  }
}
