import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Order, OrderDocument } from '../order/schema/order.schema';
import { Model } from 'mongoose';
import { Product, ProductDocument } from '../product/schema/product.schema';
import { User, UserDocument } from '../auth/schema/user.schema';
import { Order_Status } from '../order/enums/order-status.enum';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async getSalesSummary(days: number = 30): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.orderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          orderStatus: {
            $nin: [
              Order_Status.CANCELLED,
              Order_Status.RETURNED,
              Order_Status.PENDING,
            ],
          },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalPrice' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  }

  async getTopSellingProducts(limit: number = 10): Promise<any> {
    return this.productModel
      .find({ isActive: true })
      .sort({ sold: -1 })
      .limit(limit)
      .select('name images price sold averageRating reviewCount')
      .lean();
  }

  async getOrderStatusDistribution(): Promise<any> {
    return this.orderModel.aggregate([
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 },
        },
      },
    ]);
  }

  async getCustomerGrowth(months: number = 6): Promise<any> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    return this.userModel.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);
  }

  async getRevenueTrends(
    period: 'daily' | 'weekly' | 'monthly' = 'monthly',
    limit: number = 12,
  ): Promise<any> {
    let format = '%Y-%m-%d';
    let dateField: string | Record<string, any> = '$createdAt';

    if (period === 'weekly') {
      format = '%Y-W%U';
      dateField = {
        $dateFromParts: {
          isoWeekYear: { $isoWeekYear: '$createdAt' },
          isoWeek: { $isoWeek: '$createdAt' },
        },
      };
    } else if (period === 'monthly') {
      format = '%Y-%m';
      dateField = {
        $dateFromParts: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
      };
    }

    return this.orderModel.aggregate([
      {
        $match: {
          orderStatus: {
            $nin: [Order_Status.CANCELLED, Order_Status.RETURNED],
          },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: format, date: dateField } },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
          items: { $sum: { $size: '$items' } },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: limit },
      { $sort: { _id: 1 } },
    ]);
  }

  async getProductAnalytics(): Promise<any> {
    const topRatedProducts = await this.productModel
      .find({ reviewCount: { $gt: 0 }, isActive: true })
      .sort({ averageRating: -1 })
      .limit(10)
      .select('name images price averageRating reviewCount')
      .lean();

    // Get recently trending products (based on recent sales)
    const trendingProducts = await this.orderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }, // Last 30 days
      { $unwind: '$items' },
      { $group: { _id: '$items.product', count: { $sum: '$items.quantity' } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $project: {
          _id: '$product._id',
          name: '$product.name',
          images: '$product.images',
          price: '$product.price',
          count: 1,
        },
      },
    ]);

    // Get products with lowest inventory
    const lowInventoryProducts = await this.productModel
      .find({ stockQuantity: { $gt: 0 }, isActive: true })
      .sort({ stockQuantity: 1 })
      .limit(10)
      .select('name images price stockQuantity')
      .lean();

    // Get out-of-stock products
    const outOfStockCount = await this.productModel.countDocuments({
      stockQuantity: 0,
    });

    return {
      topRatedProducts,
      trendingProducts,
      lowInventoryProducts,
      outOfStockCount,
    };
  }

  async getCategoryPerformance(): Promise<any> {
    return this.orderModel.aggregate([
      {
        $match: {
          orderStatus: {
            $nin: [Order_Status.CANCELLED, Order_Status.RETURNED],
          },
        },
      },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $lookup: {
          from: 'categories',
          localField: 'product.category',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: '$category' },
      {
        $group: {
          _id: '$category._id',
          categoryName: { $first: '$category.name' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          units: { $sum: '$items.quantity' },
          orders: { $addToSet: '$_id' },
        },
      },
      {
        $project: {
          _id: 1,
          categoryName: 1,
          revenue: 1,
          units: 1,
          orderCount: { $size: '$orders' },
        },
      },
      { $sort: { revenue: -1 } },
    ]);
  }

  async getCustomerSpendingAnalysis(limit: number = 10): Promise<any> {
    // Top spending customers
    const topCustomers = await this.orderModel.aggregate([
      {
        $match: {
          orderStatus: {
            $nin: [Order_Status.CANCELLED, Order_Status.RETURNED],
          },
        },
      },
      {
        $group: {
          _id: '$user',
          totalSpent: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 },
          averageOrderValue: { $avg: '$totalAmount' },
          lastOrder: { $max: '$createdAt' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 1,
          fullName: '$user.fullName',
          email: '$user.email',
          totalSpent: 1,
          orderCount: 1,
          averageOrderValue: 1,
          lastOrder: 1,
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: limit },
    ]);

    // Average order value over time
    const aovTrend = await this.orderModel.aggregate([
      {
        $match: {
          orderStatus: {
            $nin: [Order_Status.CANCELLED, Order_Status.RETURNED],
          },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          averageOrderValue: { $avg: '$totalAmount' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return {
      topCustomers,
      aovTrend,
    };
  }

  async getDashboardSummary(): Promise<any> {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1,
    );

    const [
      currentMonthOrders,
      previousMonthOrders,
      currentMonthRevenue,
      previousMonthRevenue,
      pendingOrders,
      newCustomers,
      totalCustomers,
      totalProducts,
      totalCategories,
      averageRating,
    ] = await Promise.all([
      // Current month orders
      this.orderModel.countDocuments({
        createdAt: { $gte: currentMonthStart },
        orderStatus: { $nin: [Order_Status.CANCELLED, Order_Status.RETURNED] },
      }),
      // Previous month orders
      this.orderModel.countDocuments({
        createdAt: { $gte: previousMonthStart, $lt: currentMonthStart },
        orderStatus: { $nin: [Order_Status.CANCELLED, Order_Status.RETURNED] },
      }),
      // Current month revenue
      this.orderModel.aggregate([
        {
          $match: {
            createdAt: { $gte: currentMonthStart },
            orderStatus: {
              $nin: [Order_Status.CANCELLED, Order_Status.RETURNED],
            },
          },
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      // Previous month revenue
      this.orderModel.aggregate([
        {
          $match: {
            createdAt: { $gte: previousMonthStart, $lt: currentMonthStart },
            orderStatus: {
              $nin: [Order_Status.CANCELLED, Order_Status.RETURNED],
            },
          },
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      // Pending orders
      this.orderModel.countDocuments({
        orderStatus: {
          $in: [
            Order_Status.PENDING,
            Order_Status.CONFIRMED,
            Order_Status.PROCESSING,
          ],
        },
      }),
      // New customers this month
      this.userModel.countDocuments({
        createdAt: { $gte: currentMonthStart },
      }),
      // Total customers
      this.userModel.countDocuments({}),
      // Total products
      this.productModel.countDocuments({}),
      // Total categories
      this.productModel
        .distinct('category')
        .then((categories) => categories.length),
      // Average product rating
      this.productModel.aggregate([
        { $match: { reviewCount: { $gt: 0 } } },
        { $group: { _id: null, avgRating: { $avg: '$averageRating' } } },
      ]),
    ]);

    const currentMonthRevenueValue =
      currentMonthRevenue.length > 0 ? currentMonthRevenue[0].total : 0;
    const previousMonthRevenueValue =
      previousMonthRevenue.length > 0 ? previousMonthRevenue[0].total : 0;
    const avgRatingValue =
      averageRating.length > 0 ? averageRating[0].avgRating : 0;

    // Calculate percentage changes
    const revenueChange =
      previousMonthRevenueValue === 0
        ? 100
        : ((currentMonthRevenueValue - previousMonthRevenueValue) /
            previousMonthRevenueValue) *
          100;

    const orderChange =
      previousMonthOrders === 0
        ? 100
        : ((currentMonthOrders - previousMonthOrders) / previousMonthOrders) *
          100;

    return {
      revenue: {
        current: currentMonthRevenueValue,
        previous: previousMonthRevenueValue,
        change: revenueChange,
      },
      orders: {
        current: currentMonthOrders,
        previous: previousMonthOrders,
        change: orderChange,
        pending: pendingOrders,
      },
      customers: {
        total: totalCustomers,
        new: newCustomers,
      },
      products: {
        total: totalProducts,
        categories: totalCategories,
        averageRating: avgRatingValue,
      },
    };
  }
}
