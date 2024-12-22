export interface IEntity {
    id: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface IAuditableEntity extends IEntity {
    createdBy?: string;
    updatedBy?: string;
}
