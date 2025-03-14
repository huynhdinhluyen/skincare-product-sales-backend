import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Product, ProductDocument } from './schema/product.schema';
import { Model } from 'mongoose';
import { UpdateProductDto } from './dto/request/update-product.dto';
import {
  Category,
  CategoryDocument,
} from 'src/category/schema/category.schema';
import { CreateProductDto } from './dto/request/create-product.dto';
import { ProductFilterDto } from './dto/filter/product-filter.dto';
import { CacheService } from '../common/services/cache.service';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
    private readonly cacheService: CacheService,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const category = await this.categoryModel.findById(
      createProductDto.category,
    );
    if (!category || !category.isActive) {
      throw new NotFoundException(
        `Category with ID ${createProductDto.category} not found`,
      );
    }
    const product = new this.productModel(createProductDto);
    await this.cacheService.reset();
    return product.save();
  }

  async findAll(
    filterDto: ProductFilterDto,
  ): Promise<{ data: any[]; totalCount: number; totalPages: number }> {
    const {
      page = 1,
      limit = 10,
      search,
      categoryId,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filterDto;

    const cacheKey = `products:${JSON.stringify({
      page,
      limit,
      search: search || '',
      categoryId: categoryId || '',
      minPrice: minPrice || 0,
      maxPrice: maxPrice || 0,
      sortBy,
      sortOrder,
    })}`;

    const cachedResult = await this.cacheService.get<{
      data: any[];
      totalCount: number;
      totalPages: number;
    }>(cacheKey);

    if (cachedResult) {
      return cachedResult;
    }

    try {
      const filter: any = { isActive: true };

      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }

      if (categoryId) {
        filter.category = categoryId;
      }

      if (minPrice !== undefined) {
        filter.price = { $gte: minPrice };
      }

      if (maxPrice !== undefined) {
        if (filter.price) {
          filter.price.$lte = maxPrice;
        } else {
          filter.price = { $lte: maxPrice };
        }
      }

      const sort: any = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      const skip = (page - 1) * limit;

      const [products, totalCount] = await Promise.all([
        this.productModel
          .find(filter)
          .select(
            'name brand images price stockQuantity sold description category promotionId capacity origin',
          )
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .populate('promotionId', 'discountRate startDate endDate isActive')
          .populate('category', 'name')
          .lean()
          .exec(),
        this.productModel.countDocuments(filter).exec(),
      ]);

      const data = products.map((product) => this.applyPromotion(product));

      const result = {
        data,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      };

      await this.cacheService.set(cacheKey, result, 3600);

      return result;
    } catch (error) {
      this.logger.error(`Error retrieving products:`, error);
      throw new InternalServerErrorException('Failed to retrieve products');
    }
  }

  async getProductById(id: string): Promise<any> {
    const cacheKey = `product:${id}`;

    const cachedProduct = await this.cacheService.get<any>(cacheKey);
    if (cachedProduct) {
      this.logger.debug(`Cache hit for product ${id}`);
      return cachedProduct;
    }

    this.logger.debug(`Cache miss for product ${id}`);

    const product = await this.productModel
      .findById(id)
      .select(
        'name brand images price stockQuantity sold description category promotionId capacity origin createdAt updatedAt',
      )
      .populate('category', 'name _id')
      .populate('promotionId', 'discountRate startDate endDate isActive')
      .lean()
      .exec();

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    const processedProduct = this.applyPromotion(product);

    await this.cacheService.set(cacheKey, processedProduct, 3600);

    return processedProduct;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const updatedProduct = await this.productModel
      .findByIdAndUpdate(id, updateProductDto, { new: true })
      .exec();

    if (!updatedProduct || !updatedProduct.isActive) {
      throw new NotFoundException(`Product with ${id} not found`);
    }

    await this.cacheService.invalidateProductCache(id);

    return updatedProduct;
  }

  async remove(id: string): Promise<Product> {
    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    product.isActive = false;
    const result = await product.save();

    await this.cacheService.invalidateProductCache(id);

    return result;
  }

  async compareProducts(productIds: string[]): Promise<any[]> {
    // Validate that we have 2-4 products to compare
    if (productIds.length < 2 || productIds.length > 4) {
      throw new BadRequestException(
        'Please select between 2 and 4 products to compare',
      );
    }

    // Get all products with their details
    const products = await this.productModel
      .find({ _id: { $in: productIds }, isActive: true })
      .populate('category', 'name')
      .populate('promotionId', 'discountRate startDate endDate isActive')
      .lean()
      .exec();

    if (!products || products.length === 0) {
      throw new NotFoundException('No products found for comparison');
    }

    if (products.length !== productIds.length) {
      throw new NotFoundException('One or more products not found or inactive');
    }

    // Process products to add discounted prices
    const processedProducts = products.map((product) =>
      this.applyPromotion(product),
    );

    // Format product data for comparison
    return this.formatProductsForComparison(processedProducts);
  }

  private applyPromotion(product: any): any {
    if (product.promotionId && product.promotionId.isActive) {
      const now = new Date();
      const startDate = new Date(product.promotionId.startDate);
      const endDate = new Date(product.promotionId.endDate);

      if (now >= startDate && now <= endDate) {
        const discountRate = product.promotionId.discountRate || 0;
        const discountedPrice =
          product.price - (product.price * discountRate) / 100;

        return {
          ...product,
          originalPrice: product.price,
          discountedPrice: Math.round(discountedPrice * 100) / 100, // Round to 2 decimal places
        };
      }
    }

    return {
      ...product,
      originalPrice: product.price,
      discountedPrice: product.price,
    };
  }

  private formatProductsForComparison(products: any[]): any[] {
    // Process products for comparison with all relevant attributes
    return products.map((product) => ({
      _id: product._id,
      name: product.name,
      brand: product.brand,
      images: product.images,
      origin: product.origin,
      capacity: product.capacity,
      originalPrice: product.originalPrice,
      discountedPrice: product.discountedPrice,
      stockQuantity: product.stockQuantity,
      sold: product.sold,
      description: product.description,
      category: product.category ? product.category.name : 'N/A',
      promotion: product.promotionId
        ? `${product.promotionId.discountRate}% off`
        : 'No promotion',
    }));
  }
}
