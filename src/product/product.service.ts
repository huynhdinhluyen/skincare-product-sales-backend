import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Product, ProductDocument } from './schema/product.schema';
import { Model } from 'mongoose';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import {
  Category,
  CategoryDocument,
} from 'src/category/schema/category.schema';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async searchProducts(
    query: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: Product[]; totalCount: number; totalPages: number }> {
    try {
      if (!query || query.trim() === '') {
        return { data: [], totalCount: 0, totalPages: 0 };
      }
      const trimmedQuery = query.trim();
      const regex = new RegExp(trimmedQuery, 'i');

      const skip = (page - 1) * limit;

      const [products, totalCount] = await Promise.all([
        this.productModel
          .find({ name: { $regex: regex }, isActive: true })
          .skip(skip)
          .limit(limit)
          .lean()
          .exec(),
        this.productModel
          .countDocuments({ name: { $regex: regex }, isActive: true })
          .exec(),
      ]);

      const totalPages = Math.ceil(totalCount / limit);
      return { data: products, totalCount, totalPages };
    } catch (error) {
      console.error('Error searching products:', error);
      throw new InternalServerErrorException('Error searching products');
    }
  }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const category = await this.categoryModel.findById(
      createProductDto.category,
    );
    if (!category) {
      throw new NotFoundException(
        `Category with ID ${createProductDto.category} not found`,
      );
    }
    const product = new this.productModel(createProductDto);
    await this.cacheManager.reset();
    return product.save();
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: any[]; totalCount: number; totalPages: number }> {
    const cacheKey = `products:page=${page}:limit=${limit}`;

    try {
      const cachedResult = await this.cacheManager.get<{
        data: any[];
        totalCount: number;
        totalPages: number;
      }>(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }
    } catch (cacheError) {
      this.logger.error(
        `Cache error for products on page ${page}:`,
        cacheError,
      );
    }

    const skip = (page - 1) * limit;
    const [products, totalCount] = await Promise.all([
      this.productModel
        .find({ isActive: true })
        .skip(skip)
        .limit(limit)
        .populate('promotionId', 'discountRate startDate endDate isActive')
        .lean()
        .exec(),
      this.productModel.countDocuments({ isActive: true }).exec(),
    ]);

    const data = products.map((product) => this.applyPromotion(product));
    const result = {
      data,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    };

    try {
      await this.cacheManager.set(cacheKey, result, 3600);
    } catch (cacheSetError) {
      this.logger.error(
        `Error setting cache for products on page ${page}:`,
        cacheSetError,
      );
    }

    return result;
  }

  async getProductById(id: string): Promise<Product> {
    const cacheKey = `product:${id}`;
    let product: Product | null;

    try {
      product = await this.cacheManager.get<Product>(cacheKey);
      if (!product) {
        product = await this.findOne(id);
        await this.cacheManager.set(cacheKey, product, 3600);
      }
    } catch (error) {
      this.logger.error(`Cache error for product ${id}:`, error);
      product = await this.findOne(id);
    }
    return product;
  }

  async update(id: string, updateUserDto: UpdateProductDto): Promise<Product> {
    const updatedProduct = await this.productModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .exec();
    if (!updatedProduct || !updatedProduct.isActive) {
      throw new NotFoundException(`Product with ${id} not found`);
    }
    await this.cacheManager.reset();
    return updatedProduct;
  }

  async remove(id: string): Promise<Product> {
    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    product.isActive = false;
    await this.cacheManager.reset();
    return product.save();
  }

  private applyPromotion(product: any): any {
    if (product.promotionId && product.promotionId.isActive) {
      const now = new Date();
      const { discountRate, startDate, endDate } = product.promotionId;
      if (now >= new Date(startDate) && now <= new Date(endDate)) {
        const discountedPrice =
          product.price - (product.price * discountRate) / 100;
        return {
          ...product,
          originalPrice: product.price,
          discountedPrice: Math.max(0, discountedPrice),
        };
      }
    }
    return {
      ...product,
      originalPrice: product.price,
      discountedPrice: product.price,
    };
  }

  private async findOne(id: string): Promise<Product> {
    try {
      const product = await this.productModel.findById(id).exec();
      if (!product || !product.isActive) {
        throw new NotFoundException(`Product with ${id} not found`);
      }
      return product;
    } catch (error) {
      this.logger.error(`Error finding product with ID ${id}:`, error);
      throw error;
    }
  }
}
