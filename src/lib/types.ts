export type Role = "admin" | "editor";
export type PublishStatus = "draft" | "published";
export type JobStatus = "draft" | "open" | "closed";

export interface ImageRef {
  id: string;
  alt: string;
}

export interface Project {
  slug: string;
  name: string;
  client: string;
  type: string;
  area: string;
  year: string;
  description: string;
  highlights: string[];
  scope: string[];
  locationId: string;
  locationLabel: string;
  coverImageId: string;
  images: ImageRef[];
  imageIds: string[]; // flat copy of images[].id, used for array-contains queries
  isFeatured: boolean;
  sortOrder: number;
  status: PublishStatus;
  seoTitle: string;
  seoDesc: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Location {
  id: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  showOnMap: boolean;
  /** Legacy (non-project) client names, e.g. "Flexi Flex, Indore (2015)". */
  legacyClients: string[];
}

export interface Job {
  slug: string;
  title: string;
  department: string;
  location: string;
  type: string;
  experience: string;
  summary: string;
  responsibilities: string[];
  requirements: string[];
  status: JobStatus;
  postedAt?: string;
  closesAt: string; // yyyy-mm-dd or ""
  updatedAt?: string;
}
