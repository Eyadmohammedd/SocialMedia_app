import {
  AnyKeys,
  CreateOptions,
  DeleteResult,
  HydratedDocument,
  Model,
  ProjectionType,
  QueryOptions,
  UpdateQuery,
  UpdateResult,
} from "mongoose";

export abstract class DatabaseRepository<TRawDoc> {
  constructor(protected readonly model: Model<TRawDoc>) {}

  async create({
    data,
  }: {
    data: AnyKeys<TRawDoc>;
  }): Promise<HydratedDocument<TRawDoc>>;

  async create({
    data,
    options,
  }: {
    data: AnyKeys<TRawDoc>[];
    options?: CreateOptions | undefined;
  }): Promise<HydratedDocument<TRawDoc>[]>;

  async create({
    data,
    options,
  }: {
    data: AnyKeys<TRawDoc> | AnyKeys<TRawDoc>[];
    options?: CreateOptions | undefined;
  }): Promise<HydratedDocument<TRawDoc>[] | HydratedDocument<TRawDoc>> {
    return await this.model.create(data as any, options);
  }

  async createOne({
    data,
    options,
  }: {
    data: AnyKeys<TRawDoc>;
    options?: CreateOptions | undefined;
  }): Promise<HydratedDocument<TRawDoc>> {
    return (await this.model.create(
      data as any,
      options,
    )) as HydratedDocument<TRawDoc>;
  }

  async findOne({
    filter,
    projection,
    options,
  }: {
    filter: Partial<TRawDoc> | Record<string, unknown>;
    projection?: ProjectionType<TRawDoc> | null | undefined;
    options?: QueryOptions<TRawDoc> | null | undefined;
  }): Promise<TRawDoc | null> {
    return await this.model.findOne(filter, projection, options).exec();
  }

  async findById({
    id,
    projection,
    options,
  }: {
    id: string;
    projection?: ProjectionType<TRawDoc> | null | undefined;
    options?: QueryOptions<TRawDoc> | null | undefined;
  }): Promise<TRawDoc | null> {
    return await this.model.findById(id, projection, options).exec();
  }

  async findMany({
    filter,
    projection,
    options,
  }: {
    filter: Partial<TRawDoc> | Record<string, unknown>;
    projection?: Record<string, unknown> | null | undefined;
    options?: any;
  }): Promise<TRawDoc[]> {
    return await this.model.find(filter, projection, options).exec();
  }

  async updateOne({
    filter,
    update,
    options,
  }: {
    filter: Partial<TRawDoc> | Record<string, unknown>;
    update: UpdateQuery<TRawDoc>;
    options?: any;
  }): Promise<TRawDoc | null> {
    return (await this.model
      .findOneAndUpdate(filter, update, { new: true, ...options })
      .exec()) as any;
  }

  async updateMany({
    filter,
    update,
    options,
  }: {
    filter: Partial<TRawDoc> | Record<string, unknown>;
    update: UpdateQuery<TRawDoc>;
    options?: any;
  }): Promise<UpdateResult> {
    return await this.model.updateMany(filter, update, options).exec();
  }

  async deleteOne({
    filter,
    options,
  }: {
    filter: Partial<TRawDoc> | Record<string, unknown>;
    options?: any;
  }): Promise<TRawDoc | null> {
    return await this.model.findOneAndDelete(filter, options).exec();
  }

  async deleteMany({
    filter,
    options,
  }: {
    filter: Partial<TRawDoc> | Record<string, unknown>;
    options?: any;
  }): Promise<DeleteResult> {
    return await this.model.deleteMany(filter, options).exec();
  }
}
