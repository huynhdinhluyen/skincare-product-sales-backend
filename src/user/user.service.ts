import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from 'src/auth/schema/user.schema';
import { UserDetails } from './user-details.interface';
import { UpdateUserDto } from './dto/update-profile.dto';
import { Order, OrderDocument } from '../order/schema/order.schema';
import { Order_Status } from '../order/enums/order-status.enum';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
  ) {}

  getUserDetails(user: UserDocument) {
    return {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      city: user.city,
      address: user.address,
      point: user.point,
      role: user.role,
    };
  }

  async create(
    username: string,
    email: string,
    hashedPassword: string,
    fullName: string,
    phone: string,
    city: string,
    address: string,
    number: number,
    role: string,
  ): Promise<UserDocument> {
    const newUser = new this.userModel({
      username,
      email,
      password: hashedPassword,
      fullName,
      phone,
      city,
      address,
      number,
      role: role,
    });
    return newUser.save();
  }

  async getAllUsers(
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Promise<{
    data: any[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
  }> {
    const query: any = {};

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [users, totalCount] = await Promise.all([
      this.userModel
        .find(query)
        .select('-password -__v')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.userModel.countDocuments(query),
    ]);

    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const orderStats = await this.orderModel.aggregate([
          { $match: { user: user._id } },
          {
            $group: {
              _id: null,
              orderCount: { $sum: 1 },
              totalSpent: {
                $sum: {
                  $cond: [
                    { $eq: ['$orderStatus', Order_Status.DELIVERED] },
                    '$totalPrice',
                    0,
                  ],
                },
              },
            },
          },
        ]);

        return {
          ...user,
          orderStats:
            orderStats.length > 0
              ? {
                  orderCount: orderStats[0].orderCount,
                  totalSpent: orderStats[0].totalSpent,
                }
              : { orderCount: 0, totalSpent: 0 },
        };
      }),
    );

    return {
      data: usersWithStats,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    };
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username }).exec();
  }

  async checkDuplicatePhone(phone: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ phone }).exec();
  }

  async findById(id: string): Promise<UserDetails | null> {
    const user = await this.userModel.findById(id).exec();
    if (!user) return null;
    return this.getUserDetails(user);
  }

  async updateProfile(
    userId: string,
    updateData: UpdateUserDto,
  ): Promise<User> {
    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return updatedUser;
  }
}
