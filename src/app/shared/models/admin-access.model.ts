export interface AdminAccessMap {
    username: string;
    fullName: string;
    access: {
      systems: boolean;
      localization: boolean;
      news: boolean;
      newsCategories: boolean;
      [key: string]: boolean;
    };
  }
  