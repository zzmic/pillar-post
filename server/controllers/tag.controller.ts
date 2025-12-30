import type { Request, Response } from "express";
import { Op } from "sequelize";

import db from "../models/index.js";

type Identifier = number | string;

interface TagInstance extends Record<string, unknown> {
  tag_id: Identifier;
  name?: string;
  slug?: string;
  update: (values: Record<string, unknown>) => Promise<void>;
  destroy: () => Promise<void>;
}

interface TagModel {
  create: (values: Record<string, unknown>) => Promise<TagInstance>;
  findOne: (options: Record<string, unknown>) => Promise<TagInstance | null>;
  findByPk: (
    id: unknown,
    options?: Record<string, unknown>,
  ) => Promise<TagInstance | null>;
  findAndCountAll: (
    options: Record<string, unknown>,
  ) => Promise<{ count: number; rows: TagInstance[] }>;
}

interface DbModelMap {
  tags?: unknown;
}

const models = db as DbModelMap;

const getModel = <T>(model: unknown, modelName: string): T => {
  if (
    typeof model !== "object" ||
    model === null ||
    typeof (model as { create?: unknown }).create !== "function"
  ) {
    throw new Error(
      `Model '${modelName}' is not available on the database instance.`,
    );
  }

  return model as T;
};

const getTags = (): TagModel => {
  return getModel<TagModel>(models.tags, "tags");
};

interface TagSuccessResponse<T> {
  status: "success";
  message: string;
  data?: T;
}

interface TagFailResponse {
  status: "fail" | "error";
  message: string;
  error?: string;
}

export const createTag = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, slug } = req.body as Record<string, unknown>;

    const existingTag = await getTags().findOne({
      where: {
        [Op.or]: [{ name }, { slug }],
      },
    });

    if (existingTag) {
      const response: TagFailResponse = {
        status: "fail",
        message: "Tag with this name or slug already exists",
      };
      res.status(400).json(response);
      return;
    }

    const newTag = await getTags().create({
      name,
      slug:
        typeof slug === "string" && slug.trim().length > 0
          ? slug
          : typeof name === "string"
            ? name.toLowerCase().replace(/\s+/g, "-")
            : undefined,
    });

    const response: TagSuccessResponse<{ tag: TagInstance }> = {
      status: "success",
      message: "Tag created successfully",
      data: {
        tag: newTag,
      },
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Error creating tag:", error);
    const response: TagFailResponse = {
      status: "fail",
      message: "Failed to create tag",
      error: error instanceof Error ? error.message : undefined,
    };
    res.status(500).json(response);
  }
};

const normalizeInt = (value: unknown, fallback: number): number => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const getAllTags = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const page = Math.max(1, normalizeInt(req.query.page, 1));
    const limit = Math.max(1, normalizeInt(req.query.limit, 50));
    const offset = (page - 1) * limit;

    const { count, rows: tags } = await getTags().findAndCountAll({
      limit,
      offset,
      order: [["name", "ASC"]],
    });

    const totalPages = Math.max(1, Math.ceil(count / limit));

    const response: TagSuccessResponse<{
      tags: TagInstance[];
      pagination: Record<string, unknown>;
    }> = {
      status: "success",
      message: "Tags fetched successfully",
      data: {
        tags,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount: count,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          nextPage: page < totalPages ? page + 1 : null,
          prevPage: page > 1 ? page - 1 : null,
        },
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching tags:", error);
    const response: TagFailResponse = {
      status: "fail",
      message: "Failed to fetch tags",
      error: error instanceof Error ? error.message : undefined,
    };
    res.status(500).json(response);
  }
};

export const getTagByID = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const tagId = req.params.tag_id;
    const tag = await getTags().findByPk(tagId);

    if (!tag) {
      const response: TagFailResponse = {
        status: "fail",
        message: "Tag not found",
      };
      res.status(404).json(response);
      return;
    }

    const response: TagSuccessResponse<{ tag: TagInstance }> = {
      status: "success",
      message: "Tag fetched successfully",
      data: { tag },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching tag:", error);
    const response: TagFailResponse = {
      status: "fail",
      message: "Failed to fetch tag",
      error: error instanceof Error ? error.message : undefined,
    };
    res.status(500).json(response);
  }
};

export const getTagBySlug = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const slug = req.params.slug;
    const tag = await getTags().findOne({ where: { slug } });

    if (!tag) {
      const response: TagFailResponse = {
        status: "fail",
        message: "Tag not found",
      };
      res.status(404).json(response);
      return;
    }

    const response: TagSuccessResponse<{ tag: TagInstance }> = {
      status: "success",
      message: "Tag fetched successfully",
      data: { tag },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching tag:", error);
    const response: TagFailResponse = {
      status: "fail",
      message: "Failed to fetch tag",
      error: error instanceof Error ? error.message : undefined,
    };
    res.status(500).json(response);
  }
};

export const updateTag = async (req: Request, res: Response): Promise<void> => {
  try {
    const tagId = req.params.tag_id;
    const { name, slug } = req.body as Record<string, unknown>;

    const tag = await getTags().findByPk(tagId);
    if (!tag) {
      const response: TagFailResponse = {
        status: "fail",
        message: "Tag not found",
      };
      res.status(404).json(response);
      return;
    }

    if (name || slug) {
      const existingTag = await getTags().findOne({
        where: {
          [Op.and]: [
            {
              [Op.or]: [{ name: name ?? tag.name }, { slug: slug ?? tag.slug }],
            },
            {
              tag_id: { [Op.ne]: tagId },
            },
          ],
        },
      });

      if (existingTag) {
        const response: TagFailResponse = {
          status: "fail",
          message: "Tag with this name or slug already exists",
        };
        res.status(400).json(response);
        return;
      }
    }

    await tag.update({
      name: name ?? tag.name,
      slug: slug ?? tag.slug,
    });

    const response: TagSuccessResponse<{ tag: TagInstance }> = {
      status: "success",
      message: "Tag updated successfully",
      data: { tag },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error updating tag:", error);
    const response: TagFailResponse = {
      status: "fail",
      message: "Failed to update tag",
      error: error instanceof Error ? error.message : undefined,
    };
    res.status(500).json(response);
  }
};

export const deleteTag = async (req: Request, res: Response): Promise<void> => {
  try {
    const tagId = req.params.tag_id;
    const tag = await getTags().findByPk(tagId);

    if (!tag) {
      const response: TagFailResponse = {
        status: "fail",
        message: "Tag not found",
      };
      res.status(404).json(response);
      return;
    }

    await tag.destroy();

    const response: TagSuccessResponse<Record<string, never>> = {
      status: "success",
      message: "Tag deleted successfully",
      data: {},
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error deleting tag:", error);
    const response: TagFailResponse = {
      status: "fail",
      message: "Failed to delete tag",
      error: error instanceof Error ? error.message : undefined,
    };
    res.status(500).json(response);
  }
};
