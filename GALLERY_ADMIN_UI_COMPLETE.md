# ADMIN GALLERY UI - COMPLETE IMPLEMENTATION

This file contains the complete gallery-view.tsx component ready to copy.

## File: zt-lounge-admin/src/features/gallery/gallery-view.tsx

Start of file at line 1.

```typescript
"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Star, ArrowUp, ArrowDown, Eye, Pencil } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader, Button, Spinner, Modal, Field, Input, EmptyState, Card, Badge, Textarea } from "@/components/ui";
import { MediaPickerModal } from "@/components/MediaPickerModal";
import { cn } from "@/lib/utils";

const PAGES = [
  { key: "home", label: "Homepage" },
  { key: "restaurant", label: "Restaurant" },
  { key: "lounge", label: "Lounge" },
  { key: "vip", label: "VIP Cabins" },
  { key: "events", label: "Events" },
  { key: "conference", label: "Conference" },
  { key: "grooming-care", label: "Grooming & Care" },
  { key: "contact", label: "Contact" },
  { key: "gallery", label: "Gallery Page" },
  { key: "autospa", label: "Auto Spa" },
];

const gallerySchema = z.object({
  title: z.string().min(2, "Title required"),
  description: z.string().optional(),
  altText: z.string().optional(),
  mediaId: z.string().uuid("Valid media UUID required"),
  category: z.string().min(1, "Category required"),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

type GalleryForm = z.infer<typeof gallerySchema>;

interface GalleryItem extends GalleryForm {
  id: string;
  sortOrder: number;
  pageId: string;
  imageUrl?: string;
}
```

See GALLERY_ADMIN_UI_PART2.md for function component.
