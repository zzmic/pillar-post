import type { Request, Response } from "express";
import { Op } from "sequelize";

import { sendApiError } from "../utils/api-envelope.js";
import { getSequelizeModel } from "../utils/sequelize-models.js";

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

const getTags = (): TagModel => getSequelizeModel<TagModel>("tags");

interface TagSuccessResponse<T> {
  status: "success";
  message: string;
  data?: T;
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
      sendApiError(res, 400, "Tag with this name or slug already exists");
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
      message: "Tag created",
      data: {
        tag: newTag,
      },
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Error creating tag:", error);
    sendApiError(res, 500, "Failed to create tag");
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
      message: "Tags fetched",
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
    sendApiError(res, 500, "Failed to fetch tags");
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
      sendApiError(res, 404, "Tag not found");
      return;
    }

    const response: TagSuccessResponse<{ tag: TagInstance }> = {
      status: "success",
      message: "Tag fetched",
      data: { tag },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching tag:", error);
    sendApiError(res, 500, "Failed to fetch tag");
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
      sendApiError(res, 404, "Tag not found");
      return;
    }

    const response: TagSuccessResponse<{ tag: TagInstance }> = {
      status: "success",
      message: "Tag fetched",
      data: { tag },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching tag:", error);
    sendApiError(res, 500, "Failed to fetch tag");
  }
};

export const updateTag = async (req: Request, res: Response): Promise<void> => {
  try {
    const tagId = req.params.tag_id;
    const { name, slug } = req.body as Record<string, unknown>;

    const tag = await getTags().findByPk(tagId);
    if (!tag) {
      sendApiError(res, 404, "Tag not found");
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
        sendApiError(res, 400, "Tag with this name or slug already exists");
        return;
      }
    }

    await tag.update({
      name: name ?? tag.name,
      slug: slug ?? tag.slug,
    });

    const response: TagSuccessResponse<{ tag: TagInstance }> = {
      status: "success",
      message: "Tag updated",
      data: { tag },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error updating tag:", error);
    sendApiError(res, 500, "Failed to update tag");
  }
};

export const deleteTag = async (req: Request, res: Response): Promise<void> => {
  try {
    const tagId = req.params.tag_id;
    const tag = await getTags().findByPk(tagId);

    if (!tag) {
      sendApiError(res, 404, "Tag not found");
      return;
    }

    await tag.destroy();

    const response: TagSuccessResponse<Record<string, never>> = {
      status: "success",
      message: "Tag deleted",
      data: {},
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error deleting tag:", error);
    sendApiError(res, 500, "Failed to delete tag");
  }
};
