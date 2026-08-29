import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { encryptApiKey, decryptApiKey, maskApiKey } from "@/lib/services/apiKeyService";

const addApiKeySchema = z.object({
  service: z.enum(["fal", "midjourney", "google-gemini", "freepik"]),
  apiKey: z.string().min(1, "API key is required"),
});

/**
 * GET /api/api-keys
 * Get all API keys for the current user (masked)
 */
export async function GET() {
  const { user, error: authError } = await requireAuth();
  if (authError) return authError;

  try {
    const apiKeys = await prisma.apiKey.findMany({
      where: { userId: user!.id },
      select: {
        id: true,
        service: true,
        isActive: true,
        createdAt: true,
        key: true,
      },
    });

    const maskedKeys = apiKeys.map((key) => ({
      id: key.id,
      service: key.service,
      isActive: key.isActive,
      createdAt: key.createdAt,
      maskedKey: maskApiKey(decryptApiKey(key.key)),
    }));

    return NextResponse.json(maskedKeys);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch API keys" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/api-keys
 * Add or update an API key
 */
export async function POST(request: NextRequest) {
  const { user, error: authError } = await requireAuth();
  if (authError) return authError;

  try {
    const body = await request.json();
    const { service, apiKey } = addApiKeySchema.parse(body);

    const existing = await prisma.apiKey.findUnique({
      where: { userId_service: { userId: user!.id, service } },
    });

    const encryptedKey = encryptApiKey(apiKey);

    if (existing) {
      const updated = await prisma.apiKey.update({
        where: { id: existing.id },
        data: {
          key: encryptedKey,
          isActive: true,
        },
      });

      return NextResponse.json({
        id: updated.id,
        service: updated.service,
        isActive: updated.isActive,
        maskedKey: maskApiKey(apiKey),
        message: "API key updated successfully",
      });
    } else {
      const created = await prisma.apiKey.create({
        data: {
          userId: user!.id,
          service,
          key: encryptedKey,
          isActive: true,
          name: `${service} API Key`,
        },
      });

      return NextResponse.json(
        {
          id: created.id,
          service: created.service,
          isActive: created.isActive,
          maskedKey: maskApiKey(apiKey),
          message: "API key added successfully",
        },
        { status: 201 }
      );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation error" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to save API key" },
      { status: 500 }
    );
  }
}
