import { IEntity } from '../interfaces/base.interface';
export declare abstract class BaseEntity implements IEntity {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    constructor(partial: Partial<BaseEntity>);
}
