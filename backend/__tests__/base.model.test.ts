import { describe, expect, test } from "bun:test";
import { BaseModel } from "../model/primitives/base.model";

class TestModel extends BaseModel<TestModel> {
  name!: string;

  constructor(data?: Partial<TestModel>, repository?: any) {
    super(data, repository);
    if (data) {
      Object.assign(this, data);
    }
  }

  fromEntity(entity: any): TestModel | null {
    return new TestModel({
      id: entity.id,
      name: entity.name,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      touchedBy: entity.touchedBy,
      entityId: entity.entityId,
    });
  }
}

describe("BaseModel static helpers", () => {
  test("getAll works when called statically on a subclass", async () => {
    const entities = [
      {
        id: "1",
        name: "one",
        createdAt: new Date(),
        updatedAt: new Date(),
        touchedBy: "system",
        entityId: "entity-1",
      },
    ];

    const repository = {
      search: () => ({
        returnAll: async () => entities,
      }),
    };

    class RepositoryModel extends BaseModel<RepositoryModel> {
      name!: string;

      constructor(data?: Partial<RepositoryModel>) {
        super(data, repository as any);
        if (data) {
          Object.assign(this, data);
        }
      }

      fromEntity(entity: any): RepositoryModel | null {
        return new RepositoryModel({
          id: entity.id,
          name: entity.name,
          createdAt: entity.createdAt,
          updatedAt: entity.updatedAt,
          touchedBy: entity.touchedBy,
          entityId: entity.entityId,
        });
      }
    }

    const models = await RepositoryModel.getAll();

    expect(models).toHaveLength(1);
    expect(models[0].name).toBe("one");
  });
});
