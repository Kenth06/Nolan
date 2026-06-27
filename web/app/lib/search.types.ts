/** The search result shape returned by POST /api/search and consumed by the UI. */
export interface SearchResultItem {
  id: string;
  film: string;
  title: string;
  year: number;
  dp: string;
  score: number;
  thumbUrl: string;
  frameUrl: string;
}
