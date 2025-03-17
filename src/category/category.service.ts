import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/request/create-category.dto';
import { UpdateCategoryDto } from './dto/request/update-category.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Category, CategoryDocument } from './schema/category.schema';
import { Model } from 'mongoose';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const existingCategory = await this.categoryModel.findOne({
      name: createCategoryDto.name,
      isActive: true,
    });

    if (existingCategory) {
      throw new BadRequestException(
        `Category with name "${createCategoryDto.name}" already exists`,
      );
    }

    const inactiveCategory = await this.categoryModel.findOne({
      name: createCategoryDto.name,
      isActive: false,
    });

    if (inactiveCategory) {
      inactiveCategory.isActive = true;
      return inactiveCategory.save();
    }

    const newCategory = new this.categoryModel(createCategoryDto);
    return newCategory.save();
  }

  async findAll(): Promise<Category[]> {
    return this.categoryModel.find({ isActive: true }).exec();
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryModel.findById(id).exec();
    if (!category || !category.isActive) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const categoryToUpdate = await this.categoryModel.findById(id).exec();
    if (!categoryToUpdate || !categoryToUpdate.isActive) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    if (
      updateCategoryDto.name &&
      updateCategoryDto.name !== categoryToUpdate.name
    ) {
      const existingCategory = await this.categoryModel.findOne({
        _id: { $ne: id },
        name: updateCategoryDto.name,
        isActive: true,
      });

      if (existingCategory) {
        throw new BadRequestException(
          `Category with name "${updateCategoryDto.name}" already exists`,
        );
      }

      const inactiveCategory = await this.categoryModel.findOne({
        _id: { $ne: id }, // Exclude the current category
        name: updateCategoryDto.name,
        isActive: false,
      });

      if (inactiveCategory) {
        await this.categoryModel.findByIdAndDelete(inactiveCategory._id);
      }
    }

    return await this.categoryModel
      .findByIdAndUpdate(id, updateCategoryDto, { new: true })
      .exec();
  }

  async remove(id: string): Promise<Category> {
    const category = await this.categoryModel.findById(id).exec();
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    category.isActive = false;
    return category.save();
  }
}
