export interface UserSaves {
  map(arg0: (save: any) => any): unknown;
  userId: string;
  saves: Save[];
  lastUpdated: Date;
}

export interface Save {
  establishmentId: string;
  establishmentName: string;
  latitude: number;
  longitude: number;
  createdAt: Date;
}
