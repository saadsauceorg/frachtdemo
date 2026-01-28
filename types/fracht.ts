export type ProjectStatus = 'draft' | 'review' | 'approved';

export type GroupByOption = 'project' | 'location' | 'client' | 'status' | 'date';

export interface ProjectTag {
  id: string;
  label: string;
  color: string;
}

export interface VersionHistory {
  id: string;
  version: string;
  timestamp: string;
  author: string;
  changes: string;
}

export interface FeedbackComment {
  id: string;
  author: string;
  timestamp: string;
  text: string;
  audioUrl?: string;
}

export interface Location {
  id: string;
  name: string;
  imageUrl: string;
  description?: string;
}

export interface DesignItem {
  id: string;
  title: string;
  imageUrl: string;
  thumbnailUrl?: string;
  aspectRatio: number; // width / height
  project: string;
  location: string;
  client: string;
  status: ProjectStatus;
  tags: ProjectTag[];
  versionHistory: VersionHistory[];
  feedback: FeedbackComment[];
  createdAt: string;
  updatedAt: string;
  width?: number;
  height?: number;
  locationId?: string | null;
  locationData?: Location;
  isPinned?: boolean;
  orderIndex?: number;
  rating?: number | null;
}

export type SortOption = 'default' | 'rating_desc' | 'rating_asc';

export type LocationFilter = 'all' | 'assigned' | 'unassigned';

export interface FilterState {
  search: string;
  selectedTags: string[];
  selectedStatus: ProjectStatus[];
  selectedProjects: string[];
  selectedClients: string[];
  selectedLocations: string[];
  showPinnedOnly?: boolean;
  locationFilter?: LocationFilter;
  groupBy: GroupByOption | null;
  dateRange: {
    start: string | null;
    end: string | null;
  };
  sortBy?: SortOption;
}
